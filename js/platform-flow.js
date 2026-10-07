(function () {
  'use strict';

  var API_META = document.querySelector('meta[name="meda-ask-api"]');
  var API = (API_META && API_META.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
  var OPS_TO = 'meda-vermittlung@agentmail.to';

  function toast(el, msg, ok) {
    if (!el) return;
    el.hidden = false;
    el.className = 'platform-status ' + (ok ? 'is-ok' : 'is-err');
    el.textContent = msg;
  }

  function candToken() {
    var n = Math.floor(Math.random() * 9000) + 1000;
    var t = Date.now().toString(36).toUpperCase().slice(-4);
    return 'CAND-' + t + n;
  }

  function empToken() {
    var n = Math.floor(Math.random() * 9000) + 1000;
    var t = Date.now().toString(36).toUpperCase().slice(-4);
    return 'EMP-' + t + n;
  }

  function langRank(level) {
    var m = { A2: 0, B1: 1, B2: 2, C1: 3 };
    return m[String(level || '').toUpperCase()] != null ? m[String(level).toUpperCase()] : 1;
  }

  function matchOffers(profile) {
    var offers = (window.ABK_OFFERS || []).filter(function (o) {
      return o && o.programmed !== false;
    });
    var path = profile.path;
    var role = profile.role;
    var lang = langRank(profile.lang);
    var exp = profile.experience === true || profile.experience === 'yes';
    return offers
      .filter(function (o) {
        if (path && o.path !== path) return false;
        if (path && path !== 'ausbildung' && role && o.role !== role) return false;
        if (langRank(o.langMin) > lang) return false;
        if (!exp && o.experienceRequired) return false;
        return true;
      })
      .slice(0, 5);
  }

  function loc(obj) {
    if (!obj) return '';
    var lang = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2).toLowerCase();
    return obj[lang] || obj.de || obj.en || obj.fr || '';
  }

  function isGermanyOffer(o) {
    return !o.country || String(o.country).toUpperCase() === 'DE';
  }

  async function postIntake(payload) {
    var res = await fetch(String(API).replace(/\/$/, '') + '/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    var data = await res.json().catch(function () {
      return null;
    });
    if (!res.ok || !data || !data.ok) {
      var err = (data && data.error) || 'intake_failed';
      throw new Error(err);
    }
    return data;
  }

  function publicBrief(token, matches) {
    return {
      candidate_token: token,
      match_count: matches.length,
      matches: matches.map(function (o) {
        return {
          offer_id: o.id,
          title: loc(o.title),
          city: loc(o.city),
          region: loc(o.region),
          country: o.country || 'DE',
          path: o.path,
          langMin: o.langMin,
        };
      }),
      notice:
        'Nur hinterlegte Orientierungsangebote. Keine erfundenen Stellen. Keine personenbezogenen Daten in dieser Kurzfassung.',
    };
  }

  function absolutePage(file, params) {
    var url = new URL(file, window.location.href);
    url.search = '';
    url.hash = '';
    Object.keys(params || {}).forEach(function (key) {
      url.searchParams.set(key, params[key]);
    });
    return url.href;
  }

  function buildOpsPayload(token, form, matches) {
    var deMatches = matches.filter(isGermanyOffer);
    var route_flag = deMatches.length ? 'de' : null;
    return {
      type: 'anmeldung_match',
      ts: new Date().toISOString(),
      candidate_token: token,
      route_flag: route_flag,
      route_flag_doc:
        'Matches for Germany are handled by the partner team in Germany. Employers are not contacted automatically.',
      soft_launch: true,
      profile: {
        path: form.path,
        role: form.role,
        lang: form.lang,
        experience: form.experience,
        certs_note: form.certs_note,
        docs_listed: form.docs_listed,
        target_country: form.target_country || 'DE',
      },
      pii_for_ops_only: {
        name: form.name,
        email: form.email,
        phone: form.phone || '',
        hr_email: form.hr_email || '',
      },
      matches: matches.map(function (o) {
        return {
          offer_id: o.id,
          title: loc(o.title),
          city: loc(o.city),
          country: o.country || 'DE',
          germany: isGermanyOffer(o),
        };
      }),
      employer_outreach: (function () {
        var employerToken = empToken();
        return {
          status: 'after_call_only',
          auto_send: false,
          note: 'After Ahmed calls and the employer wants to proceed, send this EMP link. Do not offer a public self-serve signup. Company and offer are filled on the link.',
          accept_url_template: absolutePage('accept.html', { token: token }) + '&offer={offer_id}',
          deny_url_template: absolutePage('deny.html', { token: token }) + '&offer={offer_id}',
          employer_token: employerToken,
          employer_sign_url_template: absolutePage('employer-sign.html', { token: employerToken }) + '&offer={offer_id}&company={company}&name={name}&email={email}',
          employer_sign_links: matches.map(function (o) {
            return {
              offer_id: o.id,
              url: absolutePage('employer-sign.html', { token: employerToken, offer: o.id }),
              auto_send: false,
              status: 'after_call_only'
            };
          })
        };
      })(),
      deliver_to: OPS_TO,
    };
  }

  function renderMatches(root, brief) {
    if (!root) return;
    root.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'match-brief-head';
    head.innerHTML =
      '<p><strong>Kurzfassung</strong> · Vorgangsnummer <code>' +
      brief.candidate_token +
      '</code> · ' +
      brief.match_count +
      ' Treffer</p>' +
      '<p class="form-note">' +
      brief.notice +
      '</p>';
    root.appendChild(head);
    if (!brief.matches.length) {
      var empty = document.createElement('p');
      empty.className = 'form-note';
      empty.textContent =
        'Keine Treffer in den hinterlegten Orientierungsangeboten. Ihre Anmeldung geht an unser Team — ohne erfundene Stellen.';
      root.appendChild(empty);
      return;
    }
    brief.matches.forEach(function (m) {
      var card = document.createElement('article');
      card.className = 'card match-brief-card';
      card.innerHTML =
        '<h3>' +
        escapeHtml(m.title) +
        '</h3>' +
        '<p>' +
        escapeHtml(m.city) +
        (m.region ? ' · ' + escapeHtml(m.region) : '') +
        ' · ' +
        escapeHtml(m.country) +
        '</p>' +
        '<p class="form-note">Mindest-Sprachniveau: ' +
        escapeHtml(m.langMin) +
        '</p>' +
        '<p><a class="btn btn-outline btn-sm" href="contract-draft.html?token=' +
        encodeURIComponent(brief.candidate_token) +
        '&offer=' +
        encodeURIComponent(m.offer_id) +
        '&flow=cv">Anmeldung unterschreiben, danach Lebenslauf</a></p>';
      root.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindAnmeldung() {
    var form = document.getElementById('meda-anmeldung-form');
    if (!form) return;
    var status = document.getElementById('meda-anmeldung-status');
    var results = document.getElementById('meda-anmeldung-matches');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (!fd.get('einwilligung_gelesen')) {
        toast(status, 'Bitte Einwilligung bestätigen.', false);
        return;
      }
      var profile = {
        name: String(fd.get('name') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        hr_email: String(fd.get('hr_email') || '').trim(),
        path: String(fd.get('path') || '').trim(),
        role: String(fd.get('role') || '').trim(),
        lang: String(fd.get('lang') || 'B1').trim(),
        experience: String(fd.get('experience') || '') === 'yes',
        certs_note: String(fd.get('certs_note') || '').trim(),
        docs_listed: String(fd.get('docs_listed') || '').trim(),
        target_country: String(fd.get('target_country') || 'DE').trim(),
      };
      if (!profile.name || !profile.email || !profile.path) {
        toast(status, 'Name, E-Mail und Pfad sind erforderlich.', false);
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      toast(status, 'Anmeldung wird verarbeitet…', true);
      try {
        var token = candToken();
        var matches = matchOffers(profile);
        var brief = publicBrief(token, matches);
        var ops = buildOpsPayload(token, profile, matches);
        await postIntake({
          channel: 'anmeldung',
          page: 'fuer-arbeitgeber.html',
          candidate_token: token,
          public_brief: brief,
          ops: ops,
        });
        renderMatches(results, brief);
        toast(
          status,
          'Anmeldung erfasst. Vorgangsnummer ' +
            token +
            '. Personenbezogene Daten gehen nur an MEDA Vermittlung (' +
            OPS_TO +
            '). Arbeitgeber werden nicht automatisch angeschrieben.',
          true
        );
        form.reset();
      } catch (err) {
        toast(status, '', false);
        status.textContent = '';
        status.appendChild(
          document.createTextNode(
            'Übermittlung fehlgeschlagen. Bitte später erneut versuchen oder die '
          )
        );
        var contactLink = document.createElement('a');
        contactLink.href = 'kontakt.html';
        contactLink.textContent = 'Kontaktseite';
        status.appendChild(contactLink);
        status.appendChild(document.createTextNode(' öffnen.'));
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function bindKontakt() {
    var form = document.querySelector('form.form[action*="formsubmit"], form#meda-kontakt-form, form.form.card');
    if (!form) return;
    if (!/kontakt\.html/i.test(location.pathname + location.href)) return;
    form.setAttribute('id', 'meda-kontakt-form');
    form.removeAttribute('action');
    form.setAttribute('method', 'post');
    var status = document.getElementById('meda-kontakt-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'meda-kontakt-status';
      status.className = 'platform-status';
      status.hidden = true;
      form.appendChild(status);
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (!fd.get('einwilligung_gelesen')) {
        toast(status, 'Bitte Einwilligung bestätigen.', false);
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.setAttribute('data-busy', '1');
      }
      toast(status, 'Nachricht wird gesendet…', true);
      try {
        var payload = {
          channel: 'contact',
          page: 'kontakt.html',
          ops: {
            type: 'contact',
            ts: new Date().toISOString(),
            role: String(fd.get('role') || ''),
            name: String(fd.get('name') || ''),
            email: String(fd.get('email') || ''),
            company: String(fd.get('company') || ''),
            sector: String(fd.get('sector') || ''),
            message: String(fd.get('message') || ''),
            deliver_to: OPS_TO,
            soft_launch: true,
          },
        };
        await postIntake(payload);
        toast(
          status,
          'Ihre Nachricht ist bei MEDA Vermittlung eingegangen. Wir melden uns.',
          true
        );
        form.reset();
      } catch (err) {
        toast(
          status,
          'Senden fehlgeschlagen. Schreiben Sie direkt an ' +
            OPS_TO +
            ' oder MEDA-team@outlook.com (Team / Outlook). (' +
            (err && err.message ? err.message : 'error') +
            ')',
          false
        );
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindAnmeldung();
    bindKontakt();
  });
})();
