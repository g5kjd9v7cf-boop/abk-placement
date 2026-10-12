import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import worker from '../src/index.js';
import {
  auditEntries,
  canAccess,
  createStore,
  handlePartner,
  privatePdfKey,
  putContract,
} from '../src/partner-portal.mjs';

const employerPack = JSON.parse(
  readFileSync(new URL('../../data/esign/employer-soft-launch-0.5.json', import.meta.url), 'utf8')
);

const PARTNER_A = 'prt_aaaabbbbccccdddd';
const PARTNER_B = 'prt_eeeeffffgggghhhh';
const CONTRACT_A = 'con_aaaabbbbccccdddd';
const CONTRACT_B = 'con_eeeeffffgggghhhh';
const NOW = new Date('2026-10-12T12:00:00Z');
const LINK_SECRET = 'test-partner-link-secret';

function clock(date) {
  return () => date;
}

function contract(id, partnerId) {
  return {
    id,
    partner_id: partnerId,
    public_token: 'EMP-LIVE-001',
    clause_pack_id: employerPack.id,
  };
}

function portalEnv(extra = {}) {
  return {
    PARTNER_PORTAL: 'true',
    PARTNER_LINK_SECRET: LINK_SECRET,
    LEGAL_APPROVED_PACK_IDS: employerPack.id,
    REJECT_DEMO_TOKENS: 'true',
    ALLOWED_ORIGINS: 'https://meda-vermittlung.de,https://www.meda-vermittlung.de',
    ...extra,
  };
}

function post(path, body, { ip = '198.51.100.20', session = '', headers = {} } = {}) {
  const head = {
    Origin: 'https://meda-vermittlung.de',
    'Content-Type': 'application/json',
    'CF-Connecting-IP': ip,
    ...headers,
  };
  if (session) head.Authorization = `Bearer ${session}`;
  return new Request(`https://worker.example${path}`, {
    method: 'POST',
    headers: head,
    body: JSON.stringify(body),
  });
}

async function call(request, env, deps) {
  const url = new URL(request.url);
  return handlePartner(request, env, url, {}, deps);
}

function signBody(contractId, extra = {}) {
  const checkbox_map = {};
  for (const item of employerPack.checklist) checkbox_map[item.id] = true;
  return {
    contract_id: contractId,
    public_token: 'EMP-LIVE-001',
    clause_pack_id: employerPack.id,
    content_sha256: employerPack.content_sha256,
    checkbox_map,
    signer_display_name: 'Ada Lovelace',
    signature_png_data_url: 'data:image/png;base64,iVBORw0KGgo=',
    binding: true,
    deliver_to: 'attacker@example.com',
    ...extra,
  };
}

test('portal routes stay closed unless the flag is on', async () => {
  const closed = await worker.fetch(
    post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'hr.one@example.com' }),
    portalEnv({ PARTNER_PORTAL: 'false' })
  );
  assert.equal(closed.status, 404);
  assert.equal((await closed.json()).error, 'NOT_FOUND');

  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /PARTNER_PORTAL = "false"/);
  assert.equal(toml.includes('PARTNER_PORTAL = "true"'), false);
  assert.equal(toml.includes('PARTNER_LINK_SECRET ='), false);
  assert.match(toml, /# \[\[r2_buckets\]\]/);

  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /partner_audit/);
  assert.match(schema, /binding INTEGER NOT NULL DEFAULT 0/);
});

test('a partner session sees only that partner contract', async () => {
  const store = createStore();
  putContract(store, contract(CONTRACT_A, PARTNER_A));
  putContract(store, contract(CONTRACT_B, PARTNER_B));
  const deps = {
    store,
    now: clock(NOW),
    directory: {
      [PARTNER_A]: 'hr.one@example.com',
      [PARTNER_B]: 'hr.two@example.com',
    },
    mailer: async () => {},
  };
  const issued = [];
  deps.mailer = async (message) => issued.push(message);
  const started = await call(
    post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'hr.one@example.com' }),
    portalEnv(),
    deps
  );
  assert.equal(started.status, 200);
  const startedBody = await started.json();
  assert.equal(startedBody.delivered, false);
  assert.equal(startedBody.binding, false);
  assert.equal('token' in startedBody, false);
  assert.equal(JSON.stringify(startedBody).includes('hr.one@example.com'), false);
  assert.equal(issued.length, 1);

  const unknown = await call(
    post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'other@example.com' }, { ip: '198.51.100.21' }),
    portalEnv(),
    deps
  );
  assert.equal(unknown.status, 200);
  assert.equal((await unknown.json()).delivered, false);
  assert.equal(issued.length, 1);

  const sessionRes = await call(
    post('/esign/partner/magic-link/consume', { token: issued[0].token }, { ip: '198.51.100.22' }),
    portalEnv(),
    deps
  );
  assert.equal(sessionRes.status, 200);
  const sessionBody = await sessionRes.json();
  assert.equal(sessionBody.binding, false);
  assert.match(sessionRes.headers.get('Set-Cookie'), /HttpOnly/);
  assert.match(sessionRes.headers.get('Set-Cookie'), /Secure/);
  const replay = await call(
    post('/esign/partner/magic-link/consume', { token: issued[0].token }, { ip: '198.51.100.23' }),
    portalEnv(),
    deps
  );
  assert.equal(replay.status, 401);
  assert.equal(JSON.stringify(await replay.json()).includes(issued[0].token), false);

  const listed = await call(
    new Request('https://worker.example/esign/partner/contracts', {
      headers: {
        Authorization: `Bearer ${sessionBody.session}`,
        'CF-Connecting-IP': '198.51.100.24',
      },
    }),
    portalEnv(),
    deps
  );
  const listBody = await listed.json();
  assert.equal(listed.status, 200);
  assert.deepEqual(listBody.contracts.map((row) => row.id), [CONTRACT_A]);
  assert.equal(listBody.contracts[0].binding, false);
  assert.equal(JSON.stringify(listBody).includes(CONTRACT_B), false);
});

test('signed PDFs stay private and the other partner cannot download them', async () => {
  const store = createStore();
  putContract(store, contract(CONTRACT_A, PARTNER_A));
  putContract(store, contract(CONTRACT_B, PARTNER_B));
  const puts = [];
  const bucket = {
    async put(key, bytes, opts) {
      puts.push({ key, bytes, opts });
      return { publicUrl: null };
    },
    async get(key) {
      const hit = puts.find((row) => row.key === key);
      if (!hit) return null;
      return { arrayBuffer: async () => hit.bytes.buffer.slice(hit.bytes.byteOffset, hit.bytes.byteOffset + hit.bytes.byteLength), publicUrl: null };
    },
  };
  const deps = {
    store,
    bucket,
    now: clock(NOW),
    directory: { [PARTNER_A]: 'hr.one@example.com', [PARTNER_B]: 'hr.two@example.com' },
  };
  const sessionA = await login(deps, PARTNER_A, 'hr.one@example.com', '198.51.100.30');
  const sessionB = await login(deps, PARTNER_B, 'hr.two@example.com', '198.51.100.31');

  const signed = await call(
    post('/esign/partner/sign', signBody(CONTRACT_A), { ip: '198.51.100.32', session: sessionA }),
    portalEnv({ DELIVER_TO: 'ops@example.com' }),
    deps
  );
  const signedBody = await signed.json();
  assert.equal(signed.status, 200);
  assert.equal(signedBody.ok, true);
  assert.equal(signedBody.binding, false);
  assert.equal(signedBody.status, 'ENTWURF');
  assert.match(signedBody.ref_id, /^REF-/);
  const signedJson = JSON.stringify(signedBody);
  assert.equal(signedJson.includes('http'), false);
  assert.equal(signedJson.includes('private/'), false);
  assert.equal(signedJson.includes('Ada'), false);
  assert.equal(signedJson.includes('attacker@example.com'), false);
  assert.equal(signedJson.includes('ops@example.com'), false);
  assert.equal(puts.length, 1);
  assert.equal(puts[0].key, privatePdfKey(PARTNER_A, CONTRACT_A));
  assert.equal(puts[0].opts.customMetadata.partner_id, PARTNER_A);
  assert.equal('publicUrl' in puts[0].opts, false);

  const denied = await call(
    post('/esign/partner/download', { contract_id: CONTRACT_A }, { ip: '198.51.100.33', session: sessionB }),
    portalEnv(),
    deps
  );
  assert.equal(denied.status, 404);
  assert.equal((await denied.json()).error, 'NOT_FOUND');

  const link = await call(
    post('/esign/partner/download', { contract_id: CONTRACT_A }, { ip: '198.51.100.34', session: sessionA }),
    portalEnv(),
    deps
  );
  const linkBody = await link.json();
  assert.equal(link.status, 200);
  assert.equal(linkBody.binding, false);
  assert.match(linkBody.path, /^\/esign\/partner\/file\?t=/);
  assert.equal(JSON.stringify(linkBody).includes('http'), false);
  assert.equal(JSON.stringify(linkBody).includes(puts[0].key), false);

  const file = await call(
    new Request(`https://worker.example${linkBody.path}`, {
      headers: { Authorization: `Bearer ${sessionA}`, 'CF-Connecting-IP': '198.51.100.35' },
    }),
    portalEnv(),
    deps
  );
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('Content-Type'), 'application/pdf');
  assert.match(file.headers.get('Cache-Control'), /no-store/);
  const pdf = new TextDecoder().decode(await file.arrayBuffer());
  assert.match(pdf, /^%PDF-1\.4/);

  const stolen = await call(
    new Request(`https://worker.example${linkBody.path}`, {
      headers: { Authorization: `Bearer ${sessionB}`, 'CF-Connecting-IP': '198.51.100.36' },
    }),
    portalEnv(),
    deps
  );
  assert.equal(stolen.status, 404);

  const expired = await call(
    new Request(`https://worker.example${linkBody.path}`, {
      headers: { Authorization: `Bearer ${sessionA}`, 'CF-Connecting-IP': '198.51.100.37' },
    }),
    portalEnv(),
    { ...deps, now: clock(new Date(NOW.getTime() + 6 * 60 * 1000)) }
  );
  assert.equal(expired.status, 403);
  assert.equal((await expired.json()).error, 'LINK_INVALID');

  const tamperedPath = linkBody.path.replace(/.$/, (ch) => (ch === 'a' ? 'b' : 'a'));
  const tampered = await call(
    new Request(`https://worker.example${tamperedPath}`, {
      headers: { Authorization: `Bearer ${sessionA}`, 'CF-Connecting-IP': '198.51.100.38' },
    }),
    portalEnv(),
    deps
  );
  assert.equal(tampered.status, 403);

  const log = JSON.stringify(auditEntries(store));
  assert.equal(log.includes('@'), false);
  assert.equal(log.includes('Ada'), false);
  assert.match(log, /SIGN/);
  assert.match(log, /DOWNLOAD/);
  assert.equal(canAccess({ partner_id: PARTNER_A }, { partner_id: PARTNER_B }), false);
});

test('a bucket that returns a public URL is refused', async () => {
  const store = createStore();
  putContract(store, contract(CONTRACT_A, PARTNER_A));
  let deleted = false;
  const deps = {
    store,
    now: clock(NOW),
    directory: { [PARTNER_A]: 'hr.one@example.com' },
    bucket: {
      async put() {
        return { publicUrl: 'https://files.example/contract.pdf' };
      },
      async delete() {
        deleted = true;
      },
    },
  };
  const session = await login(deps, PARTNER_A, 'hr.one@example.com', '198.51.100.40');
  const signed = await call(
    post('/esign/partner/sign', signBody(CONTRACT_A), { ip: '198.51.100.41', session }),
    portalEnv(),
    deps
  );
  const body = await signed.json();
  assert.equal(signed.status, 500);
  assert.equal(body.error, 'ERROR');
  assert.equal(JSON.stringify(body).includes('http'), false);
  assert.equal(deleted, true);
});

test('passkey finish stays closed until a verifier exists', async () => {
  const store = createStore();
  const deps = {
    store,
    now: clock(NOW),
    directory: { [PARTNER_A]: 'hr.one@example.com' },
  };
  const options = await call(
    post('/esign/partner/passkey/options', { partner_id: PARTNER_A }, { ip: '198.51.100.50' }),
    portalEnv(),
    deps
  );
  const optionsBody = await options.json();
  assert.equal(options.status, 200);
  assert.equal(optionsBody.binding, false);
  assert.equal(JSON.stringify(optionsBody).includes('hr.one@example.com'), false);
  const finished = await call(
    post('/esign/partner/passkey/finish', {
      partner_id: PARTNER_A,
      challenge: optionsBody.challenge,
    }, { ip: '198.51.100.51' }),
    portalEnv(),
    deps
  );
  assert.equal(finished.status, 503);
  assert.equal((await finished.json()).error, 'NOT_CONFIGURED');

  const opened = await call(
    post('/esign/partner/passkey/options', { partner_id: PARTNER_A }, { ip: '198.51.100.52' }),
    portalEnv(),
    deps
  );
  const challenge = (await opened.json()).challenge;
  const verified = await call(
    post('/esign/partner/passkey/finish', { partner_id: PARTNER_A, challenge }, { ip: '198.51.100.53' }),
    portalEnv(),
    {
      ...deps,
      verifyPasskey: async (body) => (body.challenge === challenge ? { ok: true } : { ok: false, error: 'LOGIN_FAILED', status: 401 }),
    }
  );
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).binding, false);

  const mismatch = await call(
    post('/esign/partner/passkey/options', { partner_id: PARTNER_A }, { ip: '198.51.100.54' }),
    portalEnv(),
    deps
  );
  const foreign = (await mismatch.json()).challenge;
  const rejected = await call(
    post('/esign/partner/passkey/finish', { partner_id: PARTNER_B, challenge: foreign }, { ip: '198.51.100.55' }),
    portalEnv(),
    { ...deps, verifyPasskey: async () => ({ ok: true }) }
  );
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).error, 'LOGIN_FAILED');
});

test('login is rate-limited and Turnstile fails closed when required', async () => {
  const store = createStore();
  const deps = { store, now: clock(NOW), directory: { [PARTNER_A]: 'hr.one@example.com' }, mailer: async () => {} };
  let last = 0;
  for (let i = 0; i < 5; i += 1) {
    const response = await call(
      post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'hr.one@example.com' }, { ip: '198.51.100.60' }),
      portalEnv(),
      deps
    );
    last = response.status;
    await response.arrayBuffer();
  }
  assert.equal(last, 200);
  const blocked = await call(
    post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'hr.one@example.com' }, { ip: '198.51.100.60' }),
    portalEnv(),
    deps
  );
  assert.equal(blocked.status, 429);
  assert.equal((await blocked.json()).error, 'RATE_LIMIT');

  let called = false;
  const gated = await call(
    post('/esign/partner/magic-link', { partner_id: PARTNER_A, email: 'hr.one@example.com' }, { ip: '198.51.100.61' }),
    portalEnv({ REQUIRE_TURNSTILE: 'true', TURNSTILE_SECRET: '' }),
    { ...deps, fetchImpl: async () => { called = true; throw new Error('network'); } }
  );
  assert.equal(gated.status, 503);
  assert.equal((await gated.json()).error, 'NOT_CONFIGURED');
  assert.equal(called, false);
});

async function login(deps, partnerId, email, ip) {
  const issued = [];
  const withMailer = { ...deps, mailer: async (message) => issued.push(message) };
  const started = await call(
    post('/esign/partner/magic-link', { partner_id: partnerId, email }, { ip }),
    portalEnv(),
    withMailer
  );
  assert.equal(started.status, 200);
  await started.arrayBuffer();
  const consumed = await call(
    post('/esign/partner/magic-link/consume', { token: issued[0].token }, { ip: `${ip}.consume` }),
    portalEnv(),
    withMailer
  );
  assert.equal(consumed.status, 200);
  return (await consumed.json()).session;
}
