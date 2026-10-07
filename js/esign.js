/**
 * MEDA e-sign soft-launch (F1 native). binding:false / ENTWURF forced.
 * Clause bodies stay German. Chrome strings only are translated.
 * Submit stays disabled while pack.legal_approved !== true.
 */
(function () {
  'use strict';

  var STEPS = ['intro', 'clauses', 'checklist', 'sign', 'done'];
  var LANGS = ['de', 'fr', 'en', 'ar'];
  var LANG_KEY = 'abk_lang';

  var I18N = {
    de: {
      step_intro: 'Intro',
      step_clauses: 'Klauseln',
      step_checklist: 'Checkliste',
      step_sign: 'Unterschrift',
      step_done: 'Fertig',
      progress: 'Schritt {n} von {m} · {p} %',
      next: 'Weiter',
      back: 'Zurück',
      clear: 'Löschen',
      retry: 'Erneut zeichnen',
      toReview: 'Weiter zur Prüfung',
      h_intro: 'Worum es geht',
      h_clauses: 'Klauseln',
      h_checklist: 'Checkliste',
      h_sign: 'Unterschrift',
      h_done: 'Prüfung und Abschluss',
      scrollHint: 'Bitte die Klauseln bis zum Ende lesen. Danach wird „Weiter“ frei.',
      scrollDone: 'Ende der Klauseln erreicht.',
      checkHint: 'Alle Punkte sind nötig, bevor die Unterschrift freigeschaltet wird.',
      nameLabel: 'Vollständiger Name',
      nameHint: 'Vor- und Nachname tippen. Beides ist nötig, zusammen mit der gezeichneten Unterschrift.',
      drawHint: 'Mit dem Finger oder der Maus in das Feld zeichnen. Löschen setzt die Zeichnung zurück.',
      reviewTitle: 'Prüfung vor dem Absenden',
      reviewChecks: 'Bestätigte Punkte',
      reviewSig: 'Signaturvorschau',
      submit: 'Absenden',
      submitLocked: 'Legal-Freigabe ausstehend',
      submitExplain: 'Absenden ist deaktiviert, solange legal_approved nicht gesetzt ist. Es wird nichts gespeichert und nichts versendet. Ein Vertrag entsteht hier nicht.',
      previewBtn: 'Lokale Vorschau (kein Versand)',
      previewNote: 'Nur diese Sitzung. Nichts gespeichert, nichts versendet. Kein Vertrag.',
      previewRef: 'Referenz',
      tokenLabel: 'Öffentliche Vorgangsnummer',
      noPublicId: 'Keine öffentliche Vorgangsnummer in diesem Link.',
      withdrawalTitle: 'Widerruf',
      withdrawalUi: 'Angezeigte Frist: 12 Monate und 14 Tage.',
      withdrawalOrdinary: 'Gesetzliches Mindestmaß: 14 Tage (§355 Abs. 2 BGB).',
      b2bTitle: 'Kein Fernabsatz-Widerruf',
      b2bBody: 'Dieses Blatt richtet sich an Unternehmer (§14 BGB). Eine Verbraucher-Widerrufsbelehrung ist hier nicht der Standard. Datenschutz-Widerruf nach Art. 7 DSGVO bleibt unberührt.',
      noCv: 'Kein Lebenslauf-Upload auf dieser Seite.',
      feeLine: 'Höhe folgt im finalen Vertrag.',
      draftBadge: 'ENTWURF',
      sesNote: 'Einfache Erfassung im Entwurf. Keine qualifizierte Signatur. Nicht bindend, bis Gewerbe und Anwalt freigeben.',
      legalDeOnly: 'Der Klauseltext bleibt Deutsch. Andere Sprachen ändern nur die Bedienung, nicht den Rechtstext.',
      needScroll: 'Bitte zuerst bis zum Ende der Klauseln scrollen.',
      needChecks: 'Bitte alle Punkte der Checkliste bestätigen.',
      needSign: 'Bitte Vor- und Nachname tippen und eine Unterschrift zeichnen.',
      gateTitle: 'Link ungültig oder unvollständig',
      gateBody: 'Dieser Arbeitgeber-Link braucht eine öffentliche Nummer EMP-… aus der MEDA-E-Mail. Ohne gültiges EMP-Token gibt es keine Checkliste und kein Absenden.',
      gateSample: 'Zum Prüfen: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Angebot (Platzhalter)',
      legacyToken: 'Mitgebrachte Vorgangsnummer aus einem früheren Schritt. Die E-Sign-Referenz ist davon getrennt und entsteht erst in der Vorschau als REF-…',
      doneLead: 'Zusammenfassung Ihrer Angaben. Absenden bleibt gesperrt.',
      packLabel: 'Klauselpack'
    },
    en: {
      step_intro: 'Intro',
      step_clauses: 'Clauses',
      step_checklist: 'Checklist',
      step_sign: 'Signature',
      step_done: 'Done',
      progress: 'Step {n} of {m} · {p}%',
      next: 'Next',
      back: 'Back',
      clear: 'Clear',
      retry: 'Draw again',
      toReview: 'Continue to review',
      h_intro: 'What this step is',
      h_clauses: 'Clauses',
      h_checklist: 'Checklist',
      h_sign: 'Signature',
      h_done: 'Review and finish',
      scrollHint: 'Read the clauses to the end. Next stays locked until then.',
      scrollDone: 'End of the clauses reached.',
      checkHint: 'Every item is required before the signature step.',
      nameLabel: 'Full name',
      nameHint: 'Type first and last name. A drawn signature is required as well.',
      drawHint: 'Draw with a finger or mouse. Clear resets the drawing.',
      reviewTitle: 'Review before send',
      reviewChecks: 'Confirmed items',
      reviewSig: 'Signature preview',
      submit: 'Submit',
      submitLocked: 'Legal approval pending',
      submitExplain: 'Submit stays off until legal_approved is set. Nothing is stored or sent. This does not create a contract.',
      previewBtn: 'Local preview (not sent)',
      previewNote: 'This browser session only. Nothing stored, nothing sent. No contract.',
      previewRef: 'Reference',
      tokenLabel: 'Public reference',
      noPublicId: 'No public reference in this link.',
      withdrawalTitle: 'Withdrawal',
      withdrawalUi: 'Period shown in the UI: 12 months and 14 days.',
      withdrawalOrdinary: 'Ordinary statutory minimum: 14 days (§355 Abs. 2 BGB).',
      b2bTitle: 'No distance-selling withdrawal',
      b2bBody: 'This sheet is for businesses (§14 BGB). A consumer withdrawal notice is not the default. Data-protection withdrawal under Art. 7 GDPR is separate.',
      noCv: 'No CV upload on this page.',
      feeLine: 'The amount follows in the final contract.',
      draftBadge: 'DRAFT',
      sesNote: 'Simple capture, draft only. Not a qualified signature. Not binding until business registration and lawyer approval.',
      legalDeOnly: 'Clause text stays German. Other languages change the controls only, not the legal wording.',
      needScroll: 'Scroll the clauses to the end first.',
      needChecks: 'Confirm every checklist item.',
      needSign: 'Type a first and last name and draw a signature.',
      gateTitle: 'Link missing or not valid',
      gateBody: 'The employer link needs a public EMP-… id from the MEDA email. Without a valid EMP token there is no checklist and no submit.',
      gateSample: 'For review: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Offer (placeholders)',
      legacyToken: 'Reference brought from an earlier step. The e-sign reference is separate and appears only in the preview as REF-…',
      doneLead: 'Summary of what you entered. Submit stays locked.',
      packLabel: 'Clause pack'
    },
    fr: {
      step_intro: 'Intro',
      step_clauses: 'Clauses',
      step_checklist: 'Liste',
      step_sign: 'Signature',
      step_done: 'Fini',
      progress: 'Étape {n} sur {m} · {p} %',
      next: 'Suivant',
      back: 'Retour',
      clear: 'Effacer',
      retry: 'Redessiner',
      toReview: 'Vers la relecture',
      h_intro: 'De quoi il s’agit',
      h_clauses: 'Clauses',
      h_checklist: 'Liste',
      h_sign: 'Signature',
      h_done: 'Relecture et fin',
      scrollHint: 'Lisez les clauses jusqu’au bout. « Suivant » reste bloqué avant cela.',
      scrollDone: 'Fin des clauses atteinte.',
      checkHint: 'Chaque case est requise avant la signature.',
      nameLabel: 'Nom complet',
      nameHint: 'Saisissez prénom et nom. Une signature dessinée est aussi requise.',
      drawHint: 'Dessinez au doigt ou à la souris. Effacer remet le dessin à zéro.',
      reviewTitle: 'Relecture avant envoi',
      reviewChecks: 'Points confirmés',
      reviewSig: 'Aperçu de la signature',
      submit: 'Envoyer',
      submitLocked: 'Validation juridique en attente',
      submitExplain: 'L’envoi reste désactivé tant que legal_approved n’est pas posé. Rien n’est enregistré ni envoyé. Aucun contrat ne naît ici.',
      previewBtn: 'Aperçu local (non envoyé)',
      previewNote: 'Cette session seulement. Rien enregistré, rien envoyé. Pas de contrat.',
      previewRef: 'Référence',
      tokenLabel: 'Référence publique',
      noPublicId: 'Pas de référence publique dans ce lien.',
      withdrawalTitle: 'Rétractation',
      withdrawalUi: 'Délai affiché : 12 mois et 14 jours.',
      withdrawalOrdinary: 'Minimum légal ordinaire : 14 jours (§355 Abs. 2 BGB).',
      b2bTitle: 'Pas de rétractation de vente à distance',
      b2bBody: 'Cette fiche vise des entreprises (§14 BGB). L’information consommateur n’est pas le standard. Le retrait des données (art. 7 RGPD) reste distinct.',
      noCv: 'Pas de dépôt de CV sur cette page.',
      feeLine: 'Le montant suivra dans le contrat final.',
      draftBadge: 'BROUILLON',
      sesNote: 'Saisie simple, brouillon. Pas une signature qualifiée. Pas d’engagement avant immatriculation et avocat.',
      legalDeOnly: 'Le texte des clauses reste en allemand. Les autres langues ne changent que l’interface.',
      needScroll: 'Faites défiler les clauses jusqu’à la fin.',
      needChecks: 'Cochez tous les points de la liste.',
      needSign: 'Saisissez prénom et nom et dessinez une signature.',
      gateTitle: 'Lien incomplet ou non valable',
      gateBody: 'Le lien employeur exige un identifiant public EMP-… issu de l’e-mail MEDA. Sans jeton EMP valable, pas de liste ni d’envoi.',
      gateSample: 'Pour relecture : employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Offre (espaces réservés)',
      legacyToken: 'Référence apportée d’une étape précédente. La référence e-sign est distincte et n’apparaît dans l’aperçu que comme REF-…',
      doneLead: 'Récapitulatif. L’envoi reste bloqué.',
      packLabel: 'Pack de clauses'
    },
    ar: {
      step_intro: 'مقدمة',
      step_clauses: 'البنود',
      step_checklist: 'قائمة التحقق',
      step_sign: 'التوقيع',
      step_done: 'تم',
      progress: 'الخطوة {n} من {m} · {p}٪',
      next: 'التالي',
      back: 'رجوع',
      clear: 'مسح',
      retry: 'إعادة الرسم',
      toReview: 'إلى المراجعة',
      h_intro: 'ما هذه الخطوة',
      h_clauses: 'البنود',
      h_checklist: 'قائمة التحقق',
      h_sign: 'التوقيع',
      h_done: 'مراجعة وإنهاء',
      scrollHint: 'اقرأ البنود حتى النهاية. يبقى «التالي» مقفلاً قبل ذلك.',
      scrollDone: 'تم بلوغ نهاية البنود.',
      checkHint: 'كل الخانات مطلوبة قبل خطوة التوقيع.',
      nameLabel: 'الاسم الكامل',
      nameHint: 'اكتب الاسم واللقب. التوقيع المرسوم مطلوب أيضاً.',
      drawHint: 'ارسم بالإصبع أو الفأرة. المسح يعيد الرسم من جديد.',
      reviewTitle: 'مراجعة قبل الإرسال',
      reviewChecks: 'النقاط المؤكدة',
      reviewSig: 'معاينة التوقيع',
      submit: 'إرسال',
      submitLocked: 'بانتظار اعتماد قانوني',
      submitExplain: 'يبقى الإرسال متوقفاً ما دام legal_approved غير مفعّل. لا يُحفظ شيء ولا يُرسل شيء. لا ينشأ عقد هنا.',
      previewBtn: 'معاينة محلية (بلا إرسال)',
      previewNote: 'هذه الجلسة فقط. لا حفظ ولا إرسال. لا عقد.',
      previewRef: 'المرجع',
      tokenLabel: 'رقم عام',
      noPublicId: 'لا يوجد رقم عام في هذا الرابط.',
      withdrawalTitle: 'الرجوع',
      withdrawalUi: 'المهلة المعروضة: 12 شهراً و14 يوماً.',
      withdrawalOrdinary: 'الحد القانوني العادي: 14 يوماً (§355 Abs. 2 BGB).',
      b2bTitle: 'لا رجوع عن بعد للمستهلك',
      b2bBody: 'هذه الورقة موجهة إلى منشآت (§14 BGB). إرشاد المستهلك ليس هو الأصل هنا. سحب بيانات الحماية (المادة 7) يبقى منفصلاً.',
      noCv: 'لا رفع لسيرة ذاتية في هذه الصفحة.',
      feeLine: 'المبلغ يأتي في العقد النهائي.',
      draftBadge: 'مسودة',
      sesNote: 'التقاط بسيط ومسودة. ليس توقيعاً مؤهلاً. غير ملزم قبل السجل التجاري وموافقة المحامي.',
      legalDeOnly: 'نص البنود يبقى بالألمانية. اللغات الأخرى تغيّر الواجهة فقط.',
      needScroll: 'مرّر البنود حتى النهاية أولاً.',
      needChecks: 'أكّد كل نقاط القائمة.',
      needSign: 'اكتب الاسم واللقب وارسم توقيعاً.',
      gateTitle: 'الرابط ناقص أو غير صالح',
      gateBody: 'رابط صاحب العمل يحتاج رقماً عاماً EMP-… من بريد MEDA. بلا رمز EMP صالح لا قائمة ولا إرسال.',
      gateSample: 'للمراجعة: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'العرض (عناصر نائبة)',
      legacyToken: 'رقم أتى من خطوة سابقة. مرجع التوقيع منفصل ويظهر في المعاينة فقط بصيغة REF-…',
      doneLead: 'ملخص ما أدخلته. الإرسال يبقى مقفلاً.',
      packLabel: 'حزمة البنود'
    }
  };

  function t(lang, key) {
    var pack = I18N[lang] || I18N.de;
    return pack[key] || I18N.de[key] || key;
  }

  function fmt(lang, key, map) {
    return t(lang, key).replace(/\{(\w+)\}/g, function (_, k) {
      return map[k] != null ? String(map[k]) : '';
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function appendInline(parent, text) {
    var re = /\*\*([^*]+)\*\*/g;
    var last = 0;
    var m;
    var src = String(text || '');
    while ((m = re.exec(src))) {
      if (m.index > last) parent.appendChild(document.createTextNode(src.slice(last, m.index)));
      parent.appendChild(el('strong', { text: m[1] }));
      last = m.index + m[0].length;
    }
    if (last < src.length) parent.appendChild(document.createTextNode(src.slice(last)));
  }

  function readLang() {
    try {
      var stored = localStorage.getItem(LANG_KEY);
      if (stored && LANGS.indexOf(stored) !== -1) return stored;
    } catch (e) { /* ignore */ }
    return 'de';
  }

  function writeLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  function isEmpToken(value) {
    return /^EMP-[A-Za-z0-9][A-Za-z0-9-]{0,64}$/.test(value);
  }

  function isCandToken(value) {
    return /^CAND-[A-Za-z0-9][A-Za-z0-9-]{0,64}$/.test(value);
  }

  function isRefToken(value) {
    return /^REF-[A-Za-z0-9][A-Za-z0-9-]{0,64}$/.test(value);
  }

  function classifyToken(party, raw) {
    var token = String(raw || '').trim();
    if (party === 'employer') {
      if (isEmpToken(token)) return { ok: true, token: token, legacy: false };
      return { ok: false, token: '', legacy: false };
    }
    if (!token) return { ok: true, token: '', legacy: false };
    if (isCandToken(token)) return { ok: true, token: token, legacy: false };
    if (isRefToken(token)) return { ok: true, token: token, legacy: true };
    return { ok: true, token: '', legacy: false, ignored: true };
  }

  function fullNameOk(value) {
    var parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every(function (p) { return p.length >= 2; });
  }

  function makeRef() {
    var d = new Date();
    var y = d.getUTCFullYear();
    var m = String(d.getUTCMonth() + 1).padStart(2, '0');
    var day = String(d.getUTCDate()).padStart(2, '0');
    var buf = new Uint8Array(2);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf);
    else buf[0] = Math.floor(Math.random() * 256);
    var rand = Array.prototype.map.call(buf, function (b) {
      return b.toString(16).toUpperCase().padStart(2, '0');
    }).join('');
    return 'REF-' + y + m + day + '-' + rand;
  }

  function canvasHasInk(canvas) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var i;
    for (i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return true;
    }
    return false;
  }

  function boot() {
    var root = document.getElementById('esign-app');
    var body = document.body;
    if (!root || !body) return;
    var party = body.getAttribute('data-esign-party') || 'candidate';
    var packUrl = body.getAttribute('data-esign-pack');
    var params = new URLSearchParams(location.search);
    var tokenInfo = classifyToken(party, params.get('token') || '');
    var lang = readLang();

    var state = {
      pack: null,
      step: 0,
      clausesRead: false,
      checks: {},
      name: '',
      ink: false,
      sigUrl: '',
      previewRef: '',
      error: ''
    };

    applyLang(lang);

    if (party === 'employer' && !tokenInfo.ok) {
      showEmployerGate();
      return;
    }

    function showEmployerGate() {
      renderGate(root, lang);
      wireLang(function () { showEmployerGate(); });
    }

    root.textContent = '…';
    fetch(packUrl, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('pack');
        return res.json();
      })
      .then(function (pack) {
        if (pack.legal_approved !== true) pack.legal_approved = false;
        pack.binding = false;
        pack.status = 'ENTWURF';
        state.pack = pack;
        render();
      })
      .catch(function () {
        root.textContent = '';
        root.appendChild(el('p', { class: 'esign-error', role: 'alert', text: 'Klauselpack konnte nicht geladen werden.' }));
      });

    function wireLang(onChange) {
      var box = document.getElementById('esign-lang');
      if (!box) return;
      box.innerHTML = '';
      box.className = 'lang-switch';
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', 'Sprache');
      LANGS.forEach(function (code) {
        var btn = el('button', {
          type: 'button',
          text: code.toUpperCase(),
          'aria-pressed': code === lang ? 'true' : 'false',
          onclick: function () {
            lang = code;
            writeLang(lang);
            applyLang(lang);
            onChange(lang);
          }
        });
        btn.setAttribute('data-lang', code);
        box.appendChild(btn);
      });
    }

    function render() {
      root.textContent = '';
      var pack = state.pack;
      var sheet = el('div', { class: 'esign-sheet' });
      sheet.appendChild(el('div', { class: 'esign-watermark', 'aria-hidden': 'true', text: 'ENTWURF' }));
      sheet.appendChild(el('p', { class: 'esign-kicker', text: t(lang, 'draftBadge') + ' · ' + t(lang, 'packLabel') + ' ' + pack.id }));
      sheet.appendChild(el('h1', { text: pack.title }));
      var steps = el('ol', { class: 'esign-steps' });
      STEPS.forEach(function (id, i) {
        var li = el('li', { class: (i === state.step ? 'is-current' : i < state.step ? 'is-done' : '') });
        if (i === state.step) li.setAttribute('aria-current', 'step');
        li.appendChild(el('span', { class: 'n', text: String(i + 1) }));
        li.appendChild(document.createTextNode(t(lang, 'step_' + id)));
        steps.appendChild(li);
      });
      sheet.appendChild(steps);
      var pct = Math.round(((state.step + 1) / STEPS.length) * 100);
      sheet.appendChild(el('p', {
        class: 'esign-progress-label',
        text: fmt(lang, 'progress', { n: state.step + 1, m: STEPS.length, p: pct })
      }));
      var bar = el('div', {
        class: 'esign-progress',
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(pct)
      });
      var fill = el('span');
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      sheet.appendChild(bar);
      if (lang !== 'de') sheet.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'legalDeOnly') }));
      var panel = el('div', { class: 'esign-panel', id: 'esign-panel' });
      fillPanel(panel);
      sheet.appendChild(panel);
      if (state.error) sheet.appendChild(el('p', { class: 'esign-error', role: 'alert', text: state.error }));
      root.appendChild(sheet);
      wireLang(function () { render(); });
      var scroller = panel.querySelector('[data-clauses]');
      if (scroller) bindClauseScroll(scroller);
      var canvas = panel.querySelector('canvas');
      if (canvas) bindCanvas(canvas);
    }

    function fillPanel(panel) {
      var pack = state.pack;
      var stepId = STEPS[state.step];
      panel.appendChild(el('h2', { text: t(lang, 'h_' + stepId) }));
      if (stepId === 'intro') renderIntro(panel, pack);
      else if (stepId === 'clauses') renderClauses(panel, pack);
      else if (stepId === 'checklist') renderChecklist(panel, pack);
      else if (stepId === 'sign') renderSign(panel);
      else renderDone(panel, pack);
      panel.appendChild(actions(stepId));
    }

    function renderIntro(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-lead', text: pack.preamble || '' }));
      panel.appendChild(el('p', { class: 'esign-note', text: t(lang, 'sesNote') }));
      var meta = el('ul', { class: 'esign-meta' });
      meta.appendChild(el('li', { text: 'binding: false' }));
      meta.appendChild(el('li', { text: 'ENTWURF' }));
      meta.appendChild(el('li', { text: 'legal_approved: false' }));
      panel.appendChild(meta);
      if (pack.no_cv_upload) panel.appendChild(el('p', { class: 'esign-note', text: t(lang, 'noCv') }));
      panel.appendChild(el('p', { class: 'esign-note', text: t(lang, 'feeLine') }));
      if (pack.withdrawal && pack.withdrawal.mode === 'consumer') {
        var box = el('div', { class: 'esign-callout' });
        box.appendChild(el('h3', { text: t(lang, 'withdrawalTitle') }));
        box.appendChild(el('p', { text: t(lang, 'withdrawalUi') }));
        box.appendChild(el('p', { text: t(lang, 'withdrawalOrdinary') }));
        panel.appendChild(box);
      } else {
        var b2b = el('div', { class: 'esign-callout is-b2b' });
        b2b.appendChild(el('h3', { text: t(lang, 'b2bTitle') }));
        b2b.appendChild(el('p', { text: t(lang, 'b2bBody') }));
        panel.appendChild(b2b);
      }
      if (pack.offer && pack.offer.fields) {
        panel.appendChild(el('h3', { text: t(lang, 'offerTitle') }));
        var dl = el('dl', { class: 'esign-offer' });
        pack.offer.fields.forEach(function (field) {
          var wrap = el('div');
          wrap.appendChild(el('dt', { text: field.label }));
          wrap.appendChild(el('dd', { text: field.value }));
          dl.appendChild(wrap);
        });
        panel.appendChild(dl);
      }
      if (pack.ui_notices && pack.ui_notices.length) {
        var notes = el('ul');
        pack.ui_notices.forEach(function (line) {
          notes.appendChild(el('li', { text: line }));
        });
        panel.appendChild(notes);
      }
      var tokenP = el('p');
      tokenP.appendChild(el('strong', { text: t(lang, 'tokenLabel') + ': ' }));
      if (tokenInfo.token) {
        tokenP.appendChild(el('code', { text: tokenInfo.token }));
        if (tokenInfo.legacy) tokenP.appendChild(el('span', { class: 'esign-mini', text: ' ' + t(lang, 'legacyToken') }));
      } else tokenP.appendChild(document.createTextNode(t(lang, 'noPublicId')));
      panel.appendChild(tokenP);
    }

    function renderClauses(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-mini', id: 'esign-scroll-hint', text: state.clausesRead ? t(lang, 'scrollDone') : t(lang, 'scrollHint') }));
      var box = el('article', { class: 'esign-clauses', lang: 'de', dir: 'ltr', 'data-clauses': '1', tabindex: '0' });
      if (pack.kicker) box.appendChild(el('p', { text: pack.kicker }));
      (pack.sections || []).forEach(function (section) {
        box.appendChild(el('h3', { text: section.heading }));
        (section.paragraphs || []).forEach(function (para) {
          var p = el('p');
          appendInline(p, para);
          box.appendChild(p);
        });
      });
      panel.appendChild(box);
    }

    function renderChecklist(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'checkHint') }));
      var fs = el('fieldset', { class: 'esign-check' });
      fs.appendChild(el('legend', { class: 'esign-kicker', text: 'Checkliste' }));
      (pack.checklist || []).forEach(function (item) {
        var input = el('input', { type: 'checkbox', id: item.id });
        input.checked = !!state.checks[item.id];
        input.addEventListener('change', function () {
          state.checks[item.id] = input.checked;
          state.error = '';
        });
        var label = el('label', { for: item.id });
        label.appendChild(input);
        var span = el('span', { lang: 'de', dir: 'ltr' });
        span.textContent = item.text;
        label.appendChild(span);
        fs.appendChild(label);
      });
      panel.appendChild(fs);
    }

    function renderSign(panel) {
      panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'nameHint') }));
      var field = el('label', { class: 'esign-field' });
      field.appendChild(document.createTextNode(t(lang, 'nameLabel')));
      var input = el('input', { type: 'text', id: 'esign-name', autocomplete: 'name', maxlength: '120' });
      input.value = state.name;
      input.addEventListener('input', function () {
        state.name = input.value;
        state.error = '';
      });
      field.appendChild(input);
      panel.appendChild(field);
      panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'drawHint') }));
      var wrap = el('div', { class: 'esign-canvas-wrap' });
      var canvas = el('canvas', { id: 'esign-pad', 'aria-label': t(lang, 'h_sign') });
      wrap.appendChild(canvas);
      panel.appendChild(wrap);
      var tools = el('div', { class: 'esign-actions' });
      tools.appendChild(el('button', { type: 'button', class: 'btn btn-outline', text: t(lang, 'clear'), onclick: function () { clearPad(canvas); } }));
      tools.appendChild(el('button', { type: 'button', class: 'btn btn-outline', text: t(lang, 'retry'), onclick: function () { clearPad(canvas); } }));
      panel.appendChild(tools);
    }

    function renderDone(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-lead', text: t(lang, 'doneLead') }));
      var review = el('div', { class: 'esign-review' });
      review.appendChild(el('h3', { text: t(lang, 'reviewTitle') }));
      review.appendChild(el('p', { text: state.name }));
      review.appendChild(el('h3', { text: t(lang, 'reviewChecks') }));
      var ul = el('ul', { lang: 'de', dir: 'ltr' });
      (pack.checklist || []).forEach(function (item) {
        if (state.checks[item.id]) ul.appendChild(el('li', { text: item.text }));
      });
      review.appendChild(ul);
      review.appendChild(el('h3', { text: t(lang, 'reviewSig') }));
      if (state.sigUrl) {
        var img = el('img', { alt: t(lang, 'reviewSig'), src: state.sigUrl });
        review.appendChild(img);
      }
      panel.appendChild(review);
      var lock = el('div', { class: 'esign-lock', role: 'status' });
      lock.appendChild(el('strong', { text: t(lang, 'submitLocked') }));
      lock.appendChild(el('p', { text: t(lang, 'submitExplain') }));
      var approved = pack.legal_approved === true;
      var submit = el('button', {
        type: 'button',
        class: 'btn btn-primary',
        id: 'esign-submit',
        text: approved ? t(lang, 'submit') : t(lang, 'submit') + ' — ' + t(lang, 'submitLocked')
      });
      submit.disabled = !approved;
      submit.setAttribute('aria-disabled', approved ? 'false' : 'true');
      submit.setAttribute('data-legal-approved', approved ? 'true' : 'false');
      submit.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (state.pack.legal_approved !== true) return;
      });
      lock.appendChild(submit);
      panel.appendChild(lock);
      var preview = el('button', {
        type: 'button',
        class: 'btn btn-outline',
        id: 'esign-preview',
        text: t(lang, 'previewBtn'),
        onclick: function () {
          if (!state.previewRef) state.previewRef = makeRef();
          showPreview();
        }
      });
      panel.appendChild(preview);
      var slot = el('div', { id: 'esign-preview-slot' });
      panel.appendChild(slot);
      if (state.previewRef) showPreview();

      function showPreview() {
        var slotNode = document.getElementById('esign-preview-slot');
        if (!slotNode) return;
        slotNode.textContent = '';
        slotNode.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'previewNote') }));
        var ref = el('p', { class: 'esign-ref' });
        ref.appendChild(document.createTextNode(t(lang, 'previewRef') + ' '));
        ref.appendChild(el('code', { id: 'esign-ref', text: state.previewRef }));
        slotNode.appendChild(ref);
        if (tokenInfo.token) {
          var pub = el('p', { class: 'esign-ref' });
          pub.appendChild(el('code', { text: tokenInfo.token }));
          slotNode.appendChild(pub);
        }
        slotNode.appendChild(el('p', { class: 'esign-mini', text: 'ENTWURF · binding: false' }));
      }
    }

    function actions(stepId) {
      var row = el('div', { class: 'esign-actions' });
      if (state.step > 0) {
        row.appendChild(el('button', {
          type: 'button',
          class: 'btn btn-outline',
          text: t(lang, 'back'),
          onclick: function () {
            captureSign();
            state.error = '';
            state.step -= 1;
            render();
          }
        }));
      }
      if (stepId !== 'done') {
        var label = stepId === 'sign' ? t(lang, 'toReview') : t(lang, 'next');
        row.appendChild(el('button', {
          type: 'button',
          class: 'btn btn-primary',
          id: 'esign-next',
          text: label,
          onclick: onNext
        }));
      }
      return row;
    }

    function onNext() {
      state.error = '';
      var stepId = STEPS[state.step];
      if (stepId === 'clauses' && !state.clausesRead) {
        state.error = t(lang, 'needScroll');
        render();
        return;
      }
      if (stepId === 'checklist' && !allChecked()) {
        state.error = t(lang, 'needChecks');
        render();
        return;
      }
      if (stepId === 'sign') {
        captureSign();
        if (!fullNameOk(state.name) || !state.ink) {
          state.error = t(lang, 'needSign');
          render();
          return;
        }
      }
      if (state.step < STEPS.length - 1) {
        state.step += 1;
        render();
      }
    }

    function allChecked() {
      var list = (state.pack && state.pack.checklist) || [];
      return list.length > 0 && list.every(function (item) { return state.checks[item.id]; });
    }

    function bindClauseScroll(scroller) {
      function check() {
        var slack = 12;
        var atEnd = scroller.scrollHeight - scroller.clientHeight <= slack ||
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - slack;
        if (atEnd && !state.clausesRead) {
          state.clausesRead = true;
          var hint = document.getElementById('esign-scroll-hint');
          if (hint) hint.textContent = t(lang, 'scrollDone');
        }
      }
      scroller.addEventListener('scroll', check, { passive: true });
      requestAnimationFrame(check);
    }

    function bindCanvas(canvas) {
      var ctx = canvas.getContext('2d');
      var ratio = window.devicePixelRatio || 1;
      var width = canvas.clientWidth || 320;
      var height = 180;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1A1238';
      if (state.sigUrl) {
        var img = new Image();
        img.onload = function () {
          ctx.drawImage(img, 0, 0, width, height);
          state.ink = true;
        };
        img.src = state.sigUrl;
      }
      var drawing = false;
      function pos(ev) {
        var r = canvas.getBoundingClientRect();
        var src = ev.touches ? ev.touches[0] : ev;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
      }
      function start(ev) {
        drawing = true;
        var p = pos(ev);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ev.preventDefault();
      }
      function move(ev) {
        if (!drawing) return;
        var p = pos(ev);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        state.ink = true;
        ev.preventDefault();
      }
      function end() { drawing = false; }
      canvas.addEventListener('pointerdown', function (ev) {
        if (canvas.setPointerCapture) {
          try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
        }
        start(ev);
      });
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
    }

    function clearPad(canvas) {
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.ink = false;
      state.sigUrl = '';
      var ratio = window.devicePixelRatio || 1;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1A1238';
    }

    function captureSign() {
      var canvas = document.getElementById('esign-pad');
      var input = document.getElementById('esign-name');
      if (input) state.name = input.value;
      if (!canvas) return;
      state.ink = canvasHasInk(canvas);
      if (state.ink) state.sigUrl = canvas.toDataURL('image/png');
    }

    wireLang(function () { if (state.pack) render(); });
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  function renderGate(root, lang) {
    root.textContent = '';
    var sheet = el('div', { class: 'esign-sheet' });
    sheet.appendChild(el('div', { class: 'esign-watermark', 'aria-hidden': 'true', text: 'ENTWURF' }));
    sheet.appendChild(el('h1', { text: t(lang, 'gateTitle') }));
    sheet.appendChild(el('p', { class: 'esign-lead', text: t(lang, 'gateBody') }));
    sheet.appendChild(el('p', { class: 'esign-lock', text: t(lang, 'gateSample') }));
    sheet.appendChild(el('p', { class: 'esign-note', text: t(lang, 'submitLocked') + '. ' + t(lang, 'submitExplain') }));
    root.appendChild(sheet);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
