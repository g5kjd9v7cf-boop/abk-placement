(function () {
  'use strict';

  function show(locale) {
    document.querySelectorAll('.erk-panel').forEach(function (panel) {
      var on = panel.getAttribute('data-locale') === locale;
      panel.hidden = !on;
    });
    document.querySelectorAll('.js-erk-lang').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-erk') === locale ? 'true' : 'false');
    });
    try {
      if (window.MEDA_consent && MEDA_consent.trackView) {
        MEDA_consent.trackView({ document_version: '2026-09-20-v1', locale_shown: locale });
      }
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-erk-lang').forEach(function (button) {
      button.addEventListener('click', function () {
        show(button.getAttribute('data-erk'));
      });
    });
    show('de');
  });
})();
