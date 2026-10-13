/**
 * Shared Worker controls. No secrets live in this file.
 * Rate limits are per isolate (in-memory). Cloudflare WAF is the edge backstop.
 */

export const PRODUCTION_ORIGINS = [
  'https://meda-vermittlung.de',
  'https://www.meda-vermittlung.de',
];

const SAFE_LOG_KEYS = ['code', 'status', 'route', 'ok'];

export function parseOrigins(env) {
  const raw = env && (env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN);
  if (!raw || !String(raw).trim()) return PRODUCTION_ORIGINS.slice();
  return String(raw)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function corsHeaders(origin, allowedList, { methods = 'POST, OPTIONS' } = {}) {
  const headers = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowedList.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function demoTokensRejected(env) {
  const raw = String((env && env.REJECT_DEMO_TOKENS) || '')
    .trim()
    .toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export function isDemoToken(value) {
  return /-DEMO-/i.test(String(value || ''));
}

export function isStandaloneDemoToken(value) {
  return /^(?:CAND|EMP|REF)-DEMO-[A-Za-z0-9-]{1,64}$/i.test(String(value ?? '').trim());
}

export function containsStandaloneDemoToken(value, depth = 0) {
  if (depth > 6 || value == null) return false;
  if (typeof value === 'string') return isStandaloneDemoToken(value);
  if (typeof value !== 'object') return false;
  const list = Array.isArray(value) ? value : Object.values(value);
  return list.some((item) => containsStandaloneDemoToken(item, depth + 1));
}

export async function secretsEqual(left, right) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(left ?? ''))),
    crypto.subtle.digest('SHA-256', enc.encode(String(right ?? ''))),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    try {
      return crypto.subtle.timingSafeEqual(x, y);
    } catch {
      /* fall through to the equal-length XOR compare */
    }
  }
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function clientIp(request) {
  return (request.headers.get('CF-Connecting-IP') || '').trim();
}

export function checkRateLimit(buckets, key, now, limit, windowMs) {
  const previous = buckets.get(key) || [];
  const fresh = previous.filter((stamp) => now - stamp < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return { ok: false, retryAfterMs: windowMs - (now - fresh[0]) };
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return { ok: true, retryAfterMs: 0 };
}

export function flagOn(env, name) {
  const raw = String((env && env[name]) || '')
    .trim()
    .toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export const JSON_LIMITS = {
  consent: 32 * 1024,
  esign: 600 * 1024,
  ask: 16 * 1024,
};

export async function readJsonLimited(request, maxBytes) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: 'PAYLOAD_TOO_LARGE' };
  }
  let text;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: 'BAD_REQUEST' };
  }
  if (text.length > maxBytes) return { ok: false, status: 413, error: 'PAYLOAD_TOO_LARGE' };
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, status: 400, error: 'BAD_REQUEST' };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, status: 400, error: 'BAD_REQUEST' };
  }
}

export function turnstileTokenFrom(body) {
  if (!body || typeof body !== 'object') return '';
  return String(body.turnstile_token || body['cf-turnstile-response'] || '').trim();
}

export async function verifyTurnstileToken(fetchImpl, secret, token, ip) {
  if (!token || !secret) return false;
  let response;
  try {
    response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || '' }),
    });
  } catch {
    return false;
  }
  if (!response || !response.ok) return false;
  try {
    const data = await response.json();
    return Boolean(data && data.success === true);
  } catch {
    return false;
  }
}

export async function requireTurnstile(env, token, ip, fetchImpl = fetch) {
  if (!flagOn(env, 'REQUIRE_TURNSTILE')) return { ok: true, skipped: true };
  if (!String((env && env.TURNSTILE_SECRET) || '').trim()) {
    return { ok: false, status: 503, error: 'NOT_CONFIGURED' };
  }
  const passed = await verifyTurnstileToken(fetchImpl, env.TURNSTILE_SECRET, token, ip);
  if (!passed) return { ok: false, status: 403, error: 'TURNSTILE' };
  return { ok: true };
}

export function safeLog(event, fields) {
  const out = { event: String(event || 'log') };
  const src = fields && typeof fields === 'object' ? fields : {};
  for (const key of SAFE_LOG_KEYS) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  console.log(JSON.stringify(out));
}
