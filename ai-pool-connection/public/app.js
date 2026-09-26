const messagesEl = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const providersEl = document.getElementById('providers');
const budgetEl = document.getElementById('budget');
const resetBtn = document.getElementById('reset');

function addMessage(role, text, meta, extraClass = '') {
  const el = document.createElement('div');
  el.className = `msg ${role} ${extraClass}`.trim();
  el.textContent = text;
  if (meta) {
    const m = document.createElement('span');
    m.className = 'meta';
    m.textContent = meta;
    el.appendChild(m);
  }
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function renderStatus(status) {
  if (!status) return;
  budgetEl.textContent = `budget: $${status.spentUsd} / $${status.budgetUsd} · ${status.callCount} calls`;
  providersEl.innerHTML = '';
  for (const p of status.providers) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot ${p.configured ? 'on' : ''}"></span>${p.label}<span class="tierbadge">${p.tier}</span>`;
    providersEl.appendChild(li);
  }
}

async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    renderStatus(await res.json());
  } catch (_) {}
}

function selectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage('user', text);
  const mode = selectedMode();
  const typing = addMessage('jarvis', mode === 'council' ? 'Convening the council…' : 'Thinking…', null, 'typing');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, mode }),
    });
    const data = await res.json();
    typing.remove();
    if (!res.ok) {
      addMessage('jarvis', `Error: ${data.error || res.status}`);
      return;
    }
    if (data.mode === 'council') {
      const el = addMessage('jarvis', data.final, `coordinator: ${data.coordinator.provider} (${data.coordinator.tier}) · total $${data.totalCostUsd}`, 'council');
      data.panel.forEach((p, i) => {
        const pl = document.createElement('div');
        pl.className = 'panelist';
        pl.textContent = p.ok ? `Panelist ${i + 1} — ${p.provider} (${p.tier}): ${p.text}` : `Panelist ${i + 1} — ${p.provider} failed: ${p.error}`;
        el.insertBefore(pl, el.querySelector('.meta'));
      });
    } else {
      addMessage('jarvis', data.text, `${data.providerLabel} · ${data.model} · $${data.costUsd} · ${data.tier}`);
    }
    renderStatus(data.status);
  } catch (err) {
    typing.remove();
    addMessage('jarvis', `Error: ${err.message}`);
  }
});

resetBtn.addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  messagesEl.innerHTML = '';
  addMessage('jarvis', 'Conversation reset. How can I help?');
  loadStatus();
});

addMessage('jarvis', "Hi, I'm Jarvis. I pool multiple AI models and pick the cheapest capable one. Ask me anything, or switch to Council mode to have several models collaborate.");
loadStatus();
