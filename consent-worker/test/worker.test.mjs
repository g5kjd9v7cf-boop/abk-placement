import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { purgeOldPageviews } from '../src/index.js';

const ORIGIN = 'https://meda-vermittlung.de';

function mockDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          const call = { sql, args };
          calls.push(call);
          return {
            async run() {
              call.kind = 'run';
              return { success: true };
            },
            async first() {
              call.kind = 'first';
              return { n: 0 };
            },
            async all() {
              call.kind = 'all';
              return { results: [] };
            },
          };
        },
      };
    },
  };
}

function env(extra = {}) {
  return {
    ALLOWED_ORIGINS: 'https://meda-vermittlung.de,https://g5kjd9v7cf-boop.github.io',
    STATS_TOKEN: 'test-token-value',
    IP_HASH_PEPPER: 'pepper-test',
    DB: mockDb(),
    ...extra,
  };
}

let ipSeq = 20;
function post(path, body, headers = {}) {
  ipSeq += 1;
  return new Request('https://worker.test' + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      'CF-Connecting-IP': '203.0.113.' + ipSeq,
      'User-Agent': 'meda-test',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test('rejects a cross-site origin before writing', async () => {
  const e = env();
  const res = await worker.fetch(
    post('/pageview', { event: 'consent_given', email: 'a@b.co', ts: '2000-01-01T00:00:00.000Z' }, {
      Origin: 'https://evil.example',
    }),
    e
  );
  assert.equal(res.status, 403);
  assert.equal(e.DB.calls.length, 0);
});

test('stores a server timestamp and ignores forged event names', async () => {
  const e = env();
  const res = await worker.fetch(
    post('/pageview', {
      event: 'consent_given',
      email: 'person@example.com',
      ts: '1999-01-01T00:00:00.000Z',
      page: '/index.html?token=secret',
      referrer: 'https://example.com/path?q=1',
      session_id: '11111111-1111-4111-8111-111111111111',
      extra: 'should-not-persist',
    }),
    e
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.event, 'page_visit');
  assert.notEqual(data.ts.slice(0, 4), '1999');
  const insert = e.DB.calls.find((c) => c.sql.includes('INSERT'));
  assert.ok(insert);
  assert.equal(insert.args[0], 'page_visit');
  assert.equal(insert.args[6], null);
  assert.equal(insert.args[11], '/index.html');
  assert.equal(insert.args[10], 'https://example.com/path');
  const payload = JSON.parse(insert.args[13]);
  assert.equal(payload.extra, undefined);
  assert.equal(payload.email, undefined);
  assert.ok(insert.args[12]);
});

test('does not store an IP hash without a pepper', async () => {
  const e = env({ IP_HASH_PEPPER: '' });
  const res = await worker.fetch(post('/pageview', { page: '/impressum.html' }), e);
  assert.equal(res.status, 200);
  const insert = e.DB.calls.find((c) => c.sql.includes('INSERT'));
  assert.equal(insert.args[12], null);
});

test('requires a real email for consent and withdrawal', async () => {
  const e = env();
  const bad = await worker.fetch(post('/submit', { email: 'not-an-email', form_type: 'contact' }), e);
  assert.equal(bad.status, 400);
  const ok = await worker.fetch(
    post('/submit', {
      email: 'Person@Example.com',
      form_type: 'cv_upload',
      share_with_employers: true,
      talent_pool: false,
      age_confirmed: true,
      document_version: '2026-09-26-v2',
    }),
    e
  );
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.match(body.receipt_ref, /^MEDA-CONSENT-\d{8}-[0-9A-F]{8}$/);
  const insert = e.DB.calls.find((c) => c.sql.includes('INSERT'));
  assert.equal(insert.args[6], 'person@example.com');
  assert.equal(JSON.parse(insert.args[13]).share_with_employers, true);
});

test('rejects oversized and non-JSON bodies', async () => {
  const e = env();
  const big = await worker.fetch(
    new Request('https://worker.test/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: 'x'.repeat(9000),
    }),
    e
  );
  assert.equal(big.status, 413);
  const text = await worker.fetch(
    new Request('https://worker.test/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', Origin: ORIGIN },
      body: '{}',
    }),
    e
  );
  assert.equal(text.status, 400);
});

test('stats token is header-only and constant-time compared', async () => {
  const e = env();
  const missing = await worker.fetch(new Request('https://worker.test/stats'), e);
  assert.equal(missing.status, 401);
  const query = await worker.fetch(new Request('https://worker.test/stats?token=test-token-value'), e);
  assert.equal(query.status, 401);
  const ok = await worker.fetch(
    new Request('https://worker.test/stats', {
      headers: { Authorization: 'Bearer test-token-value', Origin: ORIGIN },
    }),
    e
  );
  assert.equal(ok.status, 200);
  const noStore = ok.headers.get('Cache-Control');
  assert.equal(noStore, 'no-store');
});

test('returns 503 when the database is not bound', async () => {
  const e = env({ DB: null });
  const res = await worker.fetch(post('/gate', { event: 'datenschutz_accepted' }), e);
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.scaffold, undefined);
});

test('purges only old page views', async () => {
  const e = env();
  const result = await purgeOldPageviews(e, new Date('2026-09-26T00:00:00.000Z'));
  assert.equal(result.ok, true);
  const del = e.DB.calls[0];
  assert.match(del.sql, /DELETE FROM consent_events WHERE event = 'page_visit'/);
  assert.equal(del.args[0] < '2026-09-26T00:00:00.000Z', true);
});
