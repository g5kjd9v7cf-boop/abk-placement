(function () {
  if (window.__medaSoftLaunchBanner) return;
  window.__medaSoftLaunchBanner = true;
  var bar = document.createElement('div');
  bar.id = 'meda-soft-launch';
  bar.setAttribute('role', 'status');
  bar.innerHTML =
    '<strong>Hinweis (vor Gewerbeanmeldung):</strong> ' +
    'Diese Website dient der Information und Interessentenaufnahme. ' +
    'Bindende Vermittlungsverträge und entgeltliche Platzierung starten erst nach abgeschlossener Gewerbeanmeldung. ' +
    'Derzeit keine Vermittlungsgebühren und keine Vertragsabschlüsse über diese Seite. ' +
    '<span lang="en">Info/waitlist only until business registration is complete — no placement fees or binding contracts yet.</span>';
  var style = document.createElement('style');
  style.textContent =
    '#meda-soft-launch{position:sticky;top:0;z-index:9999;background:#1e3a5f;color:#fff;' +
    'padding:.65rem 1rem;font:600 .85rem/1.35 Inter,system-ui,sans-serif;text-align:center}' +
    '#meda-soft-launch span[lang=en]{display:block;font-weight:500;opacity:.9;margin-top:.25rem;font-size:.8rem}';
  document.head.appendChild(style);
  function mount() {
    if (document.body) document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
