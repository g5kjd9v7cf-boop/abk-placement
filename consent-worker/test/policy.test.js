import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_ORIGINS,
  MAX_BODY_BYTES,
  bearerToken,
  createFailLimiter,
  eventForRoute,
  isAllowedEvent,
  isAllowedOrigin,
  isExpiredIso,
  isReceiptId,
  normalizeEvent,
  receiptIdFromBytes,
  retentionCutoffIso,
  timingSafeEqual,
} from '../src/policy.js';

test('origin allowlist is https only and matches the live sites', () => {
  assert.deepEqual(ALLOWED_ORIGINS, [
    'https://meda-vermittlung.de',
    'https://www.meda-vermittlung.de',
    'https://g5kjd9v7cf-boop.github.io',
  ]);
  for (const origin of ALLOWED_ORIGINS) {
    assert.equal(isAllowedOrigin(origin), true);
    assert.equal(origin.startsWith('https://'), true);
  }
  assert.equal(isAllowedOrigin('http://meda-vermittlung.de'), false);
  assert.equal(isAllowedOrigin('http://www.meda-vermittlung.de'), false);
  assert.equal(isAllowedOrigin('https://meda-vermittlung.de.evil.example'), false);
  assert.equal(isAllowedOrigin('https://evil.example'), false);
  assert.equal(isAllowedOrigin(''), false);
  assert.equal(isAllowedOrigin('https://meda-vermittlung.de/impressum.html'), false);
});

test('event names are an allowlist tied to routes', () => {
  assert.equal(eventForRoute('submit'), 'consent_given');
  assert.equal(eventForRoute('gate'), null);
  assert.equal(isAllowedEvent('page_visit'), true);
  assert.equal(isAllowedEvent('datenschutz_declined'), false);
  assert.equal(isAllowedEvent('consent_given'), true);
  const unknown = normalizeEvent('pageview', { event: 'drop_table' });
  assert.equal(unknown.error, 'event_not_allowed');
});

test('constant-time compare rejects mismatches and empty secrets', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
  assert.equal(timingSafeEqual('abc', 'abcd'), false);
  assert.equal(timingSafeEqual('', 'abc'), false);
  assert.equal(timingSafeEqual('abc', ''), false);
  assert.equal(bearerToken('Bearer secret-value'), 'secret-value');
  assert.equal(bearerToken('Basic secret-value'), '');
  assert.equal(bearerToken('Bearer '), '');
});

test('retention cutoff is six calendar months', () => {
  const now = new Date('2026-09-26T12:00:00.000Z');
  assert.equal(retentionCutoffIso(now), '2026-03-26T12:00:00.000Z');
  assert.equal(isExpiredIso('2026-03-26T11:59:59.000Z', now), true);
  assert.equal(isExpiredIso('2026-03-26T12:00:00.000Z', now), false);
  assert.equal(isExpiredIso('2026-09-01T00:00:00.000Z', now), false);
});

test('receipt ids are 128-bit hex, not short random', () => {
  const id = receiptIdFromBytes(new Uint8Array(16).fill(0xab));
  assert.equal(id, 'MEDA-' + 'ab'.repeat(16));
  assert.equal(isReceiptId(id), true);
  assert.equal(isReceiptId('MEDA-CONSENT-20260926-ABCD'), false);
  assert.equal(id.length, 5 + 32);
});

test('consent submit stores flags only and ignores email and client time', () => {
  const ok = normalizeEvent('submit', {
    event: 'consent_given',
    email: 'person@example.com',
    ts: '2000-01-01T00:00:00.000Z',
    page: '/bewerben.html',
    locale_shown: 'fr',
    form_type: 'application',
    document_version: '2026-09-26-v2',
    consent_contact: true,
    consent_share: false,
    consent_pool: false,
    user_agent: 'ignored',
    payload: { raw: true },
  });
  assert.equal(ok.error, undefined);
  assert.equal(ok.row.consent_contact, 1);
  assert.equal(ok.row.consent_share, 0);
  assert.equal(ok.row.consent_pool, 0);
  assert.equal(ok.row.page, '/bewerben.html');
  assert.equal('email' in ok.row, false);
  assert.equal('ts' in ok.row, false);
  assert.equal(JSON.stringify(ok.row).includes('person@example.com'), false);

  assert.equal(normalizeEvent('submit', { consent_contact: false, consent_share: true }).error, 'consent_contact_required');
  assert.equal(
    normalizeEvent('submit', { consent_contact: true, consent_share: 'yes' }).error,
    'consent_share_required'
  );
  const pooled = normalizeEvent('submit', { consent_contact: true, consent_share: true });
  assert.equal(pooled.row.consent_pool, 0);
});

test('withdrawal requires a long receipt id', () => {
  assert.equal(normalizeEvent('withdraw', { receipt_ref: 'MEDA-abcd' }).error, 'bad_receipt');
  const id = 'MEDA-' + 'cd'.repeat(16);
  const ok = normalizeEvent('withdraw', { receipt_ref: id, email: 'person@example.com' });
  assert.equal(ok.row.receipt_ref, id);
  assert.equal(JSON.stringify(ok.row).includes('person@example.com'), false);
});

test('failure limiter trips inside the window and not across it', () => {
  const limiter = createFailLimiter(8, 60_000);
  const t0 = 1_000_000;
  for (let i = 0; i < 7; i++) limiter.record('203.0.113.5', t0 + i);
  assert.equal(limiter.tooMany('203.0.113.5', t0 + 7), false);
  assert.equal(limiter.record('203.0.113.5', t0 + 7), true);
  assert.equal(limiter.tooMany('203.0.113.5', t0 + 7), true);
  assert.equal(limiter.tooMany('203.0.113.5', t0 + 61_000), false);
  assert.equal(MAX_BODY_BYTES, 4096);
});
