/**
 * Posts Bewerben forms to the apply Worker. The CV is not kept after the request.
 * File checks run before this module is asked to send. Server file codes are
 * shown on the file field; other worker codes get a visible message of their own.
 */
(function () {
  'use strict';

  var DEFAULT_URL = 'https://meda-apply.g5kjd9v7cf.workers.dev';

  var FILE_CODES = {
    FILE_TYPE: 'app.cv.type',
    FILE_EXT: 'app.cv.ext',
    FILE_SIZE: 'app.cv.size',
    FILE_COUNT: 'app.cv.count',
    FILE_UNSAFE: 'app.cv.unsafe'
  };

  var STATUS_CODES = {
    RATE_LIMIT: 'app.send.rate',
    INVALID: 'app.send.invalid',
    BAD_FORM: 'app.send.fail',
    DELIVERY_FAILED: 'app.send.fail',
    NOT_CONFIGURED: 'app.send.fail',
    ORIGIN: 'app.send.fail',
    TURNSTILE: 'app.send.fail',
    NOT_FOUND: 'app.send.fail'
  };

  function lang() {
    var code = 'de';
    try { code = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase(); } catch (e) { /* ignore */ }
    return code;
  }

  function text(key) {
    var packs = window.ABK_I18N || {};
    var pack = packs[lang()] || packs.de || {};
    return pack[key] || (packs.de && packs.de[key]) || '';
  }

  function endpoint() {
    var meta = document.querySelector('meta[name="meda-apply-api"]');
    var value = meta && meta.getAttribute('content');
    value = (value || DEFAULT_URL).trim();
    return value.replace(/\/$/, '');
  }

  function statusOf(form) {
    return form.querySelector('[data-apply-status]');
  }

  function setStatus(form, message, kind) {
    var node = statusOf(form);
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-err', kind === 'err' && !!message);
    node.classList.toggle('is-ok', kind === 'ok' && !!message);
    if (message && kind === 'err') {
      node.setAttribute('role', 'alert');
      try { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
    } else {
      node.setAttribute('role', 'status');
    }
  }

  function buttonOf(form) {
    return form.querySelector('[type="submit"]');
  }

  function setSending(form, on) {
    var btn = buttonOf(form);
    if (!btn) return;
    if (on) {
      var key = btn.getAttribute('data-i18n');
      if (key) {
        btn.setAttribute('data-i18n-suspended', key);
        btn.removeAttribute('data-i18n');
      }
      if (!btn.getAttribute('data-idle-label')) btn.setAttribute('data-idle-label', btn.textContent || '');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.classList.add('is-sending');
      btn.textContent = text('app.send.sending') || 'Wird gesendet … bitte warten (bis zu 20 Sekunden)';
      return;
    }
    var suspended = btn.getAttribute('data-i18n-suspended');
    if (suspended) {
      btn.setAttribute('data-i18n', suspended);
      btn.removeAttribute('data-i18n-suspended');
    }
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.classList.remove('is-sending');
    btn.textContent = (suspended && text(suspended)) || btn.getAttribute('data-idle-label') || '';
  }

  function finishSending(form) {
    form.removeAttribute('data-apply-sending');
    setSending(form, false);
  }

  function showServerError(form, code) {
    if (FILE_CODES[code]) {
      setStatus(form, '', '');
      if (form.querySelector('input[type="file"]') && window.MEDA_showCvError) {
        window.MEDA_showCvError(form, FILE_CODES[code]);
        return;
      }
      setStatus(form, text(FILE_CODES[code]), 'err');
      return;
    }
    if (code === 'CONSENT') {
      setStatus(form, '', '');
      if (window.MEDA_showConsentRequired) window.MEDA_showConsentRequired(form);
      else setStatus(form, text('app.consent.required'), 'err');
      return;
    }
    var key = STATUS_CODES[code] || 'app.send.fail';
    setStatus(form, text(key), 'err');
  }

  function send(form) {
    var url = endpoint();
    var body = new FormData(form);
    fetch(url, {
      method: 'POST',
      body: body,
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      return res.json().catch(function () { return { ok: false }; }).then(function (data) {
        if (res.ok && data && data.ok) {
          setStatus(form, text('app.send.ok'), 'ok');
          if (window.MEDA_clearCvError) window.MEDA_clearCvError(form);
          form.reset();
          return;
        }
        showServerError(form, data && data.error);
      });
    }).catch(function () {
      setStatus(form, text('app.send.fail'), 'err');
    }).then(function () {
      finishSending(form);
    });
  }

  function submitApplication(form) {
    if (!form || form.getAttribute('data-apply-sending') === '1') return;
    form.setAttribute('data-apply-sending', '1');
    setSending(form, true);
    setStatus(form, '', '');
    var fileInput = form.querySelector('input[type="file"]');
    var guard = window.MEDA_cvGuard;
    var pending = fileInput && guard && typeof guard.inspectList === 'function'
      ? guard.inspectList(fileInput.files)
      : Promise.resolve({ ok: true });
    pending.then(function (result) {
      if (fileInput && (!result || !result.ok)) {
        finishSending(form);
        if (window.MEDA_showCvError) window.MEDA_showCvError(form, (result && result.key) || 'app.cv.type');
        setStatus(form, '', '');
        return;
      }
      if (window.MEDA_clearCvError) window.MEDA_clearCvError(form);
      send(form);
    }).catch(function () {
      finishSending(form);
      setStatus(form, text('app.send.fail'), 'err');
    });
  }

  window.MEDA_submitApplication = submitApplication;
  window.MEDA_applyErrors = { FILE_CODES: FILE_CODES, STATUS_CODES: STATUS_CODES };
})();
