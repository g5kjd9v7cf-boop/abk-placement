(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MEDA_ESIGN_RULES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  var OPS_TO = 'meda-vermittlung@agentmail.to';

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
        key: 'ack',
        check: function (value) {
          return value === true ? '' : 'ack';
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

  function buildIntake(model) {
    var src = model || {};
    var role = src.role === 'employer' ? 'employer' : 'candidate';
    var signedAt = src.signed_at;
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
      acknowledgement: true
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
      notice: 'Provisional interest signature. No personal data in this brief.'
    };
    var outreach = {
      status: role === 'employer' ? 'employer_esign_recorded_pending_review' : 'draft_pending_review',
      auto_send: false,
      note: 'Do not email candidates or employers until Ahmed approves.'
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
        user_agent_hash: src.user_agent_hash || ''
      },
      employer_outreach: outreach,
      notice: 'Provisional Interessensbekundung. Not a binding Vermittlungsvertrag until Gewerbe and lawyer clearance.',
      deliver_to: src.deliver_to || OPS_TO
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

  return {
    OPS_TO: OPS_TO,
    EMAIL_RE: EMAIL_RE,
    normalizeName: normalizeName,
    validate: validate,
    buildIntake: buildIntake
  };
});
