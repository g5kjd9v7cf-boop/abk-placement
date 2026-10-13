/**
 * Application endpoint. Code only — do not deploy from this PR.
 * A CV is mailed to the ops inbox. A private bucket, when bound, keeps the
 * same bytes under a random key and never returns a URL. Logs omit PII.
 */
import {
  checkRateLimit,
  clientIp,
  containsStandaloneDemoToken,
  corsHeaders,
  demoTokensRejected,
  parseOrigins,
  safeLog,
  verifyTurnstileToken,
} from '../../workers/security.mjs';
import { deleteExpired, privateCvPlan, putPrivateCv, retentionDays } from './retention.mjs';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BODY_BYTES = 6 * 1024 * 1024;
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;
const moduleBuckets = new Map();

const SECTORS = new Set(['ausbildung', 'healthcare', 'other', 'eng', 'log', 'it']);
const MAGIC = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  doc: [0xd0, 0xcf, 0x11, 0xe0],
  docx: [0x50, 0x4b, 0x03, 0x04],
};
const CONTENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};


function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function extensionOf(name) {
  const base = String(name || '').split(/[/\\]/).pop();
  const match = /\.([A-Za-z0-9]+)$/.exec(base);
  return match ? match[1].toLowerCase() : '';
}

function startsWith(bytes, magic) {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) if (bytes[i] !== magic[i]) return false;
  return true;
}

export function classifyFile(bytes, filename) {
  const ext = extensionOf(filename);
  if (!MAGIC[ext] || !startsWith(bytes, MAGIC[ext])) return { ok: false, error: 'FILE_TYPE' };
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) return { ok: false, error: 'FILE_SIZE' };
  return { ok: true, ext };
}

function safeName(filename, ext) {
  const base = String(filename || 'cv')
    .split(/[/\\]/)
    .pop()
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, 80);
  const stem = base.replace(/\.[A-Za-z0-9]+$/, '') || 'cv';
  return `${stem}.${ext}`;
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max);
}

function validEmail(value) {
  return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function configured(env) {
  return Boolean(
    env &&
      String(env.TURNSTILE_SECRET || '').trim() &&
      String(env.AGENTMAIL_API_KEY || '').trim() &&
      String(env.AGENTMAIL_INBOX_ID || '').trim() &&
      String(env.DELIVER_TO || '').trim()
  );
}

export async function handleApply(request, env, deps = {}) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseOrigins(env);
  const headers = corsHeaders(origin, allowed, { methods: 'POST, OPTIONS' });
  const fetchImpl = deps.fetchImpl || fetch;
  const now = deps.now || Date.now();
  const buckets = deps.buckets || moduleBuckets;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (request.method !== 'POST' || (path !== '/apply' && !path.endsWith('/apply'))) {
    return json({ ok: false, error: 'NOT_FOUND' }, 404, headers);
  }
  if (!origin || !allowed.includes(origin)) {
    safeLog('apply', { code: 'ORIGIN', status: 403 });
    return json({ ok: false, error: 'ORIGIN' }, 403, headers);
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(buckets, `apply:${ip || 'missing'}`, now, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    safeLog('apply', { code: 'RATE_LIMIT', status: 429 });
    return json({ ok: false, error: 'RATE_LIMIT' }, 429, headers);
  }

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) {
    safeLog('apply', { code: 'FILE_SIZE', status: 413 });
    return json({ ok: false, error: 'FILE_SIZE' }, 413, headers);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    safeLog('apply', { code: 'BAD_FORM', status: 400 });
    return json({ ok: false, error: 'BAD_FORM' }, 400, headers);
  }

  if (String(form.get('_honey') || '')) {
    safeLog('apply', { code: 'HONEY', status: 200, ok: true });
    return json({ ok: true }, 200, headers);
  }

  const fields = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }
  if (demoTokensRejected(env) && containsStandaloneDemoToken(fields)) {
    safeLog('apply', { code: 'DEMO_TOKEN_REJECTED', status: 403 });
    return json({ ok: false, error: 'DEMO_TOKEN_REJECTED' }, 403, headers);
  }
  if (!configured(env)) {
    safeLog('apply', { code: 'NOT_CONFIGURED', status: 503 });
    return json({ ok: false, error: 'NOT_CONFIGURED' }, 503, headers);
  }

  const turnstileOk = await verifyTurnstileToken(
    fetchImpl,
    env.TURNSTILE_SECRET,
    String(form.get('cf-turnstile-response') || ''),
    ip
  );
  if (!turnstileOk) {
    safeLog('apply', { code: 'TURNSTILE', status: 403 });
    return json({ ok: false, error: 'TURNSTILE' }, 403, headers);
  }

  const formType = String(form.get('form_type') || '');
  const name = clip(form.get('name'), 200);
  const email = clip(form.get('email'), 200);
  const phone = clip(form.get('phone'), 50);
  if (String(form.get('einwilligung_gelesen') || '') !== 'yes' || !name || !validEmail(email)) {
    safeLog('apply', { code: 'INVALID', status: 400 });
    return json({ ok: false, error: 'INVALID' }, 400, headers);
  }

  const lines = [
    'MEDA Bewerbung',
    `form_type: ${formType}`,
    `name: ${name}`,
    `email: ${email}`,
    `phone: ${phone}`,
    `document_version: ${clip(form.get('document_version'), 40)}`,
  ];
  let attachment = null;

  if (formType === 'cv_upload') {
    const file = form.get('attachment');
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      safeLog('apply', { code: 'FILE_TYPE', status: 400 });
      return json({ ok: false, error: 'FILE_TYPE' }, 400, headers);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const classified = classifyFile(bytes, file.name || '');
    if (!classified.ok) {
      safeLog('apply', { code: classified.error, status: 400 });
      return json({ ok: false, error: classified.error }, 400, headers);
    }
    attachment = {
      filename: safeName(file.name, classified.ext),
      content_type: CONTENT_TYPES[classified.ext],
      content: bytesToBase64(bytes),
    };
    const plan = privateCvPlan(new Date(now), retentionDays(env));
    try {
      const stored = await putPrivateCv(env.CV_BUCKET, bytes, attachment.content_type, plan);
      if (stored.publicUrl) {
        safeLog('apply', { code: 'ERROR', status: 500 });
        return json({ ok: false, error: 'ERROR' }, 500, headers);
      }
    } catch {
      safeLog('apply', { code: 'ERROR', status: 500 });
      return json({ ok: false, error: 'ERROR' }, 500, headers);
    }
  } else if (formType === 'profile_no_cv') {
    const experience = clip(form.get('experience'), 4000);
    const skills = clip(form.get('skills'), 4000);
    const languages = clip(form.get('languages'), 400);
    const availability = clip(form.get('availability'), 200);
    const sector = clip(form.get('sector_path'), 40);
    if (!phone || !experience || !skills || !languages || !availability || !SECTORS.has(sector)) {
      safeLog('apply', { code: 'INVALID', status: 400 });
      return json({ ok: false, error: 'INVALID' }, 400, headers);
    }
    lines.push(
      `experience: ${experience}`,
      `skills: ${skills}`,
      `languages: ${languages}`,
      `availability: ${availability}`,
      `sector_path: ${sector}`
    );
  } else {
    safeLog('apply', { code: 'INVALID', status: 400 });
    return json({ ok: false, error: 'INVALID' }, 400, headers);
  }

  const recipients = String(env.DELIVER_TO)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const payload = {
    to: recipients,
    subject: 'MEDA website Bewerbung',
    text: lines.join('\n'),
  };
  if (attachment) payload.attachments = [attachment];

  const inbox = encodeURIComponent(String(env.AGENTMAIL_INBOX_ID).trim());
  let sent;
  try {
    sent = await fetchImpl(`https://api.agentmail.to/v0/inboxes/${inbox}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    safeLog('apply', { code: 'DELIVERY_FAILED', status: 502 });
    return json({ ok: false, error: 'DELIVERY_FAILED' }, 502, headers);
  }
  if (!sent || !sent.ok) {
    safeLog('apply', { code: 'DELIVERY_FAILED', status: 502 });
    return json({ ok: false, error: 'DELIVERY_FAILED' }, 502, headers);
  }
  safeLog('apply', { code: 'OK', status: 200, ok: true });
  return json({ ok: true }, 200, headers);
}

export default {
  async fetch(request, env) {
    return handleApply(request, env);
  },
  async scheduled(_event, env) {
    await deleteExpired(env && env.CV_BUCKET);
    safeLog('apply-retention', { code: 'DELETE', status: 200, ok: true });
  },
};
