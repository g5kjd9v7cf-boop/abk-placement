(function () {
  if (window.__medaAskLoaded) return;
  window.__medaAskLoaded = true;

  var meta = document.querySelector('meta[name="meda-ask-api"]');
  var API = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var locale = null;
  var role = null;
  var step = 'pitch';
  var history = [];
  var started = false;
  var spaceDone = false;
  try {
    spaceDone = sessionStorage.getItem('medaAskSpaceDone') === '1';
  } catch (e) {}

  var COPY = {
    de: {
      headSub: 'Meta AI Agent · Keine personenbezogenen Daten im Chat · Sitzung nur im Browser',
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
      langAsk: 'Welche Sprache möchten Sie nutzen?',
      continuePitch: 'Weiter',
    },
    fr: {
      headSub: 'Meta AI Agent · Aucune donnée personnelle dans le chat · Session navigateur uniquement',
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
      langAsk: 'Quelle langue souhaitez-vous utiliser ?',
      continuePitch: 'Continuer',
    },
    en: {
      headSub: 'Meta AI Agent · No personal data in chat · Browser session only',
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
      langAsk: 'Which language would you like to use?',
      continuePitch: 'Continue',
    },
  };

  var LANGS = [
    { id: 'de', label: 'Deutsch' },
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'English' },
  ];

  var PITCH_LINES = [
    'We are creating the first matching process in the history of immigration — top of the tops.',
    'We are looking for partners.',
    'Wir schaffen den ersten Matching-Prozess in der Geschichte der Immigration — absolute Spitze. Wir suchen Partner.',
  ];

  function t() {
    return COPY[locale] || COPY.de;
  }

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.setAttribute('data-mode', 'space');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span class="meda-ask-fab-dot" aria-hidden="true"></span> <span id="meda-ask-fab-label">Ask MEDA</span></button>' +
    '<div id="meda-ask-panel" role="dialog" aria-label="Ask MEDA · Meta AI Agent">' +
    '<div id="meda-ask-head">' +
    '<div class="meda-ask-agent-id">' +
    '<span class="meda-ask-avatar" aria-hidden="true"></span>' +
    '<div><strong id="meda-ask-head-title">Meta AI Agent</strong>' +
    '<span id="meda-ask-head-sub">Online · MEDA Vermittlung</span></div></div>' +
    '<button type="button" id="meda-ask-close" aria-label="Close">×</button></div>' +
    '<div id="meda-ask-space" class="meda-ask-space"></div>' +
    '<div id="meda-ask-msgs" hidden></div>' +
    '<form id="meda-ask-form" hidden><input id="meda-ask-input" maxlength="1000" autocomplete="off" ' +
    'placeholder=""/><button id="meda-ask-send" type="submit">Send</button></form>' +
    '</div>';
  document.body.appendChild(root);

  var space = root.querySelector('#meda-ask-space');
  var msgs = root.querySelector('#meda-ask-msgs');
  var fab = root.querySelector('#meda-ask-fab');
  var form = root.querySelector('#meda-ask-form');
  var input = root.querySelector('#meda-ask-input');
  var sendBtn = root.querySelector('#meda-ask-send');
  var headTitle = root.querySelector('#meda-ask-head-title');
  var headSub = root.querySelector('#meda-ask-head-sub');
  var closeBtn = root.querySelector('#meda-ask-close');

  function markSpaceDone() {
    spaceDone = true;
    try {
      sessionStorage.setItem('medaAskSpaceDone', '1');
    } catch (e) {}
  }

  function applyChrome() {
    var c = t();
    headTitle.textContent = 'Meta AI Agent';
    headSub.textContent = c.headSub;
    closeBtn.setAttribute('aria-label', c.close);
    input.placeholder = c.placeholder;
    sendBtn.textContent = c.send;
    root.setAttribute('dir', 'ltr');
  }

  function bubble(text, cls) {
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble ' + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
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
    space.innerHTML = '';
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
    tip.innerHTML = '<span></span><span></span><span></span>';
    space.appendChild(tip);
    space.scrollTop = space.scrollHeight;
    window.setTimeout(function () {
      if (tip.parentNode) tip.parentNode.removeChild(tip);
      thenFn();
    }, 650);
  }

  function enterAgentSpace() {
    root.setAttribute('data-mode', 'space');
    space.hidden = false;
    msgs.hidden = true;
    form.hidden = true;
    locale = null;
    role = null;
    started = false;
    step = 'pitch';
    applyChrome();
    headSub.textContent = 'Online · MEDA Vermittlung';
    clearSpace();

    var hero = document.createElement('div');
    hero.className = 'meda-ask-space-hero';
    hero.innerHTML =
      '<div class="meda-ask-presence"><span class="meda-ask-orb" aria-hidden="true"></span>' +
      '<div><strong>Meta AI Agent</strong><em>Present now</em></div></div>';
    space.appendChild(hero);

    var i = 0;
    function nextPitch() {
      if (i >= PITCH_LINES.length) {
        var actions = document.createElement('div');
        actions.className = 'meda-ask-space-actions';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'meda-ask-choice is-selected';
        btn.textContent = 'Continue / Weiter / Continuer';
        btn.addEventListener('click', openLangStep);
        actions.appendChild(btn);
        space.appendChild(actions);
        return;
      }
      showTyping(function () {
        spaceLine(PITCH_LINES[i], 'bot');
        i += 1;
        window.setTimeout(nextPitch, 280);
      });
    }
    window.setTimeout(nextPitch, 200);
  }

  function openLangStep() {
    step = 'lang';
    clearSpace();
    var presence = document.createElement('div');
    presence.className = 'meda-ask-space-hero compact';
    presence.innerHTML =
      '<div class="meda-ask-presence"><span class="meda-ask-orb" aria-hidden="true"></span>' +
      '<div><strong>Meta AI Agent</strong><em>Online</em></div></div>';
    space.appendChild(presence);
    showTyping(function () {
      spaceLine('Which language? / Welche Sprache? / Quelle langue?', 'bot');
      choices(
        LANGS.map(function (l) {
          return { id: l.id, label: l.label };
        }),
        function (opt) {
          locale = opt.id;
          applyChrome();
          openRoleStep();
        },
        space
      );
    });
  }

  function openRoleStep() {
    step = 'role';
    clearSpace();
    var presence = document.createElement('div');
    presence.className = 'meda-ask-space-hero compact';
    presence.innerHTML =
      '<div class="meda-ask-presence"><span class="meda-ask-orb" aria-hidden="true"></span>' +
      '<div><strong>Meta AI Agent</strong><em>Online</em></div></div>';
    space.appendChild(presence);
    showTyping(function () {
      spaceLine(t().roleAsk, 'bot');
      choices(
        [
          { id: 'professional', label: t().rolePro },
          { id: 'employer', label: t().roleEmp },
        ],
        function (opt) {
          role = opt.id;
          finishIntoChat();
        },
        space
      );
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
    msgs.innerHTML = '';
    history = [];
    started = true;
    applyChrome();
    enterChat();
  }

  function startOnboardingFallback() {
    if (locale && role) {
      startChatFromSpace();
      return;
    }
    enterAgentSpace();
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
      root.setAttribute('data-open', '1');
      fab.setAttribute('aria-expanded', 'true');
      if (!spaceDone || !locale || !role) {
        enterAgentSpace();
      } else {
        root.setAttribute('data-mode', 'chat');
        space.hidden = true;
        msgs.hidden = false;
        if (!started) {
          started = true;
          applyChrome();
          enterChat();
        } else if (step === 'chat') {
          input.focus();
        }
      }
    } else {
      root.setAttribute('data-open', '0');
      fab.setAttribute('aria-expanded', 'false');
    }
  }

  fab.addEventListener('click', function () {
    setOpen(root.getAttribute('data-open') !== '1');
  });
  closeBtn.addEventListener('click', function () {
    setOpen(false);
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
