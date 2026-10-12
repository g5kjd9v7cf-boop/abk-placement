/**
 * MEDA e-sign Worker stub (not deployed).
 * Forces binding=false and status=ENTWURF.
 * Submit is refused until LEGAL_APPROVED_PACK_IDS lists the pack id.
 * Public ids only: CAND-* / EMP-* in, REF-* out.
 * Recipients come only from env.DELIVER_TO.
 */
import {
  checkRateLimit,
  clientIp,
  corsHeaders,
  demoTokensRejected,
  isDemoToken,
  JSON_LIMITS,
  parseOrigins,
  readJsonLimited,
  requireTurnstile,
  safeLog,
  turnstileTokenFrom,
} from '../../workers/security.mjs';
import { handlePartner, partnerEnabled } from './partner-portal.mjs';

const KNOWN_PACKS = {
  'candidate-soft-launch-0.14': '023ba2ff2f8adf9a09018c930149ebab1bd8ab683b6445fc68cda0b27fcfb262',
  'employer-soft-launch-0.5': 'f6985e23d2acb9e7fb027fc9f8fdd2fc5c07d5113506cc70a53194274d4306b8',
  'family-soft-launch-0.6': '210c2df2e086ec975dd156a06123ce04abb24d4fdda288ca8bc1a64b455104ee',
};

const buckets = new Map();

export function notifyRecipients(env) {
  const raw = env && env.DELIVER_TO;
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function approvedIds(env) {
  return String((env && env.LEGAL_APPROVED_PACK_IDS) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function makeRefId(date = new Date(), randHex) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const rand = (randHex || Math.floor(Math.random() * 0xffff).toString(16))
    .toUpperCase()
    .padStart(4, '0')
    .slice(0, 4);
  return `REF-${y}${m}${day}-${rand}`;
}

function isToken(value, prefix) {
  return new RegExp('^' + prefix + '-[A-Za-z0-9][A-Za-z0-9-]{0,64}$').test(String(value || ''));
}

export function evaluateSubmit(body, env, now = new Date()) {
  const input = body && typeof body === 'object' ? body : {};
  const packId = String(input.clause_pack_id || '');
  const party = String(input.party_type || '');
  const token = String(input.public_token || '').trim();
  const forced = {
    binding: false,
    status: 'ENTWURF',
  };

  if (!KNOWN_PACKS[packId]) {
    return { http: 400, body: { ok: false, error: 'UNKNOWN_PACK', ...forced } };
  }
  if (input.content_sha256 && input.content_sha256 !== KNOWN_PACKS[packId]) {
    return { http: 400, body: { ok: false, error: 'PACK_HASH_MISMATCH', ...forced } };
  }
  if (party === 'employer') {
    if (!isToken(token, 'EMP')) {
      return { http: 400, body: { ok: false, error: 'TOKEN_INVALID', ...forced } };
    }
  } else if (party === 'candidate' || party === 'family') {
    if (token && !isToken(token, 'CAND') && !isToken(token, 'REF')) {
      return { http: 400, body: { ok: false, error: 'TOKEN_INVALID', ...forced } };
    }
  } else {
    return { http: 400, body: { ok: false, error: 'PARTY_INVALID', ...forced } };
  }

  if (demoTokensRejected(env) && isDemoToken(token)) {
    return { http: 403, body: { ok: false, error: 'DEMO_TOKEN_REJECTED', ...forced } };
  }

  const checks = input.checkbox_map;
  if (!checks || typeof checks !== 'object' || Object.keys(checks).length === 0 || Object.values(checks).some((v) => v !== true)) {
    return { http: 400, body: { ok: false, error: 'CHECKLIST_INCOMPLETE', ...forced } };
  }
  const name = String(input.signer_display_name || '').trim().slice(0, 200);
  if (name.split(/\s+/).filter((p) => p.length >= 2).length < 2) {
    return { http: 400, body: { ok: false, error: 'NAME_INVALID', ...forced } };
  }
  const sig = String(input.signature_png_data_url || '');
  if (sig.length > 500_000) {
    return { http: 413, body: { ok: false, error: 'PAYLOAD_TOO_LARGE', ...forced } };
  }
  if (!sig.startsWith('data:image/png;base64,')) {
    return { http: 400, body: { ok: false, error: 'SIGNATURE_MISSING', ...forced } };
  }
  if (Object.keys(checks).length > 40) {
    return { http: 400, body: { ok: false, error: 'CHECKLIST_INCOMPLETE', ...forced } };
  }

  if (!approvedIds(env).includes(packId)) {
    return {
      http: 403,
      body: {
        ok: false,
        error: 'LEGAL_NOT_APPROVED',
        message: 'Legal-Freigabe ausstehend',
        ...forced,
      },
    };
  }

  const ref = makeRefId(now);
  return {
    http: 200,
    body: {
      ok: true,
      ref_id: ref,
      public_token: token || null,
      binding: false,
      status: 'ENTWURF',
      clause_pack_id: packId,
      notify: { stub: true, delivered: false, recipients: notifyRecipients(env) },
    },
    record: {
      ref_id: ref,
      party_type: party,
      public_token: token || null,
      clause_pack_id: packId,
      content_sha256: KNOWN_PACKS[packId],
      checkbox_map: checks,
      signer_display_name: name,
      binding: 0,
      status: 'ENTWURF',
      signed_at: now.toISOString(),
    },
  };
}

function json(data, status, extra) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, parseOrigins(env), { methods: 'GET, POST, OPTIONS' });
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (url.pathname.startsWith('/esign/partner')) {
      if (!partnerEnabled(env)) {
        safeLog('esign', { code: 'NOT_FOUND', status: 404, route: 'partner' });
        return json({ ok: false, error: 'NOT_FOUND', binding: false, status: 'ENTWURF' }, 404, headers);
      }
      return handlePartner(request, env, url, headers);
    }
    if (request.method === 'POST') {
      const decision = checkRateLimit(
        buckets,
        `esign:${clientIp(request) || 'missing'}`,
        Date.now(),
        10,
        60 * 60 * 1000
      );
      if (!decision.ok) {
        return json({ ok: false, error: 'RATE_LIMIT', binding: false, status: 'ENTWURF' }, 429, headers);
      }
    }
    if (url.pathname === '/esign/health' && request.method === 'GET') {
      return json({ ok: true, binding: false, legal_approved_packs: approvedIds(env) }, 200, headers);
    }
    if (url.pathname !== '/esign/submit' || request.method !== 'POST') {
      return json({ ok: false, error: 'NOT_FOUND' }, 404, headers);
    }
    const parsed = await readJsonLimited(request, JSON_LIMITS.esign);
    if (!parsed.ok) {
      safeLog('esign', { code: parsed.error, status: parsed.status });
      return json(
        { ok: false, error: parsed.error, binding: false, status: 'ENTWURF' },
        parsed.status,
        headers
      );
    }
    const turnstile = await requireTurnstile(
      env,
      turnstileTokenFrom(parsed.value),
      clientIp(request)
    );
    if (!turnstile.ok) {
      safeLog('esign', { code: turnstile.error, status: turnstile.status });
      return json(
        { ok: false, error: turnstile.error, binding: false, status: 'ENTWURF' },
        turnstile.status,
        headers
      );
    }
    const result = evaluateSubmit(parsed.value, env);
    const payload = { ...result.body };
    delete payload.record;
    return json(payload, result.http, headers);
  },
};
