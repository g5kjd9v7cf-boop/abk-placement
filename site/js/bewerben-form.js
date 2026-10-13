/**
 * Sends Bewerben forms to the apply Worker. The CV is not stored in the browser
 * beyond the request, and nothing here is logged.
 */
(function () {
  'use strict';

  var COPY = {
    de: {
      sending: 'Wird gesendet …',
      ok: 'Vielen Dank. Wir haben Ihre Bewerbung erhalten.',
      fail: 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.',
      file: 'Bitte eine PDF-, DOC- oder DOCX-Datei bis 5 MB senden.',
      rate: 'Zu viele Versuche. Bitte später erneut senden.',
      turnstile: 'Bitte die Sicherheitsprüfung abschließen.',
      config: 'Das Formular ist noch nicht freigeschaltet.',
      network: 'Die Verbindung ist fehlgeschlagen. Bitte später erneut versuchen.'
    },
    fr: {
      sending: 'Envoi en cours …',
      ok: 'Merci. Nous avons reçu votre candidature.',
      fail: 'L’envoi a échoué. Veuillez réessayer.',
      file: 'Envoyez un fichier PDF, DOC ou DOCX de 5 Mo maximum.',
      rate: 'Trop de tentatives. Réessayez plus tard.',
      turnstile: 'Veuillez terminer le contrôle de sécurité.',
      config: 'Le formulaire n’est pas encore activé.',
      network: 'La connexion a échoué. Réessayez plus tard.'
    },
    en: {
      sending: 'Sending …',
      ok: 'Thank you. We have received your application.',
      fail: 'That did not work. Please try again.',
      file: 'Please send a PDF, DOC, or DOCX file up to 5 MB.',
      rate: 'Too many attempts. Please try again later.',
      turnstile: 'Please complete the security check.',
      config: 'This form is not switched on yet.',
      network: 'The connection failed. Please try again later.'
    },
    ar: {
      sending: 'جارٍ الإرسال …',
      ok: 'شكرًا لك. استلمنا طلبك.',
      fail: 'تعذّر الإرسال. يُرجى المحاولة مرة أخرى.',
      file: 'يُرجى إرسال ملف PDF أو DOC أو DOCX بحجم حتى 5 ميغابايت.',
      rate: 'محاولات كثيرة. يُرجى المحاولة لاحقًا.',
      turnstile: 'يُرجى إكمال فحص الأمان.',
      config: 'النموذج غير مفعّل بعد.',
      network: 'فشل الاتصال. يُرجى المحاولة لاحقًا.'
    }
  };

  function lang() {
    var code = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
    return COPY[code] ? code : 'de';
  }

  function text(key) {
    return COPY[lang()][key] || COPY.de[key];
  }

  function endpoint() {
    var cfg = window.MEDA_ENDPOINTS;
    return cfg && cfg.apply ? String(cfg.apply).replace(/\/$/, '') : '';
  }

  function statusOf(form) {
    return form.querySelector('[data-apply-status]');
  }

  function setStatus(form, message) {
    var node = statusOf(form);
    if (node) node.textContent = message || '';
  }

  function mountTurnstile(form) {
    var slot = form.querySelector('[data-meda-turnstile]');
    var key = window.MEDA_TURNSTILE_SITE_KEY || '';
    if (!slot || !key || !window.turnstile || slot.getAttribute('data-mounted') === '1') return;
    slot.setAttribute('data-mounted', '1');
    window.turnstile.render(slot, { sitekey: key });
  }

  function mapError(code) {
    if (code === 'FILE_TYPE' || code === 'FILE_SIZE') return text('file');
    if (code === 'RATE_LIMIT') return text('rate');
    if (code === 'TURNSTILE') return text('turnstile');
    if (code === 'NOT_CONFIGURED') return text('config');
    if (code === 'NETWORK') return text('network');
    return text('fail');
  }

  function send(form) {
    var url = endpoint();
    if (!url) {
      setStatus(form, text('config'));
      return;
    }
    if (!(window.MEDA_TURNSTILE_SITE_KEY || '')) {
      setStatus(form, text('config'));
      return;
    }
    var tokenField = form.querySelector('[name="cf-turnstile-response"]');
    if (!tokenField || !tokenField.value) {
      setStatus(form, text('turnstile'));
      return;
    }
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus(form, text('sending'));
    var body = new FormData(form);
    fetch(url, {
      method: 'POST',
      body: body,
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      return res.json().catch(function () { return { ok: res.ok }; }).then(function (data) {
        if (res.ok && data && data.ok) {
          setStatus(form, text('ok'));
          form.reset();
          if (window.turnstile) window.turnstile.reset();
          return;
        }
        setStatus(form, mapError(data && data.error));
      });
    }).catch(function () {
      setStatus(form, text('network'));
    }).then(function () {
      if (btn) btn.disabled = false;
    });
  }

  function bind(form) {
    if (form.getAttribute('data-meda-apply-bound') === '1') return;
    form.setAttribute('data-meda-apply-bound', '1');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = form.querySelector('input[name="einwilligung_gelesen"]');
      if (box && !box.checked) return;
      if (window.MEDA_consent && typeof window.MEDA_consent.hasCookieChoice === 'function' && !window.MEDA_consent.hasCookieChoice()) {
        return;
      }
      send(form);
    });
  }

  var tries = 0;
  function boot() {
    var forms = document.querySelectorAll('form[data-meda-apply]');
    forms.forEach(function (form) {
      bind(form);
      mountTurnstile(form);
    });
    if (!window.turnstile && tries < 40) {
      tries += 1;
      setTimeout(boot, 100);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
