(function () {
  'use strict';

  function qs(name) {
    try {
      return new URLSearchParams(location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function consentBase() {
    var cfg = window.MEDA_ENDPOINTS || {};
    if (cfg.consent) return String(cfg.consent).trim();
    var meta = document.querySelector('meta[name="meda-consent-api"]');
    return (meta && meta.getAttribute('content')) || '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var ref = qs('ref');
    if (ref) {
      var refEl = document.getElementById('wd-ref');
      if (refEl) refEl.value = ref;
    }
    var form = document.getElementById('widerruf-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (document.getElementById('wd-email') || {}).value || '';
      var receipt = (document.getElementById('wd-ref') || {}).value || '';
      var confirm = document.getElementById('wd-confirm');
      if (confirm && !confirm.checked) {
        confirm.focus();
        return;
      }
      var payload = { email: email, receipt_ref: receipt, document_version: '2026-09-20-v1' };
      var usedApi = false;
      try {
        if (window.MEDA_consent && typeof MEDA_consent.withdraw === 'function') {
          var hasEndpoint = consentBase().trim();
          MEDA_consent.withdraw(payload);
          usedApi = !!hasEndpoint;
        }
      } catch (err) { /* ignore */ }
      if (!usedApi) {
        var subj = 'WIDERRUF MEDA-CONSENT-' + (receipt || 'ANFRAGE');
        var body =
          'Widerruf der Einwilligung / سحب الموافقة\n\nE-Mail: ' +
          email +
          '\nBelegnummer: ' +
          (receipt || '(keine)') +
          '\ndocument_version: 2026-09-20-v1\nTimestamp: ' +
          new Date().toISOString();
        window.location.href =
          'mailto:meda-vermittlung@agentmail.to?subject=' +
          encodeURIComponent(subj) +
          '&body=' +
          encodeURIComponent(body);
      }
      var ok = document.getElementById('wd-ok');
      if (ok) ok.hidden = false;
    });
  });
})();
