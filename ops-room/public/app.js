(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    base: localStorage.getItem('opsroom_base') || 'http://127.0.0.1:8790',
    token: localStorage.getItem('opsroom_token') || '',
    who: localStorage.getItem('opsroom_who') || '',
    opId: null,
    lastId: 0,
    pollTimer: null,
    opsTimer: null,
  };

  // --- API helpers ---------------------------------------------------------
  function headers(withAuth) {
    var h = { 'Content-Type': 'application/json' };
    if (withAuth && state.token) h.Authorization = 'Bearer ' + state.token;
    return h;
  }
  function api(path, opts) {
    opts = opts || {};
    return fetch(state.base.replace(/\/+$/, '') + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
    });
  }
  function setConn(ok) {
    var el = $('connStatus');
    el.textContent = ok ? 'connected' : 'disconnected';
    el.className = 'pill ' + (ok ? 'pill-ok' : 'pill-muted');
  }

  // --- Rendering -----------------------------------------------------------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function timeShort(iso) {
    try { var d = new Date(iso); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch (e) { return ''; }
  }

  function renderOps(list) {
    var ul = $('opList');
    ul.innerHTML = '';
    (list || []).forEach(function (op) {
      var li = document.createElement('li');
      if (op.id === state.opId) li.className = 'active';
      li.innerHTML = '<div class="op-title">' + esc(op.title) + '</div>' +
        '<div class="op-sub">' + esc(op.status) + ' · ' + (op.participant_count || 0) + ' agents · ' + (op.message_count || 0) + ' msgs</div>';
      li.onclick = function () { selectOp(op.id); };
      ul.appendChild(li);
    });
  }

  function appendMessages(msgs) {
    var feed = $('feed');
    (msgs || []).forEach(function (m) {
      var wrap = document.createElement('div');
      wrap.className = 'msg role-' + esc(m.role);
      var kindTag = (m.kind && m.kind !== 'msg' && m.role !== 'system')
        ? '<span class="kind-tag kind-' + esc(m.kind) + '">' + esc(m.kind) + '</span>' : '';
      wrap.innerHTML =
        '<div class="meta"><span class="author">' + esc(m.author) + '</span>' + kindTag +
        ' <span class="time">' + timeShort(m.created_at) + '</span></div>' +
        '<div class="bubble">' + esc(m.body) + '</div>';
      feed.appendChild(wrap);
      state.lastId = Math.max(state.lastId, m.id);
    });
    if ((msgs || []).length) feed.scrollTop = feed.scrollHeight;
  }

  function renderParticipants(list) {
    var ul = $('participantList');
    ul.innerHTML = '';
    (list || []).forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="badge ' + esc(p.role) + '"></span>' +
        '<span class="pname">' + esc(p.name) + '</span>' +
        '<span class="prole">' + esc(p.role) + '</span>';
      ul.appendChild(li);
    });
    $('pCount').textContent = (list || []).length;
  }

  // --- Actions -------------------------------------------------------------
  function loadOps() {
    return api('/api/operations').then(function (res) {
      setConn(res.ok);
      if (res.ok) renderOps(res.body.operations);
    }).catch(function () { setConn(false); });
  }

  function selectOp(id) {
    state.opId = id;
    state.lastId = 0;
    $('feed').innerHTML = '';
    if (state.pollTimer) clearInterval(state.pollTimer);
    api('/api/operations/' + id).then(function (res) {
      if (!res.ok) return;
      $('opTitle').textContent = res.body.operation.title;
      $('opMeta').textContent = 'id ' + res.body.operation.id + ' · ' + res.body.operation.status;
      $('composer').hidden = false;
      $('closeOpBtn').hidden = false;
      renderParticipants(res.body.participants);
      appendMessages(res.body.messages);
      loadOps();
    });
    state.pollTimer = setInterval(pollLoop, 1500);
  }

  function pollLoop() {
    if (!state.opId) return;
    api('/api/operations/' + state.opId + '/messages?since=' + state.lastId).then(function (res) {
      if (res.ok && res.body.messages && res.body.messages.length) {
        appendMessages(res.body.messages);
        // refresh participants when there is new activity
        api('/api/operations/' + state.opId).then(function (r2) {
          if (r2.ok) renderParticipants(r2.body.participants);
        });
      }
    });
  }

  function createOp(title) {
    return api('/api/operations', { method: 'POST', headers: headers(true), body: JSON.stringify({ title: title }) })
      .then(function (res) {
        if (res.ok) { loadOps(); selectOp(res.body.id); }
        else alert('Create failed: ' + (res.body && res.body.error));
      });
  }

  function joinOp() {
    if (!state.opId || !state.who) { alert('Enter your name first.'); return; }
    api('/api/operations/' + state.opId + '/join', {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({ name: state.who, role: $('role').value })
    }).then(function (res) {
      if (!res.ok) alert('Join failed: ' + (res.body && res.body.error));
      else pollLoop();
    });
  }

  function sendMsg(body) {
    if (!state.opId) return;
    return api('/api/operations/' + state.opId + '/messages', {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({ author: state.who || 'anonymous', role: $('role').value, kind: $('kind').value, body: body })
    }).then(function (res) {
      if (res.ok) pollLoop();
      else alert('Send failed: ' + (res.body && res.body.error));
    });
  }

  // --- Wire up UI ----------------------------------------------------------
  function init() {
    $('apiBase').value = state.base;
    $('apiToken').value = state.token;
    $('who').value = state.who;

    $('apiBase').addEventListener('change', function () {
      state.base = $('apiBase').value.trim(); localStorage.setItem('opsroom_base', state.base); loadOps();
    });
    $('apiToken').addEventListener('change', function () {
      state.token = $('apiToken').value.trim(); localStorage.setItem('opsroom_token', state.token);
    });
    $('who').addEventListener('change', function () {
      state.who = $('who').value.trim(); localStorage.setItem('opsroom_who', state.who);
    });

    $('newOpForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = $('newOpTitle').value.trim();
      if (t) { createOp(t); $('newOpTitle').value = ''; }
    });
    $('joinBtn').addEventListener('click', joinOp);
    $('closeOpBtn').addEventListener('click', function () {
      if (!state.opId) return;
      api('/api/operations/' + state.opId + '/close', { method: 'POST', headers: headers(true) }).then(pollLoop);
    });
    $('composer').addEventListener('submit', function (e) {
      e.preventDefault();
      var b = $('msg').value.trim();
      if (b) { sendMsg(b); $('msg').value = ''; }
    });

    loadOps();
    state.opsTimer = setInterval(loadOps, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
