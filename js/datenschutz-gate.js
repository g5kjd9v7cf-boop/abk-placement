(function () {
  'use strict';

  var OBJECT_KEY = 'meda_pageview_objection';

  document.documentElement.classList.remove('gate-pending', 'gate-declined');

  function objected() {
    try {
      return localStorage.getItem(OBJECT_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function fill(root) {
    var lang = (document.documentElement.lang || 'de').slice(0, 2);
    var packs = window.ABK_I18N || {};
    var pack = packs[lang] || packs.de || {};
    var fallback = packs.de || {};
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = pack[key] != null ? pack[key] : fallback[key];
      if (val != null) el.textContent = val;
    });
  }

  function buildNotice() {
    var bar = document.createElement('div');
    bar.id = 'meda-li-notice';
    bar.className = 'li-notice';
    bar.setAttribute('role', 'region');

    var text = document.createElement('p');
    text.setAttribute('data-i18n', objected() ? 'gate.objected' : 'gate.notice');

    var actions = document.createElement('div');
    actions.className = 'li-notice-actions';

    var more = document.createElement('a');
    more.href = 'datenschutz.html';
    more.setAttribute('data-i18n', 'gate.more');
    actions.appendChild(more);

    if (!objected()) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-sm li-object';
      button.setAttribute('data-i18n', 'gate.object');
      button.addEventListener('click', function () {
        try { localStorage.setItem(OBJECT_KEY, '1'); } catch (e) { /* ignore */ }
        var fresh = buildNotice();
        bar.replaceWith(fresh);
        fill(fresh);
      });
      actions.appendChild(button);
    }

    bar.appendChild(text);
    bar.appendChild(actions);
    return bar;
  }

  function mount() {
    if (document.getElementById('meda-li-notice')) return;
    var bar = buildNotice();
    document.body.insertBefore(bar, document.body.firstChild);
    fill(bar);
  }

  function init() {
    document.documentElement.classList.remove('gate-pending', 'gate-declined');
    mount();
    document.addEventListener('abk:lang', function () {
      var bar = document.getElementById('meda-li-notice');
      if (bar) fill(bar);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
