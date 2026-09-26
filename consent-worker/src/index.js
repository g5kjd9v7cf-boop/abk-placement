/**
 * MEDA consent log.
 * Stores a minimum proof record only: event, server time, optional page path,
 * receipt id, and boolean consent choices. No email, no IP, no raw body.
 *
 * STATS_TOKEN must be set with `wrangler secret put STATS_TOKEN` after rotating
 * the value that used to be committed in wrangler.toml. This worker reads it
 * from the environment only. IP addresses are not stored (no IP_HASH_PEPPER).
 *
 * Stats failure limit: 8 failed Authorization attempts per client IP per 60s,
 * counted in this isolate's memory only. That is not a global rate limit.
 */

import {
  MAX_BODY_BYTES,
  STATS_FAIL_LIMIT,
  STATS_FAIL_WINDOW_MS,
  bearerToken,
  createFailLimiter,
  eventForRoute,
  isAllowedOrigin,
  isReceiptId,
  normalizeEvent,
  receiptIdFromBytes,
  retentionCutoffIso,
  timingSafeEqual,
} from './policy.js';

const failLimiter = createFailLimiter(STATS_FAIL_LIMIT, STATS_FAIL_WINDOW_MS);

function securityHeaders(extra) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Cache-Control': 'no-store',
    ...extra,
  };
}

function corsHeaders(origin, { allowGet = false } = {}) {
  const headers = {
    'Access-Control-Allow-Methods': allowGet ? 'GET, POST, OPTIONS' : 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...securityHeaders(headers || {}),
    },
  });
}

function routeOf(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.endsWith('/stats')) return 'stats';
  if (path.endsWith('/view')) return 'view';
  if (path.endsWith('/submit')) return 'submit';
  if (path.endsWith('/withdraw')) return 'withdraw';
  if (path.endsWith('/pageview')) return 'pageview';
  return null;
}

function newReceipt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return receiptIdFromBytes(bytes);
}

async function purgeExpired(env, now = new Date()) {
  if (!env.DB) return;
  const cutoff = retentionCutoffIso(now);
  await env.DB.prepare('DELETE FROM consent_events WHERE ts < ?').bind(cutoff).run();
}

async function insertProof(env, row) {
  const full = `INSERT INTO consent_events
      (event, ts, document_version, locale_shown, form_type, receipt_ref, page,
       email, user_agent, referrer, session_id, ip_hash, payload_json,
       consent_contact, consent_share, consent_pool, withdrawn)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, '{}', ?, ?, ?, 0)`;
  try {
    await env.DB.prepare(full)
      .bind(
        row.event,
        row.ts,
        row.document_version,
        row.locale_shown,
        row.form_type,
        row.receipt_ref,
        row.page,
        row.consent_contact,
        row.consent_share,
        row.consent_pool
      )
      .run();
    return { ok: true };
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (!/no such column/i.test(message)) return { ok: false, error: 'storage_error' };
  }
  await env.DB.prepare(
    `INSERT INTO consent_events
      (event, ts, document_version, locale_shown, form_type, receipt_ref, page,
       email, user_agent, referrer, session_id, ip_hash, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, '{}')`
  )
    .bind(
      row.event,
      row.ts,
      row.document_version,
      row.locale_shown,
      row.form_type,
      row.receipt_ref,
      row.page
    )
    .run();
  return { ok: true, legacy_schema: true };
}

async function restrictByReceipt(env, receipt, ts) {
  const existing = await env.DB.prepare(
    `SELECT id FROM consent_events WHERE receipt_ref = ? LIMIT 1`
  )
    .bind(receipt)
    .first();
  if (!existing) return { ok: false, status: 404, error: 'receipt_not_found' };

  try {
    await env.DB.prepare(
      `UPDATE consent_events
         SET withdrawn = 1,
             withdrawn_at = ?,
             email = NULL,
             user_agent = NULL,
             referrer = NULL,
             session_id = NULL,
             ip_hash = NULL,
             payload_json = '{}'
       WHERE receipt_ref = ?`
    )
      .bind(ts, receipt)
      .run();
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (!/no such column/i.test(message)) return { ok: false, status: 500, error: 'storage_error' };
    await env.DB.prepare(
      `UPDATE consent_events
         SET email = NULL,
             user_agent = NULL,
             referrer = NULL,
             session_id = NULL,
             ip_hash = NULL,
             payload_json = '{}',
             layout = 'withdrawn'
       WHERE receipt_ref = ?`
    )
      .bind(receipt)
      .run();
  }
  return { ok: true };
}

async function handleStats(request, env, headers) {
  const url = new URL(request.url);
  const expected = typeof env.STATS_TOKEN === 'string' ? env.STATS_TOKEN : '';
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  if (url.searchParams.has('token')) {
    failLimiter.record(ip, now);
    return json({ ok: false, error: 'query_token_rejected' }, 400, headers);
  }
  if (!expected || failLimiter.tooMany(ip, now)) {
    if (expected) failLimiter.record(ip, now);
    return json({ ok: false, error: expected ? 'rate_limited' : 'unauthorized' }, expected ? 429 : 401, headers);
  }
  const presented = bearerToken(request.headers.get('Authorization'));
  if (!timingSafeEqual(presented, expected)) {
    const blocked = failLimiter.record(ip, now);
    return json({ ok: false, error: blocked ? 'rate_limited' : 'unauthorized' }, blocked ? 429 : 401, headers);
  }
  if (!env.DB) return json({ ok: false, error: 'D1 not bound' }, 500, headers);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  async function count(event, startIso, endIso) {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM consent_events
        WHERE event = ? AND ts >= ? AND ts < ? AND (withdrawn IS NULL OR withdrawn = 0)`
    )
      .bind(event, startIso, endIso)
      .first();
    return Number(row && row.n) || 0;
  }

  async function bucket(startIso, endIso) {
    const [visits, consents, withdrawals] = await Promise.all([
      count('page_visit', startIso, endIso),
      count('consent_given', startIso, endIso),
      count('consent_withdrawn', startIso, endIso),
    ]);
    return { visits, consents, withdrawals };
  }

  try {
    const [today, week, allTime, topPages] = await Promise.all([
      bucket(todayStart.toISOString(), tomorrow.toISOString()),
      bucket(weekStart.toISOString(), tomorrow.toISOString()),
      bucket('1970-01-01T00:00:00.000Z', tomorrow.toISOString()),
      env.DB.prepare(
        `SELECT page, COUNT(*) AS n FROM consent_events
          WHERE event = 'page_visit' AND ts >= ? AND ts < ?
            AND page IS NOT NULL AND page != ''
          GROUP BY page
          ORDER BY n DESC
          LIMIT 20`
      )
        .bind(weekStart.toISOString(), tomorrow.toISOString())
        .all(),
    ]);
    const top = (topPages && topPages.results ? topPages.results : []).map((r) => ({
      page: r.page,
      n: Number(r.n) || 0,
    }));
    return json({ ok: true, today, last_7_days: week, all_time: allTime, top_pages: top }, 200, headers);
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (/no such column/i.test(message)) {
      return json({ ok: false, error: 'migration_required' }, 503, headers);
    }
    return json({ ok: false, error: 'storage_error' }, 500, headers);
  }
}

async function readBody(request) {
  const declared = request.headers.get('Content-Length');
  if (declared && Number(declared) > MAX_BODY_BYTES) return { error: 'body_too_large' };
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { error: 'body_too_large' };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: 'invalid_json' };
  }
}

export default {
  async scheduled(_event, env, ctx) {
    const job = purgeExpired(env);
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(job);
    else await job;
  },

  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const route = routeOf(url.pathname);
    const isStats = route === 'stats';
    const headers = corsHeaders(origin, { allowGet: isStats });

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin)) return json({ ok: false, error: 'origin_not_allowed' }, 403, headers);
      return new Response(null, { status: 204, headers: securityHeaders(headers) });
    }

    if (request.method === 'GET' && isStats) {
      if (origin && !isAllowedOrigin(origin)) {
        return json({ ok: false, error: 'origin_not_allowed' }, 403, headers);
      }
      const purge = purgeExpired(env);
      if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(purge);
      return handleStats(request, env, headers);
    }

    if (request.method !== 'POST' || !route || isStats) {
      return json({ ok: false, error: 'not_found' }, 404, headers);
    }

    if (!isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'origin_not_allowed' }, 403, headers);
    }

    if (!eventForRoute(route)) return json({ ok: false, error: 'not_found' }, 404, headers);

    const parsed = await readBody(request);
    if (parsed.error) {
      const status = parsed.error === 'body_too_large' ? 413 : 400;
      return json({ ok: false, error: parsed.error }, status, headers);
    }

    const normalized = normalizeEvent(route, parsed.body);
    if (normalized.error) {
      const status = normalized.error === 'not_found' ? 404 : 400;
      return json({ ok: false, error: normalized.error }, status, headers);
    }

    const ts = new Date().toISOString();
    const row = normalized.row;
    row.ts = ts;
    if (row.event === 'consent_given' && !row.receipt_ref) row.receipt_ref = newReceipt();
    if (row.receipt_ref && !isReceiptId(row.receipt_ref)) {
      return json({ ok: false, error: 'bad_receipt' }, 400, headers);
    }

    if (!env.DB) {
      return json(
        { ok: false, error: 'not_persisted', receipt_ref: row.event === 'consent_given' ? row.receipt_ref : undefined },
        503,
        headers
      );
    }

    const purge = purgeExpired(env);
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(purge);
    else await purge.catch(() => {});

    if (row.event === 'consent_withdrawn') {
      const restricted = await restrictByReceipt(env, row.receipt_ref, ts);
      if (!restricted.ok) return json({ ok: false, error: restricted.error }, restricted.status, headers);
    }

    const result = await insertProof(env, row);
    if (!result.ok) return json({ ok: false, error: 'storage_error' }, 500, headers);

    const payload = { ok: true, event: row.event, ts };
    if (row.receipt_ref) payload.receipt_ref = row.receipt_ref;
    if (row.event === 'consent_withdrawn') {
      payload.restricted = true;
      payload.mailbox_deleted = false;
    }
    return json(payload, 200, headers);
  },
};
