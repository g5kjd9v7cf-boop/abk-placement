(function () {
  'use strict';

  var DOCUMENT_VERSION = '2026-09-26-v3';
  var MAX_APPLY_FILE = 400 * 1024;
  var APPLY_EXT = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
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

  function fileExt(name) {
    var match = /\.([A-Za-z0-9]+)$/.exec(name || '');
    return match ? match[1].toLowerCase() : '';
  }

  function readAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var raw = String(reader.result || '');
        var comma = raw.indexOf(',');
        resolve(comma >= 0 ? raw.slice(comma + 1) : '');
      };
      reader.onerror = function () { reject(new Error('read')); };
      reader.readAsDataURL(file);
    });
  }

  function showApplyStatus(form, message) {
    var note = form.querySelector('#apply-result');
    if (!note) return;
    note.hidden = false;
    note.textContent = message;
  }

  function applyErrorKey(code) {
    if (code === 'file_too_large') return 'app.err.size';
    if (code === 'bad_content_type') return 'app.err.type';
    if (code === 'cv_required') return 'app.err.cv';
    if (code === 'too_many_certificates') return 'app.err.certs';
    if (code === 'consent_required') return 'app.err.consent';
    if (code === 'encryption_key_missing' || code === 'encryption_key_invalid') return 'app.err.key';
    return 'app.err.fail';
  }

  function resultKey(res) {
    if (res.matched && res.employer_contact) {
      return res.sample_rule ? 'app.result.sharedSample' : 'app.result.shared';
    }
    if (res.matched) return 'app.result.noShare';
    return 'app.result.none';
  }

  function bindApplyForm() {
    document.querySelectorAll('form[data-meda-apply]').forEach(function (form) {
      if (form.getAttribute('data-meda-apply-bound') === '1') return;
      form.setAttribute('data-meda-apply-bound', '1');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.getAttribute('data-meda-pending') === '1') return;
        var honey = form.querySelector('input[name="_honey"]');
        if (honey && honey.value) return;
        var contact = checkbox(form, 'consent_contact');
        if (!contact || !contact.checked) {
          markConsentError(form, contact);
          showApplyStatus(form, t('app.err.consent'));
          return;
        }
        var cvInput = form.querySelector('input[type="file"][name="cv"]');
        var certInput = form.querySelector('input[type="file"][name="certificate_files"]');
        var cvFile = cvInput && cvInput.files && cvInput.files[0];
        if (!cvFile) {
          showApplyStatus(form, t('app.err.cv'));
          if (cvInput) cvInput.focus();
          return;
        }
        var certs = certInput && certInput.files ? Array.prototype.slice.call(certInput.files) : [];
        if (certs.length > 3) {
          showApplyStatus(form, t('app.err.certs'));
          return;
        }
        var selected = [cvFile].concat(certs);
        for (var i = 0; i < selected.length; i++) {
          if (!APPLY_EXT[fileExt(selected[i].name)]) {
            showApplyStatus(form, t('app.err.type'));
            return;
          }
          if (selected[i].size > MAX_APPLY_FILE) {
            showApplyStatus(form, t('app.err.size'));
            return;
          }
        }
        var profession = form.querySelector('[name="profession"]');
        var certificates = form.querySelector('[name="certificates"]');
        var language = form.querySelector('[name="language_level"]');
        var years = form.querySelector('[name="experience_years"]');
        var country = form.querySelector('[name="qualification_country"]');
        var experience = years && years.value !== '' ? Number(years.value) : NaN;
        if (!profession || !profession.value || !certificates || !certificates.value.trim() || !language || !language.value || !country || !country.value.trim() || !Number.isInteger(experience) || experience < 0 || experience > 60) {
          showApplyStatus(form, t('app.err.fail'));
          return;
        }
        form.setAttribute('data-meda-pending', '1');
        var button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = true;
        var versionEl = form.querySelector('input[name="document_version"]');
        var share = !!(checkbox(form, 'consent_share') && checkbox(form, 'consent_share').checked);
        var pool = !!(checkbox(form, 'consent_pool') && checkbox(form, 'consent_pool').checked);
        Promise.all(selected.map(readAsBase64)).then(function (parts) {
          var files = selected.map(function (file, index) {
            return {
              role: index === 0 ? 'cv' : 'certificate',
              name: file.name,
              content_type: APPLY_EXT[fileExt(file.name)],
              data_base64: parts[index]
            };
          });
          var base = getEndpointBase();
          if (!base) return { ok: false, error: 'no_endpoint' };
          return fetch(base + '/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              document_version: versionEl ? versionEl.value : DOCUMENT_VERSION,
              locale_shown: (document.documentElement.lang || 'de').slice(0, 2),
              page: pagePath(),
              profession: profession.value,
              certificates: certificates.value.trim(),
              language_level: language.value,
              experience_years: experience,
              qualification_country: country.value.trim(),
              consent_contact: true,
              consent_share: share,
              consent_pool: pool,
              files: files
            }),
            mode: 'cors',
            credentials: 'omit'
          }).then(function (res) {
            return res.json().catch(function () { return { ok: false, error: 'invalid_json' }; });
          });
        }).then(function (res) {
          if (res && res.ok && RECEIPT_RE.test(res.receipt_ref || '')) {
            showApplyStatus(form, t(resultKey(res)).replace('{id}', res.receipt_ref));
            form.reset();
          } else {
            showApplyStatus(form, t(applyErrorKey(res && res.error)));
          }
          if (button) button.disabled = false;
        }).catch(function () {
          showApplyStatus(form, t('app.err.fail'));
          if (button) button.disabled = false;
        }).then(function () {
          form.removeAttribute('data-meda-pending');
        });
      });
    });
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
    bindFormGates: bindFormGates,
    bindApplyForm: bindApplyForm
  };

  var pageviewSent = false;
  function init() {
    bindFormGates();
    bindApplyForm();
    if (pageviewSent || objected()) return;
    pageviewSent = true;
    trackPageview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
