// AI Pool Connection — Cloudflare Worker.
// Serves a password-gated chat page (works in iPhone Safari) and a small API
// that pools multiple AI providers. Keys live in Worker secrets, never in code.

import { buildProviders, routeChat, statusOf } from './providers.js';
import { PAGE_HTML, LOGIN_HTML } from './page.js';

const SESSION_COOKIE = 'apc_session';

const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(s) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(String(s))));
}

async function sessionToken(password) {
  // Stateless session value = HMAC-SHA256(password, "apc-session-v1"), hex.
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('apc-session-v1'));
  return toHex(sig);
}

// Constant-time compare of two equal-length hex strings.
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Compare two secrets without leaking length (hash both to fixed-length hex).
async function secretsEqual(a, b) {
  return timingSafeEqualHex(await sha256Hex(a), await sha256Hex(b));
}

// Best-effort in-isolate sliding-window rate limiter. Cloudflare may spread
// traffic across isolates, so also enable Cloudflare Rate Limiting/WAF rules
// for hard guarantees (see worker/README.md).
const rlBuckets = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const arr = (rlBuckets.get(key) || []).filter((t) => t > now - windowMs);
  arr.push(now);
  rlBuckets.set(key, arr);
  return arr.length > max;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  return Object.fromEntries(
    header.split(';').map((c) => c.trim()).filter(Boolean).map((c) => {
      const i = c.indexOf('=');
      return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
    }),
  );
}

async function isAuthed(request, env) {
  // Fail closed: without a configured password nobody is authed (see fetch()
  // which returns 503 in that state unless ALLOW_OPEN=true for local dev).
  if (!env.APP_PASSWORD) return env.ALLOW_OPEN === 'true';
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;
  const expected = await sessionToken(env.APP_PASSWORD);
  return timingSafeEqualHex(token, expected);
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS, ...extraHeaders },
  });
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS, ...extraHeaders },
  });
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const ip = clientIp(request);

    // Fail closed: refuse to serve if no password is configured (unless the
    // operator explicitly opts into open mode for local development).
    if (!env.APP_PASSWORD && env.ALLOW_OPEN !== 'true') {
      return html(
        '<h1>Not configured</h1><p>Set the <code>APP_PASSWORD</code> secret before use: <code>npx wrangler secret put APP_PASSWORD</code>.</p>',
        503,
      );
    }

    const providers = buildProviders(env);

    // --- Auth routes ---------------------------------------------------------
    if (pathname === '/login' && request.method === 'GET') {
      return html(LOGIN_HTML(''));
    }
    if (pathname === '/login' && request.method === 'POST') {
      // Strict throttle to blunt password brute-forcing.
      if (rateLimited(`login:${ip}`, Number(env.LOGIN_RATE_PER_MIN || 8), 60_000)) {
        return html(LOGIN_HTML('Too many attempts. Wait a minute and try again.'), 429);
      }
      const form = await request.formData();
      const password = String(form.get('password') || '');
      if (env.APP_PASSWORD && (await secretsEqual(password, env.APP_PASSWORD))) {
        const token = await sessionToken(env.APP_PASSWORD);
        const secure = url.protocol === 'https:' ? ' Secure;' : '';
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/',
            'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=604800`,
          },
        });
      }
      return html(LOGIN_HTML('Wrong password.'), 401);
    }
    if (pathname === '/logout') {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login', 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` },
      });
    }

    // --- Everything below requires auth --------------------------------------
    const authed = await isAuthed(request, env);

    if (pathname === '/') {
      if (!authed) return Response.redirect(new URL('/login', url).toString(), 302);
      return html(PAGE_HTML);
    }

    if (pathname === '/api/status') {
      if (!authed) return json({ error: 'unauthorized' }, 401);
      return json({ ...statusOf(providers), authRequired: Boolean(env.APP_PASSWORD) });
    }

    if (pathname === '/api/chat' && request.method === 'POST') {
      if (!authed) return json({ error: 'unauthorized' }, 401);
      if (rateLimited(`chat:${ip}`, Number(env.CHAT_RATE_PER_MIN || 20), 60_000)) {
        return json({ error: 'rate limit exceeded, slow down' }, 429);
      }
      // Guard against oversized bodies (prompt-cost abuse) before parsing.
      const len = Number(request.headers.get('content-length') || 0);
      if (len > 16_000) return json({ error: 'payload too large' }, 413);
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }
      const message = payload?.message;
      if (!message || typeof message !== 'string') return json({ error: 'message (string) required' }, 400);
      const messages = [
        { role: 'system', content: 'You are Jarvis for AI Pool Connection. Be helpful and concise.' },
        { role: 'user', content: message.slice(0, 8000) },
      ];
      try {
        // Paid providers are opt-in (ALLOW_PAID=true) to prevent surprise spend;
        // prefer is intentionally NOT taken from the request so clients can't
        // force a paid tier.
        const r = await routeChat(providers, { messages, allowPaid: env.ALLOW_PAID === 'true' });
        return json({ text: r.text, providerLabel: r.providerLabel, model: r.model, tier: r.tier, costUsd: r.costUsd, status: statusOf(providers) });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
