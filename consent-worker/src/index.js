/**
 * MEDA Consent Worker — consent events and short-lived page views.
 * Writes are origin-checked, size-limited, and stored as an allowlisted record.
 * No API token and no IP address are stored. Deploy with `wrangler login`, then `wrangler deploy`.
 * /voice stays closed until a Twilio auth token is added for a virtual business number.
 */

import { handleVoiceRequest, purgeOldCallMessages } from './voice.js';

const MAX_BODY_BYTES = 8192;
const PAGEVIEW_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

const FORM_TYPES = new Set(['cv_upload', 'profile_no_cv', 'contact']);
const LOCALES = new Set(['de', 'fr', 'en', 'ar']);
const GATE_EVENTS = new Set(['datenschutz_accepted', 'datenschutz_declined']);

const buckets = new Map();

function parseAllowedOrigins(env) {
  const raw =
    env.ALLOWED_ORIGINS ||
    env.ALLOWED_ORIGIN ||
    'https://g5kjd9v7cf-boop.github.io';
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('https://'));
}

function corsHeaders(origin, allowedList) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
  };
  if (origin && allowedList.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
  }
  return h;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function receiptNumber(bytes) {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const rand = [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  return `MEDA-CONSENT-${y}${m}${day}-${rand}`;
}

function clip(value, max) {
  if (value == null) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function cleanEmail(value, { required = false } = {}) {
  const raw = clip(value, 254).toLowerCase();
  if (!raw) return required ? { error: 'email required' } : { value: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return { error: 'invalid email' };
  return { value: raw };
}

function cleanPage(value) {
  if (!value) return null;
  const s = String(value).split('?')[0].split('#')[0].trim().slice(0, 200);
  if (!/^\/[A-Za-z0-9._/-]*$/.test(s)) return null;
  return s;
}

function cleanReferrer(value) {
  if (!value) return null;
  try {
    const u = new URL(String(value));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return (u.origin + u.pathname).slice(0, 300);
  } catch {
    return null;
  }
}

function cleanToken(value, max, pattern) {
  const s = clip(value, max);
  if (!s) return null;
  if (pattern && !pattern.test(s)) return null;
  return s;
}

function rateLimit(key) {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

async function appendEvent(env, row) {
  if (!env.DB) return { ok: false, error: 'unavailable' };
  await env.DB.prepare(
    `INSERT INTO consent_events
      (event, ts, document_version, locale_shown, layout, session_id, email, form_type, receipt_ref, user_agent, referrer, page, ip_hash, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.event,
      row.ts,
      row.document_version,
      row.locale_shown,
      row.layout,
      row.session_id,
      row.email,
      row.form_type,
      row.receipt_ref,
      row.user_agent,
      row.referrer,
      row.page,
      row.ip_hash,
      row.payload_json
    )
    .run();
  return { ok: true };
}

function routeEvent(route, body) {
  if (route === 'view') return 'erklaerung_view';
  if (route === 'submit') return 'consent_given';
  if (route === 'withdraw') return 'consent_withdrawn';
  if (route === 'pageview') return 'page_visit';
  if (route === 'gate') {
    const ev = clip(body && body.event, 40);
    return GATE_EVENTS.has(ev) ? ev : null;
  }
  return null;
}

export async function purgeOldPageviews(env, now = new Date()) {
  if (!env || !env.DB) return { ok: false };
  const cutoff = new Date(now.getTime() - PAGEVIEW_RETENTION_MS).toISOString();
  await env.DB.prepare(
    `DELETE FROM consent_events WHERE event = 'page_visit' AND ts < ?`
  )
    .bind(cutoff)
    .run();
  return { ok: true, cutoff };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      purgeOldPageviews(env)
        .catch((err) => {
          console.error('pageview retention failed', err && err.message ? err.message : 'error');
        })
        .then(() => purgeOldCallMessages(env))
        .catch((err) => {
          console.error('call message retention failed', err && err.message ? err.message : 'error');
        })
    );
  },

  async fetch(request, env) {
    const allowedList = parseAllowedOrigins(env);
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const headers = corsHeaders(origin, allowedList);

    if (path.endsWith('/stats')) {
      return json({ ok: false, error: 'Not found' }, 404, headers);
    }

    if (path === '/voice/incoming' || path === '/voice/step') {
      return handleVoiceRequest(request, env);
    }

    if (request.method === 'OPTIONS') {
      if (origin && !allowedList.includes(origin)) {
        return new Response(null, { status: 403, headers });
      }
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, headers);
    }

    if (!origin || !allowedList.includes(origin)) {
      return json({ ok: false, error: 'Origin not allowed' }, 403, headers);
    }

    const route = path.endsWith('/view')
      ? 'view'
      : path.endsWith('/submit')
        ? 'submit'
        : path.endsWith('/withdraw')
          ? 'withdraw'
          : path.endsWith('/gate')
            ? 'gate'
            : path.endsWith('/pageview')
              ? 'pageview'
              : null;

    if (!route) {
      return json({ ok: false, error: 'Not found' }, 404, headers);
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!rateLimit(ip || origin || 'anon')) {
      return json({ ok: false, error: 'Too many requests' }, 429, headers);
    }

    const contentType = (request.headers.get('Content-Type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
    }

    const declared = Number(request.headers.get('Content-Length') || '0');
    if (declared && declared > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'Payload too large' }, 413, headers);
    }

    let rawText;
    try {
      rawText = await request.text();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
    }
    if (rawText.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'Payload too large' }, 413, headers);
    }

    let body;
    try {
      body = JSON.parse(rawText);
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
    }

    const event = routeEvent(route, body);
    if (!event) {
      return json({ ok: false, error: 'Invalid event' }, 400, headers);
    }

    const needsEmail = route === 'submit' || route === 'withdraw';
    const emailResult = needsEmail
      ? cleanEmail(body.email, { required: true })
      : { value: null };
    if (emailResult.error) {
      return json({ ok: false, error: 'Invalid email' }, 400, headers);
    }

    let receipt_ref = null;
    if (route === 'submit') {
      receipt_ref = receiptNumber(crypto.getRandomValues(new Uint8Array(4)));
    } else if (route === 'withdraw') {
      receipt_ref = cleanToken(body.receipt_ref, 64, /^MEDA-CONSENT-\d{8}-[0-9A-F]{4,8}$/);
    }

    const ip_hash = null;

    const form_type = FORM_TYPES.has(clip(body.form_type, 40)) ? clip(body.form_type, 40) : null;
    const locale = LOCALES.has(clip(body.locale_shown, 8)) ? clip(body.locale_shown, 8) : null;
    const layout = clip(body.layout, 16) === 'de+ar' ? 'de+ar' : null;
    const session_id = cleanToken(
      body.session_id,
      80,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    const document_version = cleanToken(body.document_version, 64, /^[A-Za-z0-9._:-]{1,64}$/);
    const page = cleanPage(body.page);
    const referrer = cleanReferrer(body.referrer);
    const user_agent = clip(request.headers.get('User-Agent') || '', 300) || null;
    const ts = new Date().toISOString();

    const payload = {
      event,
      document_version,
      locale_shown: locale,
      layout,
      form_type: route === 'submit' ? form_type : null,
      page,
    };
    if (route === 'submit') {
      payload.share_with_employers = body.share_with_employers === true;
      payload.talent_pool = body.talent_pool === true;
      payload.age_confirmed = body.age_confirmed === true;
    }

    const row = {
      event,
      ts,
      document_version,
      locale_shown: locale,
      layout,
      session_id,
      email: emailResult.value,
      form_type: route === 'submit' ? form_type : null,
      receipt_ref,
      user_agent,
      referrer,
      page,
      ip_hash,
      payload_json: JSON.stringify(payload),
    };

    try {
      const result = await appendEvent(env, row);
      if (!result.ok) {
        return json({ ok: false, error: 'unavailable' }, 503, headers);
      }
    } catch (err) {
      console.error('consent write failed', err && err.message ? err.message : 'error');
      return json({ ok: false, error: 'unavailable' }, 503, headers);
    }

    return json({ ok: true, event, receipt_ref, ts }, 200, headers);
  },
};
