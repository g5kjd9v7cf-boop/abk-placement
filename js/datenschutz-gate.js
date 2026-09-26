(function () {
  'use strict';

  var STORAGE_KEY = 'meda_datenschutz_gate';
  var DOC_VERSION = 'datenschutz-2026-09-26-v2';
  var OVERLAY_ID = 'meda-datenschutz-gate';
  var DECLINE_ID = 'meda-datenschutz-decline';

  function isLegalPage() {
    var file = '';
    try {
      file = (location.pathname || '').split('/').pop().toLowerCase();
    } catch (e) {
      file = '';
    }
    return file === 'impressum.html' || file === 'datenschutz.html' ||
      file === 'einwilligung.html' || file === 'widerruf.html' ||
      file === 'impressum' || file === 'datenschutz' ||
      file === 'einwilligung' || file === 'widerruf';
  }

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
    removeEl(OVERLAY_ID);
    removeEl(DECLINE_ID);
    clearGatePending();
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
          '<p class="datenschutz-gate-hint" lang="de">Bitte wählen Sie, ob wir pseudonyme Seitenaufrufe speichern dürfen. Die Website bleibt danach in beiden Fällen nutzbar. Ohne Zustimmung lesen: <a href="impressum.html">Impressum</a>, <a href="datenschutz.html">Datenschutz</a>, <a href="einwilligung.html">Einwilligung</a>, <a href="widerruf.html">Widerruf</a>.</p>' +
          '<p class="datenschutz-gate-hint" lang="ar" dir="rtl">يرجى اختيار ما إذا كان يجوز لنا حفظ زيارات صفحات بأسماء مستعارة. يبقى الموقع قابلاً للاستخدام في الحالتين. يمكن قراءة الصفحات القانونية من دون موافقة: <a href="impressum.html">بيانات الناشر</a>، <a href="datenschutz.html">حماية البيانات</a>، <a href="einwilligung.html">الموافقة</a>، <a href="widerruf.html">السحب</a>.</p>' +
        '</header>' +
        '<div class="datenschutz-gate-columns">' +
          '<article class="datenschutz-gate-col" lang="de">' +
            '<h1 id="gate-title-de">Datenschutzerklärung<\/h1><p class="gate-lead">Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.<\/p><p class="gate-version"><strong>Dokumentversion:<\/strong> datenschutz-2026-09-26-v2<\/p><h2>1. Verantwortlicher<\/h2><p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:\nMEDA Vermittlung\nE-Mail: meda-vermittlung@agentmail.to\n\nEine postalische Anschrift wird nicht veröffentlicht.<\/p><h2>2. Hosting und Server-Logs<\/h2><p>Beim Aufruf können Hosting-Anbieter technisch notwendige Verbindungsdaten in Server-Logs verarbeiten (Art. 6 Abs. 1 lit. f DSGVO). Pseudonyme Seitenaufrufe speichern wir nur, wenn Sie „Ich akzeptiere“ wählen (Art. 6 Abs. 1 lit. a DSGVO). Ablehnen lässt die Website nutzbar und unterbindet dieses Protokoll. Schriftarten werden nicht von Dritten geladen.<\/p><h2>3. Kontaktanfragen<\/h2><p>Wenn Sie uns per Formular oder E-Mail kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung der Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich) bzw. lit. f DSGVO.<\/p><h2>4. Bewerber- und Kundendaten<\/h2><p>Im Rahmen der Personalvermittlung verarbeiten wir Berufsprofile, Qualifikations- und Kontaktdaten. Rechtsgrundlagen: Art. 6 Abs. 1 lit. b und lit. f DSGVO sowie ggf. Einwilligung (Art. 6 Abs. 1 lit. a). Daten werden nur an potenzielle Arbeitgeber weitergegeben, soweit für die Vermittlung erforderlich und rechtmäßig.<\/p><h2>5. Sprachpräferenz (localStorage)<\/h2><p>Die gewählte Sprache (DE/FR/EN/AR) kann lokal in Ihrem Browser gespeichert werden. Es handelt sich um keine Tracking-Technologie.<\/p><h2>6. Cookies<\/h2><p>Diese Website setzt keine Marketing- oder Analyse-Cookies ein. Nach Annahme des Datenschutz-Gates werden nur pseudonyme Seitenaufrufe (Sitzungs-ID, ohne IP-Adresse) ohne Cookies geloggt. Sollten künftig Analyse- oder Marketing-Cookies eingesetzt werden, erfolgt dies nur mit Einwilligung und aktualisierter Information.<\/p><h2>7. Speicherdauer<\/h2><p>Personenbezogene Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.<\/p><h2>8. Ihre Rechte<\/h2><p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen Verarbeitungen auf Basis von Art. 6 Abs. 1 lit. f DSGVO. Zudem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.<\/p><h2>9. Pflicht zur Bereitstellung<\/h2><p>Die Bereitstellung von Daten ist grundsätzlich freiwillig. Ohne bestimmte Angaben kann eine Anfrage oder Vermittlung jedoch nicht sinnvoll bearbeitet werden.<\/p><h2>10. Aktualität<\/h2><p>Stand dieser Erklärung: September 2026. Wir behalten uns Anpassungen vor, wenn sich Rechtslage oder unser Angebot ändern.</p><h2>11. Empfänger und Drittland</h2><p>Hosting: GitHub Pages (GitHub, Inc., USA). Einwilligungsprotokoll: Cloudflare Worker und D1 (Cloudflare, Inc.). Formulare einschließlich Dateianhängen: FormSubmit (formsubmit.co, USA), Weiterleitung per E-Mail. E-Mail-Empfang: AgentMail. Eine Übermittlung in die USA setzt geeignete Garantien (etwa Standardvertragsklauseln) voraus. Mit jedem Dienst ist ein Auftragsverarbeitungsvertrag zu schließen, bevor Produktivdaten verarbeitet werden. Besondere Kategorien (Gesundheit, Religion, Gewerkschaft) erheben wir nicht gezielt; bitte laden Sie solche Angaben nicht hoch. Bewerberdaten: Vermittlungsdauer plus höchstens 6 Monate; Talentpool nur bei gesonderter Einwilligung bis 24 Monate. Seitenaufrufe: höchstens 90 Tage.<\/p>' +
          '</article>' +
          '<article class="datenschutz-gate-col" lang="ar" dir="rtl">' +
            '<h1 id="gate-title-ar">إشعار حماية البيانات<\/h1><p class="gate-lead">معلومات حول معالجة البيانات الشخصية وفق اللائحة العامة لحماية البيانات (DSGVO).<\/p><p class="gate-version"><strong>إصدار المستند:<\/strong> datenschutz-2026-09-26-v2<\/p><h2>1. المسؤول عن المعالجة<\/h2><p>المسؤول عن معالجة البيانات على هذا الموقع:<br\/>MEDA Vermittlung<br\/>البريد الإلكتروني: <a href="mailto:meda-vermittlung@agentmail.to">meda-vermittlung@agentmail.to<\/a><br\/>لا يُنشر عنوان بريدي.<\/p><h2>2. الاستضافة وسجلات الخادم<\/h2><p>عند الزيارة قد يعالج مزود الاستضافة بيانات اتصال ضرورية تقنياً في سجلات الخادم (المادة 6 الفقرة 1 الحرف و). لا نخزّن زيارات الصفحات ذات الأسماء المستعارة إلا إذا اخترتم «أوافق» (المادة 6 الفقرة 1 الحرف أ). الرفض يبقي الموقع قابلاً للاستخدام ويوقف هذا السجل. لا تُحمَّل الخطوط من أطراف ثالثة.<\/p><h2>3. طلبات التواصل<\/h2><p>عند التواصل عبر النموذج أو البريد الإلكتروني نعالج البيانات التي تقدّمونها لمعالجة الطلب. الأساس القانوني: المادة 6 الفقرة 1 الحرف ب (ما قبل التعاقد) أو الحرف و من اللائحة العامة لحماية البيانات.<\/p><h2>4. بيانات المرشحين والعملاء<\/h2><p>في إطار الوساطة المهنية نعالج الملفات المهنية والمؤهلات وبيانات الاتصال. الأسس القانونية: المادة 6 الفقرة 1 الحرف ب والحرف و، وعند الاقتضاء الموافقة (الحرف أ). لا تُحال البيانات إلى أصحاب عمل محتملين إلا بقدر ما يلزم للوساطة وبشكل قانوني.<\/p><h2>5. تفضيل اللغة (localStorage)<\/h2><p>يمكن حفظ اللغة المختارة (DE/FR/EN/AR) محلياً في متصفّحكم. ليست تقنية تتبّع.<\/p><h2>6. ملفات تعريف الارتباط<\/h2><p>لا يستخدم هذا الموقع ملفات تعريف ارتباط للتسويق أو التحليل. بعد قبول بوابة حماية البيانات تُسجَّل فقط زيارات صفحات بأسماء مستعارة (معرّف جلسة دون عنوان IP) دون ملفات تعريف ارتباط. إن استُخدمت لاحقاً ملفات تحليل أو تسويق، فذلك فقط بموافقة ومعلومات محدَّثة.<\/p><h2>7. مدة الحفظ<\/h2><p>تُحفظ البيانات الشخصية فقط طالما يلزم للأغراض المعنية أو لمدد قانونية للاحتفاظ.<\/p><h2>8. حقوقكم<\/h2><p>لكم الحق في الاطلاع والتصحيح والمحو وتقييد المعالجة ونقل البيانات والاعتراض على المعالجات القائمة على المادة 6 الفقرة 1 الحرف و. كما يحق لكم تقديم شكوى إلى هيئة إشراف.<\/p><h2>9. واجب تقديم البيانات<\/h2><p>تقديم البيانات طوعي عموماً. من دون بيانات معيّنة قد يتعذّر معالجة طلب أو وساطة بشكل مجدٍ.<\/p><h2>10. حداثة الإشعار<\/h2><p>تاريخ هذا الإشعار: سبتمبر 2026. نحتفظ بحق التعديل عند تغيّر القانون أو عرضنا.</p><h2>11. المستلمون والنقل خارج الاتحاد</h2><p>الاستضافة: GitHub Pages (الولايات المتحدة). سجل الموافقة: Cloudflare Worker وD1. النماذج بما فيها المرفقات: FormSubmit (الولايات المتحدة) ثم إعادة التوجيه بالبريد. استلام البريد: AgentMail. النقل إلى الولايات المتحدة يتطلب ضمانات مناسبة مثل البنود التعاقدية القياسية، وعقد معالجة مع كل مزود قبل بيانات الإنتاج. لا نجمع عمداً فئات خاصة (الصحة أو الدين أو الانتماء النقابي). بيانات المرشحين: مدة الوساطة ثم 6 أشهر كحد أقصى؛ قائمة المواهب حتى 24 شهراً فقط بموافقة منفصلة. زيارات الصفحات: 90 يوماً كحد أقصى.<\/p>' +
          '</article>' +
        '</div>' +
        '<footer class="datenschutz-gate-actions">' +
          '<button type="button" class="btn btn-outline js-gate-decline" data-choice="decline">Ablehnen</button>' +
          '<button type="button" class="btn btn-primary js-gate-accept-de" data-choice="accept">Ich akzeptiere</button>' +
          '<button type="button" class="btn btn-primary js-gate-accept-ar" data-choice="accept" lang="ar" dir="rtl">أوافق</button>' +
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
    if (isLegalPage()) {
      clearGatePending();
      return;
    }
    try {
      var params = new URLSearchParams(window.location.search || '');
      if (params.get('gate') === 'reset' || params.get('gate') === '1') {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        removeEl(OVERLAY_ID);
        removeEl(DECLINE_ID);
        // strip param from URL without reload noise
        try {
          params.delete('gate');
          var q = params.toString();
          var clean = window.location.pathname + (q ? '?' + q : '') + (window.location.hash || '');
          window.history.replaceState({}, '', clean);
        } catch (e2) { /* ignore */ }
      }
    } catch (e3) { /* ignore */ }
    var existing = readGate();
    if (existing) {
      clearGatePending();
      return;
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.accepted === false) {
          clearGatePending();
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

  // Mark pending ASAP (script in head) so CSS can hide chrome until a choice.
  // A previous decline stays usable. Legal pages are never locked.
  if (!isLegalPage() && !readGate()) {
    try {
      var raw0 = localStorage.getItem(STORAGE_KEY);
      var declined = false;
      if (raw0) {
        var d0 = JSON.parse(raw0);
        declined = !!(d0 && d0.accepted === false);
      }
      if (!declined) setGatePending();
    } catch (e) {
      setGatePending();
    }
  }

  function start() {
    try {
      init();
    } catch (e) {
      clearGatePending();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
