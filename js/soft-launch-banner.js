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
    '#meda-soft-launch{position:sticky;top:0;z-index:9999;background:#1A1238;color:#F4F1F8;' +
    'padding:.55rem 1.15rem;font:500 .82rem/1.45 Inter,system-ui,sans-serif;text-align:center;' +
    'border-bottom:2px solid #9E4FAB}' +
    '#meda-soft-launch strong{font-weight:650;color:#fff}' +
    '#meda-soft-launch span[lang=en]{display:block;font-weight:500;opacity:.82;margin-top:.18rem;font-size:.75rem}';
  document.head.appendChild(style);
  function mount() {
    if (!document.body || document.body.classList.contains('esign-page')) return;
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
