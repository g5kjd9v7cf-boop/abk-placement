/**
 * Single switch for the ask, consent, and e-sign endpoints.
 *
 * API_ORIGIN stays empty until DNS for api.meda-vermittlung.de is live.
 * Empty keeps the workers.dev fallbacks. Set it to
 * "https://api.meda-vermittlung.de" (no path) to use:
 *   ask      https://api.meda-vermittlung.de/ask      + /chat, /intake
 *   consent  https://api.meda-vermittlung.de/consent  + /view, /submit, …
 *   esign    https://api.meda-vermittlung.de          + /esign/submit, /esign/health
 *   apply    https://api.meda-vermittlung.de/apply
 *
 * TURNSTILE_SITE_KEY is public. Leave it empty until the Turnstile widget
 * exists in the Cloudflare dashboard. The secret stays in the Worker env.
 */
(function () {
  'use strict';

  var API_ORIGIN = '';
  var TURNSTILE_SITE_KEY = '';

  var FALLBACK = {
    ask: 'https://meda-ask.g5kjd9v7cf.workers.dev',
    consent: 'https://meda-consent.g5kjd9v7cf.workers.dev',
    esign: '',
    apply: 'https://meda-apply.g5kjd9v7cf.workers.dev'
  };

  function join(origin, path) {
    return String(origin).replace(/\/$/, '') + path;
  }

  var endpoints = API_ORIGIN
    ? {
        ask: join(API_ORIGIN, '/ask'),
        consent: join(API_ORIGIN, '/consent'),
        esign: join(API_ORIGIN, '')
      }
      : {
          ask: FALLBACK.ask,
          consent: FALLBACK.consent,
          esign: FALLBACK.esign,
          apply: FALLBACK.apply
        };

  if (API_ORIGIN) endpoints.apply = join(API_ORIGIN, '/apply');

  window.MEDA_ENDPOINTS = {
    API_ORIGIN: API_ORIGIN,
    ask: endpoints.ask,
    consent: endpoints.consent,
    esign: endpoints.esign,
    apply: endpoints.apply
  };
  window.MEDA_TURNSTILE_SITE_KEY = TURNSTILE_SITE_KEY;

  function setMeta(name, value) {
    var meta = document.querySelector('meta[name="' + name + '"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      var head = document.head || document.getElementsByTagName('head')[0];
      if (head) head.appendChild(meta);
    }
    meta.setAttribute('content', value || '');
  }

  setMeta('meda-ask-api', endpoints.ask);
  setMeta('meda-consent-api', endpoints.consent);
  setMeta('meda-esign-api', endpoints.esign);
})();
