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
    law_signature: true,
    clause_share: true,
    clause_services: true,
    clause_fees: true,
    clause_provisional: true,
    clause_truth: true,
    clause_login: false,
    typed_signature: 'Demo Kandidat',
    has_drawn_signature: true,
    signed_at: '2026-10-06T12:00:00.000Z',
    user_agent_hash: 'abc123',
    employer_sign_url: 'https://meda-vermittlung.de/employer-sign.html?token=REF-DEMOTEST&offer=demo-pflege-1'
  }, extra || {});
}

var empty = rules.validate({ role: 'candidate', candidate_token: 'REF-DEMOTEST', offer_id: 'demo-pflege-1' });
assert.strictEqual(empty.ok, false);
assert.ok(empty.missing.indexOf('name') !== -1);
assert.ok(empty.missing.indexOf('typed_signature') !== -1);
assert.ok(empty.missing.indexOf('law_signature') !== -1);
assert.ok(empty.missing.indexOf('clause_share') !== -1);
assert.ok(empty.missing.indexOf('clause_fees') !== -1);
assert.ok(empty.missing.indexOf('clause_truth') !== -1);
assert.ok(empty.missing.indexOf('clause_login') === -1);
assert.ok(empty.missing.indexOf('has_drawn_signature') !== -1);

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
assert.ok(employerMissing.missing.indexOf('clause_coop') !== -1);
assert.ok(employerMissing.missing.indexOf('clause_invoice') !== -1);
assert.ok(employerMissing.missing.indexOf('clause_nohire') !== -1);
assert.ok(employerMissing.missing.indexOf('clause_soft') !== -1);
assert.ok(employerMissing.missing.indexOf('clause_channel') !== -1);
assert.strictEqual(rules.publicTokenOk('employer', 'REF-DEMOTEST'), false);
assert.strictEqual(rules.publicTokenOk('candidate', 'EMP-SECRET'), false);
assert.strictEqual(rules.submitAllowed({ legal_approved: true, binding: true, pack_hash: 'abc', status: 'ENTWURF' }, 'abc'), false);
assert.strictEqual(rules.submitAllowed({ legal_approved: true, binding: false, pack_hash: 'abc', status: 'ENTWURF' }, 'other'), false);
assert.strictEqual(rules.submitAllowed({ legal_approved: false, binding: false, pack_hash: 'abc', status: 'ENTWURF' }, 'abc'), false);
assert.strictEqual(rules.submitAllowed({ legal_approved: true, binding: false, pack_hash: 'abc', status: 'ENTWURF' }, 'abc'), true);
assert.strictEqual(rules.submitAllowed(null, 'abc'), false);

var employerOk = rules.validate(candidate({
  role: 'employer',
  candidate_token: 'EMP-DEMOTEST',
  company: 'Muster GmbH',
  role_title: 'Personal',
  clause_coop: true,
  clause_pool: true,
  clause_nohire: true,
  clause_exclusivity: true,
  clause_aueg: true,
  clause_compliance: true,
  clause_channel: true,
  clause_invoice: true,
  clause_soft: true
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
assert.strictEqual(payload.public_brief.clauses_confirmed, true);
assert.strictEqual(payload.ops.signature.fee_amount, 'TODO_ANWALT');
assert.strictEqual(payload.ops.signature.clause_acknowledgements.share_contact_after_ops_review, true);
assert.strictEqual(payload.ops.signature.clause_acknowledgements.later_login_addendum, false);
assert.strictEqual(payload.ops.signature.legal_confirmations.licensed_lawyer_signed, false);
assert.strictEqual(payload.ops.signature.legal_confirmations.lawyer_review_required, true);
assert.strictEqual(JSON.stringify(payload).indexOf('€'), -1);
assert.strictEqual(JSON.stringify(payload).indexOf('EUR '), -1);

var feesOff = rules.validate(candidate({ clause_fees: false }));
assert.strictEqual(feesOff.ok, false);
assert.strictEqual(feesOff.errors.clause_fees, 'clause');

var oneLawOff = rules.validate(candidate({ law_signature: false }));
assert.strictEqual(oneLawOff.ok, false);
assert.strictEqual(oneLawOff.errors.law_signature, 'law');
var loginOn = rules.buildIntake(candidate({ clause_login: true }));
assert.strictEqual(loginOn.ops.signature.clause_acknowledgements.later_login_addendum, true);

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
  candidate_token: 'EMP-DEMOTEST',
  company: 'Muster GmbH',
  role_title: 'Personal',
  email: 'demo.arbeitgeber@example.com',
  clause_coop: true,
  clause_pool: true,
  clause_nohire: true,
  clause_exclusivity: true,
  clause_aueg: true,
  clause_compliance: true,
  clause_channel: true,
  clause_invoice: true,
  clause_soft: true
}));
assert.strictEqual(employerPayload.channel, 'employer_contract_esign');
assert.strictEqual(employerPayload.ops.party, 'employer');
assert.strictEqual(employerPayload.ops.e_sign, true);
assert.strictEqual(employerPayload.ops.binding, false);
assert.strictEqual(employerPayload.ops.soft_launch, true);
assert.strictEqual(employerPayload.ops.signature.company, 'Muster GmbH');
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.fee_on_success_separate_invoice, true);
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.contact_channel_no_bypass, true);
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.employer_pays_by_invoice, undefined);
assert.strictEqual(employerPayload.ops.legal_approved, false);
assert.strictEqual(employerPayload.public_brief.candidate_token, 'EMP-DEMOTEST');
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.no_hard_exclusivity, true);
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.provisional_soft_launch, true);
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.fee_amount, 'TODO_ANWALT');
assert.strictEqual(employerPayload.ops.signature.clause_acknowledgements.share_contact_after_ops_review, undefined);
assert.strictEqual(employerPayload.ops.employer_sign_url, undefined);
assert.strictEqual(employerPayload.ops.employer_outreach.auto_send, false);
assert.strictEqual(employerPayload.ops.employer_outreach.status, 'employer_esign_recorded_pending_review');
var employerBrief = JSON.stringify(employerPayload.public_brief);
assert.strictEqual(employerBrief.indexOf('Muster GmbH'), -1);
assert.strictEqual(employerBrief.indexOf('demo.arbeitgeber@example.com'), -1);
var md = rules.buildReceiptMd(candidate({ preview: true, pack_hash: 'abc', pack_id: 'candidate-soft-launch-0.9' }));
assert.ok(md.indexOf('Bindung: false') !== -1);
assert.strictEqual(md.indexOf('€'), -1);
assert.ok(rules.buildReceiptPdf(candidate()).indexOf('%PDF-1.4') === 0);
var family = rules.buildIntake(candidate({ role: 'family', candidate_token: '', offer_id: '', clause_privacy: true }));
assert.strictEqual(family.ops.binding, false);
assert.strictEqual(family.page, 'family-interest.html');
assert.strictEqual(JSON.stringify(family).indexOf('2000'), -1);
assert.strictEqual(JSON.stringify(family).indexOf('€'), -1);
var hidden = rules.buildIntake(candidate({ candidate_token: 'INTERNAL-9' }));
assert.strictEqual(hidden.public_brief.candidate_token, '');

console.log('esign-rules: ok');
