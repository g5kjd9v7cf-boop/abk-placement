// AI Pool Connection — Cloudflare Worker.
// Serves a password-gated chat page (works in iPhone Safari) and a small API
// that pools multiple AI providers. Keys live in Worker secrets, never in code.

import { buildProviders, routeChat, statusOf } from './providers.js';
import { PAGE_HTML, LOGIN_HTML } from './page.js';

const SESSION_COOKIE = 'apc_session';

const enc = new TextEncoder();

async function sessionToken(password) {
  // Stateless session value = HMAC-SHA256(password, "apc-session-v1"), hex.
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('apc-session-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
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
  // If no password is configured, the app is open (use only for local/dev).
  if (!env.APP_PASSWORD) return true;
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;
  const expected = await sessionToken(env.APP_PASSWORD);
  return timingSafeEqual(token, expected);
}

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...extraHeaders },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const providers = buildProviders(env);

    // --- Auth routes ---------------------------------------------------------
    if (pathname === '/login' && request.method === 'GET') {
      return html(LOGIN_HTML(''));
    }
    if (pathname === '/login' && request.method === 'POST') {
      const form = await request.formData();
      const password = String(form.get('password') || '');
      if (env.APP_PASSWORD && timingSafeEqual(password, env.APP_PASSWORD)) {
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
        const r = await routeChat(providers, { messages, prefer: payload.prefer });
        return json({ text: r.text, providerLabel: r.providerLabel, model: r.model, tier: r.tier, costUsd: r.costUsd, status: statusOf(providers) });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
