// Web server for AI Pool Connection. Serves the chat UI and a small JSON API.
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Jarvis } from './src/jarvis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
// Only trust proxy headers (X-Forwarded-For for req.ip) when explicitly told to,
// so clients can't spoof their IP to dodge rate limits on a direct connection.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);

// Baseline security headers on every response (anti-clickjacking, no sniff).
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// One shared Jarvis instance per server process (simple demo scope).
const jarvis = new Jarvis();

// --- Basic hardening ---------------------------------------------------------
// Optional bearer-token auth. When SERVER_AUTH_TOKEN is set, every /api call
// must present it. When unset, the server only listens on localhost (see HOST
// default below), so it stays a local-only tool unless you opt into a token.
const AUTH_TOKEN = process.env.SERVER_AUTH_TOKEN || '';

// Constant-time comparison (hash both sides so unequal lengths don't leak).
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// In-memory sliding-window rate limiter per client IP. Council requests cost
// several provider calls, so they count as more than one hit.
const RATE_MAX = Number(process.env.RATE_LIMIT_PER_MIN ?? 30);
const COUNCIL_WEIGHT = Number(process.env.COUNCIL_WEIGHT ?? 4);
const hits = new Map();
function rateLimited(ip, weight = 1) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const arr = (hits.get(ip) || []).filter((t) => t > windowStart);
  for (let i = 0; i < weight; i++) arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_MAX;
}

app.use('/api', (req, res, next) => {
  if (AUTH_TOKEN) {
    const header = req.get('authorization') || '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-auth-token') || '';
    if (!safeEqual(provided, AUTH_TOKEN)) return res.status(401).json({ error: 'unauthorized' });
  }
  const weight = req.path === '/chat' && req.body && req.body.mode === 'council' ? COUNCIL_WEIGHT : 1;
  if (rateLimited(req.ip, weight)) return res.status(429).json({ error: 'rate limit exceeded, slow down' });
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
// you explicitly set HOST (in which case an auth token is required).
const HOST = process.env.HOST || '127.0.0.1';
const isLoopback = HOST === '127.0.0.1' || HOST === '::1' || HOST === 'localhost';
// Fail closed: refuse to expose the API on a non-loopback interface without auth.
if (!isLoopback && !AUTH_TOKEN) {
  console.error(
    `Refusing to bind ${HOST} without SERVER_AUTH_TOKEN. Set a token (or set ALLOW_INSECURE_BIND=true to override).`,
  );
  if (process.env.ALLOW_INSECURE_BIND !== 'true') process.exit(1);
}
app.listen(PORT, HOST, () => {
  console.log(`AI Pool Connection web UI on http://${HOST}:${PORT}` + (AUTH_TOKEN ? ' (auth required)' : ''));
});
