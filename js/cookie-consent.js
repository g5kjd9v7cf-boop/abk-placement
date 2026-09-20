(function () {
  'use strict';

  var STORAGE_KEY = 'meda_cookie_consent';
  var OVERLAY_ID = 'meda-cookie-consent';

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || (data.choice !== 'accept' && data.choice !== 'deny') || !data.ts) {
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(choice) {
    var payload = { choice: choice, ts: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore quota / private mode */ }
    return payload;
  }

  function clearConsent() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function lockPage(locked) {
    document.documentElement.classList.toggle('cookie-consent-locked', locked);
    document.body.classList.toggle('cookie-consent-locked', locked);
  }

  function removeBanner() {
    var el = document.getElementById(OVERLAY_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    lockPage(false);
  }

  function buildBanner() {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'cookie-consent-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cookie-consent-title-de');

    overlay.innerHTML =
      '<div class="cookie-consent-dialog">' +
        '<div class="cookie-consent-lang" lang="de">' +
          '<h2 id="cookie-consent-title-de">Cookie-Einstellungen</h2>' +
          '<p>Wir verwenden technisch notwendige Cookies, damit die Website funktioniert. ' +
          'Optionale Cookies (z. B. Statistik) setzen wir nur mit Ihrer Einwilligung. ' +
          'Essenziell: Speicherung Ihrer Cookie-Wahl, Session für Formulare. ' +
          'Details in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
        '</div>' +
        '<div class="cookie-consent-lang" lang="ar" dir="rtl">' +
          '<h2 id="cookie-consent-title-ar">إعدادات ملفات تعريف الارتباط</h2>' +
          '<p>نستخدم ملفات تعريف ارتباط ضرورية تقنيًا لتشغيل الموقع. ' +
          'ملفات اختيارية (مثل الإحصاءات) فقط بموافقتك. ' +
          'أساسي: حفظ اختيارك للكوكيز وجلسة النماذج. ' +
          'التفاصيل في <a href="datenschutz.html">سياسة الخصوصية</a>.</p>' +
        '</div>' +
        '<div class="cookie-consent-actions">' +
          '<button type="button" class="btn btn-outline cookie-consent-deny" data-choice="deny">' +
            'Ablehnen <span class="cookie-consent-ar-btn" lang="ar" dir="rtl">رفض</span>' +
          '</button>' +
          '<button type="button" class="btn btn-primary cookie-consent-accept" data-choice="accept">' +
            'Akzeptieren <span class="cookie-consent-ar-btn" lang="ar" dir="rtl">قبول</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-choice]');
      if (!btn) return;
      var choice = btn.getAttribute('data-choice');
      if (choice !== 'accept' && choice !== 'deny') return;
      writeConsent(choice);
      removeBanner();
    });

    // Prevent clicks on dialog from bubbling in a way that could dismiss;
    // overlay itself is non-dismissible (must Accept or Deny).
    overlay.querySelector('.cookie-consent-dialog').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    return overlay;
  }

  function showBanner() {
    if (document.getElementById(OVERLAY_ID)) return;
    lockPage(true);
    document.body.appendChild(buildBanner());
    var focusBtn = document.querySelector('#' + OVERLAY_ID + ' .cookie-consent-accept');
    if (focusBtn) focusBtn.focus();
  }

  function gateOk() {
    try {
      if (window.MEDA_datenschutzGate && typeof window.MEDA_datenschutzGate.read === 'function') {
        return !!window.MEDA_datenschutzGate.read();
      }
      var raw = localStorage.getItem('meda_datenschutz_gate');
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!(data && data.accepted === true);
    } catch (e) {
      return false;
    }
  }

  function init() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.js-cookie-settings');
      if (!link) return;
      e.preventDefault();
      if (!gateOk()) return;
      clearConsent();
      showBanner();
    });

    function maybeShow() {
      if (!gateOk()) return;
      var existing = readConsent();
      if (existing) {
        lockPage(false);
        return;
      }
      showBanner();
    }

    document.addEventListener('meda:gate-accepted', maybeShow);
    maybeShow();
  }

  window.MEDA_resetCookieConsent = function () {
    clearConsent();
    showBanner();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
