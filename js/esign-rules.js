(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MEDA_ESIGN_RULES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  var OPS_TO = 'meda-vermittlung@agentmail.to';
  var TEAM_TO = 'MEDA-team@outlook.com';
  var OPS_COPIES = [OPS_TO, TEAM_TO];
  var LAW_KEYS = ['law_signature'];
  var CANDIDATE_CLAUSE_KEYS = ['clause_share', 'clause_services', 'clause_fees', 'clause_provisional', 'clause_truth'];
  var EMPLOYER_CLAUSE_KEYS = ['clause_coop', 'clause_pool', 'clause_nohire', 'clause_exclusivity', 'clause_aueg', 'clause_compliance', 'clause_invoice', 'clause_soft'];
  var FEE_AMOUNT = 'TODO_ANWALT';

  function clean(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function normalizeName(value) {
    return clean(value).toLocaleLowerCase('de-DE');
  }

  function words(value) {
    return clean(value).split(' ').filter(Boolean);
  }

  function checkMin(value, min) {
    return clean(value).length >= min ? '' : 'too_short';
  }

  function clauseKeysFor(role) {
    return role === 'employer' ? EMPLOYER_CLAUSE_KEYS.slice() : CANDIDATE_CLAUSE_KEYS.slice();
  }

  function specsFor(role) {
    var specs = [
      {
        key: 'name',
        check: function (value) {
          var parts = words(value);
          if (parts.length < 2 || parts.some(function (part) { return part.length < 2; })) return 'name_full';
          return '';
        }
      }
    ];
    if (role === 'employer') {
      specs.push({ key: 'company', check: function (value) { return checkMin(value, 2); } });
      specs.push({ key: 'role_title', check: function (value) { return checkMin(value, 2); } });
    }
    specs.push(
      { key: 'street', check: function (value) { return checkMin(value, 3); } },
      { key: 'postal_code', check: function (value) { return checkMin(value, 3); } },
      { key: 'city', check: function (value) { return checkMin(value, 2); } },
      { key: 'country', check: function (value) { return checkMin(value, 2); } },
      {
        key: 'email',
        check: function (value) {
          return EMAIL_RE.test(clean(value)) ? '' : 'email';
        }
      },
      {
        key: 'typed_signature',
        check: function (value, all) {
          if (!clean(value)) return 'typed_empty';
          if (!clean(all.name) || normalizeName(value) !== normalizeName(all.name)) return 'typed_mismatch';
          return '';
        }
      }
    );
    clauseKeysFor(role).forEach(function (key) {
      specs.push({
        key: key,
        check: function (value) {
          return value === true ? '' : 'clause';
        }
      });
    });
    LAW_KEYS.forEach(function (key) {
      specs.push({
        key: key,
        check: function (value) {
          return value === true ? '' : 'law';
        }
      });
    });
    return specs;
  }

  function validate(input) {
    var src = input || {};
    var role = src.role === 'employer' ? 'employer' : 'candidate';
    var errors = {};
    var missing = [];
    specsFor(role).forEach(function (spec) {
      var code = spec.check(src[spec.key], src);
      if (code) {
        errors[spec.key] = code;
        missing.push(spec.key);
      }
    });
    var tokenOk = clean(src.candidate_token).length > 0;
    var offerOk = clean(src.offer_id).length > 0;
    return {
      ok: missing.length === 0 && tokenOk && offerOk,
      errors: errors,
      missing: missing,
      tokenOk: tokenOk,
      offerOk: offerOk,
      role: role
    };
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildIntake(model, copyFor) {
    var src = model || {};
    var role = src.role === 'employer' ? 'employer' : 'candidate';
    var signedAt = src.signed_at;
    var slot = copyFor === 'team' ? 'team' : 'agentmail';
    var wantSigner = !!src.send_signer_copy;
    var signature = {
      name: clean(src.name),
      street: clean(src.street),
      postal_code: clean(src.postal_code),
      city: clean(src.city),
      country: clean(src.country),
      email: clean(src.email),
      phone: clean(src.phone || ''),
      typed_signature: clean(src.typed_signature),
      has_drawn_signature: !!src.has_drawn_signature,
      acknowledgement: true,
      fee_amount: FEE_AMOUNT,
      clause_acknowledgements: role === 'employer'
        ? {
          long_term_cooperation: true,
          candidate_pool_shortlists: true,
          no_hire_duty: true,
          no_hard_exclusivity: true,
          no_aueg: true,
          agg_and_privacy: true,
          employer_pays_by_invoice: true,
          provisional_soft_launch: true,
          fee_amount: FEE_AMOUNT
        }
        : {
          share_contact_after_ops_review: true,
          services_vermittlung_and_integration: true,
          fees_to_be_discussed: true,
          provisional_no_guarantee: true,
          truth_no_exclusivity_agg: true,
          later_login_addendum: !!src.clause_login,
          fee_amount: FEE_AMOUNT
        },
      legal_confirmations: {
        provisional_not_binding: true,
        vermittlung_not_aueg: true,
        no_visa_no_legal_advice: true,
        privacy_consent: true,
        typed_signature_confirms_text: true,
        lawyer_review_required: true,
        licensed_lawyer_signed: false
      }
    };
    if (role === 'employer') {
      signature.company = clean(src.company);
      signature.role_title = clean(src.role_title);
    }
    var publicBrief = {
      candidate_token: clean(src.candidate_token),
      offer_id: clean(src.offer_id),
      party: role,
      e_sign: true,
      binding: false,
      soft_launch: true,
      signed_at: signedAt,
      has_drawn_signature: !!src.has_drawn_signature,
      user_agent_hash: src.user_agent_hash || '',
      legal_confirmed: true,
      clauses_confirmed: true,
      fee_amount: FEE_AMOUNT,
      signer_copy_requested: wantSigner,
      notice: 'Provisional interest signature. No personal data in this brief.'
    };
    var outreach = {
      status: role === 'employer' ? 'employer_esign_recorded_pending_review' : 'draft_pending_review',
      auto_send: false,
      note: 'Do not email the other party. Ops copies go only to AgentMail and the MEDA team inbox.'
    };
    if (role === 'candidate' && src.employer_sign_url) {
      outreach.employer_sign_url = src.employer_sign_url;
    }
    var ops = {
      type: role === 'employer' ? 'employer_contract_esign' : 'contract_draft_interest',
      ts: signedAt,
      candidate_token: publicBrief.candidate_token,
      offer_id: publicBrief.offer_id,
      party: role,
      binding: false,
      soft_launch: true,
      e_sign: true,
      signature: signature,
      audit: {
        signed_at: signedAt,
        party: role,
        typed_signature_matches_name: true,
        has_drawn_signature: !!src.has_drawn_signature,
        user_agent_hash: src.user_agent_hash || '',
        legal_confirmed: true
      },
      employer_outreach: outreach,
      notice: 'Provisional Interessensbekundung. Not a binding Vermittlungsvertrag until Gewerbe and lawyer clearance.',
      deliver_to: slot === 'team' ? TEAM_TO : OPS_TO,
      copy_to: OPS_COPIES.slice(),
      copy_for: slot,
      receipt_id: publicBrief.candidate_token + ':' + (signedAt || ''),
      send_signer_copy: slot === 'agentmail' && wantSigner,
      signer_copy_requested: wantSigner,
      signer_copy_to: slot === 'agentmail' && wantSigner ? clean(src.email) : '',
      signer_copy_note: 'Email the signer only when send_signer_copy is true, and only to signer_copy_to. Do not email the other party.'
    };
    if (role === 'candidate' && src.employer_sign_url) ops.employer_sign_url = src.employer_sign_url;
    return {
      channel: role === 'employer' ? 'employer_contract_esign' : 'contract_esign',
      page: role === 'employer' ? 'employer-sign.html' : 'contract-draft.html',
      candidate_token: publicBrief.candidate_token,
      public_brief: publicBrief,
      ops: ops
    };
  }

  function buildIntakeCopies(model) {
    return [buildIntake(model, 'agentmail'), buildIntake(model, 'team')];
  }

  function buildReceiptHtml(model, labels) {
    var src = model || {};
    var L = labels || {};
    var role = src.role === 'employer' ? 'employer' : 'candidate';
    var lines = [];
    function row(label, value) {
      if (!String(value || '').trim()) return;
      lines.push('<p><span>' + escapeHtml(label) + '</span><br/><strong>' + escapeHtml(value) + '</strong></p>');
    }
    row(L.tokenLabel || 'Vorgangsnummer', src.candidate_token);
    row(L.offerLabel || 'Angebotsreferenz', src.offer_id);
    row(L.roleLabel || 'Rolle', role === 'employer' ? (L.partyEmployer || 'Arbeitgeber') : (L.partyCandidate || 'Kandidatin / Kandidat'));
    row(L.nameLabel || 'Name', src.name);
    if (role === 'employer') {
      row(L.companyLabel || 'Unternehmen', src.company);
      row(L.roleTitleLabel || 'Funktion', src.role_title);
    }
    row(L.addressLabel || 'Anschrift', [src.street, [src.postal_code, src.city].filter(Boolean).join(' '), src.country].filter(Boolean).join(', '));
    row(L.emailLabel || 'E-Mail', src.email);
    row(L.timeLabel || 'Zeitpunkt', L.formattedTime || src.signed_at);
    row(L.signatureLabel || 'Unterschrift', src.typed_signature);
    row(L.hashLabel || 'Gerätehinweis', src.user_agent_hash);
    var clauses = (L.clauses || []).map(function (line) {
      return '<li>' + escapeHtml(line) + '</li>';
    }).join('');
    var laws = (L.laws || []).map(function (line) {
      return '<li>' + escapeHtml(line) + '</li>';
    }).join('');
    var preview = src.preview ? '<p>' + escapeHtml(L.previewNote || '') + '</p>' : '';
    var signerNote = src.send_signer_copy
      ? escapeHtml(L.signerMailNote || '')
      : escapeHtml(L.noSignerMailNote || '');
    return '<!DOCTYPE html><html lang="' + escapeHtml(L.lang || 'de') + '"><head><meta charset="utf-8"/>'
      + '<title>' + escapeHtml(L.title || 'MEDA Kopie') + '</title>'
      + '<style>body{font-family:Inter,system-ui,sans-serif;color:#1A1238;margin:2rem;line-height:1.5}'
      + 'h1{font-size:1.4rem} .badge{display:inline-block;background:#F0E8F7;color:#6B2D78;border-radius:999px;padding:.2rem .6rem;font-size:.75rem;font-weight:700}'
      + 'p{margin:.4rem 0} span{color:#607089;font-size:.8rem}</style></head><body>'
      + '<p class="badge">' + escapeHtml(L.notBinding || 'Vorläufig · nicht bindend') + '</p>'
      + '<h1>' + escapeHtml(L.title || 'Kopie der Interessensbekundung') + '</h1>'
      + '<p>' + escapeHtml(L.copyNotice || '') + '</p>'
      + preview
      + lines.join('')
      + '<h2>' + escapeHtml(L.clausesTitle || 'Text') + '</h2><ol>' + clauses + '</ol>'
      + '<h2>' + escapeHtml(L.lawTitle || 'Rechtliche Bestätigung') + '</h2><ul>' + laws + '</ul>'
      + '<p>' + signerNote + '</p>'
      + '<p>' + escapeHtml(L.noOtherParty || 'Keine Nachricht an die andere Seite.') + '</p>'
      + '<p>MEDA Vermittlung · meda-vermittlung@agentmail.to · MEDA-team@outlook.com</p>'
      + '</body></html>';
  }

  return {
    OPS_TO: OPS_TO,
    TEAM_TO: TEAM_TO,
    OPS_COPIES: OPS_COPIES,
    LAW_KEYS: LAW_KEYS,
    clauseKeysFor: clauseKeysFor,
    FEE_AMOUNT: FEE_AMOUNT,
    EMAIL_RE: EMAIL_RE,
    normalizeName: normalizeName,
    validate: validate,
    buildIntake: buildIntake,
    buildIntakeCopies: buildIntakeCopies,
    buildReceiptHtml: buildReceiptHtml
  };
});
