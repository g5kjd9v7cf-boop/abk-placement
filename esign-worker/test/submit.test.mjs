import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { MEDA_COPY_ADDRESSES } from '../src/copy-delivery.mjs';
import worker, { completeSigning, evaluateSubmit, makeRefId, signerCopyAudit } from '../src/index.js';

const repo = new URL('../../', import.meta.url);
const site = new URL('../../site/', import.meta.url);
const packs = [
  'data/esign/candidate-soft-launch-0.14.json',
  'data/esign/employer-soft-launch-0.5.json',
  'data/esign/family-soft-launch-0.6.json',
].map((rel) => JSON.parse(readFileSync(new URL(rel, repo), 'utf8')));

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
    const html = readFileSync(new URL(name, site), 'utf8');
    assert.match(html, /noindex,nofollow/);
    assert.match(html, /Interessens-\/Entwurfsschritt — nicht bindend bis Gewerbe \+ Anwaltsfreigabe/);
    assert.equal(html.includes('type="file"'), false);
    assert.equal(html.includes('youtrust'), false);
    assert.equal(html.includes('docusign'), false);
  }
  const home = readFileSync(new URL('index.html', site), 'utf8');
  assert.equal(home.includes('employer-sign.html'), false);
  assert.equal(home.includes('contract-draft.html'), false);
  assert.equal(home.includes('family-sign.html'), false);
  const employers = readFileSync(new URL('fuer-arbeitgeber.html', site), 'utf8');
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

test('an allowlisted pack still forces ENTWURF and returns only a public REF', async () => {
  const pack = packs[0];
  const sent = [];
  const audit = [];
  const draft = evaluateSubmit(baseBody(pack, { copy: { email: 'signer@example.com' } }), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
  }, new Date('2026-10-07T12:00:00Z'));
  assert.equal(draft.ready, true);
  assert.equal(draft.body.ref_id, undefined);
  const result = await completeSigning(draft, {
    now: new Date('2026-10-07T12:00:00Z'),
    mailer: async (message) => {
      sent.push(message.to);
      return { ok: true };
    },
    audit: (entry) => audit.push(entry),
  });
  assert.equal(result.http, 200);
  assert.equal(result.body.ok, true);
  assert.match(result.body.ref_id, /^REF-\d{8}-[0-9A-F]{4}$/);
  assert.equal(result.body.binding, false);
  assert.equal(result.body.status, 'ENTWURF');
  assert.equal(result.record.binding, 0);
  assert.equal(result.body.notify.delivered, false);
  assert.deepEqual(result.body.notify.recipients, []);
  assert.equal('id' in result.body, false);
  assert.equal(JSON.stringify(result.body).includes('signer@example.com'), false);
  assert.deepEqual(sent.slice().sort(), ['MEDA-team@outlook.com', 'meda-vermittlung@agentmail.to', 'signer@example.com'].sort());
  assert.equal(audit.filter((row) => row.action === 'COPY_DELIVERED').length, 3);
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

test('production flag rejects *-DEMO-* tokens and ignores client deliver_to', async () => {
  const pack = packs[0];
  const rejected = evaluateSubmit(baseBody(pack, { deliver_to: 'attacker@example.com' }), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
    REJECT_DEMO_TOKENS: 'true',
    DELIVER_TO: 'ops@example.com',
  });
  assert.equal(rejected.http, 403);
  assert.equal(rejected.body.error, 'DEMO_TOKEN_REJECTED');
  assert.equal(rejected.body.binding, false);
  assert.equal(rejected.body.status, 'ENTWURF');
  assert.equal(rejected.body.ref_id, undefined);

  const sent = [];
  const draft = evaluateSubmit(baseBody(pack, {
    public_token: 'CAND-LIVE-001',
    deliver_to: 'attacker@example.com',
    copy: { email: 'signer@example.com' },
  }), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
    REJECT_DEMO_TOKENS: 'true',
    DELIVER_TO: 'ops@example.com',
  });
  const live = await completeSigning(draft, {
    mailer: async (message) => {
      sent.push(message.to);
      return { ok: true };
    },
  });
  assert.equal(live.http, 200);
  assert.deepEqual(live.body.notify.recipients, ['ops@example.com']);
  assert.equal(JSON.stringify(live.body).includes('attacker@example.com'), false);
  assert.equal(JSON.stringify(live.body).includes('signer@example.com'), false);
  assert.equal(sent.includes('attacker@example.com'), false);
  assert.equal(sent.includes('ops@example.com'), false);
  assert.equal(sent.includes('signer@example.com'), true);

  const employer = packs[1];
  const emp = evaluateSubmit(baseBody(employer, { public_token: 'EMP-DEMO-001' }), {
    LEGAL_APPROVED_PACK_IDS: employer.id,
    REJECT_DEMO_TOKENS: 'true',
  });
  assert.equal(emp.http, 403);
  assert.equal(emp.body.error, 'DEMO_TOKEN_REJECTED');
});

test('a signer copy is required and MEDA always receives both inboxes', async () => {
  const pack = packs[0];
  const env = { LEGAL_APPROVED_PACK_IDS: pack.id };
  const missing = evaluateSubmit(baseBody(pack), env);
  assert.equal(missing.http, 400);
  assert.equal(missing.body.error, 'COPY_REQUIRED');
  assert.equal(missing.body.ref_id, undefined);

  const invalid = evaluateSubmit(baseBody(pack, { copy: { email: 'not-an-email', download: true } }), env);
  assert.equal(invalid.http, 400);
  assert.equal(invalid.body.error, 'COPY_EMAIL_INVALID');

  const failedMail = [];
  const failedDraft = evaluateSubmit(baseBody(pack, { copy: { email: 'signer@example.com' } }), env);
  const failed = await completeSigning(failedDraft, {
    mailer: async (message) => {
      failedMail.push(message.to);
      return { ok: false };
    },
    audit: () => {},
  });
  assert.equal(failed.http, 502);
  assert.equal(failed.body.error, 'COPY_FAILED');
  assert.equal(failed.body.ref_id, undefined);
  assert.equal(failed.body.copy.complete, false);

  for (const partyPack of packs) {
    const address = `${partyPack.party}@example.com`;
    const sent = [];
    const audit = [];
    const draft = evaluateSubmit(baseBody(partyPack, {
      public_token: partyPack.party === 'employer' ? 'EMP-LIVE-001' : 'CAND-LIVE-001',
      copy: { email: address },
    }), { LEGAL_APPROVED_PACK_IDS: partyPack.id });
    const done = await completeSigning(draft, {
      mailer: async (message) => {
        sent.push(message.to);
        return { ok: true };
      },
      audit: (entry) => audit.push(entry),
    });
    assert.equal(done.http, 200, partyPack.party);
    assert.equal(done.body.binding, false);
    assert.equal(sent.includes(address), true, partyPack.party);
    for (const inbox of MEDA_COPY_ADDRESSES) assert.equal(sent.includes(inbox), true, partyPack.party);
    assert.equal(audit.filter((row) => row.recipient === 'meda' && row.action === 'COPY_DELIVERED').length, 2);
  }
});

test('download keeps the signature pending until the signer fetches the PDF', async () => {
  const pack = packs[2];
  const env = {
    LEGAL_APPROVED_PACK_IDS: pack.id,
    ALLOWED_ORIGINS: 'https://meda-vermittlung.de',
  };
  const before = signerCopyAudit().length;
  const response = await worker.fetch(new Request('https://worker.example/esign/submit', {
    method: 'POST',
    headers: {
      Origin: 'https://meda-vermittlung.de',
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '198.51.100.77',
    },
    body: JSON.stringify(baseBody(pack, {
      public_token: 'CAND-LIVE-009',
      copy: { download: true, email: 'family@example.com' },
    })),
  }), env);
  assert.equal(response.status, 202);
  const pending = await response.json();
  assert.equal(pending.ok, false);
  assert.equal(pending.error, 'COPY_PENDING');
  assert.equal(pending.binding, false);
  assert.equal(pending.copy.complete, false);
  assert.equal(pending.ref_id, undefined);
  assert.match(pending.download_path, /^\/esign\/copy\?t=/);
  assert.equal(JSON.stringify(pending).includes('family@example.com'), false);
  const emailed = signerCopyAudit().slice(before).filter((row) => row.channel === 'email');
  assert.equal(emailed.some((row) => row.destination === 'family@example.com' && row.recipient === 'signer'), true);
  for (const inbox of MEDA_COPY_ADDRESSES) {
    assert.equal(emailed.some((row) => row.destination === inbox && row.recipient === 'meda'), true);
  }

  const file = await worker.fetch(new Request(`https://worker.example${pending.download_path}`, {
    headers: { 'CF-Connecting-IP': '198.51.100.78' },
  }), env);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('Content-Type'), 'application/pdf');
  assert.match(file.headers.get('X-MEDA-Ref'), /^REF-/);
  const pdf = new TextDecoder().decode(await file.arrayBuffer());
  assert.match(pdf, /^%PDF-1\.4/);
  const again = await worker.fetch(new Request(`https://worker.example${pending.download_path}`, {
    headers: { 'CF-Connecting-IP': '198.51.100.79' },
  }), env);
  assert.equal(again.status, 404);
});

test('oversized signatures are rejected without echoing the payload', () => {
  const pack = packs[0];
  const huge = 'data:image/png;base64,' + 'A'.repeat(500_001);
  const result = evaluateSubmit(baseBody(pack, { signature_png_data_url: huge }), {
    LEGAL_APPROVED_PACK_IDS: pack.id,
  });
  assert.equal(result.http, 413);
  assert.equal(result.body.error, 'PAYLOAD_TOO_LARGE');
  assert.equal(JSON.stringify(result.body).includes('AAAA'), false);
});
