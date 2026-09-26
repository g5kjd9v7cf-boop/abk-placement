import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareApplication, publicApplyBody, publicMatchRow, matchListKeys } from '../src/apply.js';
import { employerContact, matchPlacement, planRematch, ruleMatches } from '../src/match.js';
import { PLACEMENT_RULES } from '../src/placement-rules.js';
import {
  decodeBase64,
  decodeKeyMaterial,
  decryptUtf8,
  encryptDocument,
  MAX_FILE_BYTES,
} from '../src/crypto-docs.js';

function keyMaterial() {
  const raw = new Uint8Array(32);
  for (let i = 0; i < raw.length; i++) raw[i] = i + 1;
  let bin = '';
  for (let i = 0; i < raw.length; i++) bin += String.fromCharCode(raw[i]);
  return { raw, b64: btoa(bin) };
}

function pdfBytes(extra = '') {
  return new TextEncoder().encode('%PDF-1.4\n' + extra);
}

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function applyBody(overrides = {}) {
  const pdf = pdfBytes('sample');
  return {
    profession: 'healthcare',
    certificates: 'Pflegefachkraft',
    language_level: 'B1',
    experience_years: 3,
    qualification_country: 'Morocco',
    contact_email: 'candidate@example.com',
    consent_contact: true,
    consent_share: true,
    consent_pool: false,
    locale_shown: 'de',
    document_version: '2026-09-26-v3',
    page: '/bewerben.html',
    files: [
      {
        role: 'cv',
        name: 'cv.pdf',
        content_type: 'application/pdf',
        data_base64: b64(pdf),
      },
    ],
    ...overrides,
  };
}

test('shipped rules are samples and include own plus open-licensed examples', () => {
  assert.ok(PLACEMENT_RULES.length >= 4);
  const sources = new Set(PLACEMENT_RULES.map((rule) => rule.source));
  assert.equal(sources.has('meda-own'), true);
  assert.equal(sources.has('open-vocational-categories'), true);
  for (const rule of PLACEMENT_RULES) {
    assert.equal(rule.sample, true);
    assert.equal(typeof rule.id, 'string');
    assert.equal(rule.note.toLowerCase().includes('not a live'), true);
  }
  const open = PLACEMENT_RULES.filter((rule) => rule.license === 'CC0-1.0');
  assert.ok(open.length >= 4);
  const raw = readFileSync(new URL('../../data/placement-rules.json', import.meta.url), 'utf8');
  assert.equal(raw.includes('http://'), false);
  assert.equal(raw.toLowerCase().includes('vacancy board'), false);
});

test('match uses structured facts and ignores file material', () => {
  const facts = {
    profession: 'healthcare',
    certificates: 'Staatliche Pflegefachkraft',
    language_level: 'B1',
    experience_years: 1,
    qualification_country: 'Tunisia',
  };
  const hit = matchPlacement(facts);
  assert.equal(hit.matched, true);
  assert.equal(hit.rule_id, 'open-healthcare-nursing');
  assert.equal(hit.sample, true);
  const withFiles = matchPlacement({ ...facts, files: [{ data_base64: 'AAAA' }], ciphertext: 'secret' });
  assert.deepEqual(withFiles, hit);
  assert.equal(ruleMatches({ ...facts, experience_years: 0 }, PLACEMENT_RULES[0]), false);
  assert.equal(ruleMatches({ ...facts, language_level: 'A2' }, PLACEMENT_RULES[0]), false);
  assert.equal(
    matchPlacement({ ...facts, certificates: 'Koch', profession: 'healthcare' }).matched,
    false
  );
  const it = matchPlacement({
    profession: 'it',
    certificates: 'Software developer',
    language_level: 'B1',
    experience_years: 5,
    qualification_country: 'France',
  });
  assert.equal(it.matched, false);
  const itHit = matchPlacement({
    profession: 'it',
    certificates: 'Software developer',
    language_level: 'B2',
    experience_years: 1,
    qualification_country: 'France',
  });
  assert.equal(itHit.rule_id, 'open-it');
  assert.equal(employerContact(hit, false), false);
  assert.equal(employerContact(hit, true), true);
  assert.equal(employerContact({ matched: false }, true), false);
});

test('missing or short encryption key rejects before files are read', async () => {
  let encryptCalls = 0;
  const body = applyBody({ email: 'person@example.com', certificates: 'Pflegefachkraft SECRETPLAIN' });
  const missing = await prepareApplication({}, body, {
    encryptDocument() {
      encryptCalls += 1;
      throw new Error('should not encrypt');
    },
  });
  assert.equal(missing.status, 503);
  assert.equal(missing.error, 'encryption_key_missing');
  assert.equal(missing.record, undefined);
  assert.equal(encryptCalls, 0);
  assert.equal(JSON.stringify(missing).includes('SECRETPLAIN'), false);
  assert.equal(JSON.stringify(missing).includes('person@example.com'), false);

  const invalid = await prepareApplication({ DATA_ENCRYPTION_KEY: 'YQ==' }, body, {
    encryptDocument() {
      encryptCalls += 1;
      throw new Error('should not encrypt');
    },
  });
  assert.equal(invalid.error, 'encryption_key_invalid');
  assert.equal(encryptCalls, 0);
  assert.equal(decodeKeyMaterial('').error, 'encryption_key_missing');
  assert.equal(decodeKeyMaterial('not base64!!!').error, 'encryption_key_invalid');
});

test('prepare encrypts the CV and the email, and the public receipt omits the address', async () => {
  const { raw, b64: secret } = keyMaterial();
  const shared = await prepareApplication({ DATA_ENCRYPTION_KEY: secret }, applyBody());
  assert.equal(shared.status, 200);
  assert.equal(shared.record.matched_rule_id, 'open-healthcare-nursing');
  assert.equal(shared.record.employer_match, 1);
  assert.equal(shared.record.sample_rule, 1);
  assert.equal(shared.publicResult.employer_contact, true);
  assert.equal(shared.publicResult.sample_rule, true);
  assert.equal(shared.record.talent_pool, 1);
  assert.equal(Object.hasOwn(shared.record, 'email'), false);
  assert.equal(Object.hasOwn(shared.record, 'contact_email'), false);
  assert.equal(shared.record.contact_email_ciphertext.includes('candidate@example.com'), false);
  assert.equal(shared.record.contact_email_iv.length > 0, true);
  const emailRound = await decryptUtf8(raw, shared.record.contact_email_iv, shared.record.contact_email_ciphertext);
  assert.equal(emailRound, 'candidate@example.com');
  assert.equal(shared.files.length, 1);
  assert.equal(shared.files[0].algorithm, 'AES-GCM');
  assert.equal(shared.files[0].ciphertext instanceof Uint8Array, true);
  const plain = pdfBytes('sample');
  assert.equal(shared.files[0].ciphertext.length, plain.length + 16);
  const iv = decodeBase64(shared.files[0].iv);
  assert.equal(iv.length, 12);
  const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
  const round = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, shared.files[0].ciphertext);
  assert.deepEqual(new Uint8Array(round), plain);

  const withheld = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({ consent_share: false })
  );
  assert.equal(withheld.record.matched_rule_id, 'open-healthcare-nursing');
  assert.equal(withheld.record.employer_match, 0);
  assert.equal(withheld.publicResult.employer_contact, false);
  assert.equal(withheld.publicResult.matched, true);

  const none = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({ certificates: 'Koch' })
  );
  assert.equal(none.record.matched_rule_id, null);
  assert.equal(none.record.employer_match, 0);
  assert.equal(none.publicResult.matched, false);

  const response = publicApplyBody('MEDA-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '2026-09-26T00:00:00.000Z', shared);
  assert.deepEqual(Object.keys(response).sort(), [
    'employer_contact',
    'matched',
    'ok',
    'receipt_ref',
    'sample_rule',
    'ts',
  ]);
  assert.equal(JSON.stringify(response).includes('Pflege'), false);
  assert.equal(JSON.stringify(response).includes('candidate@example.com'), false);
  assert.equal(JSON.stringify(response).includes(shared.record.contact_email_ciphertext), false);

  const missingEmail = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({ contact_email: '' })
  );
  assert.equal(missingEmail.error, 'bad_email');
  assert.equal(missingEmail.record, undefined);
  const oddEmail = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({ contact_email: 'not-an-email' })
  );
  assert.equal(oddEmail.error, 'bad_email');
  assert.equal(JSON.stringify(oddEmail).includes('not-an-email'), false);
});

test('a later rule can match stored facts without reading file bytes', () => {
  const stored = {
    id: 4,
    receipt: 'MEDA-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    profession: 'it',
    certificates_text: 'Software developer',
    language_level: 'B2',
    experience_years: 2,
    qualification_country: 'France',
    share_with_employer: 0,
    ciphertext: 'FILE-CIPHERTEXT',
    files: [{ data_base64: 'AAAA' }],
    contact_email_ciphertext: 'EMAIL-CIPHERTEXT',
  };
  const before = planRematch([stored], []);
  assert.equal(before[0].matched_rule_id, null);
  assert.equal(before[0].employer_match, 0);
  const after = planRematch([stored]);
  assert.equal(after[0].matched_rule_id, 'open-it');
  assert.equal(after[0].employer_match, 0);
  assert.equal(after[0].sample_rule, 1);
  assert.equal(JSON.stringify(after).includes('FILE-CIPHERTEXT'), false);
  assert.equal(JSON.stringify(after).includes('EMAIL-CIPHERTEXT'), false);
  const shared = planRematch([{ ...stored, share_with_employer: 1 }]);
  assert.equal(shared[0].employer_match, 1);
});

test('worker rejects unexpected content types and oversized files', async () => {
  const { b64: secret } = keyMaterial();
  let encryptCalls = 0;
  const html = new TextEncoder().encode('<html><script>alert(1)</script>');
  const bad = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({
      files: [{ role: 'cv', name: 'cv.pdf', content_type: 'application/pdf', data_base64: b64(html) }],
    }),
    {
      encryptDocument() {
        encryptCalls += 1;
      },
    }
  );
  assert.equal(bad.error, 'bad_content_type');
  assert.equal(encryptCalls, 0);

  const declared = new TextEncoder().encode('%PDF-1.4\n');
  const wrongType = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({
      files: [{ role: 'cv', name: 'cv.png', content_type: 'image/png', data_base64: b64(declared) }],
    })
  );
  assert.equal(wrongType.error, 'bad_content_type');

  const big = new Uint8Array(MAX_FILE_BYTES + 1);
  big[0] = 0x25;
  big[1] = 0x50;
  big[2] = 0x44;
  big[3] = 0x46;
  const oversized = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({
      files: [{ role: 'cv', name: 'cv.pdf', content_type: 'application/pdf', data_base64: b64(big) }],
    }),
    {
      encryptDocument() {
        encryptCalls += 1;
      },
    }
  );
  assert.equal(oversized.error, 'file_too_large');
  assert.equal(encryptCalls, 0);

  const noCv = await prepareApplication(
    { DATA_ENCRYPTION_KEY: secret },
    applyBody({
      files: [{ role: 'certificate', name: 'a.pdf', content_type: 'application/pdf', data_base64: b64(pdfBytes()) }],
    })
  );
  assert.equal(noCv.error, 'cv_required');
});

test('match list exposes no ciphertext and copies an email only when decrypted for the operator', () => {
  const row = publicMatchRow({
    id: 7,
    receipt: 'MEDA-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    created_at: '2026-09-26T00:00:00.000Z',
    profession: 'logistics',
    share_with_employer: 1,
    talent_pool: 0,
    matched_rule_id: 'open-logistics',
    sample_rule: 1,
    ciphertext: 'CIPHERTEXT-BYTES',
    email: 'person@example.com',
    certificates_text: 'Lagerfachkraft',
    qualification_country: 'Morocco',
    iv: 'iv-value',
  });
  assert.deepEqual(Object.keys(row), matchListKeys());
  const encoded = JSON.stringify(row);
  assert.equal(encoded.includes('CIPHERTEXT'), false);
  assert.equal(encoded.includes('person@example.com'), false);
  assert.equal(encoded.includes('Lagerfachkraft'), false);
  assert.equal(encoded.includes('Morocco'), false);
  assert.equal(encoded.includes('iv-value'), false);
  assert.equal(row.contact_email, '');
  assert.equal(row.sample, true);
  assert.equal(row.rule_id, 'open-logistics');
  const operator = publicMatchRow(
    { ...row, email: 'person@example.com', ciphertext: 'CIPHERTEXT-BYTES' },
    { contact_email: 'candidate@example.com' }
  );
  assert.equal(operator.contact_email, 'candidate@example.com');
  assert.equal(JSON.stringify(operator).includes('CIPHERTEXT'), false);
  assert.equal(JSON.stringify(operator).includes('person@example.com'), false);
});

test('wrangler config names the encryption secret and does not store it', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.equal(toml.includes('DATA_ENCRYPTION_KEY'), true);
  assert.equal(/^\s*DATA_ENCRYPTION_KEY\s*=/m.test(toml), false);
  assert.equal(/^\s*STATS_TOKEN\s*=/m.test(toml), false);
  assert.equal(/^\[vars\]/m.test(toml), false);
});

test('encryptDocument round-trips a jpeg header without returning plaintext', async () => {
  const { raw } = keyMaterial();
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x11, 0x22]);
  const enc = await encryptDocument(raw, jpeg);
  assert.equal(enc.algorithm, 'AES-GCM');
  assert.notDeepEqual(enc.ciphertext.subarray(0, jpeg.length), jpeg);
});
