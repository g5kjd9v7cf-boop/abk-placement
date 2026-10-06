'use strict';

var assert = require('assert');
var rules = require('../js/esign-rules.js');

function candidate(extra) {
  return Object.assign({
    role: 'candidate',
    candidate_token: 'REF-DEMOTEST',
    offer_id: 'demo-pflege-1',
    name: 'Demo Kandidat',
    street: 'Musterstraße 1',
    postal_code: '10115',
    city: 'Berlin',
    country: 'Deutschland',
    email: 'demo.kandidat@example.com',
    phone: '',
    law_provisional: true,
    law_vermittlung: true,
    law_visa: true,
    law_privacy: true,
    law_signature: true,
    typed_signature: 'Demo Kandidat',
    has_drawn_signature: false,
    signed_at: '2026-10-06T12:00:00.000Z',
    user_agent_hash: 'abc123',
    employer_sign_url: 'https://meda-vermittlung.de/employer-sign.html?token=REF-DEMOTEST&offer=demo-pflege-1'
  }, extra || {});
}

var empty = rules.validate({ role: 'candidate', candidate_token: 'REF-DEMOTEST', offer_id: 'demo-pflege-1' });
assert.strictEqual(empty.ok, false);
assert.ok(empty.missing.indexOf('name') !== -1);
assert.ok(empty.missing.indexOf('typed_signature') !== -1);
assert.ok(empty.missing.indexOf('law_provisional') !== -1);
assert.ok(empty.missing.indexOf('law_signature') !== -1);

var mismatch = rules.validate(candidate({ typed_signature: 'Andere Person' }));
assert.strictEqual(mismatch.ok, false);
assert.strictEqual(mismatch.errors.typed_signature, 'typed_mismatch');

var spaced = rules.validate(candidate({ name: '  Demo   Kandidat ', typed_signature: 'demo kandidat' }));
assert.strictEqual(spaced.ok, true);

var noToken = rules.validate(candidate({ candidate_token: '' }));
assert.strictEqual(noToken.ok, false);
assert.strictEqual(noToken.tokenOk, false);

var employerMissing = rules.validate(candidate({ role: 'employer' }));
assert.strictEqual(employerMissing.ok, false);
assert.ok(employerMissing.missing.indexOf('company') !== -1);
assert.ok(employerMissing.missing.indexOf('role_title') !== -1);

var employerOk = rules.validate(candidate({
  role: 'employer',
  company: 'Muster GmbH',
  role_title: 'Personal'
}));
assert.strictEqual(employerOk.ok, true);

var payload = rules.buildIntake(candidate());
assert.strictEqual(payload.channel, 'contract_esign');
assert.strictEqual(payload.page, 'contract-draft.html');
assert.strictEqual(payload.ops.e_sign, true);
assert.strictEqual(payload.ops.binding, false);
assert.strictEqual(payload.ops.soft_launch, true);
assert.strictEqual(payload.ops.type, 'contract_draft_interest');
assert.strictEqual(payload.ops.employer_outreach.auto_send, false);
assert.strictEqual(payload.ops.employer_outreach.status, 'draft_pending_review');
assert.ok(payload.ops.employer_sign_url.indexOf('employer-sign.html') !== -1);
assert.strictEqual(payload.public_brief.e_sign, true);
assert.strictEqual(payload.public_brief.binding, false);
assert.strictEqual(payload.public_brief.soft_launch, true);

var brief = JSON.stringify(payload.public_brief);
['Demo Kandidat', 'demo.kandidat@example.com', 'Musterstraße', '10115'].forEach(function (secret) {
  assert.strictEqual(brief.indexOf(secret), -1, 'public brief leaked ' + secret);
});
assert.strictEqual(payload.ops.signature.email, 'demo.kandidat@example.com');
assert.strictEqual(payload.ops.signature.name, 'Demo Kandidat');
assert.strictEqual(payload.ops.deliver_to, 'meda-vermittlung@agentmail.to');
assert.deepStrictEqual(payload.ops.copy_to, ['meda-vermittlung@agentmail.to', 'MEDA-team@outlook.com']);
assert.strictEqual(payload.ops.binding, false);
assert.strictEqual(payload.ops.signature.legal_confirmations.provisional_not_binding, true);
assert.strictEqual(payload.ops.signature.legal_confirmations.typed_signature_confirms_text, true);
assert.strictEqual(payload.ops.send_signer_copy, false);
assert.strictEqual(payload.ops.signer_copy_to, '');
assert.strictEqual(payload.public_brief.legal_confirmed, true);

var oneLawOff = rules.validate(candidate({ law_visa: false }));
assert.strictEqual(oneLawOff.ok, false);
assert.strictEqual(oneLawOff.errors.law_visa, 'law');

var withCopy = rules.buildIntakeCopies(candidate({ send_signer_copy: true }));
assert.strictEqual(withCopy.length, 2);
assert.strictEqual(withCopy[0].ops.copy_for, 'agentmail');
assert.strictEqual(withCopy[0].ops.send_signer_copy, true);
assert.strictEqual(withCopy[0].ops.signer_copy_to, 'demo.kandidat@example.com');
assert.strictEqual(withCopy[1].ops.deliver_to, 'MEDA-team@outlook.com');
assert.strictEqual(withCopy[1].ops.send_signer_copy, false);
assert.strictEqual(withCopy[1].ops.signer_copy_to, '');
assert.strictEqual(withCopy[1].ops.signer_copy_requested, true);
assert.strictEqual(JSON.stringify(withCopy[0].public_brief).indexOf('demo.kandidat@example.com'), -1);
assert.strictEqual(JSON.stringify(withCopy[1].public_brief).indexOf('employer-sign'), -1);

var receipt = rules.buildReceiptHtml(candidate({
  send_signer_copy: false,
  employer_sign_url: 'https://meda-vermittlung.de/employer-sign.html?token=REF-DEMOTEST&offer=demo-pflege-1'
}), {
  copyNotice: 'Sie erhalten eine Kopie. MEDA Vermittlung erhält eine Kopie (AgentMail + Team).',
  laws: ['vorläufig', 'reine Personalvermittlung', 'keine Visumzusage', 'Datenschutz', 'Unterschrift und Zeitstempel'],
  clauses: ['Keine Visumzusage. Keine Rechtsberatung.'],
  notBinding: 'Vorläufig · nicht bindend'
});
assert.ok(receipt.indexOf('Demo Kandidat') !== -1);
assert.ok(receipt.indexOf('AgentMail + Team') !== -1);
assert.ok(receipt.indexOf('meda-vermittlung@agentmail.to') !== -1);
assert.ok(receipt.indexOf('MEDA-team@outlook.com') !== -1);
assert.strictEqual(receipt.indexOf('employer-sign'), -1);

var employerPayload = rules.buildIntake(candidate({
  role: 'employer',
  company: 'Muster GmbH',
  role_title: 'Personal',
  email: 'demo.arbeitgeber@example.com'
}));
assert.strictEqual(employerPayload.channel, 'employer_contract_esign');
assert.strictEqual(employerPayload.ops.party, 'employer');
assert.strictEqual(employerPayload.ops.e_sign, true);
assert.strictEqual(employerPayload.ops.binding, false);
assert.strictEqual(employerPayload.ops.soft_launch, true);
assert.strictEqual(employerPayload.ops.signature.company, 'Muster GmbH');
assert.strictEqual(employerPayload.ops.employer_sign_url, undefined);
assert.strictEqual(employerPayload.ops.employer_outreach.auto_send, false);
assert.strictEqual(employerPayload.ops.employer_outreach.status, 'employer_esign_recorded_pending_review');
var employerBrief = JSON.stringify(employerPayload.public_brief);
assert.strictEqual(employerBrief.indexOf('Muster GmbH'), -1);
assert.strictEqual(employerBrief.indexOf('demo.arbeitgeber@example.com'), -1);

console.log('esign-rules: ok');
