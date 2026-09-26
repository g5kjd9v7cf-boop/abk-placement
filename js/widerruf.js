(function () {
  'use strict';

  var DOCUMENT_VERSION = '2026-09-26-v2';

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  function show(id, on) {
    var el = document.getElementById(id);
    if (el) el.hidden = !on;
  }

  function mailtoFallback(email, receipt) {
    var subject = 'WIDERRUF MEDA-CONSENT-' + (receipt || 'ANFRAGE');
    var body = 'Widerruf der Einwilligung / سحب الموافقة\n\nE-Mail: ' + email +
      '\nBelegnummer: ' + (receipt || '(keine)') +
      '\ndocument_version: ' + DOCUMENT_VERSION +
      '\nTimestamp: ' + new Date().toISOString();
    window.location.href = 'mailto:meda-vermittlung@agentmail.to?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    show('wd-ok', false);
    show('wd-mail', true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var ref = qs('ref');
    if (ref) {
      var field = document.getElementById('wd-ref');
      if (field) field.value = ref;
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
      var payload = { email: email, receipt_ref: receipt, document_version: DOCUMENT_VERSION };
      var request = (window.MEDA_consent && typeof MEDA_consent.withdraw === 'function')
        ? MEDA_consent.withdraw(payload)
        : Promise.resolve({ ok: false });
      Promise.resolve(request).then(function (res) {
        if (res && res.ok) {
          show('wd-mail', false);
          show('wd-ok', true);
          return;
        }
        mailtoFallback(email, receipt);
      }).catch(function () {
        mailtoFallback(email, receipt);
      });
    });
  });
})();
