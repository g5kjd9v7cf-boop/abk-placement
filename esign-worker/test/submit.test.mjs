import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { evaluateSubmit, makeRefId } from '../src/index.js';

const root = new URL('../../', import.meta.url);
const packs = [
  'data/esign/candidate-soft-launch-0.14.json',
  'data/esign/employer-soft-launch-0.5.json',
  'data/esign/family-soft-launch-0.6.json',
].map((rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8')));

function canonical(pack) {
  return JSON.stringify({
    id: pack.id,
    version: pack.version,
    sections: pack.sections,
    checklist: pack.checklist,
  });
}

function baseBody(pack, extra = {}) {
  const checkbox_map = {};
  pack.checklist.forEach((item) => {
    checkbox_map[item.id] = true;
  });
  return {
    party_type: pack.party,
    public_token: pack.party === 'employer' ? 'EMP-DEMO-001' : 'CAND-DEMO-001',
    clause_pack_id: pack.id,
    content_sha256: pack.content_sha256,
    checkbox_map,
    signer_display_name: 'Ada Lovelace',
    signature_png_data_url: 'data:image/png;base64,iVBORw0KGgo=',
    binding: true,
    ...extra,
  };
}

test('packs stay unapproved drafts and cite the agreed withdrawal rules', () => {
  for (const pack of packs) {
    assert.equal(pack.legal_approved, false);
    assert.equal(pack.binding, false);
    assert.equal(pack.status, 'ENTWURF');
    assert.equal(pack.lang, 'de');
    assert.equal(pack.fee_placeholder, 'Höhe folgt im finalen Vertrag');
    assert.equal(pack.no_cv_upload, true);
    const hash = createHash('sha256').update(canonical(pack)).digest('hex');
    assert.equal(hash, pack.content_sha256);
    const blob = JSON.stringify(pack);
    const euros = blob.match(/\d[\d.]*\s*€|€\s*\d[\d.]*/g) || [];
    for (const hit of euros) {
      assert.match(hit, /2\.000\s*€|0\s*€/);
    }
    assert.equal(blob.includes('type="file"'), false);
  }
  const candidate = packs[0];
  const employer = packs[1];
  const family = packs[2];
  assert.equal(candidate.withdrawal.mode, 'consumer');
  assert.equal(candidate.withdrawal.ui_period, '12 Monate und 14 Tage');
  assert.equal(candidate.withdrawal.ordinary_period, '14 Tage');
  assert.equal(family.withdrawal.mode, 'consumer');
  assert.equal(family.withdrawal.ui_period, '12 Monate und 14 Tage');
  assert.equal(employer.withdrawal.mode, 'b2b_none');
  assert.equal(employer.withdrawal.ui_period, null);
  assert.match(employer.checklist.find((c) => c.id === 'emp-no-withdrawal').text, /kein Fernabsatz-Widerrufsrecht/);
  assert.match(candidate.checklist.find((c) => c.id === 'cand-withdrawal').text, /12 Monate und 14 Tage/);
  assert.match(candidate.checklist.find((c) => c.id === 'cand-withdrawal').text, /14 Tage/);
});

test('pages are noindex and are not linked from the main nav', () => {
  const pages = ['contract-draft.html', 'employer-sign.html', 'family-sign.html'];
  for (const name of pages) {
    const html = readFileSync(new URL(name, root), 'utf8');
    assert.match(html, /noindex,nofollow/);
    assert.match(html, /Interessens-\/Entwurfsschritt — nicht bindend bis Gewerbe \+ Anwaltsfreigabe/);
    assert.equal(html.includes('type="file"'), false);
    assert.equal(html.includes('youtrust'), false);
    assert.equal(html.includes('docusign'), false);
  }
  const home = readFileSync(new URL('index.html', root), 'utf8');
  assert.equal(home.includes('employer-sign.html'), false);
  assert.equal(home.includes('contract-draft.html'), false);
  assert.equal(home.includes('family-sign.html'), false);
  const employers = readFileSync(new URL('fuer-arbeitgeber.html', root), 'utf8');
  assert.equal(employers.includes('employer-sign.html'), false);
});

test('unapproved packs are refused and binding cannot be flipped by the client', () => {
  for (const pack of packs) {
    const result = evaluateSubmit(baseBody(pack), { LEGAL_APPROVED_PACK_IDS: '' });
    assert.equal(result.http, 403);
    assert.equal(result.body.error, 'LEGAL_NOT_APPROVED');
    assert.equal(result.body.message, 'Legal-Freigabe ausstehend');
    assert.equal(result.body.binding, false);
    assert.equal(result.body.status, 'ENTWURF');
    assert.equal(result.body.ref_id, undefined);
  }
});

test('an allowlisted pack still forces ENTWURF and returns only a public REF', () => {
  const pack = packs[0];
  const result = evaluateSubmit(baseBody(pack), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
  }, new Date('2026-10-07T12:00:00Z'));
  assert.equal(result.http, 200);
  assert.equal(result.body.ok, true);
  assert.match(result.body.ref_id, /^REF-\d{8}-[0-9A-F]{4}$/);
  assert.equal(result.body.binding, false);
  assert.equal(result.body.status, 'ENTWURF');
  assert.equal(result.record.binding, 0);
  assert.equal(result.body.notify.delivered, false);
  assert.deepEqual(result.body.notify.recipients, [
    'meda-vermittlung@agentmail.to',
    'MEDA-team@outlook.com',
  ]);
  assert.equal('id' in result.body, false);
});

test('employer token must be EMP-*', () => {
  const pack = packs[1];
  const bad = evaluateSubmit(baseBody(pack, { public_token: 'CAND-DEMO-001' }), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
  });
  assert.equal(bad.http, 400);
  assert.equal(bad.body.error, 'TOKEN_INVALID');
  const good = evaluateSubmit(baseBody(pack, { public_token: 'EMP-DEMO-001' }), {});
  assert.equal(good.http, 403);
});

test('makeRefId shape', () => {
  assert.equal(makeRefId(new Date('2026-10-07T00:00:00Z'), 'ab'), 'REF-20261007-00AB');
});
