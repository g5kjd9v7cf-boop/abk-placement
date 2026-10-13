import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

function env(extra = {}) {
  return {
    STATS_TOKEN: 'correct-token',
    REJECT_DEMO_TOKENS: 'true',
    ALLOWED_ORIGINS: 'https://meda-vermittlung.de,https://www.meda-vermittlung.de',
    ...extra,
  };
}

test('stats token must match and an empty secret stays closed', async () => {
  const headers = { Origin: 'https://meda-vermittlung.de', 'CF-Connecting-IP': '198.51.100.8' };
  const bad = await worker.fetch(new Request('https://worker.example/stats?token=wrong', { headers }), env());
  assert.equal(bad.status, 401);
  const missing = await worker.fetch(
    new Request('https://worker.example/stats?token=correct-token', {
      headers: { ...headers, 'CF-Connecting-IP': '198.51.100.12' },
    }),
    env({ STATS_TOKEN: '' })
  );
  assert.equal(missing.status, 401);
  const good = await worker.fetch(
    new Request('https://worker.example/stats?token=correct-token', {
      headers: { ...headers, 'CF-Connecting-IP': '198.51.100.9' },
    }),
    env()
  );
  assert.equal(good.status, 500);
  assert.equal((await good.json()).error, 'D1 not bound');
});

test('demo tokens are rejected before storage', async () => {
  const response = await worker.fetch(
    new Request('https://worker.example/gate', {
      method: 'POST',
      headers: {
        Origin: 'https://meda-vermittlung.de',
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.10',
      },
      body: JSON.stringify({ session_id: 'CAND-DEMO-001', email: 'zzq-candidate@example.com' }),
    }),
    env({
      DB: {
        prepare() {
          throw new Error('stored');
        },
      },
    })
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'DEMO_TOKEN_REJECTED');
});

test('turnstile stays off until the flag and secret are set', async () => {
  const response = await worker.fetch(
    new Request('https://worker.example/gate', {
      method: 'POST',
      headers: {
        Origin: 'https://meda-vermittlung.de',
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '198.51.100.70',
      },
      body: JSON.stringify({ page: '/index.html' }),
    }),
    env({ REQUIRE_TURNSTILE: 'true', TURNSTILE_SECRET: '' })
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'NOT_CONFIGURED');
});

test('cors allowlist is the production site only', async () => {
  const response = await worker.fetch(
    new Request('https://worker.example/stats?token=x', {
      headers: { Origin: 'https://g5kjd9v7cf-boop.github.io', 'CF-Connecting-IP': '198.51.100.11' },
    }),
    env()
  );
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('consent posts are rate limited per IP', async () => {
  const headers = {
    Origin: 'https://meda-vermittlung.de',
    'Content-Type': 'application/json',
    'CF-Connecting-IP': '198.51.100.40',
  };
  let last = 0;
  for (let i = 0; i < 61; i++) {
    const response = await worker.fetch(
      new Request('https://worker.example/pageview', {
        method: 'POST',
        headers,
        body: JSON.stringify({ page: '/index.html' }),
      }),
      env()
    );
    last = response.status;
  }
  assert.equal(last, 429);
});
