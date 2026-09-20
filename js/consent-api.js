(function () {
  'use strict';

  var DOCUMENT_VERSION = '2026-09-20-v1';
  var SID_KEY = 'meda_sid';
  var COOKIE_KEY = 'meda_cookie_consent';
  var QUEUE_KEY = 'meda_consent_queue';

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function gateAccepted() {
    try {
      var raw = localStorage.getItem('meda_datenschutz_gate');
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!(data && data.accepted === true);
    } catch (e) {
      return false;
    }
  }

  var _memorySid = null;

  function getSessionId(opts) {
    opts = opts || {};
    var persist = opts.persist === true || gateAccepted();
    var id = null;
    try {
      id = localStorage.getItem(SID_KEY);
    } catch (e) { /* ignore */ }
    if (!id) id = _memorySid;
    if (!id) {
      id = uuid();
      _memorySid = id;
    }
    if (persist) {
      try {
        localStorage.setItem(SID_KEY, id);
      } catch (e) { /* ignore */ }
    }
    return id;
  }

  function getEndpointBase() {
    var meta = document.querySelector('meta[name="meda-consent-api"]');
    if (!meta) return '';
    var v = (meta.getAttribute('content') || '').trim();
    return v.replace(/\/$/, '');
  }

  function enqueueLocal(eventName, payload) {
    var entry = {
      event: eventName,
      payload: payload,
      queued_at: new Date().toISOString()
    };
    try {
      console.debug('[MEDA_consent] queue', entry);
    } catch (e) { /* ignore */ }
    try {
      var raw = sessionStorage.getItem(QUEUE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      arr.push(entry);
      sessionStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
    } catch (e) { /* ignore */ }
    return { ok: false, queued: true, offline: true };
  }

  function postJson(path, body) {
    var base = getEndpointBase();
    var enriched = Object.assign({}, body, {
      session_id: getSessionId(),
      document_version: body.document_version || DOCUMENT_VERSION,
      ts: body.ts || new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      page: typeof location !== 'undefined' ? location.pathname : ''
    });

    if (!base) {
      return Promise.resolve(enqueueLocal(path.replace(/^\//, ''), enriched));
    }

    var url = base + path;
    try {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(enriched),
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      }).then(function (res) {
        return res.json().catch(function () {
          return { ok: res.ok, status: res.status };
        });
      }).catch(function (err) {
        enqueueLocal(path.replace(/^\//, ''), enriched);
        return { ok: false, error: String(err && err.message ? err.message : err) };
      });
    } catch (err) {
      enqueueLocal(path.replace(/^\//, ''), enriched);
      return Promise.resolve({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  }

  function trackView(payload) {
    payload = payload || {};
    return postJson('/view', {
      event: 'erklaerung_view',
      document_version: payload.document_version || DOCUMENT_VERSION,
      locale_shown: payload.locale_shown || 'de'
    });
  }

  function trackSubmit(payload) {
    payload = payload || {};
    return postJson('/submit', {
      event: 'consent_given',
      email: payload.email || '',
      document_version: payload.document_version || DOCUMENT_VERSION,
      form_type: payload.form_type || '',
      checkbox_checked: true,
      consent_checkbox_version: payload.consent_checkbox_version || DOCUMENT_VERSION
    });
  }

  function withdraw(payload) {
    payload = payload || {};
    return postJson('/withdraw', {
      event: 'consent_withdrawn',
      email: payload.email || '',
      receipt_ref: payload.receipt_ref || payload.ref || '',
      document_version: payload.document_version || DOCUMENT_VERSION
    });
  }

  function hasCookieChoice() {
    try {
      var raw = localStorage.getItem(COOKIE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!(data && (data.choice === 'accept' || data.choice === 'deny'));
    } catch (e) {
      return false;
    }
  }

  function ensureCookieThen(cb) {
    if (hasCookieChoice()) {
      cb();
      return;
    }
    if (typeof window.MEDA_resetCookieConsent === 'function') {
      window.MEDA_resetCookieConsent();
    }
    var banner = document.getElementById('meda-cookie-consent');
    if (banner) {
      var focusBtn = banner.querySelector('.cookie-consent-accept') || banner.querySelector('button');
      if (focusBtn) focusBtn.focus();
    }
  }

  function bindFormGates() {
    var forms = document.querySelectorAll('form.form[action*="formsubmit"]');
    forms.forEach(function (form) {
      if (form.getAttribute('data-meda-consent-bound') === '1') return;
      form.setAttribute('data-meda-consent-bound', '1');

      form.addEventListener('submit', function (e) {
        var box = form.querySelector('input[name="einwilligung_gelesen"]');
        if (box && !box.checked) {
          e.preventDefault();
          box.focus();
          var block = form.querySelector('.consent-checkbox-block');
          if (block) {
            block.classList.add('consent-checkbox-error');
            try { block.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
          }
          return;
        }

        if (!hasCookieChoice()) {
          e.preventDefault();
          ensureCookieThen(function () {});
          return;
        }

        var emailEl = form.querySelector('input[name="email"]');
        var formTypeEl = form.querySelector('input[name="form_type"]');
        var versionEl = form.querySelector('input[name="document_version"]');
        var email = emailEl ? emailEl.value : '';
        var formType = formTypeEl ? formTypeEl.value : (form.getAttribute('data-form-type') || 'contact');
        var docVer = versionEl ? versionEl.value : DOCUMENT_VERSION;

        try {
          trackSubmit({
            email: email,
            document_version: docVer,
            form_type: formType,
            consent_checkbox_version: DOCUMENT_VERSION
          });
        } catch (err) { /* fire-and-forget */ }
      });
    });
  }


  function trackPageview(payload) {
    payload = payload || {};
    if (!gateAccepted()) {
      return Promise.resolve({ ok: false, skipped: true, reason: 'gate_not_accepted' });
    }
    return postJson('/pageview', {
      event: 'page_visit',
      document_version: payload.document_version || DOCUMENT_VERSION,
      locale_shown: payload.locale_shown || '',
      page: payload.page || (typeof location !== 'undefined' ? location.pathname : ''),
      referrer: payload.referrer || (typeof document !== 'undefined' ? document.referrer || '' : ''),
      ts: payload.ts
    });
  }

  function trackGateAccept(payload) {
    payload = payload || {};
    return postJson('/gate', {
      event: 'datenschutz_accepted',
      document_version: payload.document_version || 'datenschutz-2026-09-20-v1',
      layout: payload.layout || 'de+ar',
      ts: payload.ts
    });
  }

  function trackGateDecline(payload) {
    payload = payload || {};
    return postJson('/gate', {
      event: 'datenschutz_declined',
      document_version: payload.document_version || 'datenschutz-2026-09-20-v1',
      layout: payload.layout || 'de+ar',
      ts: payload.ts
    });
  }

  window.MEDA_consent = {
    DOCUMENT_VERSION: DOCUMENT_VERSION,
    trackView: trackView,
    trackSubmit: trackSubmit,
    withdraw: withdraw,
    trackPageview: trackPageview,
    trackGateAccept: trackGateAccept,
    trackGateDecline: trackGateDecline,
    getSessionId: getSessionId,
    gateAccepted: gateAccepted,
    hasCookieChoice: hasCookieChoice,
    bindFormGates: bindFormGates
  };

  var _pageviewSent = false;
  function maybeTrackPageview(reason) {
    if (_pageviewSent) return;
    if (!gateAccepted()) return;
    _pageviewSent = true;
    try {
      trackPageview({ reason: reason || 'load' });
    } catch (e) { /* ignore */ }
  }

  function init() {
    if (gateAccepted()) {
      getSessionId({ persist: true });
      maybeTrackPageview('already_accepted');
    }
    bindFormGates();
    document.addEventListener('meda:gate-accepted', function () {
      getSessionId({ persist: true });
      maybeTrackPageview('gate_accept');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
