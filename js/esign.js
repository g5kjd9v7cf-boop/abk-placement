/**
 * MEDA e-sign (F1 native). binding stays false.
 * Numbered clause sections stay in the published pack language unless that
 * pack already ships translations[lang].sections. Signer-facing chrome,
 * intro, checklist labels, field labels and soft notices switch with
 * DE / FR / EN / AR (js/esign-locale.js). Submit stays disabled while
 * pack.legal_approved !== true. Nothing here is a qualified signature.
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
      step_checklist: 'Liste',
      step_sign: 'Signatur',
      step_done: 'Prüfung',
      stepNav: 'Fortschritt',
      progress: 'Schritt {n} von {m}',
      next: 'Weiter',
      back: 'Zurück',
      clear: 'Löschen',
      toReview: 'Weiter zur Prüfung',
      h_intro: 'Worum es geht',
      h_clauses: 'Klauseln',
      h_checklist: 'Checkliste',
      h_sign: 'Unterschrift',
      h_done: 'Prüfung',
      docEmployer: 'Angebots- und Rahmenblatt',
      docCandidate: 'Anmeldung',
      docFamily: 'Interessensblatt',
      officialLabel: 'Fassungstitel',
      scrollHint: 'Bitte die Klauseln bis zum Ende lesen. Danach wird „Weiter“ frei.',
      scrollDone: 'Ende der Klauseln erreicht.',
      checkHint: 'Alle Punkte sind nötig, bevor die Unterschrift freigeschaltet wird.',
      nameLabel: 'Vollständiger Name',
      nameHint: 'Vor- und Nachname. Zusammen mit der gezeichneten Unterschrift.',
      drawHint: 'Mit dem Finger oder der Maus zeichnen.',
      padCaption: 'Hier unterschreiben',
      reviewTitle: 'Angaben',
      reviewChecks: 'Bestätigte Punkte',
      reviewSig: 'Signatur',
      submit: 'Absenden',
      submitLocked: 'Freigabe ausstehend',
      submitExplain: 'Absenden bleibt geschlossen, bis Gewerbe und Anwaltsfreigabe vorliegen. Es wird nichts gespeichert und nichts versendet. Ein Vertrag entsteht hier nicht.',
      holdKicker: 'Status',
      previewBtn: 'Referenz anzeigen (kein Versand)',
      previewNote: 'Nur diese Sitzung. Nichts gespeichert, nichts versendet. Kein Vertrag.',
      previewRef: 'Referenz',
      receiptKicker: 'Vorgang',
      receiptStatus: 'Stand',
      receiptStatusValue: 'Nicht bindend · nicht versendet',
      tokenLabel: 'Öffentliche Vorgangsnummer',
      noPublicId: 'Keine öffentliche Vorgangsnummer in diesem Link.',
      withdrawalTitle: 'Widerruf',
      withdrawalUi: 'Angezeigte Frist: 12 Monate und 14 Tage.',
      withdrawalOrdinary: 'Gesetzliches Mindestmaß: 14 Tage (§355 Abs. 2 BGB).',
      b2bTitle: 'Kein Fernabsatz-Widerruf',
      b2bBody: 'Dieses Blatt richtet sich an Unternehmer (§14 BGB). Eine Verbraucher-Widerrufsbelehrung ist hier nicht der Standard. Datenschutz-Widerruf nach Art. 7 DSGVO bleibt unberührt.',
      noCv: 'Kein Lebenslauf-Upload auf dieser Seite.',
      feeLine: 'Höhe folgt im finalen Vertrag.',
      chipNonbinding: 'Nicht bindend',
      chipPending: 'Freigabe ausstehend',
      chipCapture: 'Einfache Erfassung',
      sesNote: 'Einfache Erfassung. Keine qualifizierte Signatur. Nicht bindend, bis Gewerbe und Anwalt freigeben.',
      legalDeOnly: 'Der Klauseltext bleibt Deutsch. Andere Sprachen ändern nur die Bedienung, nicht den Rechtstext.',
      needScroll: 'Bitte zuerst bis zum Ende der Klauseln scrollen.',
      needChecks: 'Bitte alle Punkte der Checkliste bestätigen.',
      needSign: 'Bitte Vor- und Nachname tippen und eine Unterschrift zeichnen.',
      gateTitle: 'Link ungültig oder unvollständig',
      gateBody: 'Dieser Arbeitgeber-Link braucht eine öffentliche Nummer EMP-… aus der MEDA-E-Mail. Ohne gültiges EMP-Token gibt es keine Checkliste und kein Absenden.',
      gateSample: 'Beispiel: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Angebot',
      noticesTitle: 'Hinweise zur Fassung',
      legacyToken: 'Mitgebrachte Vorgangsnummer aus einem früheren Schritt. Die Referenz entsteht getrennt und erst in der Vorschau als REF-…',
      doneLead: 'Zusammenfassung Ihrer Angaben. Absenden bleibt geschlossen, bis die Freigabe vorliegt.',
      packLabel: 'Fassung'
    },
    en: {
      step_intro: 'Intro',
      step_clauses: 'Clauses',
      step_checklist: 'List',
      step_sign: 'Signature',
      step_done: 'Review',
      stepNav: 'Progress',
      progress: 'Step {n} of {m}',
      next: 'Next',
      back: 'Back',
      clear: 'Clear',
      toReview: 'Continue to review',
      h_intro: 'What this step is',
      h_clauses: 'Clauses',
      h_checklist: 'Checklist',
      h_sign: 'Signature',
      h_done: 'Review',
      docEmployer: 'Offer and framework sheet',
      docCandidate: 'Registration',
      docFamily: 'Statement of interest',
      officialLabel: 'Document title',
      scrollHint: 'Read the clauses to the end. Next stays closed until then.',
      scrollDone: 'End of the clauses reached.',
      checkHint: 'Every item is required before the signature step.',
      nameLabel: 'Full name',
      nameHint: 'First and last name, together with the drawn signature.',
      drawHint: 'Draw with a finger or mouse.',
      padCaption: 'Sign here',
      reviewTitle: 'Your details',
      reviewChecks: 'Confirmed items',
      reviewSig: 'Signature',
      submit: 'Submit',
      submitLocked: 'Approval pending',
      submitExplain: 'Submit stays closed until business registration and lawyer approval. Nothing is stored or sent. This does not create a contract.',
      holdKicker: 'Status',
      previewBtn: 'Show reference (not sent)',
      previewNote: 'This browser session only. Nothing stored, nothing sent. No contract.',
      previewRef: 'Reference',
      receiptKicker: 'Record',
      receiptStatus: 'Status',
      receiptStatusValue: 'Not binding · not sent',
      tokenLabel: 'Public reference',
      noPublicId: 'No public reference in this link.',
      withdrawalTitle: 'Withdrawal',
      withdrawalUi: 'Period shown in the UI: 12 months and 14 days.',
      withdrawalOrdinary: 'Ordinary statutory minimum: 14 days (§355 Abs. 2 BGB).',
      b2bTitle: 'No distance-selling withdrawal',
      b2bBody: 'This sheet is for businesses (§14 BGB). A consumer withdrawal notice is not the default. Data-protection withdrawal under Art. 7 GDPR is separate.',
      noCv: 'No CV upload on this page.',
      feeLine: 'The amount follows in the final contract.',
      chipNonbinding: 'Not binding',
      chipPending: 'Approval pending',
      chipCapture: 'Simple capture',
      sesNote: 'Simple capture. Not a qualified signature. Not binding until business registration and lawyer approval.',
      legalDeOnly: 'Clause text stays German. Other languages change the controls only, not the legal wording.',
      needScroll: 'Scroll the clauses to the end first.',
      needChecks: 'Confirm every checklist item.',
      needSign: 'Type a first and last name and draw a signature.',
      gateTitle: 'Link missing or not valid',
      gateBody: 'The employer link needs a public EMP-… id from the MEDA email. Without a valid EMP token there is no checklist and no submit.',
      gateSample: 'Example: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Offer',
      noticesTitle: 'Notes on this version',
      legacyToken: 'Reference brought from an earlier step. The e-sign reference is separate and appears only in the preview as REF-…',
      doneLead: 'Summary of what you entered. Submit stays closed until approval.',
      packLabel: 'Version'
    },
    fr: {
      step_intro: 'Intro',
      step_clauses: 'Clauses',
      step_checklist: 'Liste',
      step_sign: 'Signature',
      step_done: 'Relecture',
      stepNav: 'Progression',
      progress: 'Étape {n} sur {m}',
      next: 'Suivant',
      back: 'Retour',
      clear: 'Effacer',
      toReview: 'Vers la relecture',
      h_intro: 'De quoi il s’agit',
      h_clauses: 'Clauses',
      h_checklist: 'Liste',
      h_sign: 'Signature',
      h_done: 'Relecture',
      docEmployer: 'Fiche d’offre et de cadre',
      docCandidate: 'Inscription',
      docFamily: 'Fiche d’intérêt',
      officialLabel: 'Titre du document',
      scrollHint: 'Lisez les clauses jusqu’au bout. « Suivant » reste fermé avant cela.',
      scrollDone: 'Fin des clauses atteinte.',
      checkHint: 'Chaque case est requise avant la signature.',
      nameLabel: 'Nom complet',
      nameHint: 'Prénom et nom, avec la signature dessinée.',
      drawHint: 'Dessinez au doigt ou à la souris.',
      padCaption: 'Signez ici',
      reviewTitle: 'Vos données',
      reviewChecks: 'Points confirmés',
      reviewSig: 'Signature',
      submit: 'Envoyer',
      submitLocked: 'Validation en attente',
      submitExplain: 'L’envoi reste fermé jusqu’à l’immatriculation et la validation de l’avocat. Rien n’est enregistré ni envoyé. Aucun contrat ne naît ici.',
      holdKicker: 'Statut',
      previewBtn: 'Afficher la référence (non envoyée)',
      previewNote: 'Cette session seulement. Rien enregistré, rien envoyé. Pas de contrat.',
      previewRef: 'Référence',
      receiptKicker: 'Dossier',
      receiptStatus: 'État',
      receiptStatusValue: 'Non engageant · non envoyé',
      tokenLabel: 'Référence publique',
      noPublicId: 'Pas de référence publique dans ce lien.',
      withdrawalTitle: 'Rétractation',
      withdrawalUi: 'Délai affiché : 12 mois et 14 jours.',
      withdrawalOrdinary: 'Minimum légal ordinaire : 14 jours (§355 Abs. 2 BGB).',
      b2bTitle: 'Pas de rétractation de vente à distance',
      b2bBody: 'Cette fiche vise des entreprises (§14 BGB). L’information consommateur n’est pas le standard. Le retrait des données (art. 7 RGPD) reste distinct.',
      noCv: 'Pas de dépôt de CV sur cette page.',
      feeLine: 'Le montant suivra dans le contrat final.',
      chipNonbinding: 'Non engageant',
      chipPending: 'Validation en attente',
      chipCapture: 'Saisie simple',
      sesNote: 'Saisie simple. Pas une signature qualifiée. Pas d’engagement avant immatriculation et avocat.',
      legalDeOnly: 'Le texte des clauses reste en allemand. Les autres langues ne changent que l’interface.',
      needScroll: 'Faites défiler les clauses jusqu’à la fin.',
      needChecks: 'Cochez tous les points de la liste.',
      needSign: 'Saisissez prénom et nom et dessinez une signature.',
      gateTitle: 'Lien incomplet ou non valable',
      gateBody: 'Le lien employeur exige un identifiant public EMP-… issu de l’e-mail MEDA. Sans jeton EMP valable, pas de liste ni d’envoi.',
      gateSample: 'Exemple : employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'Offre',
      noticesTitle: 'Notes sur cette version',
      legacyToken: 'Référence apportée d’une étape précédente. La référence e-sign est distincte et n’apparaît dans l’aperçu que comme REF-…',
      doneLead: 'Récapitulatif. L’envoi reste fermé jusqu’à la validation.',
      packLabel: 'Version'
    },
    ar: {
      step_intro: 'مقدمة',
      step_clauses: 'البنود',
      step_checklist: 'القائمة',
      step_sign: 'التوقيع',
      step_done: 'مراجعة',
      stepNav: 'التقدم',
      progress: 'الخطوة {n} من {m}',
      next: 'التالي',
      back: 'رجوع',
      clear: 'مسح',
      toReview: 'إلى المراجعة',
      h_intro: 'ما هذه الخطوة',
      h_clauses: 'البنود',
      h_checklist: 'قائمة التحقق',
      h_sign: 'التوقيع',
      h_done: 'مراجعة',
      docEmployer: 'ورقة العرض والإطار',
      docCandidate: 'التسجيل',
      docFamily: 'ورقة الاهتمام',
      officialLabel: 'عنوان المستند',
      scrollHint: 'اقرأ البنود حتى النهاية. يبقى «التالي» مغلقاً قبل ذلك.',
      scrollDone: 'تم بلوغ نهاية البنود.',
      checkHint: 'كل الخانات مطلوبة قبل خطوة التوقيع.',
      nameLabel: 'الاسم الكامل',
      nameHint: 'الاسم واللقب، مع التوقيع المرسوم.',
      drawHint: 'ارسم بالإصبع أو الفأرة.',
      padCaption: 'وقّع هنا',
      reviewTitle: 'بياناتك',
      reviewChecks: 'النقاط المؤكدة',
      reviewSig: 'التوقيع',
      submit: 'إرسال',
      submitLocked: 'بانتظار الاعتماد',
      submitExplain: 'يبقى الإرسال مغلقاً إلى أن يكتمل السجل التجاري واعتماد المحامي. لا يُحفظ شيء ولا يُرسل شيء. لا ينشأ عقد هنا.',
      holdKicker: 'الحالة',
      previewBtn: 'إظهار المرجع (بلا إرسال)',
      previewNote: 'هذه الجلسة فقط. لا حفظ ولا إرسال. لا عقد.',
      previewRef: 'المرجع',
      receiptKicker: 'المعاملة',
      receiptStatus: 'الوضع',
      receiptStatusValue: 'غير ملزم · لم يُرسل',
      tokenLabel: 'رقم عام',
      noPublicId: 'لا يوجد رقم عام في هذا الرابط.',
      withdrawalTitle: 'الرجوع',
      withdrawalUi: 'المهلة المعروضة: 12 شهراً و14 يوماً.',
      withdrawalOrdinary: 'الحد القانوني العادي: 14 يوماً (§355 Abs. 2 BGB).',
      b2bTitle: 'لا رجوع عن بعد للمستهلك',
      b2bBody: 'هذه الورقة موجهة إلى منشآت (§14 BGB). إرشاد المستهلك ليس هو الأصل هنا. سحب بيانات الحماية (المادة 7) يبقى منفصلاً.',
      noCv: 'لا رفع لسيرة ذاتية في هذه الصفحة.',
      feeLine: 'المبلغ يأتي في العقد النهائي.',
      chipNonbinding: 'غير ملزم',
      chipPending: 'بانتظار الاعتماد',
      chipCapture: 'التقاط بسيط',
      sesNote: 'التقاط بسيط. ليس توقيعاً مؤهلاً. غير ملزم قبل السجل التجاري وموافقة المحامي.',
      legalDeOnly: 'نص البنود يبقى بالألمانية. اللغات الأخرى تغيّر الواجهة فقط.',
      needScroll: 'مرّر البنود حتى النهاية أولاً.',
      needChecks: 'أكّد كل نقاط القائمة.',
      needSign: 'اكتب الاسم واللقب وارسم توقيعاً.',
      gateTitle: 'الرابط ناقص أو غير صالح',
      gateBody: 'رابط صاحب العمل يحتاج رقماً عاماً EMP-… من بريد MEDA. بلا رمز EMP صالح لا قائمة ولا إرسال.',
      gateSample: 'مثال: employer-sign.html?token=EMP-DEMO-001',
      offerTitle: 'العرض',
      noticesTitle: 'ملاحظات على هذه النسخة',
      legacyToken: 'رقم أتى من خطوة سابقة. مرجع التوقيع منفصل ويظهر في المعاينة فقط بصيغة REF-…',
      doneLead: 'ملخص ما أدخلته. يبقى الإرسال مغلقاً إلى حين الاعتماد.',
      packLabel: 'الإصدار'
    }
  };

  var OFFER_LABEL_KEY = {
    'Angebots-ID': 'field_offer_id',
    'Datum Angebot': 'field_offer_date',
    'Einrichtung / Arbeitgeber': 'field_offer_org',
    'Ansprechpartner': 'field_offer_contact',
    'Stelle / Profil-Referenz': 'field_offer_role',
    'Link-Gültigkeit': 'field_offer_validity',
    'Vergütung': 'field_offer_fee'
  };

  var OFFER_VALUE_KEY = {
    '[PLATZHALTER Angebot-ID]': 'value_offer_id',
    '[PLATZHALTER Datum]': 'value_offer_date',
    '[PLATZHALTER Einrichtung]': 'value_offer_org',
    '[PLATZHALTER Ansprechpartner]': 'value_offer_contact',
    '[PLATZHALTER Stelle / Profil-Referenz]': 'value_offer_role',
    '[PLATZHALTER Gültigkeit]': 'value_offer_validity',
    'Höhe folgt im finalen Vertrag': 'value_offer_fee'
  };

  var NOTICE_KEY = {
    'Kennzeichnung ENTWURF / Unverbindlich / NON-FEE Intake.': 'notice_mark',
    'binding: false bis Gewerbe §14 GewO + Anwaltsfreigabe.': 'notice_binding',
    'Keine Zahlungspflicht, kein Vorschuss, kein §296-Vertrag durch dieses Gate.': 'notice_no_pay',
    'Keine Vergütung in diesem Blatt — nur Verweis auf späteren §296-Vertrag / separate Rechnung. Höhe folgt im finalen Vertrag.': 'notice_fee_later',
    'Keine harte Exklusivität + Prior-Agency-Carve-out.': 'notice_exclusivity',
    'Keine AÜG-Überlassung; private Arbeitsvermittlung §§296–299 SGB III.': 'notice_no_aug',
    '§296a: Ausbildung keine Vergütung durch Ausbildungssuchenden — nur für späteren Vertrag. Cap §296 Abs. 3 nur als Schranke.': 'notice_296a',
    'Fair-Recruit: Kein Gütesiegel / keine Zertifizierung. Beschwerdeweg [PLATZHALTER E-Mail].': 'notice_fair',
    'CV-Upload erst nach unterschriebenem Pack. Diese Seite nimmt keinen Lebenslauf entgegen.': 'notice_cv',
    'Büro-Adresse: Luhnenstraße 7, 30559 Hannover (Büro).': 'notice_office'
  };

  function lookup(lang, key) {
    var code = I18N[lang] ? lang : 'de';
    var base = I18N[code] || {};
    var extraRoot = window.MEDA_ESIGN_LOCALE || {};
    var extra = extraRoot[code] || {};
    if (Object.prototype.hasOwnProperty.call(base, key) && base[key]) return base[key];
    if (Object.prototype.hasOwnProperty.call(extra, key) && extra[key]) return extra[key];
    if (code !== 'de') return lookup('de', key);
    return null;
  }

  function t(lang, key) {
    var val = lookup(lang, key);
    return val == null ? key : val;
  }

  function packLocale(pack, lang) {
    return pack && pack.translations && pack.translations[lang] ? pack.translations[lang] : null;
  }

  function stampLang(node, info, uiLang) {
    if (!info || !info.lang || info.lang === uiLang) return;
    node.setAttribute('lang', info.lang);
    node.setAttribute('dir', info.lang === 'ar' ? 'rtl' : 'ltr');
  }

  function lineInfo(pack, lang, bucket, source, keyMap) {
    var loc = packLocale(pack, lang);
    if (loc && loc[bucket] && source != null && loc[bucket][source]) {
      return { text: String(loc[bucket][source]), lang: lang };
    }
    var packLang = (pack && pack.lang) || 'de';
    if (lang === packLang) return { text: source || '', lang: packLang };
    var key = keyMap && keyMap[source];
    var ui = key ? lookup(lang, key) : null;
    if (ui != null) return { text: ui, lang: lang };
    return { text: source || '', lang: packLang };
  }

  function preambleInfo(pack, lang) {
    var loc = packLocale(pack, lang);
    if (loc && typeof loc.preamble === 'string' && loc.preamble) {
      return { text: loc.preamble, lang: lang };
    }
    var packLang = (pack && pack.lang) || 'de';
    var source = (pack && pack.preamble) || '';
    if (lang === packLang) return { text: source, lang: packLang };
    var party = (pack && pack.party) || 'candidate';
    var ui = lookup(lang, 'preamble_' + party);
    if (ui != null) return { text: ui, lang: lang };
    return { text: source, lang: packLang };
  }

  function checklistInfo(pack, lang, item) {
    var loc = packLocale(pack, lang);
    if (loc && loc.checklist && item && loc.checklist[item.id]) {
      return { text: String(loc.checklist[item.id]), lang: lang };
    }
    if (loc && loc.checklist && item && loc.checklist[item.text]) {
      return { text: String(loc.checklist[item.text]), lang: lang };
    }
    var packLang = (pack && pack.lang) || 'de';
    var source = (item && item.text) || '';
    if (lang === packLang) return { text: source, lang: packLang };
    var ui = item && item.id ? lookup(lang, 'check_' + item.id) : null;
    if (ui != null) return { text: ui, lang: lang };
    return { text: source, lang: packLang };
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
        renderPackError();
      });

    function wireLang(onChange) {
      var box = document.getElementById('esign-lang');
      if (!box) return;
      box.innerHTML = '';
      box.className = 'lang-switch';
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', t(lang, 'langAria'));
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

    function docTitleKey() {
      if (party === 'employer') return 'docEmployer';
      if (party === 'family') return 'docFamily';
      return 'docCandidate';
    }

    function render() {
      root.textContent = '';
      var pack = state.pack;
      var sheet = el('article', { class: 'esign-sheet' });
      sheet.setAttribute('data-pack', pack.id);

      var head = el('header', { class: 'esign-dochead' });
      head.appendChild(el('p', { class: 'esign-kicker', text: 'MEDA Vermittlung' }));
      head.appendChild(el('h1', { text: t(lang, docTitleKey()) }));
      var official = el('details', { class: 'esign-official' });
      official.appendChild(el('summary', { text: t(lang, 'officialLabel') }));
      official.appendChild(el('p', { text: pack.title }));
      head.appendChild(official);
      var docmeta = el('p', { class: 'esign-docmeta' });
      docmeta.appendChild(document.createTextNode(t(lang, 'packLabel') + ' ' + (pack.version || '')));
      if (tokenInfo.token) {
        docmeta.appendChild(el('span', { class: 'esign-dot', 'aria-hidden': 'true', text: '·' }));
        docmeta.appendChild(el('code', { text: tokenInfo.token }));
      }
      head.appendChild(docmeta);
      if (tokenInfo.legacy) head.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'legacyToken') }));
      sheet.appendChild(head);

      var steps = el('ol', { class: 'esign-steps' });
      steps.setAttribute('aria-label', t(lang, 'stepNav'));
      STEPS.forEach(function (id, i) {
        var li = el('li', { class: (i === state.step ? 'is-current' : i < state.step ? 'is-done' : '') });
        if (i === state.step) li.setAttribute('aria-current', 'step');
        li.appendChild(el('span', { class: 'n', text: String(i + 1) }));
        li.appendChild(el('span', { class: 'lbl', text: t(lang, 'step_' + id) }));
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
        'aria-valuenow': String(pct),
        'aria-valuetext': fmt(lang, 'progress', { n: state.step + 1, m: STEPS.length, p: pct })
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
      panel.appendChild(el('p', { class: 'esign-note', text: t(lang, 'sesNote') }));
      var meta = el('ul', { class: 'esign-meta' });
      ['chipNonbinding', 'chipPending', 'chipCapture'].forEach(function (key) {
        meta.appendChild(el('li', { text: t(lang, key) }));
      });
      panel.appendChild(meta);
      if (pack.preamble) {
        var pre = preambleInfo(pack, lang);
        var preNode = el('p', { class: 'esign-preamble', text: pre.text });
        stampLang(preNode, pre, lang);
        panel.appendChild(preNode);
      }
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
          var label = lineInfo(pack, lang, 'offerLabels', field.label, OFFER_LABEL_KEY);
          var value = lineInfo(pack, lang, 'offerValues', field.value, OFFER_VALUE_KEY);
          var wrap = el('div');
          var dt = el('dt', { text: label.text });
          var dd = el('dd', { text: value.text });
          stampLang(dt, label, lang);
          stampLang(dd, value, lang);
          wrap.appendChild(dt);
          wrap.appendChild(dd);
          dl.appendChild(wrap);
        });
        panel.appendChild(dl);
      }
      if (pack.ui_notices && pack.ui_notices.length) {
        var notesWrap = el('details', { class: 'esign-official' });
        notesWrap.appendChild(el('summary', { text: t(lang, 'noticesTitle') }));
        var notes = el('ul', { class: 'esign-notes' });
        pack.ui_notices.forEach(function (line) {
          var info = lineInfo(pack, lang, 'ui_notices', line, NOTICE_KEY);
          var li = el('li', { text: info.text });
          stampLang(li, info, lang);
          notes.appendChild(li);
        });
        notesWrap.appendChild(notes);
        panel.appendChild(notesWrap);
      }
      if (!tokenInfo.token) {
        panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'noPublicId') }));
      }
    }

    function renderClauses(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-mini', id: 'esign-scroll-hint', text: state.clausesRead ? t(lang, 'scrollDone') : t(lang, 'scrollHint') }));
      var loc = packLocale(pack, lang);
      var useLocale = !!(loc && Array.isArray(loc.sections) && loc.sections.length);
      var sections = useLocale ? loc.sections : (pack.sections || []);
      var kicker = useLocale && loc.kicker ? loc.kicker : pack.kicker;
      var clauseLang = useLocale ? lang : ((pack && pack.lang) || 'de');
      if (clauseLang !== lang) {
        panel.appendChild(el('p', { class: 'esign-clause-lang', text: t(lang, 'clauseBadge') }));
      }
      var box = el('article', {
        class: 'esign-clauses',
        lang: clauseLang,
        dir: clauseLang === 'ar' ? 'rtl' : 'ltr',
        'data-clauses': '1',
        tabindex: '0'
      });
      if (kicker) box.appendChild(el('p', { text: kicker }));
      sections.forEach(function (section) {
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
      fs.appendChild(el('legend', { class: 'esign-sr', text: t(lang, 'h_checklist') }));
      (pack.checklist || []).forEach(function (item) {
        var input = el('input', { type: 'checkbox', id: item.id });
        input.checked = !!state.checks[item.id];
        input.addEventListener('change', function () {
          state.checks[item.id] = input.checked;
          state.error = '';
        });
        var label = el('label', { for: item.id });
        label.appendChild(input);
        var info = checklistInfo(pack, lang, item);
        var span = el('span', { text: info.text });
        stampLang(span, info, lang);
        label.appendChild(span);
        fs.appendChild(label);
      });
      panel.appendChild(fs);
    }

    function renderSign(panel) {
      var field = el('label', { class: 'esign-field' });
      field.appendChild(document.createTextNode(t(lang, 'nameLabel')));
      var input = el('input', {
        type: 'text',
        id: 'esign-name',
        autocomplete: 'name',
        maxlength: '120',
        placeholder: t(lang, 'nameLabel')
      });
      input.value = state.name;
      input.addEventListener('input', function () {
        state.name = input.value;
        state.error = '';
      });
      field.appendChild(input);
      panel.appendChild(field);
      panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'nameHint') }));

      var pad = el('div', { class: 'esign-pad' });
      var bar = el('div', { class: 'esign-pad-bar' });
      bar.appendChild(el('span', { text: t(lang, 'h_sign') }));
      bar.appendChild(el('button', {
        type: 'button',
        class: 'esign-linkbtn',
        text: t(lang, 'clear'),
        onclick: function () {
          var canvas = document.getElementById('esign-pad');
          if (canvas) clearPad(canvas);
        }
      }));
      pad.appendChild(bar);
      var wrap = el('div', { class: 'esign-canvas-wrap' });
      var canvas = el('canvas', { id: 'esign-pad', 'aria-label': t(lang, 'h_sign') });
      wrap.appendChild(canvas);
      var baseline = el('span', { class: 'esign-pad-baseline', 'aria-hidden': 'true' });
      baseline.appendChild(el('span', { class: 'esign-pad-x', text: '×' }));
      wrap.appendChild(baseline);
      wrap.appendChild(el('span', { class: 'esign-pad-caption', 'aria-hidden': 'true', text: t(lang, 'padCaption') }));
      pad.appendChild(wrap);
      panel.appendChild(pad);
      panel.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'drawHint') }));
    }

    function renderDone(panel, pack) {
      panel.appendChild(el('p', { class: 'esign-lead', text: t(lang, 'doneLead') }));
      var review = el('div', { class: 'esign-review' });
      review.appendChild(el('h3', { text: t(lang, 'reviewTitle') }));
      review.appendChild(el('p', { class: 'esign-review-name', text: state.name }));
      review.appendChild(el('h3', { text: t(lang, 'reviewChecks') }));
      var ul = el('ul');
      (pack.checklist || []).forEach(function (item) {
        if (!state.checks[item.id]) return;
        var info = checklistInfo(pack, lang, item);
        var li = el('li', { text: info.text });
        stampLang(li, info, lang);
        ul.appendChild(li);
      });
      review.appendChild(ul);
      review.appendChild(el('h3', { text: t(lang, 'reviewSig') }));
      if (state.sigUrl) {
        var frame = el('div', { class: 'esign-sigframe' });
        frame.appendChild(el('img', { alt: t(lang, 'reviewSig'), src: state.sigUrl }));
        review.appendChild(frame);
      }
      panel.appendChild(review);

      var approved = pack.legal_approved === true;
      var hold = el('div', { class: 'esign-hold', role: 'status' });
      hold.appendChild(el('p', { class: 'esign-hold-kicker', text: t(lang, 'holdKicker') }));
      hold.appendChild(el('strong', { id: 'esign-hold-title', text: approved ? t(lang, 'chipNonbinding') : t(lang, 'submitLocked') }));
      var explain = el('p', { id: 'esign-hold-copy', text: approved ? t(lang, 'sesNote') : t(lang, 'submitExplain') });
      hold.appendChild(explain);
      var submit = el('button', {
        type: 'button',
        class: approved ? 'btn btn-primary esign-submit' : 'btn esign-submit is-held',
        id: 'esign-submit'
      });
      submit.appendChild(document.createTextNode(t(lang, 'submit')));
      if (!approved) submit.appendChild(el('span', { class: 'esign-submit-state', text: t(lang, 'submitLocked') }));
      submit.disabled = !approved;
      submit.setAttribute('aria-disabled', approved ? 'false' : 'true');
      submit.setAttribute('data-legal-approved', approved ? 'true' : 'false');
      submit.setAttribute('aria-describedby', 'esign-hold-copy');
      submit.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (state.pack.legal_approved !== true) return;
      });
      hold.appendChild(submit);
      panel.appendChild(hold);

      panel.appendChild(el('button', {
        type: 'button',
        class: 'btn btn-outline esign-preview',
        id: 'esign-preview',
        text: t(lang, 'previewBtn'),
        onclick: function () {
          if (!state.previewRef) state.previewRef = makeRef();
          showPreview();
        }
      }));
      panel.appendChild(el('div', { id: 'esign-preview-slot' }));
      if (state.previewRef) showPreview();

      function showPreview() {
        var slotNode = document.getElementById('esign-preview-slot');
        if (!slotNode) return;
        slotNode.textContent = '';
        var card = el('div', { class: 'esign-receipt' });
        card.appendChild(el('p', { class: 'esign-receipt-kicker', text: t(lang, 'receiptKicker') }));
        var ref = el('p', { class: 'esign-receipt-ref' });
        ref.appendChild(el('code', { id: 'esign-ref', text: state.previewRef }));
        card.appendChild(ref);
        var dl = el('dl');
        function row(label, value) {
          var wrap = el('div');
          wrap.appendChild(el('dt', { text: label }));
          wrap.appendChild(el('dd', { text: value }));
          dl.appendChild(wrap);
        }
        row(t(lang, 'previewRef'), state.previewRef);
        row(t(lang, 'nameLabel'), state.name);
        if (tokenInfo.token) row(t(lang, 'tokenLabel'), tokenInfo.token);
        row(t(lang, 'receiptStatus'), t(lang, 'receiptStatusValue'));
        card.appendChild(dl);
        card.appendChild(el('p', { class: 'esign-mini', text: t(lang, 'previewNote') }));
        slotNode.appendChild(card);
      }
    }

    function actions(stepId) {
      var row = el('div', { class: 'esign-nav' });
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
      var height = canvas.clientHeight || 196;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
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
      ctx.lineWidth = 2.2;
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

    function renderPackError() {
      root.textContent = '';
      root.appendChild(el('p', { class: 'esign-error', role: 'alert', text: t(lang, 'packError') }));
      wireLang(function () { renderPackError(); });
    }

    wireLang(function () { if (state.pack) render(); });
  }

  function applyShell(lang) {
    if (!document.body) return;
    document.querySelectorAll('[data-esign-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-esign-i18n');
      var val = lookup(lang, key);
      if (val != null) node.textContent = val;
    });
    var titleKey = document.body.getAttribute('data-esign-title');
    var title = titleKey ? lookup(lang, titleKey) : null;
    if (title) document.title = title;
    var descKey = document.body.getAttribute('data-esign-desc');
    var desc = descKey ? lookup(lang, descKey) : null;
    var meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);
  }

  function applyLang(lang) {
    var rootEl = document.documentElement;
    rootEl.lang = lang;
    rootEl.dir = lang === 'ar' ? 'rtl' : 'ltr';
    rootEl.classList.toggle('lang-ar', lang === 'ar');
    if (document.body) document.body.classList.toggle('lang-ar', lang === 'ar');
    applyShell(lang);
  }

  function renderGate(root, lang) {
    root.textContent = '';
    var sheet = el('article', { class: 'esign-sheet' });
    sheet.appendChild(el('p', { class: 'esign-kicker', text: 'MEDA Vermittlung' }));
    sheet.appendChild(el('h1', { text: t(lang, 'gateTitle') }));
    sheet.appendChild(el('p', { class: 'esign-lead', text: t(lang, 'gateBody') }));
    sheet.appendChild(el('p', { class: 'esign-sample' }, [
      el('code', { text: t(lang, 'gateSample') })
    ]));
    var hold = el('div', { class: 'esign-hold', role: 'status' });
    hold.appendChild(el('p', { class: 'esign-hold-kicker', text: t(lang, 'holdKicker') }));
    hold.appendChild(el('strong', { text: t(lang, 'submitLocked') }));
    hold.appendChild(el('p', { text: t(lang, 'submitExplain') }));
    sheet.appendChild(hold);
    root.appendChild(sheet);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
