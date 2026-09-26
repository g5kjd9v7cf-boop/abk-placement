// Web server for AI Pool Connection. Serves the chat UI and a small JSON API.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jarvis } from './src/jarvis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// One shared Jarvis instance per server process (simple demo scope).
const jarvis = new Jarvis();

// --- Basic hardening ---------------------------------------------------------
// Optional bearer-token auth. When SERVER_AUTH_TOKEN is set, every /api call
// must present it. When unset, the server only listens on localhost (see HOST
// default below), so it stays a local-only tool unless you opt into a token.
const AUTH_TOKEN = process.env.SERVER_AUTH_TOKEN || '';

// Simple in-memory sliding-window rate limiter per client IP.
const RATE_MAX = Number(process.env.RATE_LIMIT_PER_MIN ?? 30);
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const arr = (hits.get(ip) || []).filter((t) => t > windowStart);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_MAX;
}

app.use('/api', (req, res, next) => {
  if (AUTH_TOKEN) {
    const header = req.get('authorization') || '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-auth-token') || '';
    if (provided !== AUTH_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  }
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'rate limit exceeded, slow down' });
  next();
});

app.get('/api/status', (req, res) => {
  res.json({ ...jarvis.status(), authRequired: Boolean(AUTH_TOKEN) });
});

app.post('/api/chat', async (req, res) => {
  const { message, mode, prefer } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) required' });
  }
  try {
    if (mode === 'council') {
      const r = await jarvis.council(message);
      return res.json({ mode: 'council', ...r, status: jarvis.status() });
    }
    const r = await jarvis.chat(message, { prefer });
    return res.json({ mode: 'chat', ...r, status: jarvis.status() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', (req, res) => {
  jarvis.reset();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8787;
// Bind to localhost by default so the server is not publicly reachable unless
// you explicitly set HOST=0.0.0.0 (in which case set SERVER_AUTH_TOKEN too).
const HOST = process.env.HOST || '127.0.0.1';
if (HOST === '0.0.0.0' && !AUTH_TOKEN) {
  console.warn('WARNING: binding to 0.0.0.0 without SERVER_AUTH_TOKEN — the API is publicly reachable and unauthenticated.');
}
app.listen(PORT, HOST, () => {
  console.log(`AI Pool Connection web UI on http://${HOST}:${PORT}` + (AUTH_TOKEN ? ' (auth required)' : ''));
});
