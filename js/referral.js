/* Referral code for marketer links (?ref=M001).
   The code stays in the address and is copied onto same-site links.
   It is not stored in the browser. The current address is left unchanged.
   A missing, unknown or inactive code becomes "direkt" on the Bewerbung form. */
(function (win) {
  'use strict';

  var CODE_RE = /^M\d{3,4}$/;
  var DIRECT = 'direkt';
  var ALLOWLIST_HREF = 'data/referral-codes.json';
  var activeCode = null;
  var watching = false;

  function readRawRef() {
    try {
      var params = new URLSearchParams(win.location.search || '');
      if (!params.has('ref')) return '';
      return params.get('ref') || '';
    } catch (e) {
      return '';
    }
  }

  function classify(raw, codes) {
    var code = String(raw == null ? '' : raw).trim().toUpperCase();
    if (!CODE_RE.test(code)) return null;
    for (var i = 0; i < codes.length; i++) {
      if (codes[i] === code) return code;
    }
    return null;
  }

  function loadAllowlist() {
    var fetchFn = win.fetch;
    if (typeof fetchFn !== 'function') return Promise.resolve([]);
    var url;
    try {
      url = new URL(ALLOWLIST_HREF, win.location.href).href;
    } catch (e) {
      url = ALLOWLIST_HREF;
    }
    return fetchFn.call(win, url, { credentials: 'omit', cache: 'no-store' }).then(function (res) {
      if (!res || !res.ok) throw new Error('allowlist');
      return res.json();
    }).then(function (data) {
      var list = data && Array.isArray(data.codes) ? data.codes : [];
      var codes = [];
      for (var i = 0; i < list.length; i++) {
        var code = String(list[i] || '').trim().toUpperCase();
        if (CODE_RE.test(code)) codes.push(code);
      }
      return codes;
    }).catch(function () {
      return [];
    });
  }

  function isCarryLink(anchor) {
    if (!anchor || !anchor.getAttribute) return false;
    var href = anchor.getAttribute('href');
    if (!href) return false;
    var trimmed = String(href).replace(/^\s+/, '');
    if (!trimmed || trimmed.charAt(0) === '#') return false;
    var lower = trimmed.slice(0, 16).toLowerCase();
    if (lower.indexOf('mailto:') === 0 || lower.indexOf('tel:') === 0 || lower.indexOf('javascript:') === 0) {
      return false;
    }
    var url;
    try {
      url = new URL(trimmed, win.location.href);
    } catch (e) {
      return false;
    }
    return url.origin === win.location.origin;
  }

  function withRef(href, code) {
    var url = new URL(href, win.location.href);
    url.searchParams.set('ref', code);
    var absolute = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.indexOf('//') === 0;
    if (absolute) return url.href;
    var path = String(href).split('#')[0].split('?')[0];
    return path + url.search + (url.hash || '');
  }

  function rewrite(code) {
    if (!code || !win.document || !win.document.querySelectorAll) return;
    var anchors = win.document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i];
      if (!isCarryLink(anchor)) continue;
      var href = anchor.getAttribute('href');
      var next = withRef(href, code);
      if (next !== href) anchor.setAttribute('href', next);
    }
  }

  function fillForms(value) {
    if (!win.document || !win.document.querySelectorAll) return;
    var forms = win.document.querySelectorAll('form[action*="formsubmit.co"]');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      var input = form.querySelector ? form.querySelector('input[name="ref_code"]') : null;
      if (!input) {
        input = win.document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', 'ref_code');
        input.type = 'hidden';
        input.name = 'ref_code';
        form.appendChild(input);
      }
      input.value = value;
      if (input.setAttribute) input.setAttribute('value', value);
    }
  }

  function findAnchor(node) {
    while (node && node !== win.document) {
      if (node.tagName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }

  function onActivate(event) {
    if (!activeCode) return;
    var anchor = findAnchor(event && event.target);
    if (!anchor || !isCarryLink(anchor)) return;
    var href = anchor.getAttribute('href');
    var next = withRef(href, activeCode);
    if (next !== href) anchor.setAttribute('href', next);
  }

  function watch(code) {
    if (watching) return;
    watching = true;
    if (win.document && win.document.addEventListener) {
      win.document.addEventListener('click', onActivate, true);
      win.document.addEventListener('auxclick', onActivate, true);
      win.document.addEventListener('contextmenu', onActivate, true);
    }
    var Observer = win.MutationObserver;
    if (!Observer || !win.document || !win.document.body) return;
    try {
      var obs = new Observer(function () { rewrite(code); });
      obs.observe(win.document.body, { childList: true, subtree: true });
    } catch (e) { /* ignore */ }
  }

  function whenReady(fn) {
    if (!win.document) {
      fn();
      return;
    }
    if (win.document.readyState === 'loading') {
      win.document.addEventListener('DOMContentLoaded', fn);
      return;
    }
    fn();
  }

  function start() {
    var raw = readRawRef();
    var allowlist = loadAllowlist();
    var done = new Promise(function (resolve) {
      whenReady(function () {
        allowlist.then(function (codes) {
          var code = classify(raw, codes);
          fillForms(code || DIRECT);
          if (code) {
            activeCode = code;
            rewrite(code);
            watch(code);
          }
          resolve(code || DIRECT);
        }).catch(function () {
          fillForms(DIRECT);
          resolve(DIRECT);
        });
      });
    });
    api.ready = done;
    return done;
  }

  var api = {
    DIRECT: DIRECT,
    CODE_RE: CODE_RE,
    ready: Promise.resolve(DIRECT),
    start: start
  };
  win.MEDA_referral = api;

  if (win.document && !win.MEDA_REFERRAL_NO_AUTO) {
    start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
