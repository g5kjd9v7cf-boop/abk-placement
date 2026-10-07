(function (root) {
  'use strict';

  var RECORD_KEY = 'meda_esign_cv_gate';

  function clean(value) {
    return String(value || '').trim();
  }

  function publicCandidateToken(token) {
    return /^(REF|CAND)-[A-Za-z0-9][A-Za-z0-9-]{2,}$/.test(clean(token));
  }

  function issueCandidateToken() {
    var n = Math.floor(Math.random() * 9000) + 1000;
    var tail = Date.now().toString(36).toUpperCase().slice(-4);
    return 'CAND-' + tail + n;
  }

  function read() {
    try {
      var raw = sessionStorage.getItem(RECORD_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.binding !== false || data.status !== 'ENTWURF') return null;
      if (!publicCandidateToken(data.token)) return null;
      if (data.legal_approved === true) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function write(record) {
    var src = record || {};
    if (!publicCandidateToken(src.token)) return null;
    var stored = {
      token: clean(src.token),
      role: 'candidate',
      binding: false,
      status: 'ENTWURF',
      pack_id: clean(src.pack_id) || 'candidate-soft-launch-0.13',
      signed_at: clean(src.signed_at) || new Date().toISOString(),
      legal_approved: false
    };
    try {
      sessionStorage.setItem(RECORD_KEY, JSON.stringify(stored));
    } catch (e) { /* ignore */ }
    return stored;
  }

  function signUrl(token) {
    var url = new URL('contract-draft.html', root.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('token', publicCandidateToken(token) ? clean(token) : issueCandidateToken());
    url.searchParams.set('flow', 'cv');
    return url.href;
  }

  root.MEDA_ESIGN_GATE = {
    read: read,
    write: write,
    issueCandidateToken: issueCandidateToken,
    publicCandidateToken: publicCandidateToken,
    signUrl: signUrl
  };
})(window);
