/**
 * MEDA Consent Worker — Phase 2 scaffold (not deployed in Phase 1).
 * Handlers: POST /view /submit /withdraw /gate
 */

function corsHeaders(origin, allowed) {
  const o = origin && origin === allowed ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
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

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || 'https://g5kjd9v7cf-boop.github.io';
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\\/$/, '') || '/';

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
            : 'datenschutz_gate');

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
