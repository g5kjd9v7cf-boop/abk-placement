(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var token = q.get('token') || '';
  var offer = q.get('offer') || '';
  document.getElementById('tok').textContent = token || '(fehlt)';
  document.getElementById('off').textContent = offer || '(fehlt)';
  var contract = document.getElementById('to-contract');
  contract.href =
    'contract-draft.html?token=' +
    encodeURIComponent(token) +
    '&offer=' +
    encodeURIComponent(offer) +
    '&decision=accept';

  function askBase() {
    var cfg = window.MEDA_ENDPOINTS || {};
    if (cfg.ask) return String(cfg.ask).replace(/\/$/, '');
    var meta = document.querySelector('meta[name="meda-ask-api"]');
    return ((meta && meta.content) || '').replace(/\/$/, '');
  }

  document.getElementById('btn-accept').addEventListener('click', async function () {
    var st = document.getElementById('st');
    st.hidden = false;
    st.className = 'platform-status is-ok';
    st.textContent = 'Speichere…';
    var API = askBase();
    try {
      if (!API) throw new Error('no_endpoint');
      var res = await fetch(API + '/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'employer_accept',
          page: 'accept.html',
          candidate_token: token,
          ops: {
            type: 'employer_accept',
            ts: new Date().toISOString(),
            candidate_token: token,
            offer_id: offer,
            route_flag: token ? 'de' : null,
            route_flag_doc:
              'Matches for Germany are handled by the partner team in Germany. Employers are not contacted automatically.',
            employer_outreach: { status: 'accept_recorded_pending_review', auto_send: false },
            soft_launch: true
          }
        })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
      st.textContent =
        'Ihre Annahme ist gespeichert. Es wird keine automatische E-Mail versendet. Vorgangsnummer: ' +
        (token || '—');
    } catch (e) {
      st.className = 'platform-status is-err';
      st.textContent = '';
      st.appendChild(document.createTextNode('Das hat nicht geklappt. Bitte schreiben Sie an '));
      var mail = document.createElement('a');
      mail.href = 'mailto:meda-vermittlung@agentmail.to';
      mail.textContent = 'meda-vermittlung@agentmail.to';
      st.appendChild(mail);
      st.appendChild(document.createTextNode(' oder '));
      var team = document.createElement('a');
      team.href = 'mailto:MEDA-team@outlook.com';
      team.textContent = 'MEDA-team@outlook.com (Team / Outlook)';
      st.appendChild(team);
      st.appendChild(document.createTextNode(' oder öffnen Sie die '));
      var page = document.createElement('a');
      page.href = 'kontakt.html';
      page.textContent = 'Kontaktseite';
      st.appendChild(page);
      st.appendChild(document.createTextNode('.'));
    }
  });
})();
