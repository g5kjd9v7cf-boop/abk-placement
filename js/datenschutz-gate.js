(function () {
  'use strict';

  var STORAGE_KEY = 'meda_datenschutz_gate';
  var DOC_VERSION = 'datenschutz-2026-09-20-v1';
  var OVERLAY_ID = 'meda-datenschutz-gate';
  var DECLINE_ID = 'meda-datenschutz-decline';

  function readGate() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.accepted !== true || !data.ts || !data.document_version) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeGate(accepted) {
    var payload = {
      accepted: !!accepted,
      ts: new Date().toISOString(),
      document_version: DOC_VERSION,
      layout: 'de+ar'
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore */ }
    return payload;
  }

  function clearGatePending() {
    document.documentElement.classList.remove('gate-pending');
    document.documentElement.classList.remove('gate-declined');
  }

  function setGatePending() {
    document.documentElement.classList.add('gate-pending');
  }

  function removeEl(id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function track(kind, payload) {
    try {
      if (window.MEDA_consent) {
        if (kind === 'accept' && typeof window.MEDA_consent.trackGateAccept === 'function') {
          window.MEDA_consent.trackGateAccept(payload);
          return;
        }
        if (kind === 'decline' && typeof window.MEDA_consent.trackGateDecline === 'function') {
          window.MEDA_consent.trackGateDecline(payload);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    try {
      console.debug('[MEDA_gate]', kind, payload);
      var raw = sessionStorage.getItem('meda_consent_queue');
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      arr.push({ event: kind === 'accept' ? 'datenschutz_accepted' : 'datenschutz_declined', payload: payload, queued_at: new Date().toISOString() });
      sessionStorage.setItem('meda_consent_queue', JSON.stringify(arr));
    } catch (e2) { /* ignore */ }
  }

  function onAccept() {
    var payload = writeGate(true);
    track('accept', {
      event: 'datenschutz_accepted',
      document_version: DOC_VERSION,
      layout: 'de+ar',
      ts: payload.ts
    });
    // Essential session id only after Accept
    try {
      if (window.MEDA_consent && typeof window.MEDA_consent.getSessionId === 'function') {
        window.MEDA_consent.getSessionId({ persist: true });
      }
    } catch (e) { /* ignore */ }
    removeEl(OVERLAY_ID);
    removeEl(DECLINE_ID);
    clearGatePending();
    try {
      document.dispatchEvent(new CustomEvent('meda:gate-accepted', { detail: payload }));
    } catch (e) { /* ignore */ }
  }

  function showDeclineWall() {
    removeEl(OVERLAY_ID);
    document.documentElement.classList.add('gate-declined');
    document.documentElement.classList.remove('gate-pending');
    if (document.getElementById(DECLINE_ID)) return;
    var wall = document.createElement('div');
    wall.id = DECLINE_ID;
    wall.className = 'datenschutz-decline-wall';
    wall.setAttribute('role', 'dialog');
    wall.setAttribute('aria-modal', 'true');
    wall.innerHTML =
      '<div class="datenschutz-decline-inner">' +
        '<div lang="de">' +
          '<h1>Zugang nicht möglich</h1>' +
          '<p>Ohne Zustimmung zur Datenschutzerklärung können Sie diese Website nicht nutzen.</p>' +
          '<p><button type="button" class="btn btn-primary js-gate-reread">Erklärung erneut lesen</button></p>' +
        '</div>' +
        '<div lang="ar" dir="rtl">' +
          '<h1>لا يمكن الوصول</h1>' +
          '<p>بدون الموافقة على إشعار حماية البيانات لا يمكنكم استخدام هذا الموقع.</p>' +
          '<p><button type="button" class="btn btn-primary js-gate-reread">قراءة الإشعار مجددًا</button></p>' +
        '</div>' +
      '</div>';
    wall.addEventListener('click', function (e) {
      if (e.target.closest('.js-gate-reread')) {
        e.preventDefault();
        removeEl(DECLINE_ID);
        document.documentElement.classList.remove('gate-declined');
        setGatePending();
        showGate();
      }
    });
    (document.body || document.documentElement).appendChild(wall);
  }

  function onDecline() {
    var payload = {
      accepted: false,
      ts: new Date().toISOString(),
      document_version: DOC_VERSION,
      layout: 'de+ar'
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore */ }
    track('decline', {
      event: 'datenschutz_declined',
      document_version: DOC_VERSION,
      layout: 'de+ar',
      ts: payload.ts
    });
    showDeclineWall();
  }

  function showGate() {
    if (document.getElementById(OVERLAY_ID)) return;
    setGatePending();
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'datenschutz-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'gate-title-de');
    overlay.innerHTML =
      '<div class="datenschutz-gate-dialog">' +
        '<header class="datenschutz-gate-header">' +
          '<div class="logo">MEDA<em> Vermittlung</em></div>' +
          '<p class="datenschutz-gate-hint" lang="de">Bitte lesen Sie die Datenschutzerklärung und stimmen Sie zu, um die Website zu nutzen.</p>' +
          '<p class="datenschutz-gate-hint" lang="ar" dir="rtl">يرجى قراءة إشعار حماية البيانات والموافقة عليه لاستخدام الموقع.</p>' +
        '</header>' +
        '<div class="datenschutz-gate-columns">' +
          '<article class="datenschutz-gate-col" lang="de">' +
            '<h1 id="gate-title-de">Datenschutzerklärung<\/h1><p class="gate-lead">Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.<\/p><p class="gate-version"><strong>Dokumentversion:<\/strong> datenschutz-2026-09-20-v1<\/p><h2>1. Verantwortlicher<\/h2><p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:\nMEDA Vermittlung\nE-Mail: meda-vermittlung@agentmail.to\nTelefon: +49 176 55409685\nEine postalische Anschrift wird nicht veröffentlicht.<\/p><h2>2. Hosting und Server-Logs<\/h2><p>Beim Aufruf dieser Website können technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, User-Agent) in Server-Logs verarbeitet werden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb).<\/p><h2>3. Kontaktanfragen<\/h2><p>Wenn Sie uns per Formular oder E-Mail kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung der Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich) bzw. lit. f DSGVO.<\/p><h2>4. Bewerber- und Kundendaten<\/h2><p>Im Rahmen der Personalvermittlung verarbeiten wir Berufsprofile, Qualifikations- und Kontaktdaten. Rechtsgrundlagen: Art. 6 Abs. 1 lit. b und lit. f DSGVO sowie ggf. Einwilligung (Art. 6 Abs. 1 lit. a). Daten werden nur an potenzielle Arbeitgeber weitergegeben, soweit für die Vermittlung erforderlich und rechtmäßig.<\/p><h2>5. Sprachpräferenz (localStorage)<\/h2><p>Die gewählte Sprache (DE/FR/EN/AR) kann lokal in Ihrem Browser gespeichert werden. Es handelt sich um keine Tracking-Technologie.<\/p><h2>6. Cookies<\/h2><p>Diese Website setzt derzeit keine Tracking-Cookies ein. Sollten künftig Analyse- oder Marketing-Cookies eingesetzt werden, erfolgt dies nur mit Einwilligung und aktualisierter Information.<\/p><h2>7. Speicherdauer<\/h2><p>Personenbezogene Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.<\/p><h2>8. Ihre Rechte<\/h2><p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen Verarbeitungen auf Basis von Art. 6 Abs. 1 lit. f DSGVO. Zudem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.<\/p><h2>9. Pflicht zur Bereitstellung<\/h2><p>Die Bereitstellung von Daten ist grundsätzlich freiwillig. Ohne bestimmte Angaben kann eine Anfrage oder Vermittlung jedoch nicht sinnvoll bearbeitet werden.<\/p><h2>10. Aktualität<\/h2><p>Stand dieser Erklärung: September 2026. Wir behalten uns Anpassungen vor, wenn sich Rechtslage oder unser Angebot ändern.<\/p>' +
          '</article>' +
          '<article class="datenschutz-gate-col" lang="ar" dir="rtl">' +
            '<h1 id="gate-title-ar">إشعار حماية البيانات<\/h1><p class="gate-lead">معلومات حول معالجة البيانات الشخصية وفق اللائحة العامة لحماية البيانات (DSGVO).<\/p><p class="gate-version"><strong>إصدار المستند:<\/strong> datenschutz-2026-09-20-v1<\/p><h2>1. المسؤول عن المعالجة<\/h2><p>المسؤول عن معالجة البيانات على هذا الموقع:<br/>MEDA Vermittlung<br/>البريد: <a href="mailto:meda-vermittlung@agentmail.to">meda-vermittlung@agentmail.to<\/a><br/>الهاتف: <a href="tel:+4917655409685">+49 176 55409685<\/a><br/>لا يُنشر عنوان بريدي.<\/p><h2>2. الاستضافة وسجلات الخادم<\/h2><p>عند زيارة هذا الموقع قد تُعالج بيانات ضرورية تقنيًا (مثل عنوان IP، الوقت، وكيل المستخدم) في سجلات الخادم. الأساس القانوني: المادة 6 الفقرة 1 الحرف و DSGVO (مصلحة مشروعة في تشغيل آمن).<\/p><h2>3. طلبات التواصل<\/h2><p>عند التواصل عبر النموذج أو البريد نعالج البيانات التي تقدمها لمعالجة الطلب. الأساس القانوني: المادة 6 الفقرة 1 الحرف ب DSGVO (ما قبل التعاقد) أو الحرف و.<\/p><h2>4. بيانات المرشحين والعملاء<\/h2><p>في إطار الوساطة نعالج الملفات المهنية والمؤهلات وبيانات الاتصال. الأسس: المادة 6 الفقرة 1 الحرف ب و و، وعند الاقتضاء الموافقة (الحرف أ). لا تُحال البيانات إلى أصحاب عمل محتملين إلا بقدر ما يلزم للوساطة وبشكل قانوني.<\/p><h2>5. تفضيل اللغة (localStorage)<\/h2><p>يمكن حفظ اللغة المختارة (DE/FR/EN/AR) محليًا في متصفحك. ليست تقنية تتبع.<\/p><h2>6. ملفات تعريف الارتباط<\/h2><p>لا يستخدم هذا الموقع حاليًا ملفات تتبع. إن استُخدمت لاحقًا ملفات تحليل أو تسويق، فذلك فقط بالموافقة ومعلومات محدّثة.<\/p><h2>7. مدة الحفظ<\/h2><p>تُحفظ البيانات الشخصية فقط طالما يلزم للأغراض المعنية أو لمدد قانونية.<\/p><h2>8. حقوقك<\/h2><p>لك الحق في الاطلاع والتصحيح والمحو وتقييد المعالجة ونقل البيانات والاعتراض على المعالجات على أساس المادة 6 الفقرة 1 الحرف و. كما يحق لك تقديم شكوى إلى هيئة إشراف.<\/p><h2>9. واجب التقديم<\/h2><p>تقديم البيانات طوعي عمومًا. بدون بيانات معينة قد يتعذر معالجة طلب أو وساطة بشكل مجدٍ.<\/p><h2>10. حداثة الإشعار<\/h2><p>تاريخ هذا الإشعار: سبتمبر 2026. نحتفظ بحق التعديل عند تغير القانون أو عرضنا.<\/p>' +
          '</article>' +
        '</div>' +
        '<footer class="datenschutz-gate-actions">' +
          '<button type="button" class="btn btn-outline js-gate-decline" data-choice="decline">Ablehnen</button>' +
          '<button type="button" class="btn btn-primary js-gate-accept-de" data-choice="accept">Ich akzeptiere</button>' +
          '<button type="button" class="btn btn-primary js-gate-accept-ar" data-choice="accept" lang="ar" dir="rtl">أقبل</button>' +
        '</footer>' +
      '</div>';

    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-choice]');
      if (!btn) return;
      var choice = btn.getAttribute('data-choice');
      if (choice === 'accept') onAccept();
      else if (choice === 'decline') onDecline();
    });

    var mount = function () {
      document.body.appendChild(overlay);
      var focusBtn = overlay.querySelector('.js-gate-accept-de');
      if (focusBtn) focusBtn.focus();
    };
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  }

  function init() {
    var existing = readGate();
    if (existing) {
      clearGatePending();
      return;
    }
    // If previously declined, show wall (still not usable)
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.accepted === false) {
          if (document.body) showDeclineWall();
          else document.addEventListener('DOMContentLoaded', showDeclineWall);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    showGate();
  }

  window.MEDA_datenschutzGate = {
    DOCUMENT_VERSION: DOC_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    read: readGate,
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      removeEl(DECLINE_ID);
      showGate();
    }
  };

  // Mark pending ASAP (script in head) so CSS can hide chrome
  if (!readGate()) {
    try {
      var raw0 = localStorage.getItem(STORAGE_KEY);
      var declined = false;
      if (raw0) {
        var d0 = JSON.parse(raw0);
        declined = !!(d0 && d0.accepted === false);
      }
      if (declined) document.documentElement.classList.add('gate-declined');
      else setGatePending();
    } catch (e) {
      setGatePending();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
