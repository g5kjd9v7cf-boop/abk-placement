(function () {
  'use strict';

  function show(locale) {
    document.querySelectorAll('.erk-panel').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-locale') !== locale;
    });
    document.querySelectorAll('.js-erk-lang').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-erk') === locale ? 'true' : 'false');
    });
    try {
      if (window.MEDA_consent && MEDA_consent.trackView) {
        MEDA_consent.trackView({ document_version: '2026-09-26-v2', locale_shown: locale });
      }
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-erk-lang').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-erk'));
      });
    });
    show('de');
  });
})();
