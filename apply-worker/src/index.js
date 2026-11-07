/**
 * Bewerbung endpoint. Mail only: nothing is written to R2, D1, KV, or logs.
 * Logs are a code and a status. Candidate fields never go to the console.
 *
 * Delivery is one AgentMail JSON request:
 *   POST /v0/inboxes/{inbox_id}/messages/send
 *   attachment content is standard base64, with filename and content_type.
 * The whole request, body plus attachments, must stay under AgentMail's 6 MB cap.
 */
import { MAX_FILE_BYTES, classifyCv, safeFileName } from './cv.mjs';

export { MAX_FILE_BYTES, classifyCv } from './cv.mjs';

export const INBOX_ID = 'meda-vermittlung@agentmail.to';
export const COPY_TO = 'MEDA-team@outlook.com';
export const DEFAULT_ORIGINS = [
  'https://meda-vermittlung.de',
  'https://www.meda-vermittlung.de',
  'https://g5kjd9v7cf-boop.github.io',
];
export const MAX_BODY_BYTES = 6 * 1024 * 1024;
export const AGENTMAIL_REQUEST_LIMIT = 6_000_000;
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;
const SECTORS = new Set(['ausbildung', 'healthcare', 'other', 'eng', 'log', 'it']);
const CONTENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const FIELD_ORDER = [
  'form_type',
  'name',
  'email',
  'phone',
  'document_version',
  'consent_checkbox_version',
  'einwilligung_gelesen',
  'experience',
  'skills',
  'languages',
  'availability',
  'sector_path',
  'ref_code',
];
const LIMITS = {
  name: 200,
  email: 200,
  phone: 50,
  document_version: 40,
  consent_checkbox_version: 40,
  experience: 4000,
  skills: 4000,
  languages: 400,
  availability: 200,
  sector_path: 40,
  ref_code: 80,
  form_type: 40,
};
const moduleBuckets = new Map();

function json(data, status, headers, extra) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
      ...extra,
    },
  });
}

function httpsOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (url.pathname !== '/' && url.pathname !== '') return '';
    if (url.search || url.hash) return '';
    return url.origin;
  } catch {
    return '';
  }
}

export function parseOrigins(env) {
  const raw = env && env.ALLOWED_ORIGINS;
  if (!raw || !String(raw).trim()) return DEFAULT_ORIGINS.slice();
  const list = String(raw)
    .split(',')
    .map((part) => httpsOrigin(part.trim()))
    .filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS.slice();
}

function corsHeaders(origin, allowed) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function safeLog(event, fields) {
  const out = { event: String(event || 'apply') };
  const src = fields && typeof fields === 'object' ? fields : {};
  for (const key of ['code', 'status', 'ok']) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  console.log(JSON.stringify(out));
}

function clientIp(request) {
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

function clip(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\r/g, '').trim().slice(0, max);
}

function validEmail(value) {
  return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isApplyPath(pathname) {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  return path === '/' || path === '/apply';
}

async function verifyTurnstile(fetchImpl, secret, token, ip) {
  if (!token || !secret) return false;
  let response;
  try {
    response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || '' }),
      redirect: 'manual',
    });
  } catch {
    return false;
  }
  if (!response || response.status < 200 || response.status >= 300) return false;
  try {
    const data = await response.json();
    return Boolean(data && data.success === true);
  } catch {
    return false;
  }
}

function stringFields(form) {
  const fields = {};
  let count = 0;
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    if (!key || key.startsWith('_') || key === 'cf-turnstile-response') continue;
    count += 1;
    if (count > 40) break;
    const max = LIMITS[key] || 500;
    fields[key] = clip(value, max);
  }
  return fields;
}

function messageText(fields) {
  const lines = ['MEDA Bewerbung'];
  const seen = new Set();
  for (const key of FIELD_ORDER) {
    if (fields[key]) {
      lines.push(`${key}: ${fields[key]}`);
      seen.add(key);
    }
  }
  for (const key of Object.keys(fields).sort()) {
    if (seen.has(key) || !fields[key]) continue;
    lines.push(`${key}: ${fields[key]}`);
  }
  return lines.join('\n');
}

function subjectLine(name) {
  const clean = clip(name, 120).replace(/[\n]/g, ' ');
  return clean ? `MEDA website Bewerbung: ${clean}` : 'MEDA website Bewerbung';
}

export async function handleApply(request, env, deps = {}) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseOrigins(env);
  const headers = corsHeaders(origin, allowed);
  const fetchImpl = deps.fetchImpl || fetch;
  const now = deps.now || Date.now();
  const buckets = deps.buckets || moduleBuckets;
  const fail = (status, error, extra) => {
    safeLog('apply', { code: error, status });
    return json({ ok: false, error }, status, headers, extra);
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  if (request.method !== 'POST' || !isApplyPath(url.pathname)) {
    return fail(404, 'NOT_FOUND');
  }
  if (!origin || !allowed.includes(origin)) return fail(403, 'ORIGIN');

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return fail(413, 'FILE_SIZE');

  const ip = clientIp(request) || 'missing';
  const limit = checkRateLimit(buckets, `apply:${ip}`, now, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    const retry = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    return fail(429, 'RATE_LIMIT', { 'Retry-After': String(retry) });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'BAD_FORM');
  }

  if (String(form.get('_honey') ?? '').length > 0) {
    safeLog('apply', { code: 'HONEY', status: 200, ok: true });
    return json({ ok: true }, 200, headers);
  }

  const apiKey = String((env && env.AGENTMAIL_API_KEY) || '').trim();
  if (!apiKey) return fail(503, 'NOT_CONFIGURED');

  const turnstileSecret = String((env && env.TURNSTILE_SECRET) || '').trim();
  if (turnstileSecret) {
    const passed = await verifyTurnstile(
      fetchImpl,
      turnstileSecret,
      clip(form.get('cf-turnstile-response'), 2048),
      ip === 'missing' ? '' : ip
    );
    if (!passed) return fail(403, 'TURNSTILE');
  }

  const fields = stringFields(form);
  const formType = fields.form_type || '';
  if (fields.einwilligung_gelesen !== 'yes' || !fields.document_version || !fields.consent_checkbox_version) {
    return fail(400, 'CONSENT');
  }
  if (!fields.name || !validEmail(fields.email)) return fail(400, 'INVALID');

  let attachment = null;
  if (formType === 'cv_upload') {
    const files = form.getAll('attachment').filter((item) => item && typeof item !== 'string');
    if (files.length !== 1 || typeof files[0].arrayBuffer !== 'function') return fail(400, 'FILE_TYPE');
    const file = files[0];
    if (typeof file.size === 'number' && file.size > MAX_FILE_BYTES) return fail(400, 'FILE_SIZE');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const classified = classifyCv(file.name || '', bytes.length, bytes);
    if (!classified.ok) return fail(400, classified.error);
    attachment = {
      filename: safeFileName(file.name, classified.ext),
      content_type: CONTENT_TYPES[classified.ext],
      content_disposition: 'attachment',
      content: bytesToBase64(bytes),
    };
  } else if (formType === 'profile_no_cv') {
    if (!fields.phone || !fields.experience || !fields.skills || !fields.languages || !fields.availability || !SECTORS.has(fields.sector_path)) {
      return fail(400, 'INVALID');
    }
  } else {
    return fail(400, 'INVALID');
  }

  const payload = {
    to: [INBOX_ID],
    cc: [COPY_TO],
    reply_to: fields.email,
    subject: subjectLine(fields.name),
    text: messageText(fields),
  };
  if (attachment) payload.attachments = [attachment];

  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).length > AGENTMAIL_REQUEST_LIMIT) return fail(413, 'FILE_SIZE');

  const inbox = encodeURIComponent(INBOX_ID);
  let sent;
  try {
    sent = await fetchImpl(`https://api.agentmail.to/v0/inboxes/${inbox}/messages/send`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
  } catch {
    return fail(502, 'DELIVERY_FAILED');
  }
  if (sent && sent.body && typeof sent.body.cancel === 'function') {
    try { await sent.body.cancel(); } catch { /* the response is not logged */ }
  }
  if (!sent || sent.status < 200 || sent.status >= 300) return fail(502, 'DELIVERY_FAILED');
  safeLog('apply', { code: 'OK', status: 200, ok: true });
  return json({ ok: true }, 200, headers);
}

export default {
  async fetch(request, env) {
    return handleApply(request, env);
  },
};
