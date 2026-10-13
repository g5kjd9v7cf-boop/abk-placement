(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var token = q.get('token') || '';
  var offer = q.get('offer') || '';
  document.getElementById('tok').textContent = token || '(fehlt)';
  document.getElementById('off').textContent = offer || '(fehlt)';

  function askBase() {
    var cfg = window.MEDA_ENDPOINTS || {};
    if (cfg.ask) return String(cfg.ask).replace(/\/$/, '');
    var meta = document.querySelector('meta[name="meda-ask-api"]');
    return ((meta && meta.content) || '').replace(/\/$/, '');
  }

  document.getElementById('btn-deny').addEventListener('click', async function () {
    var st = document.getElementById('st');
    st.hidden = false;
    st.className = 'platform-status is-ok';
    st.textContent = 'Speichere…';
    var API = askBase();
    try {
      if (!API) throw new Error('no_endpoint');
      var noteEl = document.getElementById('note');
      var res = await fetch(API + '/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'employer_deny',
          page: 'deny.html',
          candidate_token: token,
          ops: {
            type: 'employer_deny',
            ts: new Date().toISOString(),
            candidate_token: token,
            offer_id: offer,
            note: (noteEl && noteEl.value) || '',
            employer_outreach: { status: 'deny_recorded_pending_review', auto_send: false },
            soft_launch: true
          }
        })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
      st.textContent = 'Ihre Ablehnung ist gespeichert. Es wird keine automatische E-Mail versendet.';
    } catch (e) {
      st.className = 'platform-status is-err';
      st.textContent = 'Fehler: ' + ((e && e.message) || e);
    }
  });
})();
