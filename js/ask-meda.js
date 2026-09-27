(function () {
  if (window.__medaAskLoaded) return;
  window.__medaAskLoaded = true;

  var meta = document.querySelector('meta[name="meda-ask-api"]');
  var API = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var locale = (document.documentElement.lang || 'de').slice(0, 2);
  var history = [];

  var root = document.createElement('div');
  root.id = 'meda-ask-root';
  root.setAttribute('data-open', '0');
  root.innerHTML =
    '<button type="button" id="meda-ask-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="meda-ask-panel">' +
    '<span aria-hidden="true">💬</span> Ask MEDA</button>' +
    '<div id="meda-ask-panel" role="dialog" aria-label="Ask MEDA">' +
    '<div id="meda-ask-head"><div><strong>Ask MEDA</strong>' +
    '<span>KI-Assistent · DE / AR / FR · Keine personenbezogenen Daten im Chat · Sitzung nur im Browser</span></div>' +
    '<button type="button" id="meda-ask-close" aria-label="Schließen">×</button></div>' +
    '<div id="meda-ask-msgs"></div>' +
    '<form id="meda-ask-form"><input id="meda-ask-input" maxlength="1000" autocomplete="off" ' +
    'placeholder="Frage zu Leistungen, Prozess, Visa-Basics…"/><button id="meda-ask-send" type="submit">Senden</button></form>' +
    '</div>';
  document.body.appendChild(root);

  var msgs = root.querySelector('#meda-ask-msgs');
  var fab = root.querySelector('#meda-ask-fab');
  var panel = root.querySelector('#meda-ask-panel');
  var input = root.querySelector('#meda-ask-input');
  var sendBtn = root.querySelector('#meda-ask-send');

  function bubble(text, cls) {
    var d = document.createElement('div');
    d.className = 'meda-ask-bubble ' + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  bubble(
    'Ich bin ein KI-Assistent von MEDA Vermittlung. Ich beantworte allgemeine Fragen zu Leistungen und dem Maghreb→Deutschland-Vermittlungspfad. Bitte senden Sie keine Namen, E-Mails, Telefonnummern oder Lebensläufe hier — zur Bewerbung nutzen Sie bewerben.html (Warteliste). Gespräche werden serverseitig nicht gespeichert.',
    'sys'
  );

  function setOpen(open) {
    root.setAttribute('data-open', open ? '1' : '0');
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) input.focus();
  }
  fab.addEventListener('click', function () {
    setOpen(root.getAttribute('data-open') !== '1');
  });
  root.querySelector('#meda-ask-close').addEventListener('click', function () {
    setOpen(false);
  });

  root.querySelector('#meda-ask-form').addEventListener('submit', async function (e) {
    e.preventDefault();
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
        body: JSON.stringify({ locale: locale, messages: history.slice(-6) }),
      });
      var data = await res.json();
      var reply = (data && (data.reply || data.error)) || 'Antwort derzeit nicht verfügbar.';
      bubble(reply, 'bot');
      if (data && data.ok && data.reply) history.push({ role: 'assistant', content: data.reply });
      if (data && data.cta) {
        var a = document.createElement('div');
        a.className = 'meda-ask-bubble sys';
        a.innerHTML = '<a href="' + data.cta + '">Zur Warteliste / Bewerbung →</a>';
        msgs.appendChild(a);
      }
    } catch (err) {
      bubble('Netzwerkfehler — bitte später erneut versuchen oder kontakt.html nutzen.', 'bot');
    } finally {
      sendBtn.disabled = false;
    }
  });
})();
