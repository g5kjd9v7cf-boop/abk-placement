/* Removed: Cookie-Einstellungen banner. Keep Datenschutz gate only.
   Stub so cached HTML that still requests this file does nothing harmful. */
(function () {
  'use strict';
  function kill() {
    var el = document.getElementById('meda-cookie-consent');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    try {
      document.documentElement.classList.remove('cookie-consent-locked');
      if (document.body) document.body.classList.remove('cookie-consent-locked');
    } catch (e) { /* ignore */ }
  }
  kill();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kill);
  }
})();
