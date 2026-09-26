(function () {
  'use strict';

  var DOCUMENT_VERSION = '2026-09-26-v2';
  var OBJECT_KEY = 'meda_pageview_objection';
  var RECEIPT_RE = /^MEDA-[0-9a-f]{32}$/;

  function t(key) {
    var lang = (document.documentElement.lang || 'de').slice(0, 2);
    var packs = window.ABK_I18N || {};
    var pack = packs[lang] || packs.de || {};
    if (pack[key] != null) return pack[key];
    if (packs.de && packs.de[key] != null) return packs.de[key];
    return '';
  }

  function objected() {
    try {
      return localStorage.getItem(OBJECT_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function getEndpointBase() {
    var meta = document.querySelector('meta[name="meda-consent-api"]');
    if (!meta) return '';
    return (meta.getAttribute('content') || '').trim().replace(/\/$/, '');
  }

  function pagePath() {
    try {
      var path = location.pathname || '/';
      if (path.charAt(0) !== '/') path = '/' + path;
      return path.split('?')[0].split('#')[0];
    } catch (e) {
      return '/';
    }
  }

  function compact(body) {
    var out = {};
    Object.keys(body).forEach(function (key) {
      if (body[key] !== undefined && body[key] !== '') out[key] = body[key];
    });
    return out;
  }

  function postJson(path, body) {
    var base = getEndpointBase();
    var payload = compact(Object.assign({
      document_version: DOCUMENT_VERSION,
      locale_shown: (document.documentElement.lang || 'de').slice(0, 2),
      page: pagePath()
    }, body || {}));
    delete payload.email;
    delete payload.ts;
    delete payload.user_agent;
    delete payload.referrer;

    if (!base) return Promise.resolve({ ok: false, error: 'no_endpoint' });

    return fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors',
      credentials: 'omit'
    }).then(function (res) {
      return res.json().catch(function () {
        return { ok: false, status: res.status };
      });
    }).catch(function (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    });
  }

  function trackView(payload) {
    payload = payload || {};
    return postJson('/view', {
      event: 'erklaerung_view',
      document_version: payload.document_version || DOCUMENT_VERSION,
      locale_shown: payload.locale_shown || (document.documentElement.lang || 'de').slice(0, 2)
    });
  }

  function trackSubmit(payload) {
    payload = payload || {};
    return postJson('/submit', {
      event: 'consent_given',
      document_version: payload.document_version || DOCUMENT_VERSION,
      form_type: payload.form_type || 'contact',
      locale_shown: payload.locale_shown,
      consent_contact: true,
      consent_share: payload.consent_share === true,
      consent_pool: payload.consent_pool === true
    });
  }

  function withdraw(payload) {
    payload = payload || {};
    return postJson('/withdraw', {
      event: 'consent_withdrawn',
      receipt_ref: payload.receipt_ref || '',
      document_version: payload.document_version || DOCUMENT_VERSION
    });
  }

  function trackPageview() {
    if (objected()) return Promise.resolve({ ok: false, skipped: true, reason: 'objection' });
    return postJson('/pageview', { event: 'page_visit' });
  }

  function checkbox(form, name) {
    return form.querySelector('input[type="checkbox"][name="' + name + '"]');
  }

  function setHidden(form, name, value) {
    var el = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  function markConsentError(form, box) {
    var block = form.querySelector('.consent-checkbox-block');
    if (block) block.classList.add('consent-checkbox-error');
    if (box) box.focus();
  }

  function bindFormGates() {
    document.querySelectorAll('form.form[action*="formsubmit"]').forEach(function (form) {
      if (form.getAttribute('data-meda-consent-bound') === '1') return;
      form.setAttribute('data-meda-consent-bound', '1');
      form.addEventListener('submit', function (e) {
        if (form.getAttribute('data-meda-release') === '1') return;
        e.preventDefault();
        if (form.getAttribute('data-meda-pending') === '1') return;
        var contact = checkbox(form, 'consent_contact');
        if (!contact || !contact.checked) {
          markConsentError(form, contact);
          return;
        }
        var honey = form.querySelector('input[name="_honey"]');
        if (honey && honey.value) return;
        form.setAttribute('data-meda-pending', '1');
        var share = !!(checkbox(form, 'consent_share') && checkbox(form, 'consent_share').checked);
        var pool = !!(checkbox(form, 'consent_pool') && checkbox(form, 'consent_pool').checked);
        setHidden(form, 'consent_contact_value', 'yes');
        setHidden(form, 'consent_share_value', share ? 'yes' : 'no');
        setHidden(form, 'consent_pool_value', pool ? 'yes' : 'no');
        var formTypeEl = form.querySelector('input[name="form_type"]');
        var versionEl = form.querySelector('input[name="document_version"]');
        var note = form.querySelector('.consent-receipt');
        if (!note) {
          note = document.createElement('p');
          note.className = 'form-note consent-receipt';
          note.setAttribute('role', 'status');
          form.appendChild(note);
        }
        trackSubmit({
          document_version: versionEl ? versionEl.value : DOCUMENT_VERSION,
          form_type: formTypeEl ? formTypeEl.value : 'contact',
          consent_share: share,
          consent_pool: pool
        }).then(function (res) {
          if (res && res.ok && RECEIPT_RE.test(res.receipt_ref || '')) {
            setHidden(form, 'receipt_ref', res.receipt_ref);
            note.textContent = t('consent.receipt').replace('{id}', res.receipt_ref);
          } else {
            note.textContent = t('consent.logFail');
          }
          form.setAttribute('data-meda-release', '1');
          var button = form.querySelector('button[type="submit"]');
          if (button) button.textContent = t('consent.sendNow') || button.textContent;
        }).catch(function () {
          note.textContent = t('consent.logFail');
          form.setAttribute('data-meda-release', '1');
        });
      });
    });
  }

  window.MEDA_consent = {
    DOCUMENT_VERSION: DOCUMENT_VERSION,
    trackView: trackView,
    trackSubmit: trackSubmit,
    withdraw: withdraw,
    trackPageview: trackPageview,
    objected: objected,
    bindFormGates: bindFormGates
  };

  var pageviewSent = false;
  function init() {
    bindFormGates();
    if (pageviewSent || objected()) return;
    pageviewSent = true;
    trackPageview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
