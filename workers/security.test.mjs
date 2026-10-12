import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRateLimit,
  containsStandaloneDemoToken,
  isDemoToken,
  parseOrigins,
  PRODUCTION_ORIGINS,
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
