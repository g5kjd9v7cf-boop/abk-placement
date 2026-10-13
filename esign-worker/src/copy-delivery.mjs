/**
 * Signer and MEDA copies for the e-sign stub. Not a live mailer.
 * The default acceptor records the delivery and does not open a network connection.
 * Signing is complete only after every required copy has been accepted.
 */

export const MEDA_COPY_ADDRESSES = [
  'meda-vermittlung@agentmail.to',
  'MEDA-team@outlook.com',
];

export function normalizeCopyEmail(value) {
  const email = String(value || '').trim();
  if (!email || email.length > 200 || /[\s]/.test(email)) return '';
  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@')) return '';
  const domain = email.slice(at + 1);
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return '';
  return email.toLowerCase();
}

export function parseCopyChoice(input) {
  const raw = input && typeof input.copy === 'object' && !Array.isArray(input.copy) ? input.copy : null;
  if (!raw) return { ok: false, error: 'COPY_REQUIRED' };
  const download = raw.download === true;
  const entered = Object.prototype.hasOwnProperty.call(raw, 'email') && raw.email != null && String(raw.email).trim() !== '';
  const email = entered ? normalizeCopyEmail(raw.email) : '';
  if (entered && !email) return { ok: false, error: 'COPY_EMAIL_INVALID' };
  if (!email && !download) return { ok: false, error: 'COPY_REQUIRED' };
  return { ok: true, email, download };
}

export function requiredDeliveries(choice) {
  const rows = MEDA_COPY_ADDRESSES.map((destination) => ({
    channel: 'email',
    recipient: 'meda',
    destination,
  }));
  if (choice.email) {
    rows.push({ channel: 'email', recipient: 'signer', destination: choice.email });
  }
  if (choice.download) {
    rows.push({ channel: 'download', recipient: 'signer', destination: '' });
  }
  return rows;
}

export function deliverySatisfied(required, done) {
  return required.every((need) => done.some((got) => (
    got.channel === need.channel
    && got.recipient === need.recipient
    && (need.channel === 'download' || String(got.destination).toLowerCase() === String(need.destination).toLowerCase())
  )));
}

export async function defaultCopyMailer() {
  return { ok: true };
}

export async function acceptCopies({ choice, refId, party, mailer, audit, now }) {
  const required = requiredDeliveries(choice);
  const done = [];
  const send = typeof mailer === 'function' ? mailer : defaultCopyMailer;
  const at = (now instanceof Date ? now : new Date()).toISOString();
  let failed = false;
  for (const row of required) {
    if (row.channel !== 'email') continue;
    let result;
    try {
      result = await send({
        to: row.destination,
        role: row.recipient,
        ref_id: refId,
        party,
        filename: 'contract.pdf',
      });
    } catch {
      result = { ok: false };
    }
    const entry = {
      at,
      action: result && result.ok === true ? 'COPY_DELIVERED' : 'COPY_FAILED',
      channel: 'email',
      recipient: row.recipient,
      destination: row.destination,
      ref_id: refId,
      party,
    };
    if (audit) audit(entry);
    if (entry.action === 'COPY_DELIVERED') done.push(entry);
    else failed = true;
  }
  if (failed) return { failed: true, complete: false, required, done };
  const complete = deliverySatisfied(required, done);
  return { failed: false, complete, pending: !complete, required, done };
}

export function recordDownload(state, meta, audit) {
  const entry = {
    at: meta.at,
    action: 'COPY_DELIVERED',
    channel: 'download',
    recipient: 'signer',
    destination: '',
    ref_id: state.ref_id,
    party: meta.party,
  };
  state.done.push(entry);
  if (audit) audit(entry);
  return deliverySatisfied(state.required, state.done);
}
