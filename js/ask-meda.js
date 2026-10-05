(function () {
  if (window.__medaAskLoaded) return;
  window.__medaAskLoaded = true;

  var meta = document.querySelector('meta[name="meda-ask-api"]');
  var API = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var locStr = String(location.pathname || '') + ' ' + String(location.href || '');
  var isEmployerPage = /fuer-arbeitgeber|fuer-arbeitgeber\.html/i.test(locStr);

  var locale = null;
  var role = isEmployerPage ? 'employer' : null;
  var step = 'pitch';
  var history = [];
  var started = false;
  var spaceDone = false;
  try {
    spaceDone = sessionStorage.getItem(isEmployerPage ? 'medaAskEmpSpaceDone' : 'medaAskSpaceDone') === '1';
  } catch (e) {}

  var COPY = {
    de: {
      headSub: isEmployerPage
        ? 'Arbeitgeber-Seitenagent · Antworten nur aus dieser Seite · Fragen ohne personenbezogene Daten protokolliert'
        : 'Meda AI Agent · Keine personenbezogenen Daten im Chat · Sitzung nur im Browser',
      close: 'Schließen',
      placeholder: isEmployerPage
        ? 'Frage zu Prozess, Family Future, Regionen, FAQ…'
        : 'Ihre Frage zu Leistungen, Prozess oder Visa-Basics…',
      send: 'Senden',
      roleAsk: 'Sind Sie Arbeitgeber oder Fachkraft?',
      roleEmp: 'Arbeitgeber',
      rolePro: 'Fachkraft',
      readyEmp: isEmployerPage
        ? 'Ich bin der Agent dieser Arbeitgeberseite. Ich antworte nur aus dem programmierten Inhalt (Sprachpartner, Prozess, Family Future, Regionen, FAQ, Vertrauen). Was hier fehlt, sage ich klar und verweise auf kontakt.html. Ihre Fragen werden ohne personenbezogene Daten protokolliert.'
        : 'Danke. Ich beantworte allgemeine Fragen für Arbeitgeber zu Vermittlung, Prozess und Soft-Launch. Bitte senden Sie hier keine Namen, E-Mails, Telefonnummern oder Unterlagen. Für konkrete Anfragen nutzen Sie fuer-arbeitgeber.html bzw. kontakt.html.',
      readyPro:
        'Danke. Ich beantworte allgemeine Fragen für Fachkräfte zum Pfad aus dem Ausland nach Deutschland. Bitte senden Sie hier keine personenbezogenen Daten oder Lebensläufe. Zur Warteliste / Bewerbung nutzen Sie ausschließlich bewerben.html.',
      cta: isEmployerPage ? 'Zur Kontaktseite' : 'Zur Warteliste / Bewerbung',
      errNet: 'Netzwerkfehler — bitte später erneut versuchen oder kontakt.html nutzen.',
      errReply: 'Ich konnte das gerade nicht beantworten. Bitte schreiben Sie an meda-vermittlung@agentmail.to — wir kümmern uns darum.',
      langAsk: 'Welche Sprache möchten Sie nutzen?',
      continuePitch: 'Weiter',
      grounded: 'Quelle: Arbeitgeberseite',
      fab: isEmployerPage ? 'Arbeitgeber Agent' : 'Ask MEDA',
      typing: 'Agent denkt nach…',
      headTitle: isEmployerPage ? 'Arbeitgeber Agent' : 'Meda AI Agent',
    },
    fr: {
      headSub: isEmployerPage
        ? 'Agent page employeur · Réponses uniquement depuis cette page · Questions journalisées sans données personnelles'
        : 'Meda AI Agent · Aucune donnée personnelle dans le chat · Session navigateur uniquement',
      close: 'Fermer',
      placeholder: isEmployerPage
        ? 'Question sur processus, Family Future, régions, FAQ…'
        : 'Votre question sur les services, le processus ou les bases visa…',
      send: 'Envoyer',
      roleAsk: 'Êtes-vous employeur ou professionnel ?',
      roleEmp: 'Employeur',
      rolePro: 'Professionnel',
      readyEmp: isEmployerPage
        ? 'Je suis l’agent de cette page employeur. Je réponds uniquement au contenu programmé (partenaire linguistique, processus, Family Future, régions, FAQ). Si ce n’est pas ici, je le dis et renvoie vers kontakt.html. Vos questions sont journalisées sans données personnelles.'
        : 'Merci. Je réponds aux questions générales des employeurs sur la mise en relation, le processus et le soft-launch. N’envoyez pas de noms, e-mails, téléphones ou dossiers ici. Pour une demande concrète, utilisez fuer-arbeitgeber.html ou kontakt.html.',
      readyPro:
        'Merci. Je réponds aux questions générales des candidats sur le parcours de l’étranger vers l’Allemagne. N’envoyez pas de données personnelles ni de CV ici. Pour la liste d’attente / candidature, utilisez uniquement bewerben.html.',
      cta: isEmployerPage ? 'Vers la page contact' : 'Liste d’attente / candidature',
      errNet: 'Erreur réseau — réessayez plus tard ou utilisez kontakt.html.',
      errReply: 'Je n’ai pas pu répondre pour le moment. Écrivez à meda-vermittlung@agentmail.to — nous nous en occuperons.',
      langAsk: 'Quelle langue souhaitez-vous utiliser ?',
      continuePitch: 'Continuer',
      grounded: 'Source : page employeur',
      fab: isEmployerPage ? 'Agent employeur' : 'Ask MEDA',
      typing: 'L’agent réfléchit…',
      headTitle: isEmployerPage ? 'Agent employeur' : 'Meda AI Agent',
    },
    en: {
      headSub: isEmployerPage
        ? 'Employer page agent · Answers from this page only · Questions logged without personal data'
        : 'Meda AI Agent · No personal data in chat · Browser session only',
      close: 'Close',
      placeholder: isEmployerPage
        ? 'Ask about process, Family Future, regions, FAQ…'
        : 'Your question about services, process, or visa basics…',
      send: 'Send',
      roleAsk: 'Are you an employer or a skilled professional?',
      roleEmp: 'Employer',
      rolePro: 'Professional',
      readyEmp: isEmployerPage
        ? 'I am the agent for this employer page. I answer only from programmed content (language partner, process, Family Future, regions, FAQ, trust). If it is not on this page, I say so and point to kontakt.html. Your questions are logged without personal data.'
        : 'Thank you. I answer general employer questions about placement, process, and soft-launch. Do not send names, emails, phone numbers, or documents here. For concrete enquiries use fuer-arbeitgeber.html or kontakt.html.',
      readyPro:
        'Thank you. I answer general questions for professionals on the path from abroad to Germany. Do not send personal data or CVs here. For the waitlist / application use bewerben.html only.',
      cta: isEmployerPage ? 'Go to contact page' : 'Waitlist / application',
      errNet: 'Network error — please try again later or use kontakt.html.',
      errReply: 'I could not answer that just now. Please email meda-vermittlung@agentmail.to — we will look into it for you.',
      langAsk: 'Which language would you like to use?',
      continuePitch: 'Continue',
      grounded: 'Source: employer page',
      fab: isEmployerPage ? 'Employer Agent' : 'Ask MEDA',
      typing: 'Agent is thinking…',
      headTitle: isEmployerPage ? 'Employer Agent' : 'Meda AI Agent',
    },
  };

  var LANGS = [
    { id: 'de', label: 'Deutsch' },
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'English' },
  ];

  var PITCH_EMP_DE = [
    'Arbeitgeber-Plattform · Fachkräfte und Familien — klar begleitet, weltweit gedacht.',
    'Dieser Seitenagent antwortet ausschließlich aus dem programmierten Inhalt dieser Plattform. Fragen werden ohne personenbezogene Daten protokolliert. Nur Orientierung — keine Rechtsberatung.',
  ];
  var PITCH_EMP_EN = [
    'Employer platform · Skilled professionals and families — clear guidance, global outlook.',
    'This page agent answers only from programmed content on this platform. Questions are logged without personal data. Orientation only — no legal advice.',
  ];
  var PITCH_GENERAL = [
    'MEDA verbindet qualifizierte Fachkräfte mit Unternehmen in ganz Deutschland. Wir suchen Partnerschaften, um unsere Reichweite zu erweitern und herausragende Talentlösungen zu liefern.',
    "MEDA connects skilled professionals with companies across Germany. We're seeking partnership opportunities to expand our reach and deliver exceptional talent solutions.",
  ];

  function pitchLines() {
    if (!isEmployerPage) return PITCH_GENERAL;
    var loc = locale || defaultLocale();
    if (loc === 'en' || loc === 'fr') return PITCH_EMP_EN;
    return PITCH_EMP_DE;
  }

  function t() {
    return COPY[locale] || COPY.de;
  }

  function defaultLocale() {
    var hl = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2).toLowerCase();
    if (hl === 'fr' || hl === 'en' || hl === 'de') return hl;
    return 'de';
  }

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.setAttribute('data-mode', 'space');
  if (isEmployerPage) root.setAttribute('data-employer-agent', '1');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span class="meda-ask-fab-dot" aria-hidden="true"></span> <span id="meda-ask-fab-label">' +
    (isEmployerPage ? 'Arbeitgeber Agent' : 'Ask MEDA') +
    '</span></button>' +
    '<div id="meda-ask-panel" role="dialog" aria-label="Ask MEDA · Meda AI Agent">' +
    '<div id="meda-ask-head">' +
    '<div class="meda-ask-agent-id">' +
    '<span class="meda-ask-avatar" aria-hidden="true"></span>' +
    '<div><strong id="meda-ask-head-title">' +
    (isEmployerPage ? 'Arbeitgeber Agent' : 'Meda AI Agent') +
    '</strong>' +
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
  var fabLabel = root.querySelector('#meda-ask-fab-label');

  function markSpaceDone() {
    spaceDone = true;
    try {
      sessionStorage.setItem(isEmployerPage ? 'medaAskEmpSpaceDone' : 'medaAskSpaceDone', '1');
    } catch (e) {}
  }

  function applyChrome() {
    var c = t();
    headTitle.textContent = c.headTitle;
    headSub.textContent = c.headSub;
    closeBtn.setAttribute('aria-label', c.close);
    input.placeholder = c.placeholder;
    sendBtn.textContent = c.send;
    if (fabLabel) fabLabel.textContent = c.fab;
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

  function showGroundedChip() {
    var chip = document.createElement('div');
    chip.className = 'meda-ask-bubble sys meda-ask-source';
    chip.textContent = t().grounded;
    msgs.appendChild(chip);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTypingInMsgs() {
    var tip = document.createElement('div');
    tip.className = 'meda-ask-typing meda-ask-typing-chat';
    tip.setAttribute('aria-live', 'polite');
    tip.setAttribute('aria-label', t().typing);
    tip.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(tip);
    msgs.scrollTop = msgs.scrollHeight;
    return tip;
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
    if (!isEmployerPage) {
      locale = null;
      role = null;
    } else {
      role = 'employer';
      if (!locale) locale = defaultLocale();
    }
    started = false;
    step = 'pitch';
    applyChrome();
    headSub.textContent = 'Online · MEDA Vermittlung';
    clearSpace();

    var hero = document.createElement('div');
    hero.className = 'meda-ask-space-hero';
    hero.innerHTML =
      '<div class="meda-ask-presence"><span class="meda-ask-orb" aria-hidden="true"></span>' +
      '<div><strong>' +
      (isEmployerPage ? 'Arbeitgeber Agent' : 'Meda AI Agent') +
      '</strong><em>Online</em></div></div>';
    space.appendChild(hero);

    var lines = pitchLines();
    var i = 0;
    function nextPitch() {
      if (i >= lines.length) {
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
    var presence = document.createElement('div');
    presence.className = 'meda-ask-space-hero compact';
    presence.innerHTML =
      '<div class="meda-ask-presence"><span class="meda-ask-orb" aria-hidden="true"></span>' +
      '<div><strong>' +
      (isEmployerPage ? 'Arbeitgeber Agent' : 'Meda AI Agent') +
      '</strong><em>Online</em></div></div>';
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
          if (isEmployerPage) {
            role = 'employer';
            finishIntoChat();
          } else {
            openRoleStep();
          }
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
      '<div><strong>Meda AI Agent</strong><em>Online</em></div></div>';
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
    if (isEmployerPage) role = 'employer';
    if (!locale) locale = defaultLocale();
    applyChrome();
    enterChat();
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
    var tip = showTypingInMsgs();
    try {
      var payload = {
        locale: locale || defaultLocale(),
        visitor_role: role || (isEmployerPage ? 'employer' : 'professional'),
        messages: history.slice(-6),
      };
      if (isEmployerPage) {
        payload.page = 'fuer-arbeitgeber.html';
        payload.page_source = collectPageSource();
        payload.mode = 'page_agent';
        payload.visitor_role = 'employer';
      }
      var res = await fetch(String(API).replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      var data = await res.json().catch(function () {
        return null;
      });
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
      var reply =
        (data && data.ok && data.reply) ||
        (data && data.reply) ||
        t().errReply;
      if (reply === 'upstream' || reply === 'upstream_parse' || reply === 'backend_unconfigured') {
        reply = t().errReply;
      }
      if (!res.ok && !(data && data.reply)) {
        reply = t().errNet;
      }
      // Client leak filter: redact internal wiring only. Never swap a long grounded answer for a welcome line.
      // Avoid bare "model"/"Modelle" false positives — match config/vendor markers only.
      if (/flagship|budget\s*models?|CODECRAFT|MODEL_PRIMARY|MODEL_FALLBACK|gpt-5\.6|claude-opus|grok-4\.|deepseek|gemma-2|gemini-3\.[67]|no silent fallback|stiller Wechsel|workers\.dev\/kb|system prompt/i.test(String(reply))) {
        reply = t().errReply;
      }
      // Surface escalation from turn-limit / ticket skills
      if (data && (data.escalated || data.skill === 'escalate_email' || data.skill === 'open_support_ticket')) {
        // Keep server reply (already professional); ensure history stores it
      }
      bubble(reply, 'bot');
      if (data && data.reply) history.push({ role: 'assistant', content: data.reply });
      else if (reply && reply !== t().errNet) history.push({ role: 'assistant', content: reply });
      if (data && data.grounded) showGroundedChip();
      if (data && data.cta) {
        var a = document.createElement('div');
        a.className = 'meda-ask-bubble sys';
        var href = data.cta;
        if (isEmployerPage && /bewerben\.html/i.test(href)) href = 'kontakt.html';
        else if (role === 'employer' && /bewerben\.html/i.test(href)) href = 'fuer-arbeitgeber.html';
        a.innerHTML = '<a href="' + href + '">' + t().cta + '</a>';
        msgs.appendChild(a);
        msgs.scrollTop = msgs.scrollHeight;
      }
    } catch (err) {
      if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
      bubble(t().errNet, 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
