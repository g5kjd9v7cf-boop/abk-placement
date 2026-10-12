/**
 * Partner portal stub on the meda-esign Worker. Not deployed.
 * PARTNER_PORTAL defaults false. Every JSON response keeps binding false.
 * Passkey finish fails closed until a WebAuthn verifier is injected.
 * Magic-link tokens are never returned on the HTTP response.
 * Signed PDFs have no public URL. See PARTNER-PORTAL.md.
 */
import {
  checkRateLimit,
  clientIp,
  flagOn,
  JSON_LIMITS,
  readJsonLimited,
  requireTurnstile,
  safeLog,
  secretsEqual,
  turnstileTokenFrom,
} from '../../workers/security.mjs';

const PARTNER_ID = /^prt_[a-z0-9]{16}$/;
const CONTRACT_ID = /^con_[a-z0-9]{16}$/;
const LOGIN_JSON_LIMIT = 8 * 1024;
const MAGIC_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_LINK_TTL_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const defaultStore = createStore();

export function partnerEnabled(env) {
  return flagOn(env, 'PARTNER_PORTAL');
}

export function createStore() {
  return {
    magic: new Map(),
    sessions: new Map(),
    challenges: new Map(),
    contracts: new Map(),
    objects: new Map(),
    audit: [],
    buckets: new Map(),
  };
}

export function putContract(store, contract) {
  const id = String(contract && contract.id || '');
  const partnerId = String(contract && contract.partner_id || '');
  if (!CONTRACT_ID.test(id) || !PARTNER_ID.test(partnerId)) {
    throw new Error('BAD_ID');
  }
  store.contracts.set(id, {
    id,
    partner_id: partnerId,
    public_token: String(contract.public_token || ''),
    clause_pack_id: String(contract.clause_pack_id || ''),
    ref_id: contract.ref_id || null,
    binding: false,
    status: 'ENTWURF',
    pdf: false,
  });
  return store.contracts.get(id);
}

export function canAccess(session, record) {
  return Boolean(session && record && session.partner_id === record.partner_id);
}

export function privatePdfKey(partnerId, contractId) {
  return `private/${partnerId}/${contractId}.pdf`;
}

export function auditEntries(store) {
  return store.audit.map((row) => ({
    at: row.at,
    action: row.action,
    partner_id: row.partner_id,
    contract_id: row.contract_id,
  }));
}

function nowDate(deps) {
  const value = typeof deps.now === 'function' ? deps.now() : new Date();
  return value instanceof Date ? value : new Date(value);
}

function audit(store, action, partnerId, contractId, now) {
  store.audit.push({
    at: now.toISOString(),
    action,
    partner_id: partnerId || null,
    contract_id: contractId || null,
  });
}

function portalJson(data, status, extra) {
  const body = { ...data, binding: false, status: 'ENTWURF' };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

function fail(error, status, cors) {
  safeLog('esign', { code: error, status, route: 'partner' });
  return portalJson({ ok: false, error }, status, cors);
}

function limited(store, request, name, limit, now) {
  const ip = clientIp(request) || 'missing';
  return checkRateLimit(store.buckets, `partner:${name}:${ip}`, now.getTime(), limit, HOUR_MS);
}

function b64url(bytes) {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function b64urlToString(value) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const bin = atob(value.replaceAll('-', '+').replaceAll('_', '/') + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

async function sha256Hex(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function linkTtlMs(env) {
  const raw = Number(env && env.PARTNER_LINK_TTL_SECONDS);
  if (!Number.isFinite(raw)) return DEFAULT_LINK_TTL_MS;
  const seconds = Math.min(900, Math.max(30, Math.floor(raw)));
  return seconds * 1000;
}

function readSessionToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.match(/^Bearer\s+(\S+)/i);
  if (bearer) return bearer[1];
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)partner_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function sessionFrom(request, store, now) {
  const token = readSessionToken(request);
  if (!token) return null;
  const hash = await sha256Hex(token);
  const row = store.sessions.get(hash);
  if (!row || row.exp <= now.getTime()) return null;
  return { partner_id: row.partner_id, exp: row.exp };
}

function sessionCookie(token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `partner_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/esign/partner; Max-Age=${maxAge}`;
}

async function openSession(store, partnerId, now) {
  const token = randomToken();
  const hash = await sha256Hex(token);
  const exp = now.getTime() + SESSION_TTL_MS;
  store.sessions.set(hash, { partner_id: partnerId, exp });
  return { token, exp };
}

function emailShape(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length < 3 || email.length > 200) return '';
  if (email.includes(' ') || email.includes('\n') || email.includes('\r')) return '';
  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@') || at > email.length - 4) return '';
  return email;
}

async function directoryHit(directory, partnerId, email) {
  const expectedRaw = directory && typeof directory[partnerId] === 'string' ? directory[partnerId] : '';
  const expected = emailShape(expectedRaw);
  const given = emailShape(email);
  const match = await secretsEqual(expected, given);
  return Boolean(expected && given && match && PARTNER_ID.test(partnerId));
}

function knownPartner(directory, partnerId) {
  return Boolean(directory && typeof directory[partnerId] === 'string' && PARTNER_ID.test(partnerId) && emailShape(directory[partnerId]));
}

async function guardTurnstile(request, env, body, deps) {
  return requireTurnstile(env, turnstileTokenFrom(body), clientIp(request), deps.fetchImpl || fetch);
}

function stubPdfBytes() {
  return new TextEncoder().encode('%PDF-1.4\n% meda-partner-stub\ntrailer<<>>\n%%EOF\n');
}

async function writePdf(bucket, memory, key, bytes, partnerId) {
  if (!key.startsWith(`private/${partnerId}/`)) return { ok: false, publicUrl: null };
  if (bucket && typeof bucket.put === 'function') {
    const result = await bucket.put(key, bytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { partner_id: partnerId },
    });
    if (result && result.publicUrl) {
      if (typeof bucket.delete === 'function') await bucket.delete(key);
      return { ok: false, publicUrl: null };
    }
  } else {
    memory.set(key, { bytes, partnerId });
  }
  return { ok: true, publicUrl: null };
}

async function readPdf(bucket, memory, key, partnerId) {
  if (!key.startsWith(`private/${partnerId}/`)) return null;
  if (bucket && typeof bucket.get === 'function') {
    const obj = await bucket.get(key);
    if (!obj) return null;
    if (obj.publicUrl) return null;
    const buf = typeof obj.arrayBuffer === 'function' ? await obj.arrayBuffer() : obj;
    return new Uint8Array(buf);
  }
  const hit = memory.get(key);
  if (!hit || hit.partnerId !== partnerId) return null;
  return hit.bytes;
}

async function issueLink(env, partnerId, contractId, now) {
  const secret = String((env && env.PARTNER_LINK_SECRET) || '').trim();
  if (secret.length < 16) return { ok: false, error: 'NOT_CONFIGURED', status: 503 };
  const exp = now.getTime() + linkTtlMs(env);
  const payload = JSON.stringify({ v: 1, partner_id: partnerId, contract_id: contractId, exp });
  const mac = await hmacHex(secret, payload);
  const token = `${b64url(new TextEncoder().encode(payload))}.${mac}`;
  return { ok: true, token, exp };
}

async function readLink(env, token) {
  const secret = String((env && env.PARTNER_LINK_SECRET) || '').trim();
  if (secret.length < 16) return { ok: false, error: 'NOT_CONFIGURED', status: 503 };
  const raw = String(token || '');
  if (raw.length < 20 || raw.length > 2000 || !raw.includes('.')) {
    return { ok: false, error: 'LINK_INVALID', status: 403 };
  }
  const dot = raw.lastIndexOf('.');
  const payloadB64 = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  let payload;
  try {
    payload = b64urlToString(payloadB64);
  } catch {
    return { ok: false, error: 'LINK_INVALID', status: 403 };
  }
  const expected = await hmacHex(secret, payload);
  if (!(await secretsEqual(expected, mac))) {
    return { ok: false, error: 'LINK_INVALID', status: 403 };
  }
  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return { ok: false, error: 'LINK_INVALID', status: 403 };
  }
  if (!data || data.v !== 1 || !PARTNER_ID.test(data.partner_id) || !CONTRACT_ID.test(data.contract_id)) {
    return { ok: false, error: 'LINK_INVALID', status: 403 };
  }
  return { ok: true, data };
}

async function magicLink(request, env, store, cors, deps, now) {
  const decision = limited(store, request, 'magic', 5, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const parsed = await readJsonLimited(request, LOGIN_JSON_LIMIT);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const turnstile = await guardTurnstile(request, env, parsed.value, deps);
  if (!turnstile.ok) return fail(turnstile.error, turnstile.status, cors);
  const partnerId = String(parsed.value.partner_id || '');
  const email = String(parsed.value.email || '');
  const hit = await directoryHit(deps.directory, partnerId, email);
  if (hit && typeof deps.mailer === 'function') {
    const token = randomToken();
    const hash = await sha256Hex(token);
    store.magic.set(hash, { partner_id: partnerId, exp: now.getTime() + MAGIC_TTL_MS, used: false });
    await deps.mailer({ to: emailShape(email), token });
    audit(store, 'MAGIC_ISSUED', partnerId, null, now);
  }
  return portalJson({ ok: true, delivered: false }, 200, cors);
}

async function consumeMagic(request, env, store, cors, now) {
  const decision = limited(store, request, 'consume', 10, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const parsed = await readJsonLimited(request, LOGIN_JSON_LIMIT);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const token = String(parsed.value.token || '');
  const hash = token ? await sha256Hex(token) : '';
  const row = hash ? store.magic.get(hash) : null;
  if (!row || row.used || row.exp <= now.getTime()) {
    audit(store, 'LOGIN_FAILED', null, null, now);
    return fail('LOGIN_FAILED', 401, cors);
  }
  row.used = true;
  const session = await openSession(store, row.partner_id, now);
  audit(store, 'LOGIN', row.partner_id, null, now);
  const headers = { ...cors, 'Set-Cookie': sessionCookie(session.token) };
  return portalJson(
    { ok: true, session: session.token, expires_at: new Date(session.exp).toISOString() },
    200,
    headers
  );
}

async function passkeyOptions(request, env, store, cors, deps, now) {
  const decision = limited(store, request, 'passkey', 10, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const parsed = await readJsonLimited(request, LOGIN_JSON_LIMIT);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const turnstile = await guardTurnstile(request, env, parsed.value, deps);
  if (!turnstile.ok) return fail(turnstile.error, turnstile.status, cors);
  const partnerId = String(parsed.value.partner_id || '');
  const challenge = randomToken();
  if (knownPartner(deps.directory, partnerId)) {
    store.challenges.set(challenge, { partner_id: partnerId, exp: now.getTime() + 5 * 60 * 1000 });
  }
  return portalJson(
    { ok: true, challenge, timeout_ms: 60000, user_verification: 'required' },
    200,
    cors
  );
}

async function passkeyFinish(request, env, store, cors, deps, now) {
  const decision = limited(store, request, 'passkey', 10, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const parsed = await readJsonLimited(request, LOGIN_JSON_LIMIT);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const turnstile = await guardTurnstile(request, env, parsed.value, deps);
  if (!turnstile.ok) return fail(turnstile.error, turnstile.status, cors);
  const verify = typeof deps.verifyPasskey === 'function'
    ? deps.verifyPasskey
    : async () => ({ ok: false, error: 'NOT_CONFIGURED', status: 503 });
  const verdict = await verify(parsed.value);
  if (!verdict || verdict.ok !== true) {
    audit(store, 'LOGIN_FAILED', null, null, now);
    return fail((verdict && verdict.error) || 'NOT_CONFIGURED', (verdict && verdict.status) || 503, cors);
  }
  const partnerId = String(parsed.value.partner_id || '');
  const challenge = String(parsed.value.challenge || '');
  const row = store.challenges.get(challenge);
  store.challenges.delete(challenge);
  if (!row || row.exp <= now.getTime() || row.partner_id !== partnerId) {
    audit(store, 'LOGIN_FAILED', null, null, now);
    return fail('LOGIN_FAILED', 401, cors);
  }
  const session = await openSession(store, partnerId, now);
  audit(store, 'LOGIN', partnerId, null, now);
  const headers = { ...cors, 'Set-Cookie': sessionCookie(session.token) };
  return portalJson(
    { ok: true, session: session.token, expires_at: new Date(session.exp).toISOString() },
    200,
    headers
  );
}

async function listContracts(request, store, cors, now) {
  const decision = limited(store, request, 'list', 60, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const session = await sessionFrom(request, store, now);
  if (!session) return fail('LOGIN_REQUIRED', 401, cors);
  const contracts = [];
  for (const row of store.contracts.values()) {
    if (!canAccess(session, row)) continue;
    contracts.push({
      id: row.id,
      clause_pack_id: row.clause_pack_id,
      ref_id: row.ref_id,
      signed: row.pdf === true,
      binding: false,
      status: 'ENTWURF',
    });
  }
  return portalJson({ ok: true, contracts }, 200, cors);
}

async function signContract(request, env, store, cors, deps, now) {
  const decision = limited(store, request, 'sign', 10, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const session = await sessionFrom(request, store, now);
  if (!session) return fail('LOGIN_REQUIRED', 401, cors);
  const parsed = await readJsonLimited(request, JSON_LIMITS.esign);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const turnstile = await guardTurnstile(request, env, parsed.value, deps);
  if (!turnstile.ok) return fail(turnstile.error, turnstile.status, cors);
  const contractId = String(parsed.value.contract_id || '');
  const contract = store.contracts.get(contractId);
  if (!canAccess(session, contract)) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  if (String(parsed.value.public_token || '') !== contract.public_token) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  const { evaluateSubmit } = await import('./index.js');
  const submitBody = { ...parsed.value, party_type: 'employer', binding: false };
  delete submitBody.deliver_to;
  delete submitBody.contract_id;
  if (submitBody.clause_pack_id && submitBody.clause_pack_id !== contract.clause_pack_id) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  submitBody.clause_pack_id = contract.clause_pack_id;
  const result = evaluateSubmit(submitBody, env, now);
  if (result.http !== 200) {
    const error = result.body && result.body.error ? result.body.error : 'ERROR';
    return fail(error, result.http, cors);
  }
  const key = privatePdfKey(contract.partner_id, contract.id);
  const stored = await writePdf(deps.bucket, store.objects, key, stubPdfBytes(), contract.partner_id);
  if (!stored.ok || stored.publicUrl) {
    audit(store, 'SIGN_REFUSED', session.partner_id, contract.id, now);
    return fail('ERROR', 500, cors);
  }
  contract.pdf = true;
  contract.ref_id = result.body.ref_id;
  contract.binding = false;
  contract.status = 'ENTWURF';
  audit(store, 'SIGN', session.partner_id, contract.id, now);
  return portalJson({ ok: true, ref_id: result.body.ref_id, contract_id: contract.id }, 200, cors);
}

async function downloadLink(request, env, store, cors, now) {
  const decision = limited(store, request, 'download', 30, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const session = await sessionFrom(request, store, now);
  if (!session) return fail('LOGIN_REQUIRED', 401, cors);
  const parsed = await readJsonLimited(request, LOGIN_JSON_LIMIT);
  if (!parsed.ok) return fail(parsed.error, parsed.status, cors);
  const contract = store.contracts.get(String(parsed.value.contract_id || ''));
  if (!canAccess(session, contract) || contract.pdf !== true) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  const link = await issueLink(env, contract.partner_id, contract.id, now);
  if (!link.ok) return fail(link.error, link.status, cors);
  audit(store, 'LINK_ISSUED', session.partner_id, contract.id, now);
  return portalJson(
    {
      ok: true,
      path: `/esign/partner/file?t=${encodeURIComponent(link.token)}`,
      expires_at: new Date(link.exp).toISOString(),
    },
    200,
    cors
  );
}

async function downloadFile(request, env, store, cors, deps, now) {
  const decision = limited(store, request, 'file', 60, now);
  if (!decision.ok) return fail('RATE_LIMIT', 429, cors);
  const session = await sessionFrom(request, store, now);
  if (!session) return fail('LOGIN_REQUIRED', 401, cors);
  const token = new URL(request.url).searchParams.get('t') || '';
  const link = await readLink(env, token);
  if (!link.ok) {
    audit(store, 'DOWNLOAD_DENIED', session.partner_id, null, now);
    return fail(link.error, link.status, cors);
  }
  if (link.data.exp <= now.getTime()) {
    audit(store, 'DOWNLOAD_DENIED', session.partner_id, null, now);
    return fail('LINK_INVALID', 403, cors);
  }
  const contract = store.contracts.get(link.data.contract_id);
  if (!contract || contract.partner_id !== link.data.partner_id || !canAccess(session, contract)) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  const bytes = await readPdf(deps.bucket, store.objects, privatePdfKey(contract.partner_id, contract.id), contract.partner_id);
  if (!bytes) {
    audit(store, 'ACCESS_DENIED', session.partner_id, null, now);
    return fail('NOT_FOUND', 404, cors);
  }
  audit(store, 'DOWNLOAD', session.partner_id, contract.id, now);
  return new Response(bytes, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="contract.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function handlePartner(request, env, url, cors = {}, deps = {}) {
  const store = deps.store || defaultStore;
  const now = nowDate(deps);
  const path = url.pathname;
  if (path === '/esign/partner/magic-link' && request.method === 'POST') {
    return magicLink(request, env, store, cors, deps, now);
  }
  if (path === '/esign/partner/magic-link/consume' && request.method === 'POST') {
    return consumeMagic(request, env, store, cors, now);
  }
  if (path === '/esign/partner/passkey/options' && request.method === 'POST') {
    return passkeyOptions(request, env, store, cors, deps, now);
  }
  if (path === '/esign/partner/passkey/finish' && request.method === 'POST') {
    return passkeyFinish(request, env, store, cors, deps, now);
  }
  if (path === '/esign/partner/contracts' && request.method === 'GET') {
    return listContracts(request, store, cors, now);
  }
  if (path === '/esign/partner/sign' && request.method === 'POST') {
    return signContract(request, env, store, cors, deps, now);
  }
  if (path === '/esign/partner/download' && request.method === 'POST') {
    return downloadLink(request, env, store, cors, now);
  }
  if (path === '/esign/partner/file' && request.method === 'GET') {
    return downloadFile(request, env, store, cors, deps, now);
  }
  return fail('NOT_FOUND', 404, cors);
}
