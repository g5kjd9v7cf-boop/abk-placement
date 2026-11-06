/**
 * Posts Bewerben forms to the apply Worker. The CV is not kept after the request.
 */
(function () {
  'use strict';

  var DEFAULT_URL = 'https://meda-apply.g5kjd9v7cf.workers.dev';

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

  function setStatus(form, message) {
    var node = statusOf(form);
    if (node) node.textContent = message || '';
  }

  function showFileError(form, code) {
    var key = 'app.cv.type';
    if (code === 'FILE_SIZE') key = 'app.cv.size';
    else if (code === 'FILE_UNSAFE') key = 'app.cv.unsafe';
    else if (code === 'FILE_EXT') key = 'app.cv.ext';
    else if (code === 'FILE_COUNT') key = 'app.cv.count';
    if (window.MEDA_showCvError) window.MEDA_showCvError(form, key);
  }

  function send(form) {
    var url = endpoint();
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus(form, text('app.send.sending'));
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
          setStatus(form, text('app.send.ok'));
          form.reset();
          return;
        }
        var code = data && data.error;
        if (code === 'FILE_TYPE' || code === 'FILE_SIZE' || code === 'FILE_UNSAFE' || code === 'FILE_EXT' || code === 'FILE_COUNT') {
          showFileError(form, code);
        }
        if (code === 'CONSENT') {
          setStatus(form, text('app.consent.required'));
          return;
        }
        if (code === 'RATE_LIMIT') {
          setStatus(form, text('app.send.rate'));
          return;
        }
        setStatus(form, text('app.send.fail'));
      });
    }).catch(function () {
      setStatus(form, text('app.send.fail'));
    }).then(function () {
      if (btn) btn.disabled = false;
    });
  }

  function submitApplication(form) {
    var fileInput = form.querySelector('input[type="file"]');
    var guard = window.MEDA_cvGuard;
    var pending = fileInput && guard && typeof guard.inspectList === 'function'
      ? guard.inspectList(fileInput.files)
      : Promise.resolve({ ok: true });
    pending.then(function (result) {
      if (fileInput && (!result || !result.ok)) {
        if (window.MEDA_showCvError) window.MEDA_showCvError(form, (result && result.key) || 'app.cv.type');
        setStatus(form, '');
        return;
      }
      if (window.MEDA_clearCvError) window.MEDA_clearCvError(form);
      send(form);
    }).catch(function () {
      setStatus(form, text('app.send.fail'));
    });
  }

  window.MEDA_submitApplication = submitApplication;
})();
