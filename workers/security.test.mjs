import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRateLimit,
  containsStandaloneDemoToken,
  isDemoToken,
  JSON_LIMITS,
  parseOrigins,
  PRODUCTION_ORIGINS,
  readJsonLimited,
  requireTurnstile,
  safeLog,
  secretsEqual,
} from './security.mjs';

test('secret compare matches equal strings only', async () => {
  assert.equal(await secretsEqual('correct-token', 'correct-token'), true);
  assert.equal(await secretsEqual('correct-token', 'correct-tokem'), false);
  assert.equal(await secretsEqual('short', 'much-longer-token'), false);
  assert.equal(await secretsEqual('', ''), true);
});

test('rate limit is a fixed window per key', () => {
  const buckets = new Map();
  for (let i = 0; i < 5; i++) {
    assert.equal(checkRateLimit(buckets, 'ip', 1_000 + i, 5, 1_000).ok, true);
  }
  assert.equal(checkRateLimit(buckets, 'ip', 1_004, 5, 1_000).ok, false);
  assert.equal(checkRateLimit(buckets, 'other', 1_004, 5, 1_000).ok, true);
  assert.equal(checkRateLimit(buckets, 'ip', 2_001, 5, 1_000).ok, true);
});

test('production origins stay on the public site', () => {
  assert.deepEqual(parseOrigins({}), PRODUCTION_ORIGINS);
  assert.equal(parseOrigins({}).includes('https://g5kjd9v7cf-boop.github.io'), false);
  assert.deepEqual(parseOrigins({ ALLOWED_ORIGINS: 'https://meda-vermittlung.de' }), [
    'https://meda-vermittlung.de',
  ]);
});

test('demo token detection stays on token shape', () => {
  assert.equal(isDemoToken('EMP-DEMO-001'), true);
  assert.equal(containsStandaloneDemoToken({ session_id: 'CAND-DEMO-001' }), true);
  assert.equal(containsStandaloneDemoToken({ experience: 'pre-demo call notes' }), false);
  assert.equal(containsStandaloneDemoToken({ name: 'Lina' }), false);
});

test('json bodies are capped and must be objects', async () => {
  const small = new Request('https://worker.example/x', {
    method: 'POST',
    body: JSON.stringify({ page: '/index.html' }),
  });
  const ok = await readJsonLimited(small, JSON_LIMITS.consent);
  assert.equal(ok.ok, true);
  const huge = new Request('https://worker.example/x', {
    method: 'POST',
    body: 'x'.repeat(JSON_LIMITS.ask + 1),
  });
  const blocked = await readJsonLimited(huge, JSON_LIMITS.ask);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error, 'PAYLOAD_TOO_LARGE');
  const list = new Request('https://worker.example/x', { method: 'POST', body: '[1]' });
  const bad = await readJsonLimited(list, 100);
  assert.equal(bad.error, 'BAD_REQUEST');
});

test('turnstile runs only when the env flag is on', async () => {
  const skipped = await requireTurnstile({ REQUIRE_TURNSTILE: 'false' }, '', '203.0.113.1', async () => {
    throw new Error('fetch');
  });
  assert.equal(skipped.ok, true);
  const missing = await requireTurnstile({ REQUIRE_TURNSTILE: 'true' }, 'token', '203.0.113.1', async () => {
    throw new Error('fetch');
  });
  assert.equal(missing.error, 'NOT_CONFIGURED');
  const failed = await requireTurnstile(
    { REQUIRE_TURNSTILE: 'true', TURNSTILE_SECRET: 'secret' },
    'token',
    '203.0.113.1',
    async () => Response.json({ success: false })
  );
  assert.equal(failed.status, 403);
  assert.equal(failed.error, 'TURNSTILE');
});

test('safe logs keep only status codes', () => {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(String(line));
  try {
    safeLog('apply', {
      code: 'OK',
      status: 200,
      email: 'zzq-candidate@example.com',
      name: 'ZZQ Candidate',
      phone: '+4915112345678',
    });
  } finally {
    console.log = original;
  }
  const joined = lines.join('\n');
  assert.match(joined, /"code":"OK"/);
  assert.equal(joined.includes('zzq-candidate'), false);
  assert.equal(joined.includes('ZZQ'), false);
  assert.equal(joined.includes('+4915112345678'), false);
});
