(function () {
  if (window.__medaAskLoaded) return;
  window.__medaAskLoaded = true;

  var meta = document.querySelector('meta[name="meda-ask-api"]');
  var API = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var locStr = String(location.pathname || '') + ' ' + String(location.href || '');
  var isEmployerPage = /fuer-arbeitgeber/i.test(locStr);
  var isCandidatePage = /fuer-fachkraefte|bewerben/i.test(locStr);
  var MAIL = 'meda-vermittlung@agentmail.to';
  var MAIL_TEAM = 'MEDA-team@outlook.com';
  var SLOW_MS = 15000;

  var locale = null;
  var localePinned = false;
  var role = isEmployerPage ? 'employer' : (isCandidatePage ? 'professional' : null);
  var history = [];
  var started = false;
  var busy = false;
  var slowTimer = null;
  var lastFocus = null;

  var COPY = {
    de: {
      headSub: isEmployerPage
        ? 'Für Arbeitgeber · ohne personenbezogene Daten'
        : 'Fragen im Chat · ohne personenbezogene Daten',
      close: 'Schließen',
      openHint: 'Chat öffnen',
      inputLabel: 'Ihre Frage',
      placeholder: 'Ihre Frage…',
      send: 'Senden',
      suggestionsLabel: 'Vorgeschlagene Fragen',
      roleEmp: 'Arbeitgeber',
      rolePro: 'Fachkraft',
      linkContact: 'Kontakt',
      linkApply: 'Jetzt bewerben',
      cta: isEmployerPage ? 'Zur Kontaktseite' : 'Zur Bewerbung',
      errNet: 'Die Verbindung ist gerade unterbrochen. Bitte versuchen Sie es später erneut oder schreiben Sie an [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) oder [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      errReply: 'Das konnte ich gerade nicht beantworten. Schreiben Sie uns an [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) oder [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      grounded: 'Quelle: Arbeitgeberseite',
      fab: isEmployerPage ? 'Arbeitgeber-Assistent' : 'MEDA-Assistent',
      typing: 'Antwort wird formuliert',
      slow: 'Das dauert gerade etwas länger. Einen Moment bitte.',
      headTitle: isEmployerPage ? 'Arbeitgeber-Assistent' : 'MEDA-Assistent',
      fbKicker: 'Kurzantwort',
      fbEmpty: 'Gerne erläutern wir Ablauf und die nächsten Schritte direkt mit Ihnen.',
      fbContact: 'Kontakt aufnehmen',
      fbMail: 'E-Mail schreiben',
      teamOutlook: 'Team / Outlook',
      quickLang: 'Sprache',
      quickRole: 'Rolle',
      files: {
        'kontakt.html': 'Kontakt',
        'bewerben.html': 'Jetzt bewerben',
        'fuer-arbeitgeber.html': 'Für Arbeitgeber',
        'fuer-fachkraefte.html': 'Für Fachkräfte',
        'leistungen.html': 'Leistungen',
        'integration.html': 'Integration',
        'ueber-uns.html': 'Über uns',
        'index.html': 'Startseite'
      },
      promptsEmp: [
        'Wie läuft der Weg bis zur Auswahlliste?',
        'Welche Branchen und Profile gibt es?',
        'Wie nehmen wir Kontakt auf?',
        'Was übernimmt MEDA für Arbeitgeber?'
      ],
      promptsPro: [
        'Wie bewerbe ich mich bei MEDA?',
        'Welche Profile vermittelt MEDA?',
        'Welche Sprachstände sind üblich?',
        'Wie erreiche ich Sie?'
      ],
      welcomeEmp: [
        'Guten Tag. Hier beantworte ich Fragen von Arbeitgebern zu Ablauf und Auswahlliste — nachvollziehbar und ohne Rechtsberatung. Für ein Gespräch: ',
        { href: 'kontakt.html', label: 'Kontakt' },
        ' oder ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Bitte keine personenbezogenen Daten in diesem Chat.'
      ],
      welcomePro: [
        'Guten Tag. Stellen Sie Ihre Frage hier. Die Bewerbung läuft über ',
        { href: 'bewerben.html', label: 'Jetzt bewerben' },
        '. Für ein Gespräch: ',
        { href: 'kontakt.html', label: 'Kontakt' },
        ' oder ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Bitte keine Lebensläufe und keine personenbezogenen Daten in diesem Chat.'
      ]
    },
    fr: {
      headSub: isEmployerPage
        ? 'Pour les employeurs · sans données personnelles'
        : 'Questions dans le chat · sans données personnelles',
      close: 'Fermer',
      openHint: 'Ouvrir le chat',
      inputLabel: 'Votre question',
      placeholder: 'Votre question…',
      send: 'Envoyer',
      suggestionsLabel: 'Questions suggérées',
      roleEmp: 'Employeur',
      rolePro: 'Professionnel',
      linkContact: 'Contact',
      linkApply: 'Postuler maintenant',
      cta: isEmployerPage ? 'Vers la page contact' : 'Vers la candidature',
      errNet: 'La connexion est interrompue. Réessayez plus tard ou écrivez à [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) ou [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Équipe / Outlook).',
      errReply: 'Je n’ai pas pu répondre pour le moment. Écrivez à [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) ou [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Équipe / Outlook).',
      grounded: 'Source : page employeur',
      fab: isEmployerPage ? 'Assistant employeur' : 'Assistant MEDA',
      typing: 'Rédaction de la réponse',
      slow: 'Cela prend un peu plus de temps. Un instant, s’il vous plaît.',
      headTitle: isEmployerPage ? 'Assistant employeur' : 'Assistant MEDA',
      fbKicker: 'Réponse courte',
      fbEmpty: 'Nous expliquons volontiers le déroulement et les prochaines étapes.',
      fbContact: 'Nous contacter',
      fbMail: 'Écrire un e-mail',
      teamOutlook: 'Équipe / Outlook',
      quickLang: 'Langue',
      quickRole: 'Rôle',
      files: {
        'kontakt.html': 'Contact',
        'bewerben.html': 'Postuler maintenant',
        'fuer-arbeitgeber.html': 'Pour les employeurs',
        'fuer-fachkraefte.html': 'Pour les professionnels',
        'leistungen.html': 'Prestations',
        'integration.html': 'Intégration',
        'ueber-uns.html': 'À propos',
        'index.html': 'Accueil'
      },
      promptsEmp: [
        'Comment se déroule le parcours jusqu’à la liste restreinte ?',
        'Quels secteurs et profils couvrez-vous ?',
        'Comment vous contacter ?',
        'Que fait MEDA pour les employeurs ?'
      ],
      promptsPro: [
        'Comment déposer ma candidature auprès de MEDA ?',
        'Quels profils MEDA met-il en relation ?',
        'Quels niveaux de langue sont habituels ?',
        'Comment vous joindre ?'
      ],
      welcomeEmp: [
        'Bonjour. Je réponds ici aux questions des employeurs sur le déroulement et la liste restreinte — clairement, et sans conseil juridique. Pour un échange : ',
        { href: 'kontakt.html', label: 'Contact' },
        ' ou ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Équipe / Outlook : ' + MAIL_TEAM },
        '. Merci de ne pas indiquer de données personnelles dans ce chat.'
      ],
      welcomePro: [
        'Bonjour. Posez votre question ici. La candidature passe par ',
        { href: 'bewerben.html', label: 'Postuler maintenant' },
        '. Pour un échange : ',
        { href: 'kontakt.html', label: 'Contact' },
        ' ou ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Équipe / Outlook : ' + MAIL_TEAM },
        '. Merci de ne pas envoyer de CV ni de données personnelles ici.'
      ]
    },
    en: {
      headSub: isEmployerPage
        ? 'For employers · no personal data in chat'
        : 'Questions in chat · no personal data',
      close: 'Close',
      openHint: 'Open chat',
      inputLabel: 'Your question',
      placeholder: 'Your question…',
      send: 'Send',
      suggestionsLabel: 'Suggested questions',
      roleEmp: 'Employer',
      rolePro: 'Professional',
      linkContact: 'Contact',
      linkApply: 'Apply now',
      cta: isEmployerPage ? 'Go to contact page' : 'Go to the application',
      errNet: 'The connection dropped. Please try again later, or email [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) or [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      errReply: 'I could not answer that just now. Please email [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) or [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      grounded: 'Source: employer page',
      fab: isEmployerPage ? 'Employer assistant' : 'MEDA assistant',
      typing: 'Writing a reply',
      slow: 'This is taking a little longer. One moment, please.',
      headTitle: isEmployerPage ? 'Employer assistant' : 'MEDA assistant',
      fbKicker: 'Short answer',
      fbEmpty: 'We are happy to explain the process and the next steps directly.',
      fbContact: 'Contact us',
      fbMail: 'Email us',
      teamOutlook: 'Team / Outlook',
      quickLang: 'Language',
      quickRole: 'Role',
      files: {
        'kontakt.html': 'Contact',
        'bewerben.html': 'Apply now',
        'fuer-arbeitgeber.html': 'For employers',
        'fuer-fachkraefte.html': 'For professionals',
        'leistungen.html': 'Services',
        'integration.html': 'Integration',
        'ueber-uns.html': 'About',
        'index.html': 'Home'
      },
      promptsEmp: [
        'How does the path work up to the shortlist?',
        'Which sectors and profiles do you cover?',
        'How do we get in touch?',
        'What does MEDA do for employers?'
      ],
      promptsPro: [
        'How do I apply with MEDA?',
        'Which profiles does MEDA work with?',
        'Which language levels are typical?',
        'How can I reach you?'
      ],
      welcomeEmp: [
        'Good day. I answer employer questions about the process and the shortlist — clearly, and without legal advice. For a conversation: ',
        { href: 'kontakt.html', label: 'Contact' },
        ' or email ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Please don’t share personal data in this chat.'
      ],
      welcomePro: [
        'Good day. Ask your question here. Applications go through ',
        { href: 'bewerben.html', label: 'Apply now' },
        '. For a conversation: ',
        { href: 'kontakt.html', label: 'Contact' },
        ' or ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Please don’t send CVs or personal data here.'
      ]
    },
    ar: {
      headSub: isEmployerPage
        ? 'لأصحاب العمل · دون بيانات شخصية'
        : 'أسئلة في المحادثة · دون بيانات شخصية',
      close: 'إغلاق',
      openHint: 'فتح المحادثة',
      inputLabel: 'سؤالكم',
      placeholder: 'سؤالكم…',
      send: 'إرسال',
      suggestionsLabel: 'أسئلة مقترحة',
      roleEmp: 'صاحب عمل',
      rolePro: 'كفاءة مهنية',
      linkContact: 'التواصل',
      linkApply: 'قدّموا الآن',
      cta: isEmployerPage ? 'إلى صفحة التواصل' : 'إلى التقديم',
      errNet: 'انقطع الاتصال. يُرجى المحاولة لاحقًا أو الكتابة إلى [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) أو [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (الفريق / Outlook).',
      errReply: 'تعذّر الرد الآن. راسلونا على [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) أو [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (الفريق / Outlook).',
      grounded: 'المصدر: صفحة أصحاب العمل',
      fab: isEmployerPage ? 'مساعد أصحاب العمل' : 'مساعد MEDA',
      typing: 'جارٍ إعداد الإجابة',
      slow: 'يستغرق الرد وقتًا أطول قليلًا. لحظة من فضلكم.',
      headTitle: isEmployerPage ? 'مساعد أصحاب العمل' : 'مساعد MEDA',
      fbKicker: 'إجابة مختصرة',
      fbEmpty: 'يسعدنا أن نوضح المسار والخطوات التالية مباشرة.',
      fbContact: 'صفحة التواصل',
      fbMail: 'راسلونا',
      teamOutlook: 'الفريق / Outlook',
      quickLang: 'اللغة',
      quickRole: 'الدور',
      files: {
        'kontakt.html': 'التواصل',
        'bewerben.html': 'قدّموا الآن',
        'fuer-arbeitgeber.html': 'لأصحاب العمل',
        'fuer-fachkraefte.html': 'للكفاءات',
        'leistungen.html': 'الخدمات',
        'integration.html': 'الاندماج',
        'ueber-uns.html': 'من نحن',
        'index.html': 'الرئيسية'
      },
      promptsEmp: [
        'كيف يسير المسار حتى القائمة المختصرة؟',
        'ما القطاعات والملفات التي تغطونها؟',
        'كيف نتواصل معكم؟',
        'ماذا تقدّم MEDA لأصحاب العمل؟'
      ],
      promptsPro: [
        'كيف أتقدّم لدى MEDA؟',
        'ما الملفات التي تعمل معها MEDA؟',
        'ما مستويات اللغة المعتادة؟',
        'كيف أتواصل معكم؟'
      ],
      welcomeEmp: [
        'أهلاً بكم. أجيب هنا عن أسئلة أصحاب العمل حول المسار والقائمة المختصرة، بوضوح ومن دون استشارة قانونية. للحوار: ',
        { href: 'kontakt.html', label: 'التواصل' },
        ' أو ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'الفريق / Outlook: ' + MAIL_TEAM },
        '. يُرجى عدم إرسال بيانات شخصية في هذه المحادثة.'
      ],
      welcomePro: [
        'أهلاً بكم. اكتبوا سؤالكم هنا. التقديم يتم عبر ',
        { href: 'bewerben.html', label: 'قدّموا الآن' },
        '. للحوار: ',
        { href: 'kontakt.html', label: 'التواصل' },
        ' أو ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'الفريق / Outlook: ' + MAIL_TEAM },
        '. يُرجى عدم إرسال سير ذاتية أو بيانات شخصية هنا.'
      ]
    }
  };

  var LANGS = [
    { id: 'de', label: 'Deutsch' },
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'English' },
    { id: 'ar', label: 'العربية' }
  ];

  function t() {
    return COPY[locale] || COPY.de;
  }

  function pack(lang) {
    return COPY[lang] || t();
  }

  function normalizeLang(value) {
    var code = String(value || '').trim().toLowerCase().replace('_', '-').slice(0, 2);
    return COPY[code] ? code : null;
  }

  function mostlyArabic(text) {
    var compact = String(text || '').replace(/\s+/g, '');
    if (!compact) return false;
    var arabic = compact.match(/[\u0600-\u06FF]/g);
    var n = arabic ? arabic.length : 0;
    return n >= 3 && n * 2 >= compact.length;
  }

  function defaultLocale() {
    var hl = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
    if (COPY[hl]) return hl;
    try {
      var stored = localStorage.getItem('abk_lang');
      if (stored && COPY[stored]) return stored;
    } catch (e) {}
    return 'de';
  }

  function promptKind() {
    if (role === 'employer') return 'employer';
    if (role === 'professional') return 'candidate';
    return isEmployerPage ? 'employer' : 'candidate';
  }

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.setAttribute('data-mode', 'chat');
  root.setAttribute('dir', 'ltr');
  if (isEmployerPage) root.setAttribute('data-employer-agent', '1');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span class="meda-ask-fab-dot" aria-hidden="true"></span>' +
    '<svg class="meda-ask-fab-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5 5.2 19.6c-.15.55.42.98.92.68L9.2 18.2A7.4 7.4 0 1 0 6 16.5z"/></svg>' +
    '<span id="meda-ask-fab-label" aria-hidden="true"></span></button>' +
    '<div id="meda-ask-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-labelledby="meda-ask-head-title">' +
    '<div id="meda-ask-head">' +
    '<div class="meda-ask-agent-id">' +
    '<span class="meda-ask-avatar" aria-hidden="true"></span>' +
    '<div><strong id="meda-ask-head-title"></strong>' +
    '<span id="meda-ask-head-sub"></span></div></div>' +
    '<button type="button" id="meda-ask-close"></button></div>' +
    '<div id="meda-ask-msgs" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<div id="meda-ask-quick"></div>' +
    '<form id="meda-ask-form">' +
    '<label id="meda-ask-input-label" class="meda-ask-sr" for="meda-ask-input"></label>' +
    '<input id="meda-ask-input" maxlength="1000" autocomplete="off" enterkeyhint="send"/>' +
    '<button id="meda-ask-send" type="submit"></button></form>' +
    '</div>';
  document.body.appendChild(root);

  var msgs = root.querySelector('#meda-ask-msgs');
  var quick = root.querySelector('#meda-ask-quick');
  var panel = root.querySelector('#meda-ask-panel');
  var fab = root.querySelector('#meda-ask-fab');
  var form = root.querySelector('#meda-ask-form');
  var input = root.querySelector('#meda-ask-input');
  var inputLabel = root.querySelector('#meda-ask-input-label');
  var sendBtn = root.querySelector('#meda-ask-send');
  var headTitle = root.querySelector('#meda-ask-head-title');
  var headSub = root.querySelector('#meda-ask-head-sub');
  var closeBtn = root.querySelector('#meda-ask-close');
  var fabLabel = root.querySelector('#meda-ask-fab-label');

  locale = defaultLocale();

  function applyLangDir(el, lang) {
    var code = COPY[lang] ? lang : (locale || 'de');
    el.lang = code;
    el.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
  }

  function applyChrome() {
    var c = t();
    var dir = locale === 'ar' ? 'rtl' : 'ltr';
    root.setAttribute('dir', dir);
    root.setAttribute('lang', locale || 'de');
    root.setAttribute('data-locale', locale || 'de');
    panel.setAttribute('dir', dir);
    panel.setAttribute('lang', locale || 'de');
    headTitle.textContent = c.headTitle;
    headSub.textContent = c.headSub;
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', c.close);
    input.placeholder = c.placeholder;
    input.setAttribute('aria-label', c.inputLabel);
    inputLabel.textContent = c.inputLabel;
    sendBtn.textContent = c.send;
    sendBtn.setAttribute('aria-label', c.send);
    if (fabLabel) fabLabel.textContent = c.fab;
    fab.setAttribute('aria-label', c.fab + ' — ' + c.openHint);
  }

  function resetIntro() {
    if (history.length) return;
    while (msgs.firstChild) msgs.removeChild(msgs.firstChild);
    showWelcome();
    showSuggestions();
  }

  function renderQuickPicks() {
    var c = t();
    var active = document.activeElement;
    var activeKey = active && active.getAttribute && active.getAttribute('data-quick');
    quick.textContent = '';

    var langGroup = document.createElement('div');
    langGroup.className = 'meda-ask-quick-row';
    langGroup.setAttribute('role', 'group');
    langGroup.setAttribute('aria-label', c.quickLang);
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'meda-ask-choice' + (l.id === locale ? ' is-selected' : '');
      b.setAttribute('aria-pressed', l.id === locale ? 'true' : 'false');
      b.setAttribute('data-quick', 'lang-' + l.id);
      b.textContent = l.label;
      b.addEventListener('click', function () {
        if (locale === l.id && localePinned) return;
        locale = l.id;
        localePinned = true;
        applyChrome();
        resetIntro();
        renderQuickPicks();
      });
      langGroup.appendChild(b);
    });

    var roleGroup = document.createElement('div');
    roleGroup.className = 'meda-ask-quick-row';
    roleGroup.setAttribute('role', 'group');
    roleGroup.setAttribute('aria-label', c.quickRole);
    [
      { id: 'professional', label: c.rolePro },
      { id: 'employer', label: c.roleEmp }
    ].forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'meda-ask-choice' + (role === opt.id ? ' is-selected' : '');
      b.setAttribute('aria-pressed', role === opt.id ? 'true' : 'false');
      b.setAttribute('data-quick', 'role-' + opt.id);
      b.textContent = opt.label;
      b.addEventListener('click', function () {
        if (role === opt.id) return;
        role = opt.id;
        resetIntro();
        renderQuickPicks();
      });
      roleGroup.appendChild(b);
    });

    quick.appendChild(langGroup);
    quick.appendChild(roleGroup);
    if (activeKey) {
      var next = quick.querySelector('[data-quick="' + activeKey + '"]');
      if (next) next.focus();
    }
  }

  function noteWrittenLang(text) {
    if (localePinned || !mostlyArabic(text) || locale === 'ar') return;
    locale = 'ar';
    applyChrome();
    renderQuickPicks();
    if (!history.length) resetIntro();
  }

  function adoptReplyLang(lang) {
    if (!lang || !COPY[lang] || localePinned || locale === lang) return;
    locale = lang;
    applyChrome();
    if (root.getAttribute('data-open') === '1') renderQuickPicks();
  }

  function classifyHref(raw) {
    var href = String(raw || '').trim();
    if (!href || /[\u0000-\u001f\s]/.test(href)) return null;
    if (/^(javascript|data|vbscript|file):/i.test(href)) return null;
    if (/^mailto:/i.test(href)) {
      var addr = href.slice(7).split('?')[0];
      try { addr = decodeURIComponent(addr); } catch (e) { return null; }
      if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(addr)) return null;
      return { href: 'mailto:' + addr, external: false };
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.indexOf('//') === 0) {
      try {
        var u = new URL(href, location.href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        var host = u.hostname.toLowerCase().replace(/^www\./, '');
        var here = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        var same = host === here || host === 'meda-vermittlung.de';
        return { href: u.href, external: !same };
      } catch (e2) {
        return null;
      }
    }
    if (/^\/\//.test(href)) return null;
    if (/^(?:\/|\.\/|\.\.\/)?(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+\.html(?:[?#][^\s]*)?$/.test(href) || /^#[A-Za-z0-9_-]+$/.test(href)) {
      return { href: href, external: false };
    }
    return null;
  }

  function fileKeyFromHref(href) {
    var info = classifyHref(href);
    if (!info) return null;
    var path = info.href;
    try {
      if (/^https?:/i.test(path)) path = new URL(path).pathname;
    } catch (e) {
      return null;
    }
    var file = String(path).split(/[?#]/)[0].split('/').pop().toLowerCase();
    if (!/^[a-z0-9.-]+\.html$/.test(file)) return null;
    return file;
  }

  function fileLabel(href, lang) {
    var key = fileKeyFromHref(href);
    if (!key) return null;
    var labels = pack(lang).files || {};
    return labels[key] || null;
  }

  function appendTextWithIsolates(parent, text) {
    var src = String(text);
    var re = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|https?:\/\/[^\s<>()]+)/g;
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      if (m.index > last) parent.appendChild(document.createTextNode(src.slice(last, m.index)));
      var raw = m[0];
      var core = raw;
      var trail = '';
      var tm = /^(.*?)([.,;:!?)\]]+)$/.exec(raw);
      if (tm && /@|https?:/i.test(tm[1])) {
        core = tm[1];
        trail = tm[2];
      }
      var bdi = document.createElement('bdi');
      bdi.setAttribute('dir', 'auto');
      bdi.textContent = core;
      parent.appendChild(bdi);
      if (trail) parent.appendChild(document.createTextNode(trail));
      last = m.index + raw.length;
    }
    if (last < src.length) parent.appendChild(document.createTextNode(src.slice(last)));
  }

  function makeLink(label, href) {
    var info = classifyHref(href);
    if (!info) {
      var plain = document.createElement('span');
      appendTextWithIsolates(plain, label);
      return plain;
    }
    var a = document.createElement('a');
    appendTextWithIsolates(a, label);
    a.href = info.href;
    if (/@|https?:\/\//i.test(String(label || '')) || /^mailto:/i.test(info.href)) {
      a.setAttribute('dir', 'auto');
    }
    if (info.external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function humanizeFiles(text, lang) {
    var labels = pack(lang).files || COPY.de.files;
    var saved = [];
    var protectedText = String(text).replace(/\[[^\]\n]+\]\([^)\n]+\)/g, function (m) {
      saved.push(m);
      return '\u0000L' + (saved.length - 1) + '\u0000';
    });
    protectedText = protectedText.replace(/(?:https?:\/\/(?:www\.)?meda-vermittlung\.de\/)?((?:fuer-arbeitgeber|fuer-fachkraefte|bewerben|kontakt|leistungen|integration|ueber-uns|index)\.html)\b/gi, function (full, file) {
      var key = String(file).toLowerCase();
      var label = labels[key];
      if (!label) return full;
      return '[' + label + '](' + key + ')';
    });
    return protectedText.replace(/\u0000L(\d+)\u0000/g, function (_, n) {
      return saved[Number(n)] || '';
    });
  }

  function appendInline(parent, text, lang) {
    var re = /\*\*([^*\n]+)\*\*|__([^_\n]+)__|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
    var src = String(text);
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      if (m.index > last) appendTextWithIsolates(parent, src.slice(last, m.index));
      if (m[1] != null || m[2] != null) {
        var strong = document.createElement('strong');
        strong.textContent = m[1] != null ? m[1] : m[2];
        parent.appendChild(strong);
      } else {
        var label = fileLabel(m[4], lang) || m[3];
        parent.appendChild(makeLink(label, m[4]));
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) appendTextWithIsolates(parent, src.slice(last));
  }

  function renderMarkdownInto(el, text, lang) {
    var src = humanizeFiles(text, lang).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = src.split('\n');
    var i = 0;
    var para = [];
    function flushPara() {
      if (!para.length) return;
      var p = document.createElement('p');
      para.forEach(function (line, idx) {
        if (idx) p.appendChild(document.createElement('br'));
        appendInline(p, line, lang);
      });
      el.appendChild(p);
      para = [];
    }
    while (i < lines.length) {
      var line = lines[i];
      if (!String(line).trim()) {
        flushPara();
        i += 1;
        continue;
      }
      var ol = /^\s*\d+[.)]\s+(.+)$/.exec(line);
      var ul = /^\s*[-*•]\s+(.+)$/.exec(line);
      if (ol || ul) {
        flushPara();
        var ordered = !!ol;
        var list = document.createElement(ordered ? 'ol' : 'ul');
        while (i < lines.length) {
          var ol2 = /^\s*\d+[.)]\s+(.+)$/.exec(lines[i]);
          var ul2 = /^\s*[-*•]\s+(.+)$/.exec(lines[i]);
          if (ordered && !ol2) break;
          if (!ordered && !ul2) break;
          var item = document.createElement('li');
          appendInline(item, (ol2 || ul2)[1], lang);
          list.appendChild(item);
          i += 1;
        }
        el.appendChild(list);
        continue;
      }
      para.push(line);
      i += 1;
    }
    flushPara();
  }

  function fillParts(el, parts) {
    parts.forEach(function (part) {
      if (typeof part === 'string') {
        appendTextWithIsolates(el, part);
        return;
      }
      if (part && part.href) el.appendChild(makeLink(part.label, part.href));
    });
  }

  function scrollMsgs() {
    function go() {
      msgs.scrollTop = msgs.scrollHeight;
    }
    go();
    window.requestAnimationFrame(function () {
      go();
      window.requestAnimationFrame(go);
    });
  }

  function bubble(text, cls, rich, lang) {
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble ' + cls + (rich ? ' meda-ask-rich' : '');
    applyLangDir(d, lang);
    if (rich) renderMarkdownInto(d, text, d.lang);
    else appendTextWithIsolates(d, text);
    msgs.appendChild(d);
    scrollMsgs();
    return d;
  }

  function showWelcome() {
    var c = t();
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble sys meda-ask-welcome meda-ask-rich';
    applyLangDir(d, locale || 'de');
    fillParts(d, promptKind() === 'employer' ? c.welcomeEmp : c.welcomePro);
    msgs.appendChild(d);
    scrollMsgs();
    return d;
  }

  function showGroundedChip(lang) {
    var chip = document.createElement('div');
    chip.className = 'meda-ask-source';
    applyLangDir(chip, lang);
    chip.textContent = pack(lang).grounded;
    msgs.appendChild(chip);
    scrollMsgs();
  }

  function showSafeCta(href, lang) {
    var dest = String(href || '');
    if (isEmployerPage && /bewerben\.html/i.test(dest)) dest = 'kontakt.html';
    else if (role === 'employer' && /bewerben\.html/i.test(dest)) dest = 'fuer-arbeitgeber.html';
    var info = classifyHref(dest);
    if (!info) return;
    var row = document.createElement('div');
    row.className = 'meda-ask-cta-row';
    applyLangDir(row, lang);
    var a = makeLink(pack(lang).cta, info.href);
    a.className = 'meda-ask-cta';
    row.appendChild(a);
    msgs.appendChild(row);
    scrollMsgs();
  }

  function clearSlow() {
    if (slowTimer) {
      window.clearTimeout(slowTimer);
      slowTimer = null;
    }
  }

  function showTypingInMsgs() {
    clearSlow();
    var tip = document.createElement('div');
    tip.className = 'meda-ask-typing meda-ask-typing-chat';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    applyLangDir(tip, locale || 'de');
    var dots = document.createElement('span');
    dots.className = 'meda-ask-dots';
    dots.setAttribute('aria-hidden', 'true');
    for (var n = 0; n < 3; n += 1) dots.appendChild(document.createElement('span'));
    var live = document.createElement('span');
    live.className = 'meda-ask-sr meda-ask-typing-live';
    live.textContent = t().typing;
    var slow = document.createElement('p');
    slow.className = 'meda-ask-slow';
    slow.hidden = true;
    slow.textContent = t().slow;
    tip.appendChild(dots);
    tip.appendChild(live);
    tip.appendChild(slow);
    msgs.appendChild(tip);
    scrollMsgs();
    slowTimer = window.setTimeout(function () {
      if (!tip.parentNode) return;
      slow.hidden = false;
      slow.textContent = t().slow;
      live.textContent = t().slow;
      scrollMsgs();
    }, SLOW_MS);
    return tip;
  }

  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function clearSuggestions() {
    removeNode(msgs.querySelector('.meda-ask-suggestions'));
  }

  function showSuggestions() {
    clearSuggestions();
    var c = t();
    var list = promptKind() === 'employer' ? c.promptsEmp : c.promptsPro;
    var wrap = document.createElement('div');
    wrap.className = 'meda-ask-suggestions';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', c.suggestionsLabel);
    list.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'meda-ask-choice meda-ask-suggest';
      b.textContent = q;
      b.addEventListener('click', function () {
        ask(q);
      });
      wrap.appendChild(b);
    });
    msgs.appendChild(wrap);
    scrollMsgs();
  }

  function shortenFallback(text, lang) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw || raw.length > 420) return pack(lang).fbEmpty;
    return String(text || '').trim();
  }

  function signalBlob(data) {
    if (!data || typeof data !== 'object') return '';
    var keys = ['mode', 'reason', 'notice', 'fallback', 'fallback_reason', 'source', 'path', 'reply_mode', 'code', 'error'];
    var parts = [];
    keys.forEach(function (k) {
      if (data[k] != null && typeof data[k] !== 'object') parts.push(String(data[k]));
    });
    var metaObj = data.meta;
    if (metaObj && typeof metaObj === 'object') {
      ['mode', 'reason', 'notice', 'fallback'].forEach(function (k) {
        if (metaObj[k] != null && typeof metaObj[k] !== 'object') parts.push(String(metaObj[k]));
      });
    }
    return parts.join(' ');
  }

  // Worker reply shape (read-only; URL and worker stay as they are):
  // { ok, reply, lang, model, grounded, cta, escalated, skill,
  //   notice, mode, reason, degraded, fallback, offline_faq, meta? }
  // UI strings follow the widget language, or `lang` / meta.lang when the
  // visitor has not chosen a language in the widget.
  function isOfflineFallback(data) {
    if (!data || typeof data !== 'object') return false;
    if (/offline_faq/i.test(signalBlob(data))) return true;
    if (data.fallback === true || data.offline_faq === true || data.degraded === true) return true;
    if (data.meta && typeof data.meta === 'object') {
      if (data.meta.fallback === true || data.meta.degraded === true || data.meta.offline_faq === true) return true;
    }
    return false;
  }

  function replyLanguage(data, replyText) {
    var fromApi = data && (normalizeLang(data.lang) || (data.meta && normalizeLang(data.meta.lang)));
    if (fromApi) return fromApi;
    if (mostlyArabic(replyText)) return 'ar';
    return null;
  }

  function showFallbackCard(reply, lang) {
    var c = pack(lang);
    var card = document.createElement('div');
    card.className = 'meda-ask-fallback';
    card.setAttribute('role', 'note');
    applyLangDir(card, lang);
    var kicker = document.createElement('p');
    kicker.className = 'meda-ask-fallback-kicker';
    kicker.textContent = c.fbKicker;
    var body = document.createElement('div');
    body.className = 'meda-ask-fallback-body meda-ask-rich';
    renderMarkdownInto(body, shortenFallback(reply, lang), lang);
    var actions = document.createElement('div');
    actions.className = 'meda-ask-fallback-actions';
    var contact = makeLink(c.fbContact, 'kontakt.html');
    contact.className = 'meda-ask-cta';
    var mail = makeLink(c.fbMail, 'mailto:' + MAIL);
    mail.className = 'meda-ask-cta meda-ask-cta-quiet';
    var team = makeLink(c.teamOutlook, 'mailto:' + MAIL_TEAM);
    team.className = 'meda-ask-cta meda-ask-cta-quiet';
    actions.appendChild(contact);
    actions.appendChild(mail);
    actions.appendChild(team);
    card.appendChild(kicker);
    card.appendChild(body);
    card.appendChild(actions);
    msgs.appendChild(card);
    scrollMsgs();
    return shortenFallback(reply, lang);
  }

  function sheetLimit() {
    var narrow = window.matchMedia('(max-width: 640px)').matches && root.getAttribute('data-open') === '1';
    if (!narrow) {
      panel.style.maxHeight = '';
      panel.style.height = '';
      panel.style.bottom = '';
      return;
    }
    var vv = window.visualViewport;
    var viewH = vv ? vv.height : window.innerHeight;
    var insetBottom = 0;
    if (vv) insetBottom = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    var topClear = 0;
    var banner = document.getElementById('meda-soft-launch');
    var header = document.querySelector('.site-header');
    [banner, header].forEach(function (el) {
      if (!el) return;
      var rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.bottom > topClear && rect.top < viewH * 0.6) topClear = rect.bottom;
    });
    var gap = 12;
    var limit = Math.round(viewH * 0.8);
    var room = Math.round(viewH - Math.min(topClear, viewH) - gap);
    var cap = Math.max(240, Math.min(limit, room));
    panel.style.bottom = insetBottom + 'px';
    panel.style.maxHeight = cap + 'px';
    panel.style.height = cap + 'px';
  }

  function focusables(scope) {
    return Array.prototype.filter.call(
      scope.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (el) {
        if (el.disabled) return false;
        if (el.closest('[hidden]')) return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      }
    );
  }

  function restoreFocus() {
    var back = fab;
    if (lastFocus && lastFocus !== document.body && document.contains(lastFocus) && !panel.contains(lastFocus)) {
      back = lastFocus;
    }
    window.setTimeout(function () {
      try { back.focus(); } catch (e) {}
    }, 0);
  }

  function ensureChat(focusInput) {
    root.setAttribute('data-mode', 'chat');
    if (!locale) locale = defaultLocale();
    if (isEmployerPage && !role) role = 'employer';
    applyChrome();
    renderQuickPicks();
    if (!started) {
      started = true;
      showWelcome();
      showSuggestions();
    }
    sheetLimit();
    if (focusInput) {
      window.setTimeout(function () {
        try { input.focus(); } catch (e) {}
      }, 0);
    }
    scrollMsgs();
  }

  function setOpen(open) {
    if (open) {
      lastFocus = document.activeElement;
      root.setAttribute('data-open', '1');
      fab.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      panel.setAttribute('aria-modal', 'true');
      ensureChat(true);
    } else {
      root.setAttribute('data-open', '0');
      fab.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('aria-modal', 'false');
      sheetLimit();
      restoreFocus();
    }
  }

  function looksLeaked(reply) {
    return /flagship|budget\s*models?|CODECRAFT|MODEL_PRIMARY|MODEL_FALLBACK|gpt-\d|gpt\s*5|claude[-\s]+opus|grok[-\s]*4|deepseek|gemma-2|gemini-3\.[67]|no silent fallback|stiller Wechsel|workers\.dev\/kb|system prompt|anthropic/i.test(String(reply));
  }

  function ask(text) {
    var question = String(text || '').trim();
    if (!question || busy) return;
    if (root.getAttribute('data-open') !== '1') return;
    busy = true;
    input.value = '';
    clearSuggestions();
    var userLang = mostlyArabic(question) ? 'ar' : (locale || 'de');
    noteWrittenLang(question);
    bubble(question, 'user', false, userLang);
    if (root.getAttribute('data-open') === '1') input.focus();
    history.push({ role: 'user', content: question });
    sendBtn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    var tip = showTypingInMsgs();
    var payload = {
      locale: locale || defaultLocale(),
      visitor_role: role || (isEmployerPage ? 'employer' : 'professional'),
      messages: history.slice(-6)
    };
    if (isEmployerPage) {
      payload.page = 'fuer-arbeitgeber.html';
      payload.page_source = collectPageSource();
      payload.mode = 'page_agent';
    }
    fetch(String(API).replace(/\/$/, '') + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        return { res: res, data: data };
      });
    }).then(function (out) {
      clearSlow();
      removeNode(tip);
      var res = out.res;
      var data = out.data;
      var reply = (data && (data.ok || data.reply) && data.reply) || '';
      var netFail = !res.ok && !(data && data.reply);
      var badReply = !reply || reply === 'upstream' || reply === 'upstream_parse' || reply === 'backend_unconfigured' || looksLeaked(reply);
      if (netFail) {
        bubble(t().errNet, 'bot', true, locale || 'de');
        return;
      }
      if (badReply) {
        var errText = t().errReply;
        bubble(errText, 'bot', true, locale || 'de');
        history.push({ role: 'assistant', content: errText });
        return;
      }
      var apiLang = replyLanguage(data, reply);
      if (apiLang) adoptReplyLang(apiLang);
      var shownLang = apiLang || locale || 'de';
      var offline = !!(data && isOfflineFallback(data));
      var shown = reply;
      if (offline) {
        shown = showFallbackCard(reply, shownLang);
      } else {
        bubble(reply, 'bot', true, shownLang);
        if (data && data.grounded) showGroundedChip(shownLang);
        if (data && data.cta) showSafeCta(data.cta, shownLang);
      }
      if (shown && shown !== t().errNet) history.push({ role: 'assistant', content: String(shown) });
    }).catch(function () {
      clearSlow();
      removeNode(tip);
      bubble(t().errNet, 'bot', true, locale || 'de');
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
      form.removeAttribute('aria-busy');
      if (root.getAttribute('data-open') === '1') input.focus();
      scrollMsgs();
    });
  }

  function collectPageSource() {
    try {
      var main = document.querySelector('main');
      var raw = (main && main.textContent) || '';
      return String(raw).replace(/\s+/g, ' ').trim().slice(0, 12000);
    } catch (e) {
      return '';
    }
  }

  fab.addEventListener('click', function () {
    setOpen(root.getAttribute('data-open') !== '1');
  });
  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (root.getAttribute('data-open') !== '1') return;
    e.preventDefault();
    setOpen(false);
  });

  panel.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || root.getAttribute('data-open') !== '1') return;
    var nodes = focusables(panel);
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  document.addEventListener('abk:lang', function (ev) {
    if (localePinned) return;
    var next = ev.detail && normalizeLang(ev.detail.lang);
    if (!next || next === locale) return;
    locale = next;
    applyChrome();
    if (root.getAttribute('data-open') === '1') {
      renderQuickPicks();
      resetIntro();
    }
  });

  window.addEventListener('resize', function () {
    sheetLimit();
    if (root.getAttribute('data-open') === '1') scrollMsgs();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      sheetLimit();
      if (root.getAttribute('data-open') === '1') scrollMsgs();
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (root.getAttribute('data-open') === '1') scrollMsgs();
    });
  }

  applyChrome();
})();
