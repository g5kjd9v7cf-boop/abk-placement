(function () {
  'use strict';

  var LOCALES = { de: true, fr: true, en: true, ar: true };
  var viewed = false;

  function show(locale) {
    if (!LOCALES[locale]) locale = 'de';
    document.querySelectorAll('.erk-panel').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-locale') !== locale;
    });
    document.querySelectorAll('.js-erk-lang').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-erk') === locale ? 'true' : 'false');
    });
    if (viewed) return;
    viewed = true;
    try {
      if (window.MEDA_consent && typeof MEDA_consent.trackView === 'function') {
        MEDA_consent.trackView({
          document_version: '2026-09-26-v3',
          locale_shown: locale
        });
      }
    } catch (e) { /* ignore */ }
  }

  function init() {
    if (!document.querySelector('.erk-panel')) return;
    document.querySelectorAll('.js-erk-lang').forEach(function (button) {
      button.addEventListener('click', function () {
        show(button.getAttribute('data-erk'));
      });
    });
    var lang = (document.documentElement.lang || 'de').slice(0, 2);
    show(LOCALES[lang] ? lang : 'de');
    document.addEventListener('abk:lang', function (event) {
      var next = event.detail && event.detail.lang;
      if (next) show(next);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
