(function () {
  'use strict';

  var RECEIPT_RE = /^MEDA-[0-9a-f]{32}$/;

  function t(key) {
    var lang = (document.documentElement.lang || 'de').slice(0, 2);
    var packs = window.ABK_I18N || {};
    var pack = packs[lang] || packs.de || {};
    if (pack[key] != null) return pack[key];
    if (packs.de && packs.de[key] != null) return packs.de[key];
    return '';
  }

  function init() {
    var form = document.getElementById('widerruf-form');
    if (!form) return;
    try {
      var ref = new URLSearchParams(location.search).get('ref');
      var field = document.getElementById('wd-ref');
      if (ref && field && RECEIPT_RE.test(ref)) field.value = ref;
    } catch (e) { /* ignore */ }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var receipt = ((document.getElementById('wd-ref') || {}).value || '').trim();
      var confirm = document.getElementById('wd-confirm');
      var ok = document.getElementById('wd-ok');
      var err = document.getElementById('wd-err');
      if (ok) ok.hidden = true;
      if (err) {
        err.hidden = true;
        err.textContent = '';
      }
      if (confirm && !confirm.checked) {
        confirm.focus();
        return;
      }
      if (!RECEIPT_RE.test(receipt)) {
        if (err) {
          err.hidden = false;
          err.textContent = t('wd.missing');
        }
        return;
      }
      var request = (window.MEDA_consent && typeof MEDA_consent.withdraw === 'function')
        ? MEDA_consent.withdraw({ receipt_ref: receipt, document_version: '2026-09-26-v4' })
        : Promise.resolve({ ok: false });
      Promise.resolve(request).then(function (res) {
        if (res && res.ok === true && res.restricted === true) {
          if (ok) ok.hidden = false;
          return;
        }
        if (err) {
          err.hidden = false;
          err.textContent = t('wd.err');
        }
      }).catch(function () {
        if (err) {
          err.hidden = false;
          err.textContent = t('wd.err');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();