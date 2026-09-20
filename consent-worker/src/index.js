/**
 * MEDA Consent Worker — consent events + privacy-friendly pageviews + stats
 */

function parseAllowedOrigins(env) {
  const raw =
    env.ALLOWED_ORIGINS ||
    env.ALLOWED_ORIGIN ||
    'https://g5kjd9v7cf-boop.github.io';
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin, allowedList, { allowGet = false } = {}) {
  const methods = allowGet ? 'GET, POST, OPTIONS' : 'POST, OPTIONS';
  const h = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowedList.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
  }
  return h;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function receiptNumber(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `MEDA-CONSENT-${y}${m}${day}-${rand}`;
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function appendEvent(env, row) {
  if (!env.DB) {
    return { ok: false, error: 'D1 not bound — scaffold only' };
  }
  await env.DB.prepare(
    `INSERT INTO consent_events
      (event, ts, document_version, locale_shown, layout, session_id, email, form_type, receipt_ref, user_agent, referrer, page, ip_hash, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.event,
      row.ts,
      row.document_version || null,
      row.locale_shown || null,
      row.layout || null,
      row.session_id || null,
      row.email || null,
      row.form_type || null,
      row.receipt_ref || null,
      row.user_agent || null,
      row.referrer || null,
      row.page || null,
      row.ip_hash || null,
      row.payload_json
    )
    .run();
  return { ok: true };
}

function dayBoundsUtc(daysAgoStart, daysAgoEndExclusive) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgoStart));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgoEndExclusive + 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function bucketStats(env, startIso, endIso) {
  const visitsRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM consent_events
     WHERE event = 'page_visit' AND ts >= ? AND ts < ?`
  )
    .bind(startIso, endIso)
    .first();

  const sessionsRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT session_id) AS n FROM consent_events
     WHERE event = 'page_visit' AND session_id IS NOT NULL AND session_id != ''
       AND ts >= ? AND ts < ?`
  )
    .bind(startIso, endIso)
    .first();

  const acceptsRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM consent_events
     WHERE event = 'datenschutz_accepted'
       AND ts >= ? AND ts < ?`
  )
    .bind(startIso, endIso)
    .first();

  return {
    visits: Number(visitsRow && visitsRow.n) || 0,
    unique_sessions: Number(sessionsRow && sessionsRow.n) || 0,
    gate_accepts: Number(acceptsRow && acceptsRow.n) || 0,
  };
}

async function handleStats(request, env, headers) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const expected = env.STATS_TOKEN || '';
  if (!expected || token !== expected) {
    return json({ ok: false, error: 'Unauthorized' }, 401, headers);
  }
  if (!env.DB) {
    return json({ ok: false, error: 'D1 not bound' }, 500, headers);
  }

  const today = dayBoundsUtc(0, 0);
  // last 7 days inclusive of today → start 6 days ago 00:00 through tomorrow 00:00
  const week = dayBoundsUtc(6, 0);
  const allStart = '1970-01-01T00:00:00.000Z';
  const allEnd = new Date(Date.UTC(2099, 0, 1)).toISOString();

  const [todayStats, weekStats, allStats, topPages] = await Promise.all([
    bucketStats(env, today.start, today.end),
    bucketStats(env, week.start, week.end),
    bucketStats(env, allStart, allEnd),
    env.DB.prepare(
      `SELECT page, COUNT(*) AS n FROM consent_events
       WHERE event = 'page_visit' AND ts >= ? AND ts < ?
         AND page IS NOT NULL AND page != ''
       GROUP BY page
       ORDER BY n DESC
       LIMIT 20`
    )
      .bind(week.start, week.end)
      .all(),
  ]);

  const top = (topPages && topPages.results ? topPages.results : []).map((r) => ({
    page: r.page,
    n: Number(r.n) || 0,
  }));

  return json(
    {
      ok: true,
      today: todayStats,
      last_7_days: weekStats,
      all_time: allStats,
      top_pages: top,
    },
    200,
    headers
  );
}

export default {
  async fetch(request, env) {
    const allowedList = parseAllowedOrigins(env);
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const isStats = path.endsWith('/stats');
    const headers = corsHeaders(origin, allowedList, { allowGet: isStats });

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === 'GET' && isStats) {
      return handleStats(request, env, headers);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, headers);
    }

    const route = path.endsWith('/view')
      ? 'view'
      : path.endsWith('/submit')
        ? 'submit'
        : path.endsWith('/withdraw')
          ? 'withdraw'
          : path.endsWith('/gate')
            ? 'gate'
            : path.endsWith('/pageview')
              ? 'pageview'
              : null;

    if (!route) {
      return json({ ok: false, error: 'Not found' }, 404, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, headers);
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const daySalt = new Date().toISOString().slice(0, 10);
    const ip_hash = ip ? await sha256Hex(ip + '|' + daySalt) : null;

    let event =
      body.event ||
      (route === 'view'
        ? 'erklaerung_view'
        : route === 'submit'
          ? 'consent_given'
          : route === 'withdraw'
            ? 'consent_withdrawn'
            : route === 'pageview'
              ? 'page_visit'
              : 'datenschutz_gate');

    if (route === 'pageview') {
      event = 'page_visit';
    }

    let receipt_ref = body.receipt_ref || null;
    if (route === 'submit' && !receipt_ref) {
      receipt_ref = receiptNumber();
    }

    const ts = body.ts || new Date().toISOString();
    const row = {
      event,
      ts,
      document_version: body.document_version || null,
      locale_shown: body.locale_shown || null,
      layout: body.layout || null,
      session_id: body.session_id || null,
      email: body.email || null,
      form_type: body.form_type || null,
      receipt_ref,
      user_agent: body.user_agent || request.headers.get('User-Agent') || null,
      referrer: body.referrer || null,
      page: body.page || null,
      ip_hash,
      payload_json: JSON.stringify(body),
    };

    const result = await appendEvent(env, row);
    if (!result.ok && result.error && result.error.includes('scaffold')) {
      return json(
        { ok: true, scaffold: true, receipt_ref, message: 'D1 not bound — event not persisted' },
        200,
        headers
      );
    }
    if (!result.ok) {
      return json({ ok: false, error: result.error || 'DB error' }, 500, headers);
    }

    return json({ ok: true, event, receipt_ref, ts }, 200, headers);
  },
};
