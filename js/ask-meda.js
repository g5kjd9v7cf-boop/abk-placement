(function () {
  if (window.__medaAskLoaded) return;
  window.__medaAskLoaded = true;

  var meta = document.querySelector('meta[name="meda-ask-api"]');
  var API = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var VIDEO_SRC = (function () {
    var m = document.querySelector('meta[name="meda-ask-video"]');
    if (m && m.content) return m.content;
    try {
      var base = document.querySelector('script[src*="ask-meda.js"]');
      if (base && base.src) {
        return new URL('../assets/ask-meda-intro.mp4', base.src).href;
      }
    } catch (e) {}
    return '/assets/ask-meda-intro.mp4';
  })();
  var locale = null;
  var role = null;
  var step = 'lang';
  var history = [];
  var videoSeen = false;
  try {
    videoSeen = sessionStorage.getItem('medaAskVideoSeen') === '1';
  } catch (e) {}

  var COPY = {
    de: {
      headSub: 'KI-Assistent · Keine personenbezogenen Daten im Chat · Sitzung nur im Browser',
      close: 'Schließen',
      placeholder: 'Ihre Frage zu Leistungen, Prozess oder Visa-Basics…',
      send: 'Senden',
      roleAsk: 'Sind Sie Arbeitgeber oder Fachkraft?',
      roleEmp: 'Arbeitgeber',
      rolePro: 'Fachkraft',
      readyEmp:
        'Danke. Ich beantworte allgemeine Fragen für Arbeitgeber zu Vermittlung, Prozess und Soft-Launch. Bitte senden Sie hier keine Namen, E-Mails, Telefonnummern oder Unterlagen. Für konkrete Anfragen nutzen Sie fuer-arbeitgeber.html bzw. kontakt.html.',
      readyPro:
        'Danke. Ich beantworte allgemeine Fragen für Fachkräfte zum Pfad Maghreb–Deutschland. Bitte senden Sie hier keine personenbezogenen Daten oder Lebensläufe. Zur Warteliste / Bewerbung nutzen Sie ausschließlich bewerben.html.',
      cta: 'Zur Warteliste / Bewerbung',
      errNet: 'Netzwerkfehler — bitte später erneut versuchen oder kontakt.html nutzen.',
      errReply: 'Antwort derzeit nicht verfügbar.',
      videoTitle: 'Ask MEDA — kurze Orientierung',
      videoSkip: 'Weiter zum Chat',
      videoReplay: 'Video erneut abspielen',
      videoHint: 'Tipp zum Abspielen · Stummschaltung möglich',
    },
    ar: {
      headSub: 'مساعد ذكي · لا بيانات شخصية في المحادثة · الجلسة في المتصفح فقط',
      close: 'إغلاق',
      placeholder: 'سؤالك حول الخدمات أو المسار أو أساسيات التأشيرة…',
      send: 'إرسال',
      roleAsk: 'هل أنتم صاحب عمل أم كفاءة مهنية؟',
      roleEmp: 'صاحب عمل',
      rolePro: 'كفاءة مهنية',
      readyEmp:
        'شكرًا. أجيب عن أسئلة عامة لأصحاب العمل حول الوساطة والمسار والإطلاق المبدئي. يُرجى عدم إرسال أسماء أو بريد أو هاتف أو ملفات هنا. للاستفسارات المحددة استخدموا fuer-arbeitgeber.html أو kontakt.html.',
      readyPro:
        'شكرًا. أجيب عن أسئلة عامة للكفاءات حول مسار المغرب–ألمانيا. يُرجى عدم إرسال بيانات شخصية أو سيرة ذاتية هنا. لقائمة الانتظار / التقديم استخدموا فقط bewerben.html.',
      cta: 'إلى قائمة الانتظار / التقديم',
      errNet: 'خطأ في الشبكة — حاولوا لاحقًا أو استخدموا kontakt.html.',
      errReply: 'الإجابة غير متاحة حاليًا.',
      videoTitle: 'Ask MEDA — توجيه مختصر',
      videoSkip: 'المتابعة إلى المحادثة',
      videoReplay: 'إعادة تشغيل الفيديو',
      videoHint: 'انقر للتشغيل · يمكن كتم الصوت',
    },
    fr: {
      headSub: 'Assistant IA · Aucune donnée personnelle dans le chat · Session navigateur uniquement',
      close: 'Fermer',
      placeholder: 'Votre question sur les services, le processus ou les bases visa…',
      send: 'Envoyer',
      roleAsk: 'Êtes-vous employeur ou professionnel ?',
      roleEmp: 'Employeur',
      rolePro: 'Professionnel',
      readyEmp:
        'Merci. Je réponds aux questions générales des employeurs sur la mise en relation, le processus et le soft-launch. N’envoyez pas de noms, e-mails, téléphones ou dossiers ici. Pour une demande concrète, utilisez fuer-arbeitgeber.html ou kontakt.html.',
      readyPro:
        'Merci. Je réponds aux questions générales des candidats sur le parcours Maghreb–Allemagne. N’envoyez pas de données personnelles ni de CV ici. Pour la liste d’attente / candidature, utilisez uniquement bewerben.html.',
      cta: 'Liste d’attente / candidature',
      errNet: 'Erreur réseau — réessayez plus tard ou utilisez kontakt.html.',
      errReply: 'Réponse indisponible pour le moment.',
      videoTitle: 'Ask MEDA — courte orientation',
      videoSkip: 'Continuer vers le chat',
      videoReplay: 'Relire la vidéo',
      videoHint: 'Appuyez pour lire · son désactivable',
    },
    en: {
      headSub: 'AI assistant · No personal data in chat · Browser session only',
      close: 'Close',
      placeholder: 'Your question about services, process, or visa basics…',
      send: 'Send',
      roleAsk: 'Are you an employer or a skilled professional?',
      roleEmp: 'Employer',
      rolePro: 'Professional',
      readyEmp:
        'Thank you. I answer general employer questions about placement, process, and soft-launch. Do not send names, emails, phone numbers, or documents here. For concrete enquiries use fuer-arbeitgeber.html or kontakt.html.',
      readyPro:
        'Thank you. I answer general questions for professionals on the Maghreb–Germany path. Do not send personal data or CVs here. For the waitlist / application use bewerben.html only.',
      cta: 'Waitlist / application',
      errNet: 'Network error — please try again later or use kontakt.html.',
      errReply: 'Reply currently unavailable.',
      videoTitle: 'Ask MEDA — short orientation',
      videoSkip: 'Continue to chat',
      videoReplay: 'Play video again',
      videoHint: 'Tap to play · mute available',
    },
  };

  var LANGS = [
    { id: 'de', label: 'Deutsch' },
    { id: 'ar', label: 'العربية' },
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'English' },
  ];

  function t() {
    return COPY[locale] || COPY.de;
  }

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span aria-hidden="true">▶</span> <span id="meda-ask-fab-label">Ask MEDA</span></button>' +
    '<div id="meda-ask-video" hidden role="dialog" aria-modal="true" aria-label="Ask MEDA video">' +
    '<div class="meda-ask-video-card">' +
    '<div class="meda-ask-video-head"><strong id="meda-ask-video-title">Ask MEDA</strong>' +
    '<button type="button" id="meda-ask-video-close" aria-label="Close">×</button></div>' +
    '<video id="meda-ask-video-el" playsinline webkit-playsinline preload="metadata" controls ' +
    'poster=""></video>' +
    '<p id="meda-ask-video-hint" class="meda-ask-video-hint"></p>' +
    '<div class="meda-ask-video-actions">' +
    '<button type="button" id="meda-ask-video-skip" class="meda-ask-choice is-selected">Weiter</button>' +
    '<button type="button" id="meda-ask-video-replay" class="meda-ask-choice">Replay</button>' +
    '</div></div></div>' +
    '<div id="meda-ask-panel" role="dialog" aria-label="Ask MEDA">' +
    '<div id="meda-ask-head"><div><strong>Ask MEDA</strong>' +
    '<span id="meda-ask-head-sub">KI-Assistent · DE / AR / FR / EN</span></div>' +
    '<button type="button" id="meda-ask-close" aria-label="Close">×</button></div>' +
    '<div id="meda-ask-msgs"></div>' +
    '<form id="meda-ask-form" hidden><input id="meda-ask-input" maxlength="1000" autocomplete="off" ' +
    'placeholder=""/><button id="meda-ask-send" type="submit">Send</button></form>' +
    '</div>';
  document.body.appendChild(root);

  var msgs = root.querySelector('#meda-ask-msgs');
  var fab = root.querySelector('#meda-ask-fab');
  var form = root.querySelector('#meda-ask-form');
  var input = root.querySelector('#meda-ask-input');
  var sendBtn = root.querySelector('#meda-ask-send');
  var headSub = root.querySelector('#meda-ask-head-sub');
  var closeBtn = root.querySelector('#meda-ask-close');
  var videoWrap = root.querySelector('#meda-ask-video');
  var videoEl = root.querySelector('#meda-ask-video-el');
  var videoTitle = root.querySelector('#meda-ask-video-title');
  var videoHint = root.querySelector('#meda-ask-video-hint');
  var videoSkip = root.querySelector('#meda-ask-video-skip');
  var videoReplay = root.querySelector('#meda-ask-video-replay');
  var videoClose = root.querySelector('#meda-ask-video-close');
  var started = false;

  videoEl.src = VIDEO_SRC;
  videoEl.setAttribute('src', VIDEO_SRC);

  function bubble(text, cls) {
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble ' + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function choices(options, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'meda-ask-choices';
    options.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'meda-ask-choice';
      b.textContent = opt.label;
      if (opt.dir) b.setAttribute('dir', opt.dir);
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
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function applyChrome() {
    var c = t();
    headSub.textContent = c.headSub;
    closeBtn.setAttribute('aria-label', c.close);
    input.placeholder = c.placeholder;
    sendBtn.textContent = c.send;
    videoTitle.textContent = c.videoTitle;
    videoHint.textContent = c.videoHint;
    videoSkip.textContent = c.videoSkip;
    videoReplay.textContent = c.videoReplay;
    videoClose.setAttribute('aria-label', c.close);
    root.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  }

  function markVideoSeen() {
    videoSeen = true;
    try {
      sessionStorage.setItem('medaAskVideoSeen', '1');
    } catch (e) {}
  }

  function playVideo() {
    videoWrap.hidden = false;
    root.setAttribute('data-video', '1');
    applyChrome();
    videoEl.muted = true;
    videoEl.currentTime = 0;
    var p = videoEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        /* autoplay blocked — controls remain for tap-to-play */
      });
    }
  }

  function closeVideo(goChat) {
    try {
      videoEl.pause();
    } catch (e) {}
    videoWrap.hidden = true;
    root.removeAttribute('data-video');
    markVideoSeen();
    if (goChat) {
      root.setAttribute('data-open', '1');
      fab.setAttribute('aria-expanded', 'true');
      startOnboarding();
    }
  }

  function startOnboarding() {
    if (started) return;
    started = true;
    msgs.innerHTML = '';
    history = [];
    step = 'lang';
    form.hidden = true;
    bubble('Ask MEDA · MEDA Vermittlung', 'sys');
    bubble('Please choose your language / Bitte Sprache wählen / Choisissez votre langue / يُرجى اختيار اللغة', 'bot');
    choices(
      LANGS.map(function (l) {
        return { id: l.id, label: l.label, dir: l.id === 'ar' ? 'rtl' : 'ltr' };
      }),
      function (opt) {
        locale = opt.id;
        applyChrome();
        bubble(opt.label, 'user');
        askRole();
      }
    );
  }

  function askRole() {
    step = 'role';
    bubble(t().roleAsk, 'bot');
    choices(
      [
        { id: 'employer', label: t().roleEmp },
        { id: 'professional', label: t().rolePro },
      ],
      function (opt) {
        role = opt.id;
        bubble(opt.label, 'user');
        enterChat();
      }
    );
  }

  function enterChat() {
    step = 'chat';
    var c = t();
    bubble(role === 'employer' ? c.readyEmp : c.readyPro, 'sys');
    form.hidden = false;
    input.focus();
  }

  function setOpen(open) {
    if (open) {
      if (!videoSeen) {
        playVideo();
        return;
      }
      root.setAttribute('data-open', '1');
      fab.setAttribute('aria-expanded', 'true');
      startOnboarding();
      if (step === 'chat') input.focus();
    } else {
      root.setAttribute('data-open', '0');
      fab.setAttribute('aria-expanded', 'false');
      closeVideo(false);
    }
  }

  fab.addEventListener('click', function () {
    var isOpen = root.getAttribute('data-open') === '1' || root.getAttribute('data-video') === '1';
    if (isOpen) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  });
  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });
  videoClose.addEventListener('click', function () {
    closeVideo(true);
  });
  videoSkip.addEventListener('click', function () {
    closeVideo(true);
  });
  videoReplay.addEventListener('click', function () {
    videoEl.currentTime = 0;
    videoEl.muted = false;
    videoEl.play().catch(function () {});
  });
  videoEl.addEventListener('ended', function () {
    markVideoSeen();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (step !== 'chat') return;
    var text = (input.value || '').trim();
    if (!text) return;
    input.value = '';
    bubble(text, 'user');
    history.push({ role: 'user', content: text });
    sendBtn.disabled = true;
    try {
      var res = await fetch(String(API).replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          locale: locale || 'de',
          visitor_role: role || 'professional',
          messages: history.slice(-6),
        }),
      });
      var data = await res.json();
      var reply = (data && (data.reply || data.error)) || t().errReply;
      bubble(reply, 'bot');
      if (data && data.ok && data.reply) history.push({ role: 'assistant', content: data.reply });
      if (data && data.cta) {
        var a = document.createElement('div');
        a.className = 'meda-ask-bubble sys';
        var href = data.cta;
        if (role === 'employer' && /bewerben\.html/i.test(href)) href = 'fuer-arbeitgeber.html';
        a.innerHTML = '<a href="' + href + '">' + t().cta + '</a>';
        msgs.appendChild(a);
        msgs.scrollTop = msgs.scrollHeight;
      }
    } catch (err) {
      bubble(t().errNet, 'bot');
    } finally {
      sendBtn.disabled = false;
    }
  });
})();
