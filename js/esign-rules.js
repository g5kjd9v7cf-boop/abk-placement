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
  var CANDIDATE_CLAUSE_KEYS = ['clause_share', 'clause_withdraw', 'clause_upload', 'clause_fees', 'clause_training', 'clause_truth', 'clause_services', 'clause_provisional'];
  var EMPLOYER_CLAUSE_KEYS = ['clause_link', 'clause_coop', 'clause_pool', 'clause_nohire', 'clause_exclusivity', 'clause_aueg', 'clause_compliance', 'clause_channel', 'clause_invoice', 'clause_b2b', 'clause_soft'];
  var FAMILY_CLAUSE_KEYS = ['clause_privacy', 'clause_withdraw'];
  var FEE_AMOUNT = 'TODO_ANWALT';
  var FEE_LINE = 'Hoehe folgt im finalen Vertrag. TODO Anwalt. Dieses Blatt begruendet keine Zahlungspflicht.';
  var PACK_IDS = {
    candidate: 'candidate-soft-launch-0.13',
    employer: 'employer-soft-launch-0.4',
    family: 'family-soft-launch-0.5'
  };

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
    if (role === 'employer') return EMPLOYER_CLAUSE_KEYS.slice();
    if (role === 'family') return FAMILY_CLAUSE_KEYS.slice();
    return CANDIDATE_CLAUSE_KEYS.slice();
  }

  function publicTokenOk(role, token) {
    var value = clean(token);
    var anyPublic = /^(REF|CAND|EMP)-[A-Za-z0-9][A-Za-z0-9-]{2,}$/;
    if (role === 'family') return value === '' || anyPublic.test(value);
    if (role === 'employer') return /^EMP-[A-Za-z0-9][A-Za-z0-9-]{2,}$/.test(value);
    return /^(REF|CAND)-[A-Za-z0-9][A-Za-z0-9-]{2,}$/.test(value);
  }

  function submitAllowed(lock, packHash) {
    if (!lock || typeof lock !== 'object') return false;
    if (lock.binding !== false) return false;
    if (lock.legal_approved !== true) return false;
    if (lock.status && lock.status !== 'ENTWURF') return false;
    if (!packHash || lock.pack_hash !== packHash) return false;
    return true;
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
      },
      {
        key: 'has_drawn_signature',
        check: function (value) {
          return value === true ? '' : 'drawn';
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
    var role = src.role === 'employer' ? 'employer' : src.role === 'family' ? 'family' : 'candidate';
    var errors = {};
    var missing = [];
    specsFor(role).forEach(function (spec) {
      var code = spec.check(src[spec.key], src);
      if (code) {
        errors[spec.key] = code;
        missing.push(spec.key);
      }
    });
    var tokenOk = publicTokenOk(role, src.candidate_token);
    var offerOk = role === 'family' || src.service_flow === true ? true : clean(src.offer_id).length > 0;
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

  function checkboxMap(src, role) {
    var map = {};
    clauseKeysFor(role).forEach(function (key) {
      map[key] = src[key] === true;
    });
    map.law_signature = src.law_signature === true;
    if (role === 'candidate') map.clause_login = !!src.clause_login;
    map.send_signer_copy = !!src.send_signer_copy;
    return map;
  }

  function buildIntake(model, copyFor) {
    var src = model || {};
    var role = src.role === 'employer' ? 'employer' : src.role === 'family' ? 'family' : 'candidate';
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
          unique_link_for_named_offer: src.clause_link === true,
          no_fernabsatz_withdrawal_b2b: src.clause_b2b === true,
          long_term_cooperation: true,
          candidate_pool_shortlists: true,
          no_hire_duty: true,
          no_hard_exclusivity: true,
          no_aueg: true,
          agg_and_privacy: true,
          contact_channel_no_bypass: true,
          fee_on_success_separate_invoice: true,
          provisional_soft_launch: true,
          fee_amount: FEE_AMOUNT,
          fee_line: FEE_LINE
        }
        : role === 'family'
          ? {
            privacy_interest: src.clause_privacy === true,
            fernabsatz_notice_14_days: src.clause_withdraw === true,
            fee_amount: FEE_AMOUNT,
            fee_line: FEE_LINE
          }
          : {
            share_contact_after_ops_review: src.clause_share === true,
            fernabsatz_notice_14_days: src.clause_withdraw === true,
            upload_only_after_signature: src.clause_upload === true,
            fees_open_no_payment_on_this_sheet: src.clause_fees === true,
            training_statutory_not_gate_fee: src.clause_training === true,
            services_vermittlung_no_guarantee: src.clause_services === true,
            provisional_no_guarantee: src.clause_provisional === true,
            truth_soft_channel_agg: src.clause_truth === true,
            later_login_addendum: !!src.clause_login,
            fee_amount: FEE_AMOUNT,
            fee_line: FEE_LINE
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
    var shownToken = publicTokenOk(role, src.candidate_token) ? clean(src.candidate_token) : '';
    var publicBrief = {
      candidate_token: shownToken,
      offer_id: role === 'family' ? '' : clean(src.offer_id),
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
    var page = role === 'employer' ? 'employer-sign.html' : role === 'family' ? 'family-interest.html' : 'contract-draft.html';
    var ops = {
      type: role === 'employer' ? 'employer_contract_esign' : role === 'family' ? 'family_interest' : 'contract_draft_interest',
      ts: signedAt,
      candidate_token: publicBrief.candidate_token,
      offer_id: publicBrief.offer_id,
      party: role,
      binding: false,
      soft_launch: true,
      e_sign: true,
      pack_id: src.pack_id || PACK_IDS[role] || '',
      pack_hash: src.pack_hash || '',
      legal_approved: false,
      signature: signature,
      audit: {
        signed_at: signedAt,
        party: role,
        typed_signature_matches_name: true,
        has_drawn_signature: !!src.has_drawn_signature,
        user_agent: src.user_agent || '',
        user_agent_hash: src.user_agent_hash || '',
        ip_capture: 'worker',
        pack_id: src.pack_id || PACK_IDS[role] || '',
        pack_hash: src.pack_hash || '',
        checkbox_map: checkboxMap(src, role),
        signature_asset_ref: src.signature_asset_ref || '',
        legal_confirmed: true,
        binding: false,
        status: 'ENTWURF'
      },
      employer_outreach: outreach,
      notice: 'Provisional Interessensbekundung. Not a binding Vermittlungsvertrag until Gewerbe and lawyer clearance.',
      deliver_to: slot === 'team' ? TEAM_TO : OPS_TO,
      copy_to: OPS_COPIES.slice(),
      copy_for: slot,
      receipt_id: publicBrief.candidate_token + ':' + (signedAt || ''),
      copies: {
        signer: {
          requested: wantSigner,
          to: wantSigner ? clean(src.email) : '',
          channel: 'signer_email'
        },
        meda: [
          { channel: 'agentmail', to: OPS_TO },
          { channel: 'outlook', to: TEAM_TO }
        ]
      },
      send_signer_copy: slot === 'agentmail' && wantSigner,
      signer_copy_requested: wantSigner,
      signer_copy_to: slot === 'agentmail' && wantSigner ? clean(src.email) : '',
      signer_copy_note: 'Email the signer only when send_signer_copy is true, and only to signer_copy_to. Do not email the other party.'
    };
    if (role === 'candidate' && src.employer_sign_url) ops.employer_sign_url = src.employer_sign_url;
    return {
      channel: role === 'employer' ? 'employer_contract_esign' : role === 'family' ? 'family_interest' : 'contract_esign',
      page: page,
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
    row(L.tokenLabel || 'Referenznummer', src.candidate_token);
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
    row('Paket', (src.pack_id || '') + (src.pack_hash ? ' · ' + src.pack_hash : ''));
    row('Vergütung', FEE_LINE);
    row('Siegelmaterial', receiptSealMaterial(src));
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
      + '<p class="badge">' + escapeHtml(L.notBinding || 'Entwurf · nicht rechtsverbindlich') + '</p>'
      + '<h1>' + escapeHtml(L.title || 'Kopie der Erklärung') + '</h1>'
      + '<p>' + escapeHtml(L.copyNotice || '') + '</p>'
      + preview
      + lines.join('')
      + '<h2>' + escapeHtml(L.lawTitle || 'Rechtliche Bestätigung') + '</h2><ul>' + laws + '</ul>'
      + '<p>' + signerNote + '</p>'
      + '<p>' + escapeHtml(L.noOtherParty || 'Keine Nachricht an die andere Partei.') + '</p>'
      + '<p>MEDA Vermittlung · meda-vermittlung@agentmail.to · MEDA-team@outlook.com</p>'
      + '</body></html>';
  }

  function receiptSealMaterial(src) {
    var role = src.role === 'employer' ? 'employer' : src.role === 'family' ? 'family' : 'candidate';
    return [
      'binding:false',
      'status:ENTWURF',
      src.pack_id || PACK_IDS[role] || '',
      src.pack_hash || '',
      src.signed_at || '',
      JSON.stringify(checkboxMap(src, role)),
      src.signature_asset_ref || '',
      clean(src.typed_signature)
    ].join('\n');
  }

  function buildReceiptMd(model) {
    var src = model || {};
    var role = src.role === 'employer' ? 'employer' : src.role === 'family' ? 'family' : 'candidate';
    var token = publicTokenOk(role, src.candidate_token) ? clean(src.candidate_token) : '';
    return [
      '# MEDA Interessensblatt — ENTWURF',
      '',
      'Bindung: false. Nicht rechtsverbindlich. Kein Vermittlungsvertrag. Keine Vergütung und keine Zahlung aus diesem Blatt.',
      'Vergütung: ' + FEE_LINE,
      '',
      '- Rolle: ' + role,
      '- Referenznummer: ' + token,
      '- Zeitpunkt: ' + (src.signed_at || ''),
      '- Paket: ' + (src.pack_id || PACK_IDS[role] || ''),
      '- Paket-Hash: ' + (src.pack_hash || ''),
      '- User-Agent: ' + (src.user_agent || ''),
      '- Signatur-Referenz: ' + (src.signature_asset_ref || ''),
      '- Gezeichnet: ' + (src.has_drawn_signature ? 'ja' : 'nein'),
      '',
      '## Siegelmaterial',
      '',
      '```',
      receiptSealMaterial(src),
      '```',
      '',
      src.preview ? 'Vorschau. Nicht versiegelt. Nichts übermittelt und keine E-Mail versendet.' : 'Hinweis: Eine Versiegelung erfolgt erst, wenn diese Entwurfsfassung zur Übermittlung freigegeben ist.',
      ''
    ].join('\n');
  }

  function pdfEscape(value) {
    return String(value || '')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function buildReceiptPdf(model) {
    var text = pdfEscape(buildReceiptMd(model)).split('\n').slice(0, 42);
    var commands = ['BT', '/F1 11 Tf', '48 780 Td', '14 TL'];
    text.forEach(function (line, index) {
      commands.push((index ? 'T* ' : '') + '(' + line.slice(0, 110) + ') Tj');
    });
    commands.push('ET');
    var stream = commands.join('\n');
    var objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
      '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
      '4 0 obj << /Length ' + stream.length + ' >> stream\n' + stream + '\nendstream endobj\n',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'
    ];
    var pdf = '%PDF-1.4\n';
    var offsets = [0];
    objects.forEach(function (obj) {
      offsets.push(pdf.length);
      pdf += obj;
    });
    var xref = pdf.length;
    pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
    pdf += '0000000000 65535 f \n';
    for (var i = 1; i < offsets.length; i++) {
      pdf += ('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n';
    }
    pdf += 'trailer << /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return pdf;
  }

  return {
    OPS_TO: OPS_TO,
    TEAM_TO: TEAM_TO,
    OPS_COPIES: OPS_COPIES,
    LAW_KEYS: LAW_KEYS,
    clauseKeysFor: clauseKeysFor,
    PACK_IDS: PACK_IDS,
    FEE_AMOUNT: FEE_AMOUNT,
    FEE_LINE: FEE_LINE,
    EMAIL_RE: EMAIL_RE,
    normalizeName: normalizeName,
    publicTokenOk: publicTokenOk,
    submitAllowed: submitAllowed,
    validate: validate,
    buildIntake: buildIntake,
    buildIntakeCopies: buildIntakeCopies,
    buildReceiptHtml: buildReceiptHtml,
    buildReceiptMd: buildReceiptMd,
    buildReceiptPdf: buildReceiptPdf,
    receiptSealMaterial: receiptSealMaterial
  };
});
