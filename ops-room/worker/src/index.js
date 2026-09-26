/**
 * Ops Room — shared coordination backend for multi-agent operations.
 *
 * An "operation" is one shared room. Participants (orchestrator / agents /
 * humans) join it and append messages to a common, ordered feed, so many
 * agents can coordinate toward a single operation. Message ids are a monotonic
 * integer so clients can cheaply poll with ?since=<lastId>.
 */

function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080';
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin, allowedList) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  if (origin && allowedList.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

// Constant-time comparison via per-call random-key HMAC (length-independent).
async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const kb = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey('raw', kb, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const ha = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(String(a))));
  const hb = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(String(b))));
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

// Writes require Authorization: Bearer <OPS_ROOM_TOKEN> when the token is set.
// If unset (local dev), writes are open.
async function authorizeWrite(request, env) {
  const expected = env.OPS_ROOM_TOKEN || '';
  if (!expected) return true;
  const m = /^Bearer\s+(.+)$/i.exec((request.headers.get('Authorization') || '').trim());
  if (!m) return false;
  return timingSafeEqual(m[1].trim(), expected);
}

function uuid() {
  return crypto.randomUUID();
}

async function readJson(request) {
  try {
    const b = await request.json();
    return b && typeof b === 'object' ? b : {};
  } catch {
    return null;
  }
}

const ROLES = new Set(['orchestrator', 'agent', 'human', 'system']);
const KINDS = new Set(['msg', 'status', 'task', 'result', 'system']);
const MAX_BODY = 8000;
const MAX_NAME = 120;

async function createOperation(env, body) {
  const title = String(body.title || '').trim().slice(0, 200);
  if (!title) return { error: 'title is required', status: 400 };
  const id = uuid();
  await env.DB.prepare('INSERT INTO operations (id, title) VALUES (?, ?)').bind(id, title).run();
  const op = await env.DB.prepare('SELECT id, title, status, created_at FROM operations WHERE id = ?').bind(id).first();
  return { data: op, status: 201 };
}

async function listOperations(env) {
  const rows = await env.DB.prepare(
    `SELECT o.id, o.title, o.status, o.created_at,
            (SELECT COUNT(*) FROM participants p WHERE p.operation_id = o.id) AS participant_count,
            (SELECT COUNT(*) FROM messages m WHERE m.operation_id = o.id) AS message_count
     FROM operations o ORDER BY o.created_at DESC LIMIT 100`
  ).all();
  return { data: { operations: rows.results || [] }, status: 200 };
}

async function getOperation(env, id) {
  const op = await env.DB.prepare('SELECT id, title, status, created_at FROM operations WHERE id = ?').bind(id).first();
  if (!op) return { error: 'operation not found', status: 404 };
  const participants = await env.DB.prepare(
    'SELECT id, name, role, joined_at, last_seen FROM participants WHERE operation_id = ? ORDER BY joined_at'
  ).bind(id).all();
  const messages = await env.DB.prepare(
    'SELECT id, author, role, kind, body, created_at FROM messages WHERE operation_id = ? ORDER BY id DESC LIMIT 50'
  ).bind(id).all();
  return {
    data: {
      operation: op,
      participants: participants.results || [],
      messages: (messages.results || []).reverse(),
    },
    status: 200,
  };
}

async function joinOperation(env, id, body) {
  const op = await env.DB.prepare('SELECT id FROM operations WHERE id = ?').bind(id).first();
  if (!op) return { error: 'operation not found', status: 404 };
  const name = String(body.name || '').trim().slice(0, MAX_NAME);
  const role = ROLES.has(body.role) ? body.role : 'agent';
  if (!name) return { error: 'name is required', status: 400 };
  const pid = uuid();
  // Upsert on (operation_id, name): re-joining just refreshes role/last_seen.
  await env.DB.prepare(
    `INSERT INTO participants (id, operation_id, name, role) VALUES (?, ?, ?, ?)
     ON CONFLICT(operation_id, name) DO UPDATE SET role = excluded.role,
       last_seen = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  ).bind(pid, id, name, role).run();
  const p = await env.DB.prepare(
    'SELECT id, name, role, joined_at, last_seen FROM participants WHERE operation_id = ? AND name = ?'
  ).bind(id, name).first();
  await appendMessage(env, id, { author: 'system', role: 'system', kind: 'system', body: `${name} joined as ${role}.` });
  return { data: { participant: p }, status: 201 };
}

async function appendMessage(env, id, body) {
  const author = String(body.author || '').trim().slice(0, MAX_NAME) || 'anonymous';
  const role = ROLES.has(body.role) ? body.role : 'agent';
  const kind = KINDS.has(body.kind) ? body.kind : 'msg';
  const text = String(body.body == null ? '' : body.body).slice(0, MAX_BODY);
  if (!text) return { error: 'body is required', status: 400 };
  const res = await env.DB.prepare(
    'INSERT INTO messages (operation_id, author, role, kind, body) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, author, role, kind, text).run();
  const newId = res.meta && res.meta.last_row_id;
  // Touch participant last_seen if the author is a known participant.
  await env.DB.prepare(
    "UPDATE participants SET last_seen = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE operation_id = ? AND name = ?"
  ).bind(id, author).run();
  const msg = await env.DB.prepare(
    'SELECT id, author, role, kind, body, created_at FROM messages WHERE id = ?'
  ).bind(newId).first();
  return { data: { message: msg }, status: 201 };
}

async function postMessage(env, id, body) {
  const op = await env.DB.prepare('SELECT id, status FROM operations WHERE id = ?').bind(id).first();
  if (!op) return { error: 'operation not found', status: 404 };
  if (op.status === 'closed') return { error: 'operation is closed', status: 409 };
  return appendMessage(env, id, body);
}

async function pollMessages(env, id, sinceRaw, limitRaw) {
  const op = await env.DB.prepare('SELECT id FROM operations WHERE id = ?').bind(id).first();
  if (!op) return { error: 'operation not found', status: 404 };
  const since = Math.max(0, parseInt(sinceRaw || '0', 10) || 0);
  const limit = Math.min(200, Math.max(1, parseInt(limitRaw || '100', 10) || 100));
  const rows = await env.DB.prepare(
    'SELECT id, author, role, kind, body, created_at FROM messages WHERE operation_id = ? AND id > ? ORDER BY id LIMIT ?'
  ).bind(id, since, limit).all();
  const list = rows.results || [];
  const lastId = list.length ? list[list.length - 1].id : since;
  return { data: { messages: list, last_id: lastId }, status: 200 };
}

async function closeOperation(env, id) {
  const op = await env.DB.prepare('SELECT id FROM operations WHERE id = ?').bind(id).first();
  if (!op) return { error: 'operation not found', status: 404 };
  await env.DB.prepare("UPDATE operations SET status = 'closed' WHERE id = ?").bind(id).run();
  await appendMessage(env, id, { author: 'system', role: 'system', kind: 'system', body: 'Operation closed.' });
  return { data: { id, status: 'closed' }, status: 200 };
}

export default {
  async fetch(request, env) {
    const allowedList = parseAllowedOrigins(env);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, allowedList);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!env.DB) return json({ ok: false, error: 'D1 not bound' }, 500, headers);
    if (path === '/api/health') return json({ ok: true, service: 'ops-room' }, 200, headers);

    const out = (r) =>
      r.error ? json({ ok: false, error: r.error }, r.status, headers) : json({ ok: true, ...r.data }, r.status, headers);

    // Enforce browser-origin allowlist on writes (server-side, defense in depth).
    const isWrite = method === 'POST';
    if (isWrite && origin && !allowedList.includes(origin)) {
      return json({ ok: false, error: 'Origin not allowed' }, 403, headers);
    }
    if (isWrite && !(await authorizeWrite(request, env))) {
      return json({ ok: false, error: 'Unauthorized' }, 401, headers);
    }

    try {
      // /api/operations
      if (path === '/api/operations') {
        if (method === 'GET') return out(await listOperations(env));
        if (method === 'POST') {
          const body = await readJson(request);
          if (body === null) return json({ ok: false, error: 'invalid JSON' }, 400, headers);
          return out(await createOperation(env, body));
        }
      }

      const mOp = path.match(/^\/api\/operations\/([A-Za-z0-9-]+)$/);
      if (mOp && method === 'GET') return out(await getOperation(env, mOp[1]));

      const mJoin = path.match(/^\/api\/operations\/([A-Za-z0-9-]+)\/join$/);
      if (mJoin && method === 'POST') {
        const body = await readJson(request);
        if (body === null) return json({ ok: false, error: 'invalid JSON' }, 400, headers);
        return out(await joinOperation(env, mJoin[1], body));
      }

      const mMsg = path.match(/^\/api\/operations\/([A-Za-z0-9-]+)\/messages$/);
      if (mMsg && method === 'GET') return out(await pollMessages(env, mMsg[1], url.searchParams.get('since'), url.searchParams.get('limit')));
      if (mMsg && method === 'POST') {
        const body = await readJson(request);
        if (body === null) return json({ ok: false, error: 'invalid JSON' }, 400, headers);
        return out(await postMessage(env, mMsg[1], body));
      }

      const mClose = path.match(/^\/api\/operations\/([A-Za-z0-9-]+)\/close$/);
      if (mClose && method === 'POST') return out(await closeOperation(env, mClose[1]));

      return json({ ok: false, error: 'not found' }, 404, headers);
    } catch (err) {
      return json({ ok: false, error: `server error: ${err && err.message ? err.message : err}` }, 500, headers);
    }
  },
};
