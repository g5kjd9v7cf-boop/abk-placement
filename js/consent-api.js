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


  var FORMSUBMIT_AJAX = 'https://formsubmit.co/ajax/meda-vermittlung@agentmail.to';
  var FORMSUBMIT_TIMEOUT_MS = 12000;
  var FALLBACK_MSG = 'Unser Formular ist gerade nicht erreichbar. Bitte senden Sie Ihren Lebenslauf und Ihre Angaben per E-Mail an meda-vermittlung@agentmail.to – wir melden uns.';
  var SUCCESS_MSG = 'Vielen Dank — Ihre Bewerbung ist eingegangen. Wir melden uns.';
  var EMAIL_CTA = 'Per E-Mail senden';
  var EMAIL_HINT = 'Ihre Angaben bleiben in diesem Formular. Der Lebenslauf kann per Mailto nicht angehängt werden — bitte in der E-Mail anhängen.';
  var EMAIL_SUBJECT = 'Bewerbung – {name}';
  var EMAIL_NO_NAME = 'ohne Name';
  var EMAIL_ATTACH = 'Bitte hängen Sie Ihren Lebenslauf (PDF, DOC oder DOCX) an diese E-Mail an.';

  function formText(key, fallback) {
    var text = cvText(key);
    return text || fallback;
  }

  function fillWithEmail(el, text) {
    var email = 'meda-vermittlung@agentmail.to';
    var at = String(text || '').indexOf(email);
    if (at < 0) {
      el.textContent = text;
      return;
    }
    el.textContent = '';
    el.appendChild(document.createTextNode(text.slice(0, at)));
    var bdi = document.createElement('bdi');
    bdi.setAttribute('dir', 'ltr');
    bdi.style.display = 'block';
    bdi.style.unicodeBidi = 'isolate';
    bdi.style.whiteSpace = 'nowrap';
    bdi.style.textAlign = (document.documentElement.dir === 'rtl') ? 'right' : 'left';
    bdi.textContent = email;
    el.appendChild(bdi);
    el.appendChild(document.createTextNode(text.slice(at + email.length)));
  }

  function fieldLabel(el) {
    if (!el) return '';
    var lab = el.closest('label');
    if (lab) {
      var span = lab.querySelector('span');
      if (span) return (span.textContent || '').trim();
    }
    return el.getAttribute('name') || '';
  }

  function buildMailto(form) {
    var nameEl = form.querySelector('input[name="name"]');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    var subject = formText('app.form.emailSubject', EMAIL_SUBJECT).replace('{name}', name || formText('app.form.emailNoName', EMAIL_NO_NAME));
    var lines = [];
    var skip = {
      _subject: 1, _template: 1, _captcha: 1, _honey: 1, _next: 1,
      document_version: 1, consent_checkbox_version: 1, einwilligung_gelesen: 1
    };
    var els = form.querySelectorAll('input, textarea, select');
    Array.prototype.forEach.call(els, function (el) {
      var n = el.getAttribute('name');
      if (!n || skip[n] || el.type === 'file' || (el.type === 'hidden' && n.charAt(0) === '_')) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (!el.checked) return;
      }
      var val = String(el.value || '').trim();
      if (!val) return;
      lines.push(fieldLabel(el) + ': ' + val);
    });
    lines.push('');
    lines.push(formText('app.form.emailAttach', EMAIL_ATTACH));
    var href = 'mailto:meda-vermittlung@agentmail.to'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(lines.join('\n'));
    return href;
  }

  function ensureStatus(form) {
    var el = form.querySelector('.meda-form-status');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'meda-form-status form-note';
    el.setAttribute('role', 'status');
    el.hidden = true;
    var btn = form.querySelector('button[type="submit"]');
    if (btn && btn.parentNode) btn.parentNode.insertBefore(el, btn.nextSibling);
    else form.appendChild(el);
    return el;
  }

  function clearFallback(form) {
    var el = form.querySelector('.meda-form-status');
    if (!el) return;
    el.hidden = true;
    el.innerHTML = '';
    el.classList.remove('meda-form-status-error', 'meda-form-status-ok');
  }

  function showFallback(form, quiet) {
    var el = ensureStatus(form);
    el.classList.remove('meda-form-status-ok');
    el.classList.add('meda-form-status-error');
    el.removeAttribute('data-i18n');
    el.innerHTML = '';
    var p = document.createElement('p');
    p.style.margin = '0 0 0.75rem';
    p.setAttribute('data-i18n', 'app.form.fallback');
    fillWithEmail(p, formText('app.form.fallback', FALLBACK_MSG));
    el.appendChild(p);
    var a = document.createElement('a');
    a.className = 'btn btn-primary btn-sm';
    a.href = buildMailto(form);
    a.setAttribute('data-i18n', 'app.form.emailCta');
    a.textContent = formText('app.form.emailCta', EMAIL_CTA);
    el.appendChild(a);
    var hint = document.createElement('p');
    hint.className = 'form-note';
    hint.style.marginTop = '0.75rem';
    hint.setAttribute('data-i18n', 'app.form.emailHint');
    hint.textContent = formText('app.form.emailHint', EMAIL_HINT);
    el.appendChild(hint);
    el.hidden = false;
    if (!quiet) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
    }
  }

  function showSuccess(form, quiet) {
    clearFallback(form);
    var el = ensureStatus(form);
    el.classList.remove('meda-form-status-error');
    el.classList.add('meda-form-status-ok');
    el.setAttribute('data-i18n', 'app.form.success');
    el.textContent = formText('app.form.success', SUCCESS_MSG);
    el.hidden = false;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'false');
    }
    if (!quiet) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
    }
  }

  function setSubmitting(form, on) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
  }

  function submitViaAjax(form) {
    clearFallback(form);
    setSubmitting(form, true);
    var data;
    try {
      data = new FormData(form);
    } catch (err) {
      setSubmitting(form, false);
      showFallback(form);
      return Promise.resolve({ ok: false });
    }
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        try { controller.abort(); } catch (e) { /* ignore */ }
      }, FORMSUBMIT_TIMEOUT_MS);
    }
    var opts = {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
      mode: 'cors',
      credentials: 'omit'
    };
    if (controller) opts.signal = controller.signal;
    return fetch(FORMSUBMIT_AJAX, opts).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res || !res.ok) {
        setSubmitting(form, false);
        showFallback(form);
        return { ok: false, status: res && res.status };
      }
      showSuccess(form);
      return { ok: true };
    }).catch(function () {
      if (timer) clearTimeout(timer);
      setSubmitting(form, false);
      showFallback(form);
      return { ok: false };
    });
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

        e.preventDefault();

        if (box && !box.checked) {
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

        submitViaAjax(form);
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
    bindFormGates: bindFormGates,
    FORMSUBMIT_AJAX: FORMSUBMIT_AJAX,
    submitViaAjax: submitViaAjax,
    showFallback: showFallback,
    buildMailto: buildMailto
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
    document.addEventListener('abk:lang', function () {
      var nodes = document.querySelectorAll('form.form .meda-form-status');
      Array.prototype.forEach.call(nodes, function (el) {
        if (el.hidden) return;
        var form = el.closest('form');
        if (!form) return;
        if (el.classList.contains('meda-form-status-error')) showFallback(form, true);
        else if (el.classList.contains('meda-form-status-ok')) showSuccess(form, true);
      });
    });
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
