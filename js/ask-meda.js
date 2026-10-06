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
  var SLOW_MS = 8000;

  var locale = null;
  var localePinned = false;
  var role = isEmployerPage ? 'employer' : null;
  var step = 'pitch';
  var history = [];
  var started = false;
  var busy = false;
  var slowTimer = null;
  var lastFocus = null;
  var spaceDone = false;
  try {
    spaceDone = sessionStorage.getItem(isEmployerPage ? 'medaAskEmpSpaceDone' : 'medaAskSpaceDone') === '1';
  } catch (e) {}

  var COPY = {
    de: {
      headSub: isEmployerPage
        ? 'Für Arbeitgeber · ohne personenbezogene Daten'
        : 'Orientierung im Chat · ohne personenbezogene Daten',
      close: 'Schließen',
      openHint: 'Chat öffnen',
      inputLabel: 'Ihre Frage',
      placeholder: isEmployerPage
        ? 'Frage zu Prozess, Kosten oder Kontakt…'
        : 'Frage zu Bewerbung, Anerkennung oder Visum…',
      send: 'Senden',
      suggestionsLabel: 'Vorgeschlagene Fragen',
      roleAsk: 'Sind Sie Arbeitgeber oder Fachkraft?',
      roleEmp: 'Arbeitgeber',
      rolePro: 'Fachkraft',
      linkContact: 'Kontakt',
      linkApply: 'Jetzt bewerben',
      cta: isEmployerPage ? 'Zur Kontaktseite' : 'Zur Bewerbung',
      errNet: 'Die Verbindung ist gerade unterbrochen. Bitte versuchen Sie es später erneut oder schreiben Sie an [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) oder [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      errReply: 'Das konnte ich gerade nicht beantworten. Schreiben Sie uns an [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) oder [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook) — wir kümmern uns darum.',
      langAsk: 'Welche Sprache möchten Sie nutzen?',
      continuePitch: 'Weiter',
      grounded: 'Quelle: Arbeitgeberseite',
      fab: isEmployerPage ? 'Arbeitgeber-Assistent' : 'MEDA-Assistent',
      typing: 'Antwort wird formuliert',
      slow: 'Einen Moment, ich formuliere die Antwort…',
      headTitle: isEmployerPage ? 'Arbeitgeber-Assistent' : 'MEDA-Assistent',
      online: 'Erreichbar',
      fbKicker: 'Kurzantwort',
      fbEmpty: 'Gerne erläutern wir Ablauf, Zeitrahmen und die nächsten Schritte direkt mit Ihnen.',
      fbContact: 'Kontakt aufnehmen',
      fbMail: 'E-Mail schreiben',
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
        'Wie läuft der Prozess von der Auftragsklärung bis zur Integration?',
        'Welche Kosten entstehen für Arbeitgeber?',
        'Welche Branchen und Profile betreuen Sie?',
        'Wie nehmen wir Kontakt auf?'
      ],
      promptsPro: [
        'Wie bewerbe ich mich bei MEDA?',
        'Wie funktioniert die berufliche Anerkennung?',
        'Was sollte ich zu Visum und Einreise wissen?',
        'Wie erreiche ich Sie?'
      ],
      welcomeEmp: [
        'Guten Tag. Ich bin der Assistent für Arbeitgeber bei MEDA Vermittlung. Gerne erkläre ich Prozess, Auswahlliste und Integration — klar, nachvollziehbar und ohne Rechtsberatung. Für ein persönliches Gespräch öffnen Sie ',
        { href: 'kontakt.html', label: 'Kontakt' },
        ' oder schreiben Sie an ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Bitte senden Sie hier keine personenbezogenen Daten.'
      ],
      welcomePro: [
        'Willkommen. Ich begleite Fachkräfte auf dem Weg aus dem Ausland nach Deutschland — bei Bewerbung, Anerkennung und den ersten Schritten. Die Bewerbung selbst läuft über ',
        { href: 'bewerben.html', label: 'Jetzt bewerben' },
        '. Für ein Gespräch: ',
        { href: 'kontakt.html', label: 'Kontakt' },
        ' oder ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Bitte keine Lebensläufe oder personenbezogenen Daten in diesem Chat.'
      ]
    },
    fr: {
      headSub: isEmployerPage
        ? 'Pour les employeurs · sans données personnelles'
        : 'Orientation dans le chat · sans données personnelles',
      close: 'Fermer',
      openHint: 'Ouvrir le chat',
      inputLabel: 'Votre question',
      placeholder: isEmployerPage
        ? 'Question sur le processus, les coûts ou le contact…'
        : 'Question sur la candidature, la reconnaissance ou le visa…',
      send: 'Envoyer',
      suggestionsLabel: 'Questions suggérées',
      roleAsk: 'Êtes-vous employeur ou professionnel ?',
      roleEmp: 'Employeur',
      rolePro: 'Professionnel',
      linkContact: 'Contact',
      linkApply: 'Postuler',
      cta: isEmployerPage ? 'Vers la page contact' : 'Vers la candidature',
      errNet: 'La connexion est interrompue. Réessayez plus tard ou écrivez à [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) ou [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Équipe / Outlook).',
      errReply: 'Je n’ai pas pu répondre pour le moment. Écrivez à [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) ou [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Équipe / Outlook) — nous nous en occupons.',
      langAsk: 'Quelle langue souhaitez-vous utiliser ?',
      continuePitch: 'Continuer',
      grounded: 'Source : page employeur',
      fab: isEmployerPage ? 'Assistant employeur' : 'Assistant MEDA',
      typing: 'Rédaction de la réponse',
      slow: 'Un instant, je formule la réponse…',
      headTitle: isEmployerPage ? 'Assistant employeur' : 'Assistant MEDA',
      online: 'En ligne',
      fbKicker: 'Réponse courte',
      fbEmpty: 'Nous vous expliquons volontiers le déroulement, les délais et les prochaines étapes.',
      fbContact: 'Nous contacter',
      fbMail: 'Écrire un e-mail',
      files: {
        'kontakt.html': 'Contact',
        'bewerben.html': 'Postuler',
        'fuer-arbeitgeber.html': 'Pour les employeurs',
        'fuer-fachkraefte.html': 'Pour les professionnels',
        'leistungen.html': 'Services',
        'integration.html': 'Intégration',
        'ueber-uns.html': 'À propos',
        'index.html': 'Accueil'
      },
      promptsEmp: [
        'Comment se déroule le processus, du cadrage du besoin à l’intégration ?',
        'Quels coûts un employeur doit-il prévoir ?',
        'Quels secteurs et profils accompagnez-vous ?',
        'Comment prenons-nous contact ?'
      ],
      promptsPro: [
        'Comment déposer ma candidature auprès de MEDA ?',
        'Comment fonctionne la reconnaissance professionnelle ?',
        'Que faut-il savoir sur le visa et l’entrée ?',
        'Comment vous joindre ?'
      ],
      welcomeEmp: [
        'Bonjour. Je suis l’assistant employeurs de MEDA Vermittlung. J’explique le processus, la liste restreinte et l’intégration — clairement, et sans conseil juridique. Pour un échange personnel, ouvrez ',
        { href: 'kontakt.html', label: 'Contact' },
        ' ou écrivez à ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Merci de ne pas indiquer de données personnelles ici.'
      ],
      welcomePro: [
        'Bienvenue. J’accompagne les professionnelles et professionnels venus de l’étranger vers l’Allemagne — candidature, reconnaissance et premiers pas. La candidature passe par ',
        { href: 'bewerben.html', label: 'Postuler' },
        '. Pour un échange : ',
        { href: 'kontakt.html', label: 'Contact' },
        ' ou ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Merci de ne pas envoyer de CV ni de données personnelles ici.'
      ]
    },
    en: {
      headSub: isEmployerPage
        ? 'For employers · no personal data in chat'
        : 'Guidance in chat · no personal data',
      close: 'Close',
      openHint: 'Open chat',
      inputLabel: 'Your question',
      placeholder: isEmployerPage
        ? 'Ask about process, costs, or contact…'
        : 'Ask about applying, recognition, or visas…',
      send: 'Send',
      suggestionsLabel: 'Suggested questions',
      roleAsk: 'Are you an employer or a skilled professional?',
      roleEmp: 'Employer',
      rolePro: 'Professional',
      linkContact: 'Contact',
      linkApply: 'Apply now',
      cta: isEmployerPage ? 'Go to contact page' : 'Go to the application',
      errNet: 'The connection dropped. Please try again later, or email [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) or [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook).',
      errReply: 'I could not answer that just now. Please email [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) or [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (Team / Outlook) — we will look into it.',
      langAsk: 'Which language would you like to use?',
      continuePitch: 'Continue',
      grounded: 'Source: employer page',
      fab: isEmployerPage ? 'Employer assistant' : 'MEDA assistant',
      typing: 'Writing a reply',
      slow: 'One moment — I’m writing the answer…',
      headTitle: isEmployerPage ? 'Employer assistant' : 'MEDA assistant',
      online: 'Online',
      fbKicker: 'Short answer',
      fbEmpty: 'We are happy to walk through the process, timing, and next steps with you directly.',
      fbContact: 'Contact us',
      fbMail: 'Email us',
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
        'How does the process work, from the briefing to integration?',
        'What costs should an employer expect?',
        'Which sectors and profiles do you cover?',
        'How do we get in touch?'
      ],
      promptsPro: [
        'How do I apply with MEDA?',
        'How does professional recognition work?',
        'What should I know about visas and entry?',
        'How can I reach you?'
      ],
      welcomeEmp: [
        'Good day. I’m the employer assistant for MEDA Vermittlung. I can walk you through the process, the shortlist and integration — clearly, and without legal advice. For a personal conversation, open ',
        { href: 'kontakt.html', label: 'Contact' },
        ' or email ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. Please don’t share personal data in this chat.'
      ],
      welcomePro: [
        'Welcome. I guide skilled professionals on the path from abroad to Germany — application, recognition, and first steps. Applications go through ',
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
        : 'توجيه في المحادثة · دون بيانات شخصية',
      close: 'إغلاق',
      openHint: 'فتح المحادثة',
      inputLabel: 'سؤالكم',
      placeholder: isEmployerPage
        ? 'سؤال عن المسار أو التكاليف أو التواصل…'
        : 'سؤال عن التقديم أو المعادلة أو التأشيرة…',
      send: 'إرسال',
      suggestionsLabel: 'أسئلة مقترحة',
      roleAsk: 'هل أنتم صاحب عمل أم كفاءة مهنية؟',
      roleEmp: 'صاحب عمل',
      rolePro: 'كفاءة مهنية',
      linkContact: 'التواصل',
      linkApply: 'قدّموا الآن',
      cta: isEmployerPage ? 'إلى صفحة التواصل' : 'إلى التقديم',
      errNet: 'انقطع الاتصال. يُرجى المحاولة لاحقًا أو الكتابة إلى [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) أو [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (الفريق / Outlook).',
      errReply: 'تعذّر الرد الآن. راسلونا على [meda-vermittlung@agentmail.to](mailto:meda-vermittlung@agentmail.to) أو [MEDA-team@outlook.com](mailto:MEDA-team@outlook.com) (الفريق / Outlook) ونتولى الأمر.',
      langAsk: 'أي لغة تفضّلون؟',
      continuePitch: 'متابعة',
      grounded: 'المصدر: صفحة أصحاب العمل',
      fab: isEmployerPage ? 'مساعد أصحاب العمل' : 'مساعد MEDA',
      typing: 'جارٍ صياغة الإجابة',
      slow: 'لحظة من فضلكم، أصوغ الإجابة…',
      headTitle: isEmployerPage ? 'مساعد أصحاب العمل' : 'مساعد MEDA',
      online: 'متصل',
      fbKicker: 'إجابة مختصرة',
      fbEmpty: 'يسعدنا أن نوضح لكم المسار والمدد والخطوات التالية مباشرة.',
      fbContact: 'صفحة التواصل',
      fbMail: 'راسلونا',
      files: {
        'kontakt.html': 'التواصل',
        'bewerben.html': 'قدّموا الآن',
        'fuer-arbeitgeber.html': 'لأصحاب العمل',
        'fuer-fachkraefte.html': 'للكفاءات',
        'leistungen.html': 'الخدمات',
        'integration.html': 'الاندماج',
        'ueber-uns.html': 'من نحن',
        'index.html': 'البداية'
      },
      promptsEmp: [
        'كيف تسير العملية من توضيح الطلب حتى الاندماج؟',
        'ما التكاليف التي يتحمّلها صاحب العمل؟',
        'ما القطاعات والملفات التي تغطونها؟',
        'كيف نتواصل معكم؟'
      ],
      promptsPro: [
        'كيف أتقدّم لدى MEDA؟',
        'كيف تتم المعادلة المهنية؟',
        'ماذا ينبغي أن أعرف عن التأشيرة والدخول؟',
        'كيف أتواصل معكم؟'
      ],
      welcomeEmp: [
        'أهلاً بكم. أنا مساعد أصحاب العمل لدى MEDA للوساطة. أوضح المسار والقائمة المختصرة والاندماج — بوضوح ومن دون استشارة قانونية. لحوار شخصي زوروا ',
        { href: 'kontakt.html', label: 'التواصل' },
        ' أو راسلونا على ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
        '. يُرجى عدم إرسال بيانات شخصية في هذه المحادثة.'
      ],
      welcomePro: [
        'أهلاً بكم. أرافق الكفاءات في طريقها من الخارج إلى ألمانيا — في التقديم والمعادلة والخطوات الأولى. التقديم يتم عبر ',
        { href: 'bewerben.html', label: 'قدّموا الآن' },
        '. للحوار: ',
        { href: 'kontakt.html', label: 'التواصل' },
        ' أو ',
        { href: 'mailto:' + MAIL, label: MAIL },
        ' · ',
        { href: 'mailto:' + MAIL_TEAM, label: 'Team / Outlook: ' + MAIL_TEAM },
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

  var PITCH_EMP = {
    de: [
      'Arbeitgeber-Plattform · Fachkräfte und Familien — klar begleitet.',
      'Ich antworte aus dem Inhalt dieser Seite. Nur Orientierung, keine Rechtsberatung.'
    ],
    en: [
      'Employer platform · Skilled professionals and families — guided with clarity.',
      'I answer from this page. Orientation only, not legal advice.'
    ],
    fr: [
      'Plateforme employeurs · Professionnels et familles — un accompagnement clair.',
      'Je réponds à partir de cette page. Orientation seulement, pas de conseil juridique.'
    ],
    ar: [
      'منصة أصحاب العمل · كفاءات وعائلات — بمرافقة واضحة.',
      'أجيب من محتوى هذه الصفحة. توجيه فقط، بلا استشارة قانونية.'
    ]
  };

  var PITCH_GENERAL = {
    de: [
      'MEDA vermittelt qualifizierte Fachkräfte an Unternehmen in Deutschland — als Sprach- und Kommunikationspartner.',
      'Ich beantworte allgemeine Fragen zu Ablauf und Orientierung. Keine Rechtsberatung und keine personenbezogenen Daten im Chat.'
    ],
    en: [
      'MEDA places qualified professionals with companies in Germany — as a language and communication partner.',
      'I answer general questions about the path and what to expect. No legal advice, and no personal data in chat.'
    ],
    fr: [
      'MEDA met en relation des professionnels qualifiés et des entreprises en Allemagne — comme partenaire linguistique.',
      'Je réponds aux questions générales sur le parcours. Pas de conseil juridique, et aucune donnée personnelle dans le chat.'
    ],
    ar: [
      'تربط MEDA الكفاءات المؤهلة بالشركات في ألمانيا — كشريك لغوي وتواصلي.',
      'أجيب عن الأسئلة العامة حول المسار. بلا استشارة قانونية، ومن دون بيانات شخصية في المحادثة.'
    ]
  };

  function t() {
    return COPY[locale] || COPY.de;
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
    if (isEmployerPage) return 'employer';
    if (isCandidatePage) return 'candidate';
    return role === 'employer' ? 'employer' : 'candidate';
  }

  function pitchLines() {
    var loc = locale || defaultLocale();
    var pack = isEmployerPage ? PITCH_EMP : PITCH_GENERAL;
    return pack[loc] || pack.de;
  }

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.setAttribute('data-mode', 'space');
  root.setAttribute('dir', 'ltr');
  if (isEmployerPage) root.setAttribute('data-employer-agent', '1');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span class="meda-ask-fab-dot" aria-hidden="true"></span> <span id="meda-ask-fab-label"></span></button>' +
    '<div id="meda-ask-panel" role="dialog" aria-modal="true" aria-labelledby="meda-ask-head-title">' +
    '<div id="meda-ask-head">' +
    '<div class="meda-ask-agent-id">' +
    '<span class="meda-ask-avatar" aria-hidden="true"></span>' +
    '<div><strong id="meda-ask-head-title"></strong>' +
    '<span id="meda-ask-head-sub"></span></div></div>' +
    '<button type="button" id="meda-ask-close"></button></div>' +
    '<div id="meda-ask-space" class="meda-ask-space"></div>' +
    '<div id="meda-ask-msgs" role="log" aria-live="polite" aria-relevant="additions" hidden></div>' +
    '<form id="meda-ask-form" hidden>' +
    '<label id="meda-ask-input-label" class="meda-ask-sr" for="meda-ask-input"></label>' +
    '<input id="meda-ask-input" maxlength="1000" autocomplete="off" enterkeyhint="send"/>' +
    '<button id="meda-ask-send" type="submit"></button></form>' +
    '</div>';
  document.body.appendChild(root);

  var space = root.querySelector('#meda-ask-space');
  var msgs = root.querySelector('#meda-ask-msgs');
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

  function markSpaceDone() {
    spaceDone = true;
    try {
      sessionStorage.setItem(isEmployerPage ? 'medaAskEmpSpaceDone' : 'medaAskSpaceDone', '1');
    } catch (e) {}
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

  function makeLink(label, href) {
    var info = classifyHref(href);
    if (!info) {
      var plain = document.createElement('span');
      plain.textContent = label;
      return plain;
    }
    var a = document.createElement('a');
    a.textContent = label;
    a.href = info.href;
    if (info.external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  function humanizeFiles(text) {
    var labels = (t().files) || COPY.de.files;
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

  function appendInline(parent, text) {
    var re = /\*\*([^*\n]+)\*\*|__([^_\n]+)__|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
    var src = String(text);
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      if (m.index > last) parent.appendChild(document.createTextNode(src.slice(last, m.index)));
      if (m[1] != null || m[2] != null) {
        var strong = document.createElement('strong');
        strong.textContent = m[1] != null ? m[1] : m[2];
        parent.appendChild(strong);
      } else {
        parent.appendChild(makeLink(m[3], m[4]));
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) parent.appendChild(document.createTextNode(src.slice(last)));
  }

  function renderMarkdownInto(el, text) {
    var src = humanizeFiles(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = src.split('\n');
    var i = 0;
    var para = [];
    function flushPara() {
      if (!para.length) return;
      var p = document.createElement('p');
      para.forEach(function (line, idx) {
        if (idx) p.appendChild(document.createElement('br'));
        appendInline(p, line);
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
          appendInline(item, (ol2 || ul2)[1]);
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
        el.appendChild(document.createTextNode(part));
        return;
      }
      if (part && part.href) el.appendChild(makeLink(part.label, part.href));
    });
  }

  function scrollMsgs() {
    window.requestAnimationFrame(function () {
      msgs.scrollTop = msgs.scrollHeight;
      window.requestAnimationFrame(function () {
        msgs.scrollTop = msgs.scrollHeight;
      });
    });
  }

  function bubble(text, cls, rich) {
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble ' + cls + (rich ? ' meda-ask-rich' : '');
    d.lang = locale || 'de';
    if (rich) renderMarkdownInto(d, text);
    else d.textContent = text;
    msgs.appendChild(d);
    scrollMsgs();
    return d;
  }

  function showWelcome() {
    var c = t();
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble sys meda-ask-welcome meda-ask-rich';
    d.lang = locale || 'de';
    fillParts(d, promptKind() === 'employer' ? c.welcomeEmp : c.welcomePro);
    msgs.appendChild(d);
    scrollMsgs();
    return d;
  }

  function showGroundedChip() {
    var chip = document.createElement('div');
    chip.className = 'meda-ask-source';
    chip.textContent = t().grounded;
    msgs.appendChild(chip);
    scrollMsgs();
  }

  function showSafeCta(href) {
    var dest = String(href || '');
    if (isEmployerPage && /bewerben\.html/i.test(dest)) dest = 'kontakt.html';
    else if (role === 'employer' && /bewerben\.html/i.test(dest)) dest = 'fuer-arbeitgeber.html';
    var info = classifyHref(dest);
    if (!info) return;
    var row = document.createElement('div');
    row.className = 'meda-ask-cta-row';
    var a = makeLink(t().cta, info.href);
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

  function shortenFallback(text) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw || raw.length > 420) return t().fbEmpty;
    return String(text || '').trim();
  }

  function signalBlob(data) {
    if (!data || typeof data !== 'object') return '';
    var keys = ['mode', 'reason', 'notice', 'fallback', 'fallback_reason', 'source', 'path', 'reply_mode', 'code', 'error'];
    var parts = [];
    keys.forEach(function (k) {
      if (data[k] != null && typeof data[k] !== 'object') parts.push(String(data[k]));
    });
    var meta = data.meta;
    if (meta && typeof meta === 'object') {
      ['mode', 'reason', 'notice', 'fallback'].forEach(function (k) {
        if (meta[k] != null && typeof meta[k] !== 'object') parts.push(String(meta[k]));
      });
    }
    return parts.join(' ');
  }

  // Worker reply shape (read-only; URL and worker stay as they are):
  // { ok, reply, model, grounded, cta, escalated, skill,
  //   notice, mode, reason, degraded, fallback, offline_faq, meta? }
  // Offline FAQ: notice/mode/reason contains "offline_faq"
  // (e.g. flagship_cascade_exhausted_offline_faq) or a fallback flag
  // (fallback / degraded / offline_faq === true).
  function isOfflineFallback(data) {
    if (!data || typeof data !== 'object') return false;
    if (/offline_faq/i.test(signalBlob(data))) return true;
    if (data.fallback === true || data.offline_faq === true || data.degraded === true) return true;
    if (data.meta && typeof data.meta === 'object') {
      if (data.meta.fallback === true || data.meta.degraded === true || data.meta.offline_faq === true) return true;
    }
    return false;
  }

  function showFallbackCard(reply) {
    var c = t();
    var card = document.createElement('div');
    card.className = 'meda-ask-fallback';
    card.setAttribute('role', 'note');
    card.lang = locale || 'de';
    var kicker = document.createElement('p');
    kicker.className = 'meda-ask-fallback-kicker';
    kicker.textContent = c.fbKicker;
    var body = document.createElement('div');
    body.className = 'meda-ask-fallback-body meda-ask-rich';
    renderMarkdownInto(body, shortenFallback(reply));
    var actions = document.createElement('div');
    actions.className = 'meda-ask-fallback-actions';
    var contact = makeLink(c.fbContact, 'kontakt.html');
    contact.className = 'meda-ask-cta';
    var mail = makeLink(c.fbMail, 'mailto:' + MAIL);
    mail.className = 'meda-ask-cta meda-ask-cta-quiet';
    var team = makeLink('Team / Outlook', 'mailto:' + MAIL_TEAM);
    team.className = 'meda-ask-cta meda-ask-cta-quiet';
    actions.appendChild(contact);
    actions.appendChild(mail);
    actions.appendChild(team);
    card.appendChild(kicker);
    card.appendChild(body);
    card.appendChild(actions);
    msgs.appendChild(card);
    scrollMsgs();
    return shortenFallback(reply);
  }

  function choices(options, onPick, mount) {
    var wrap = document.createElement('div');
    wrap.className = 'meda-ask-choices';
    options.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'meda-ask-choice';
      b.textContent = opt.label;
      b.addEventListener('click', function () {
        if (wrap.getAttribute('data-done') === '1') return;
        wrap.setAttribute('data-done', '1');
        Array.prototype.forEach.call(wrap.querySelectorAll('button'), function (btn) {
          btn.disabled = true;
          if (btn === b) btn.classList.add('is-selected');
        });
        onPick(opt);
      });
      wrap.appendChild(b);
    });
    (mount || msgs).appendChild(wrap);
    return wrap;
  }

  function clearSpace() {
    while (space.firstChild) space.removeChild(space.firstChild);
  }

  function spaceLine(text, cls) {
    var d = document.createElement('div');
    d.className = 'meda-ask-space-line ' + (cls || 'bot');
    d.textContent = text;
    space.appendChild(d);
    space.scrollTop = space.scrollHeight;
    return d;
  }

  function showTyping(thenFn) {
    var tip = document.createElement('div');
    tip.className = 'meda-ask-typing';
    tip.setAttribute('aria-hidden', 'true');
    var dots = document.createElement('span');
    dots.className = 'meda-ask-dots';
    for (var n = 0; n < 3; n += 1) dots.appendChild(document.createElement('span'));
    tip.appendChild(dots);
    space.appendChild(tip);
    space.scrollTop = space.scrollHeight;
    window.setTimeout(function () {
      removeNode(tip);
      thenFn();
    }, 650);
  }

  function presenceBlock(compact) {
    var hero = document.createElement('div');
    hero.className = 'meda-ask-space-hero' + (compact ? ' compact' : '');
    var presence = document.createElement('div');
    presence.className = 'meda-ask-presence';
    var orb = document.createElement('span');
    orb.className = 'meda-ask-orb';
    orb.setAttribute('aria-hidden', 'true');
    var copy = document.createElement('div');
    var strong = document.createElement('strong');
    strong.textContent = t().headTitle;
    var em = document.createElement('em');
    em.textContent = t().online;
    copy.appendChild(strong);
    copy.appendChild(em);
    presence.appendChild(orb);
    presence.appendChild(copy);
    hero.appendChild(presence);
    return hero;
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

  function enterAgentSpace() {
    root.setAttribute('data-mode', 'space');
    space.hidden = false;
    msgs.hidden = true;
    form.hidden = true;
    if (!localePinned) locale = defaultLocale();
    if (isEmployerPage) role = 'employer';
    else role = null;
    started = false;
    step = 'pitch';
    applyChrome();
    clearSpace();
    space.appendChild(presenceBlock(false));

    var lines = pitchLines();
    var i = 0;
    function nextPitch() {
      if (i >= lines.length) {
        var actions = document.createElement('div');
        actions.className = 'meda-ask-space-actions';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'meda-ask-choice is-selected';
        btn.textContent = t().continuePitch;
        btn.addEventListener('click', openLangStep);
        actions.appendChild(btn);
        space.appendChild(actions);
        btn.focus();
        return;
      }
      showTyping(function () {
        spaceLine(lines[i], 'bot');
        i += 1;
        window.setTimeout(nextPitch, 280);
      });
    }
    window.setTimeout(nextPitch, 200);
  }

  function openLangStep() {
    step = 'lang';
    clearSpace();
    space.appendChild(presenceBlock(true));
    showTyping(function () {
      spaceLine(t().langAsk, 'bot');
      choices(LANGS.map(function (l) {
        return { id: l.id, label: l.label };
      }), function (opt) {
        locale = opt.id;
        localePinned = true;
        applyChrome();
        if (isEmployerPage) {
          role = 'employer';
          finishIntoChat();
        } else {
          openRoleStep();
        }
      }, space);
    });
  }

  function openRoleStep() {
    step = 'role';
    clearSpace();
    space.appendChild(presenceBlock(true));
    showTyping(function () {
      spaceLine(t().roleAsk, 'bot');
      choices([
        { id: 'professional', label: t().rolePro },
        { id: 'employer', label: t().roleEmp }
      ], function (opt) {
        role = opt.id;
        finishIntoChat();
      }, space);
    });
  }

  function finishIntoChat() {
    markSpaceDone();
    startChatFromSpace();
  }

  function startChatFromSpace() {
    root.setAttribute('data-mode', 'chat');
    space.hidden = true;
    msgs.hidden = false;
    while (msgs.firstChild) msgs.removeChild(msgs.firstChild);
    history = [];
    started = true;
    if (isEmployerPage) role = 'employer';
    if (!locale) locale = defaultLocale();
    applyChrome();
    enterChat();
  }

  function enterChat() {
    step = 'chat';
    showWelcome();
    showSuggestions();
    form.hidden = false;
    input.focus();
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

  function setOpen(open) {
    if (open) {
      lastFocus = document.activeElement;
      root.setAttribute('data-open', '1');
      fab.setAttribute('aria-expanded', 'true');
      var ready = spaceDone && locale && (role || isEmployerPage);
      if (!ready) {
        enterAgentSpace();
      } else {
        if (isEmployerPage) role = 'employer';
        root.setAttribute('data-mode', 'chat');
        space.hidden = true;
        msgs.hidden = false;
        if (!started) {
          started = true;
          applyChrome();
          enterChat();
        } else if (step === 'chat') {
          applyChrome();
          input.focus();
          scrollMsgs();
        }
      }
    } else {
      root.setAttribute('data-open', '0');
      fab.setAttribute('aria-expanded', 'false');
      restoreFocus();
    }
  }

  function looksLeaked(reply) {
    return /flagship|budget\s*models?|CODECRAFT|MODEL_PRIMARY|MODEL_FALLBACK|gpt-\d|gpt\s*5|claude[-\s]+opus|grok[-\s]*4|deepseek|gemma-2|gemini-3\.[67]|no silent fallback|stiller Wechsel|workers\.dev\/kb|system prompt|anthropic/i.test(String(reply));
  }

  function ask(text) {
    var question = String(text || '').trim();
    if (!question || step !== 'chat' || busy) return;
    busy = true;
    input.value = '';
    clearSuggestions();
    bubble(question, 'user', false);
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
      payload.visitor_role = 'employer';
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
      var reply = (data && (data.ok || data.reply) && data.reply) || t().errReply;
      if (reply === 'upstream' || reply === 'upstream_parse' || reply === 'backend_unconfigured') reply = t().errReply;
      if (!res.ok && !(data && data.reply)) reply = t().errNet;
      if (looksLeaked(reply)) reply = t().errReply;
      var offline = !!(data && isOfflineFallback(data));
      var shown = reply;
      if (offline && reply && reply !== t().errNet && reply !== t().errReply) {
        shown = showFallbackCard(reply);
      } else if (offline && (!reply || reply === t().errReply)) {
        shown = showFallbackCard(t().fbEmpty);
      } else {
        bubble(reply, 'bot', true);
        if (data && data.grounded) showGroundedChip();
        if (data && data.cta) showSafeCta(data.cta);
      }
      if (shown && shown !== t().errNet) history.push({ role: 'assistant', content: String(shown) });
    }).catch(function () {
      clearSlow();
      removeNode(tip);
      bubble(t().errNet, 'bot', true);
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
      form.removeAttribute('aria-busy');
      if (root.getAttribute('data-open') === '1') input.focus();
      scrollMsgs();
    });
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
    if (localePinned || started) return;
    if (root.getAttribute('data-open') === '1') return;
    var next = ev.detail && String(ev.detail.lang || '').slice(0, 2).toLowerCase();
    if (!COPY[next]) return;
    locale = next;
    applyChrome();
  });

  applyChrome();
})();
