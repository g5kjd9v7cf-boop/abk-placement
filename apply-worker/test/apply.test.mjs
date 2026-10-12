import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { classifyFile, handleApply, MAX_FILE_BYTES } from '../src/index.js';
import { deleteExpired, privateCvPlan } from '../src/retention.mjs';

const ENV = {
  TURNSTILE_SECRET: 'turnstile-test-secret',
  AGENTMAIL_API_KEY: 'am-test-key',
  AGENTMAIL_INBOX_ID: 'inbox-test',
  DELIVER_TO: 'ops@example.com',
  REJECT_DEMO_TOKENS: 'true',
  ALLOWED_ORIGINS: 'https://meda-vermittlung.de,https://www.meda-vermittlung.de',
};

function pdfBytes(extra = 0) {
  const bytes = new Uint8Array(8 + extra);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  return bytes;
}

function mockFetch({ turnstile = true, mailStatus = 200 } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('siteverify')) {
      return Response.json({ success: turnstile });
    }
    return new Response('{}', { status: mailStatus });
  };
  return { impl, calls };
}

function applyRequest(fields, { ip = '203.0.113.10', file = null, filename = 'cv.pdf', origin = 'https://meda-vermittlung.de' } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  if (file) form.set('attachment', new File([file], filename));
  return new Request('https://meda-apply.example/apply', {
    method: 'POST',
    headers: { Origin: origin, 'CF-Connecting-IP': ip },
    body: form,
  });
}

const CV_FIELDS = {
  form_type: 'cv_upload',
  name: 'ZZQ Candidate',
  email: 'zzq-candidate@example.com',
  phone: '+4915112345678',
  einwilligung_gelesen: 'yes',
  document_version: '2026-09-20-v1',
  'cf-turnstile-response': 'token-ok',
};

test('file type uses extension and magic bytes', () => {
  assert.equal(classifyFile(pdfBytes(), 'cv.pdf').ok, true);
  assert.equal(classifyFile(pdfBytes(), 'cv.docx').error, 'FILE_TYPE');
  assert.equal(classifyFile(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0]), 'cv.doc').ok, true);
  assert.equal(classifyFile(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]), 'cv.docx').ok, true);
  assert.equal(classifyFile(pdfBytes(MAX_FILE_BYTES), 'cv.pdf').error, 'FILE_SIZE');
});

test('a CV is mailed once and never echoed or logged', async () => {
  const mail = mockFetch();
  const logs = [];
  const original = console.log;
  console.log = (line) => logs.push(String(line));
  try {
    const response = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.20' }), ENV, {
      fetchImpl: mail.impl,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, { ok: true });
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://meda-vermittlung.de');
  } finally {
    console.log = original;
  }
  const sent = mail.calls.find((call) => call.url.includes('api.agentmail.to'));
  assert.ok(sent);
  assert.match(sent.url, /\/v0\/inboxes\/inbox-test\/messages\/send$/);
  assert.match(sent.init.headers.Authorization, /^Bearer am-test-key$/);
  const payload = JSON.parse(sent.init.body);
  assert.deepEqual(payload.to, ['ops@example.com']);
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.attachments[0].filename, 'cv.pdf');
  assert.equal(payload.attachments[0].content_type, 'application/pdf');
  assert.equal(payload.attachments[0].content, Buffer.from(pdfBytes()).toString('base64'));
  assert.match(payload.text, /zzq-candidate@example.com/);
  const logged = logs.join('\n');
  assert.equal(logged.includes('zzq-candidate'), false);
  assert.equal(logged.includes('ZZQ'), false);
  assert.equal(logged.includes('+4915112345678'), false);
  assert.equal(logged.includes(payload.attachments[0].content), false);
});

test('profile applications have no attachment', async () => {
  const mail = mockFetch();
  const response = await handleApply(
    applyRequest(
      {
        form_type: 'profile_no_cv',
        name: 'ZZQ Candidate',
        email: 'zzq-candidate@example.com',
        phone: '+4915112345678',
        experience: 'three years',
        skills: 'care',
        languages: 'German B2',
        availability: 'now',
        sector_path: 'healthcare',
        einwilligung_gelesen: 'yes',
        'cf-turnstile-response': 'token-ok',
      },
      { ip: '203.0.113.21' }
    ),
    ENV,
    { fetchImpl: mail.impl }
  );
  assert.equal(response.status, 200);
  const payload = JSON.parse(mail.calls.at(-1).init.body);
  assert.equal(payload.attachments, undefined);
});

test('rejects bad type, turnstile, origin, demo tokens, and missing secrets', async () => {
  const mail = mockFetch();
  const badFile = await handleApply(
    applyRequest(CV_FIELDS, { file: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]), filename: 'cv.pdf', ip: '203.0.113.22' }),
    ENV,
    { fetchImpl: mail.impl }
  );
  assert.equal(badFile.status, 400);
  assert.equal((await badFile.json()).error, 'FILE_TYPE');

  const failedCheck = mockFetch({ turnstile: false });
  const turnstile = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.23' }), ENV, {
    fetchImpl: failedCheck.impl,
  });
  assert.equal(turnstile.status, 403);
  assert.equal(failedCheck.calls.some((call) => call.url.includes('agentmail')), false);

  const evil = await handleApply(
    applyRequest(CV_FIELDS, { file: pdfBytes(), origin: 'https://evil.example', ip: '203.0.113.24' }),
    ENV,
    { fetchImpl: mail.impl }
  );
  assert.equal(evil.status, 403);
  assert.equal(evil.headers.get('access-control-allow-origin'), null);

  const demo = await handleApply(
    applyRequest({ ...CV_FIELDS, public_token: 'CAND-DEMO-001' }, { file: pdfBytes(), ip: '203.0.113.25' }),
    ENV,
    { fetchImpl: mail.impl }
  );
  assert.equal(demo.status, 403);
  assert.equal((await demo.json()).error, 'DEMO_TOKEN_REJECTED');

  const bare = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.26' }), {
    REJECT_DEMO_TOKENS: 'true',
  }, { fetchImpl: mail.impl });
  assert.equal(bare.status, 503);
  assert.equal((await bare.json()).error, 'NOT_CONFIGURED');
});

test('honeypot pretends success and does not deliver', async () => {
  const mail = mockFetch();
  const response = await handleApply(
    applyRequest({ ...CV_FIELDS, _honey: 'bot' }, { file: pdfBytes(), ip: '203.0.113.27' }),
    ENV,
    { fetchImpl: mail.impl }
  );
  assert.equal(response.status, 200);
  assert.equal(mail.calls.length, 0);
});

test('rate limit is five applications per IP per hour', async () => {
  const mail = mockFetch();
  const buckets = new Map();
  for (let i = 0; i < 5; i++) {
    const response = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.30' }), ENV, {
      fetchImpl: mail.impl,
      now: 1_000 + i,
      buckets,
    });
    assert.equal(response.status, 200);
  }
  const blocked = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.30' }), ENV, {
    fetchImpl: mail.impl,
    now: 1_010,
    buckets,
  });
  assert.equal(blocked.status, 429);
});

test('a bound CV stays private and expires', async () => {
  const puts = [];
  const objects = new Map();
  const bucket = {
    async put(key, bytes, options) {
      puts.push(key);
      objects.set(key, { bytes, customMetadata: options.customMetadata });
    },
    async list() {
      return {
        objects: [...objects.entries()].map(([key, value]) => ({
          key,
          customMetadata: value.customMetadata,
        })),
      };
    },
    async delete(key) {
      objects.delete(key);
    },
  };
  const mail = mockFetch();
  const response = await handleApply(
    applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.40' }),
    { ...ENV, CV_BUCKET: bucket, CV_RETENTION_DAYS: '180' },
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.equal(body.includes('http'), false);
  assert.equal(body.includes('private/'), false);
  assert.equal(puts.length, 1);
  assert.match(puts[0], /^private\/\d{4}-\d{2}-\d{2}\//);
  const plan = privateCvPlan(new Date('2020-01-01T00:00:00Z'), 180);
  assert.equal(plan.publicUrl, null);
  objects.set('private/old/one', { customMetadata: { delete_at: '2020-01-02T00:00:00.000Z' } });
  objects.set('private/new/two', { customMetadata: { delete_at: '2099-01-02T00:00:00.000Z' } });
  const removed = await deleteExpired(bucket, new Date('2026-10-12T00:00:00Z'));
  assert.equal(removed.deleted, 1);
  assert.equal(objects.has('private/old/one'), false);
  assert.equal(objects.has('private/new/two'), true);
});

test('apply config has no embedded secrets', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.equal(/TURNSTILE_SECRET\s*=/.test(toml), false);
  assert.equal(/AGENTMAIL_API_KEY\s*=/.test(toml), false);
  assert.equal(/AGENTMAIL_INBOX_ID\s*=/.test(toml), false);
  assert.equal(/DELIVER_TO\s*=/.test(toml), false);
  assert.match(toml, /REJECT_DEMO_TOKENS\s*=\s*"true"/);
  assert.match(toml, /api\.meda-vermittlung\.de\/apply\/\*/);
  assert.equal(toml.includes('github.io'), false);
  assert.equal(/\[\[r2_buckets\]\]/.test(toml), false);
  assert.equal(/\[\[d1_databases\]\]/.test(toml), false);
});
