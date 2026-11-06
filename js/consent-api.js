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

  function showConsentRequired(form, box) {
    var block = form.querySelector('.consent-checkbox-block');
    if (block) {
      block.classList.add('consent-checkbox-error');
      try { block.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
    }
    var msg = form.querySelector('.consent-required-msg');
    if (msg) msg.hidden = false;
    if (box) {
      box.setAttribute('aria-invalid', 'true');
      try { box.focus(); } catch (err) { /* ignore */ }
    }
  }

  function clearConsentRequired(form, box) {
    var block = form.querySelector('.consent-checkbox-block');
    if (block) block.classList.remove('consent-checkbox-error');
    var msg = form.querySelector('.consent-required-msg');
    if (msg) msg.hidden = true;
    if (box) box.removeAttribute('aria-invalid');
  }

  function cvText(key) {
    var lang = 'de';
    try { lang = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase(); } catch (e) { /* ignore */ }
    var packs = window.ABK_I18N || {};
    var pack = packs[lang] || packs.de || {};
    return pack[key] || (packs.de && packs.de[key]) || '';
  }

  function cvErrorEl(form) {
    var msg = form.querySelector('.cv-file-error');
    if (msg) return msg;
    var input = form.querySelector('input[type="file"]');
    if (!input) return null;
    msg = document.createElement('p');
    msg.className = 'cv-file-error';
    msg.setAttribute('role', 'alert');
    msg.hidden = true;
    if (input.parentNode) input.parentNode.insertBefore(msg, input.nextSibling);
    return msg;
  }

  function showCvError(form, key) {
    var msg = cvErrorEl(form);
    if (msg) {
      msg.setAttribute('data-i18n', key);
      var text = cvText(key);
      if (text) msg.textContent = text;
      msg.hidden = false;
    }
    var input = form.querySelector('input[type="file"]');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      try { input.focus(); } catch (err) { /* ignore */ }
    }
  }

  function clearCvError(form) {
    var msg = form.querySelector('.cv-file-error');
    if (msg) msg.hidden = true;
    var input = form.querySelector('input[type="file"]');
    if (input) input.removeAttribute('aria-invalid');
  }

  window.MEDA_showCvError = showCvError;
  window.MEDA_clearCvError = clearCvError;

  function continueSubmit(form) {
    form.setAttribute('data-cv-pass', '1');
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
  }

  function bindFormGates() {
    var forms = document.querySelectorAll('form.form[action*="formsubmit"]');
    forms.forEach(function (form) {
      if (form.getAttribute('data-meda-consent-bound') === '1') return;
      form.setAttribute('data-meda-consent-bound', '1');

      var box = form.querySelector('input[name="einwilligung_gelesen"]');
      if (box) {
        box.addEventListener('invalid', function (ev) {
          ev.preventDefault();
          showConsentRequired(form, box);
        });
        box.addEventListener('change', function () {
          if (box.checked) clearConsentRequired(form, box);
        });
      }

      form.addEventListener('submit', function (e) {
        var passed = form.getAttribute('data-cv-pass') === '1';
        if (passed) form.removeAttribute('data-cv-pass');

        var fileInput = form.querySelector('input[type="file"]');
        if (fileInput && !passed) {
          e.preventDefault();
          if (box && !box.checked) {
            showConsentRequired(form, box);
            return;
          }
          var guard = window.MEDA_cvGuard;
          var pending = guard && typeof guard.inspectList === 'function'
            ? guard.inspectList(fileInput.files)
            : Promise.resolve({ ok: false, key: 'app.cv.type' });
          pending.then(function (result) {
            if (!result || !result.ok) {
              showCvError(form, (result && result.key) || 'app.cv.type');
              return;
            }
            clearCvError(form);
            if (box && !box.checked) {
              showConsentRequired(form, box);
              return;
            }
            continueSubmit(form);
          }).catch(function () {
            showCvError(form, 'app.cv.type');
          });
          return;
        }

        if (box && !box.checked) {
          e.preventDefault();
          showConsentRequired(form, box);
          return;
        }
        if (box) clearConsentRequired(form, box);

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
