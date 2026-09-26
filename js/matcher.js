(function () {
  'use strict';

  var state = {
    path: null,
    role: null,
    lang: null,
    experience: null
  };

  function currentLang() {
    try {
      var s = localStorage.getItem('abk_lang');
      if (s === 'fr' || s === 'en' || s === 'de') return s;
    } catch (e) {}
    return (document.documentElement.lang || 'de').slice(0, 2);
  }

  function t(key) {
    if (window.ABK_I18N && typeof window.ABK_I18N === 'object') {
      var lang = currentLang();
      var pack = window.ABK_I18N[lang] || window.ABK_I18N.de;
      if (pack && pack[key] != null) return pack[key];
      if (window.ABK_I18N.de && window.ABK_I18N.de[key] != null) return window.ABK_I18N.de[key];
    }
    return key;
  }

  function loc(obj) {
    if (!obj) return '';
    var lang = currentLang();
    return obj[lang] || obj.de || obj.en || '';
  }

  function langRank(level) {
    return level === 'B2' ? 2 : 1;
  }

  function filterOffers() {
    var offers = window.ABK_OFFERS || [];
    if (!state.path || !state.lang || state.experience === null) return [];
    var userLang = langRank(state.lang);
    var wantExp = state.experience === true;
    return offers.filter(function (o) {
      if (o.path !== state.path) return false;
      if (state.path !== 'ausbildung' && state.role && o.role !== state.role) return false;
      if (langRank(o.langMin) > userLang) return false;
      if (!wantExp && o.experienceRequired) return false;
      return true;
    });
  }

  function setPressed(group, value) {
    document.querySelectorAll('[data-match-group="' + group + '"]').forEach(function (btn) {
      var on = btn.getAttribute('data-match-value') === String(value);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('is-active', on);
    });
  }

  function showStep(id, show) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = !show;
  }

  function renderOffers() {
    var root = document.getElementById('match-results');
    var empty = document.getElementById('match-empty');
    var countEl = document.getElementById('match-count');
    if (!root) return;
    var list = filterOffers();
    root.replaceChildren();
    if (countEl) {
      countEl.textContent = t('match.count').replace('{n}', String(list.length));
    }
    if (!state.path || !state.lang || state.experience === null) {
      if (empty) empty.hidden = true;
      return;
    }
    if (!list.length) {
      if (empty) {
        empty.hidden = false;
        empty.querySelector('[data-i18n="match.empty"]').textContent = t('match.empty');
        var hint = empty.querySelector('[data-i18n="match.empty.hint"]');
        if (hint) hint.textContent = t('match.empty.hint');
      }
      return;
    }
    if (empty) empty.hidden = true;
    list.forEach(function (o) {
      var card = document.createElement('article');
      card.className = 'offer-card reveal in';
      var expLabel = o.experienceRequired ? t('match.exp.yes') : t('match.exp.no');
      var top = document.createElement('div');
      top.className = 'offer-top';
      var pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = loc(o.tags);
      var langPill = document.createElement('span');
      langPill.className = 'offer-lang';
      langPill.textContent = o.langMin + '+';
      top.appendChild(pill);
      top.appendChild(langPill);
      var title = document.createElement('h3');
      title.textContent = loc(o.title);
      var locP = document.createElement('p');
      locP.className = 'offer-loc';
      locP.textContent = loc(o.city) + ' · ' + loc(o.region);
      var meta = document.createElement('ul');
      meta.className = 'offer-meta';
      var langLi = document.createElement('li');
      var langStrong = document.createElement('strong');
      langStrong.textContent = t('match.meta.lang') + ': ';
      langLi.appendChild(langStrong);
      langLi.appendChild(document.createTextNode(o.langMin + (o.langMin === 'B2' ? ' (' + t('match.meta.c1') + ')' : '')));
      var expLi = document.createElement('li');
      var expStrong = document.createElement('strong');
      expStrong.textContent = t('match.meta.exp') + ': ';
      expLi.appendChild(expStrong);
      expLi.appendChild(document.createTextNode(expLabel));
      meta.appendChild(langLi);
      meta.appendChild(expLi);
      var cta = document.createElement('a');
      cta.className = 'btn btn-outline btn-sm';
      cta.href = 'kontakt.html';
      cta.textContent = t('match.cta');
      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(locP);
      card.appendChild(meta);
      card.appendChild(cta);
      root.appendChild(card);
    });
  }

  function onPath(path) {
    state.path = path;
    state.role = path === 'ausbildung' ? 'ausbildung' : null;
    state.lang = null;
    state.experience = null;
    setPressed('path', path);
    setPressed('role', '');
    setPressed('lang', '');
    setPressed('exp', '');
    var needRole = path === 'healthcare' || path === 'other';
    showStep('match-roles', needRole);
    showStep('match-filters', !needRole);
    showStep('match-results-wrap', !needRole);
    document.querySelectorAll('#match-roles [data-match-group="role"]').forEach(function (btn) {
      var show = btn.getAttribute('data-path') === path;
      btn.hidden = !show;
    });
    if (!needRole) {
      showStep('match-filters', true);
      showStep('match-results-wrap', true);
    }
    renderOffers();
    var roles = document.getElementById('match-roles');
    if (roles && needRole) roles.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onRole(role) {
    state.role = role;
    state.lang = null;
    state.experience = null;
    setPressed('role', role);
    setPressed('lang', '');
    setPressed('exp', '');
    showStep('match-filters', true);
    showStep('match-results-wrap', true);
    renderOffers();
    var filters = document.getElementById('match-filters');
    if (filters) filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onLang(lang) {
    state.lang = lang;
    setPressed('lang', lang);
    renderOffers();
  }

  function onExp(val) {
    state.experience = val === 'yes';
    setPressed('exp', val);
    renderOffers();
  }

  function bind() {
    var root = document.getElementById('candidate-matcher');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-match-group]');
      if (!btn || !root.contains(btn)) return;
      var group = btn.getAttribute('data-match-group');
      var value = btn.getAttribute('data-match-value');
      if (group === 'path') onPath(value);
      else if (group === 'role') onRole(value);
      else if (group === 'lang') onLang(value);
      else if (group === 'exp') onExp(value);
    });
    document.addEventListener('abk:lang', function () {
      // refresh visible i18n on dynamic bits
      document.querySelectorAll('#candidate-matcher [data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        var val = t(key);
        if (val) el.textContent = val;
      });
      renderOffers();
    });
    // deep-link support
    if (location.hash === '#paths' || location.hash === '#matcher') {
      var el = document.getElementById('paths') || document.getElementById('candidate-matcher');
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth' }); }, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
