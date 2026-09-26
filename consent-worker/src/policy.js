/**
 * Pure checks for the consent worker. No I/O, no secrets.
 * Origins are hardcoded to the HTTPS sites this project actually serves.
 */

export const ALLOWED_ORIGINS = Object.freeze([
  'https://meda-vermittlung.de',
  'https://www.meda-vermittlung.de',
  'https://g5kjd9v7cf-boop.github.io',
]);

export const ROUTE_EVENTS = Object.freeze({
  view: 'erklaerung_view',
  submit: 'consent_given',
  withdraw: 'consent_withdrawn',
  pageview: 'page_visit',
});

export const ALLOWED_EVENTS = Object.freeze(new Set(Object.values(ROUTE_EVENTS)));

export const MAX_BODY_BYTES = 4096;

/** Best-effort, per-isolate only. See README. */
export const STATS_FAIL_LIMIT = 8;
export const STATS_FAIL_WINDOW_MS = 60 * 1000;

const RECEIPT_RE = /^MEDA-[0-9a-f]{32}$/;
const DOC_RE = /^[A-Za-z0-9._-]{1,40}$/;
const PAGE_RE = /^\/[A-Za-z0-9._\-/]{0,119}$/;
const LOCALES = new Set(['de', 'fr', 'en', 'ar']);
const FORM_TYPES = new Set(['contact', 'application']);

export function isAllowedOrigin(origin) {
  if (typeof origin !== 'string' || !ALLOWED_ORIGINS.includes(origin)) return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.origin === origin;
  } catch {
    return false;
  }
}

export function eventForRoute(route) {
  return ROUTE_EVENTS[route] || null;
}

export function isAllowedEvent(event) {
  return ALLOWED_EVENTS.has(event);
}

/**
 * Compare two strings in constant time relative to their contents.
 * Length differences still return false. Empty strings never match.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (aa[i] || 0) ^ (bb[i] || 0);
  }
  return diff === 0;
}

export function bearerToken(authorization) {
  if (typeof authorization !== 'string') return '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match ? match[1] : '';
}

export function retentionCutoffIso(now = new Date(), months = 6) {
  const d = new Date(now.getTime());
  const count = Number.isInteger(months) && months > 0 ? months : 6;
  d.setUTCMonth(d.getUTCMonth() - count);
  return d.toISOString();
}

/** Application profiles, encrypted documents, and the encrypted email. */
export function applicationRetentionCutoffIso(now = new Date()) {
  return retentionCutoffIso(now, 24);
}

export function isExpiredIso(ts, now = new Date()) {
  if (typeof ts !== 'string' || !ts) return true;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return true;
  return t < Date.parse(retentionCutoffIso(now));
}

export function receiptIdFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) {
    throw new Error('receipt bytes');
  }
  let hex = '';
  for (let i = 0; i < 16; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return 'MEDA-' + hex;
}

export function isReceiptId(value) {
  return typeof value === 'string' && RECEIPT_RE.test(value);
}

export function sanitizePage(value) {
  if (typeof value !== 'string') return null;
  const page = value.trim();
  if (!PAGE_RE.test(page) || page.includes('..')) return null;
  return page;
}

export function sanitizeLocale(value) {
  if (typeof value !== 'string') return null;
  const locale = value.trim().toLowerCase();
  return LOCALES.has(locale) ? locale : null;
}

export function sanitizeFormType(value) {
  if (typeof value !== 'string') return null;
  const formType = value.trim();
  return FORM_TYPES.has(formType) ? formType : null;
}

export function sanitizeDocumentVersion(value) {
  if (typeof value !== 'string') return null;
  const version = value.trim();
  return DOC_RE.test(version) ? version : null;
}

function requireBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

/**
 * Whitelist fields for a consent write. Client timestamps, email, IP and
 * unknown properties are ignored. Returns { error } or a row fragment.
 */
export function normalizeEvent(route, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'invalid_body' };
  }
  const event = eventForRoute(route);
  if (!event) return { error: 'not_found' };
  if (Object.prototype.hasOwnProperty.call(body, 'event') && body.event !== event) {
    return { error: 'event_not_allowed' };
  }
  const page = body.page == null || body.page === '' ? null : sanitizePage(body.page);
  if (body.page != null && body.page !== '' && !page) return { error: 'bad_page' };
  const locale = body.locale_shown == null || body.locale_shown === ''
    ? null
    : sanitizeLocale(body.locale_shown);
  if (body.locale_shown != null && body.locale_shown !== '' && !locale) {
    return { error: 'bad_locale' };
  }
  const formType = body.form_type == null || body.form_type === ''
    ? null
    : sanitizeFormType(body.form_type);
  if (body.form_type != null && body.form_type !== '' && !formType) {
    return { error: 'bad_form_type' };
  }
  const documentVersion = body.document_version == null || body.document_version === ''
    ? null
    : sanitizeDocumentVersion(body.document_version);
  if (body.document_version != null && body.document_version !== '' && !documentVersion) {
    return { error: 'bad_document_version' };
  }

  const row = {
    event,
    page,
    locale_shown: locale,
    form_type: formType,
    document_version: documentVersion,
    consent_contact: null,
    consent_share: null,
    consent_pool: null,
    receipt_ref: null,
  };

  if (event === 'consent_given') {
    if (body.consent_contact !== true) return { error: 'consent_contact_required' };
    const share = requireBoolean(body.consent_share);
    if (share === null) return { error: 'consent_share_required' };
    const pool = body.consent_pool == null ? false : requireBoolean(body.consent_pool);
    if (pool === null) return { error: 'consent_pool_invalid' };
    row.consent_contact = 1;
    row.consent_share = share ? 1 : 0;
    row.consent_pool = pool ? 1 : 0;
    if (body.receipt_ref != null && body.receipt_ref !== '' && !isReceiptId(body.receipt_ref)) {
      return { error: 'bad_receipt' };
    }
    row.receipt_ref = isReceiptId(body.receipt_ref) ? body.receipt_ref : null;
  }

  if (event === 'consent_withdrawn') {
    if (!isReceiptId(body.receipt_ref)) return { error: 'bad_receipt' };
    row.receipt_ref = body.receipt_ref;
  }

  return { row };
}

export function createFailLimiter(limit, windowMs) {
  const buckets = new Map();
  function prune(key, time) {
    const prev = buckets.get(key) || [];
    const next = [];
    for (let i = 0; i < prev.length; i++) {
      if (time - prev[i] < windowMs) next.push(prev[i]);
    }
    return next;
  }
  return {
    tooMany(key, time) {
      return prune(key, time).length >= limit;
    },
    record(key, time) {
      const next = prune(key, time);
      next.push(time);
      buckets.set(key, next);
      if (buckets.size > 500) {
        const oldest = buckets.keys().next().value;
        buckets.delete(oldest);
      }
      return next.length >= limit;
    },
  };
}
