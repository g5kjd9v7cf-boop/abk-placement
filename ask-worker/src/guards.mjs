/**
 * Hooks for the live ask Worker. This file is not a deployable script.
 * Do not set `main` in ask-worker/wrangler.toml and do not wrangler deploy
 * from this directory. The live script should call guardAsk before it
 * sends mail, then use the returned body.
 */
import {
  JSON_LIMITS,
  checkRateLimit,
  clientIp,
  containsStandaloneDemoToken,
  demoTokensRejected,
  readJsonLimited,
  requireTurnstile,
  safeLog,
  turnstileTokenFrom,
} from '../../workers/security.mjs';

const buckets = new Map();
const FIELD_MAX = {
  message: 4000,
  name: 200,
  email: 200,
  company: 200,
  role: 40,
  sector: 40,
  page: 200,
  type: 40,
  channel: 40,
};

export function sanitizeAsk(body) {
  const src = body && typeof body === 'object' ? body : {};
  const ops = src.ops && typeof src.ops === 'object' ? src.ops : {};
  const cleanOps = {};
  for (const [key, value] of Object.entries(ops)) {
    if (key === 'deliver_to') continue;
    if (typeof value === 'string') cleanOps[key] = value.slice(0, FIELD_MAX[key] || 500);
    else if (typeof value === 'boolean' || typeof value === 'number') cleanOps[key] = value;
  }
  const out = { ops: cleanOps };
  if (typeof src.channel === 'string') out.channel = src.channel.slice(0, 40);
  if (typeof src.page === 'string') out.page = src.page.slice(0, 200);
  return out;
}

export async function guardAsk(request, env, deps = {}) {
  const used = deps.buckets || buckets;
  const now = deps.now || Date.now();
  const ip = clientIp(request);
  const limit = checkRateLimit(used, `ask:${ip || 'missing'}`, now, 30, 60 * 1000);
  if (!limit.ok) {
    safeLog('ask', { code: 'RATE_LIMIT', status: 429 });
    return { ok: false, status: 429, error: 'RATE_LIMIT' };
  }
  const parsed = await readJsonLimited(request, JSON_LIMITS.ask);
  if (!parsed.ok) {
    safeLog('ask', { code: parsed.error, status: parsed.status });
    return { ok: false, status: parsed.status, error: parsed.error };
  }
  if (demoTokensRejected(env) && containsStandaloneDemoToken(parsed.value)) {
    safeLog('ask', { code: 'DEMO_TOKEN_REJECTED', status: 403 });
    return { ok: false, status: 403, error: 'DEMO_TOKEN_REJECTED' };
  }
  const turnstile = await requireTurnstile(
    env,
    turnstileTokenFrom(parsed.value),
    ip,
    deps.fetchImpl || fetch
  );
  if (!turnstile.ok) {
    safeLog('ask', { code: turnstile.error, status: turnstile.status });
    return { ok: false, status: turnstile.status, error: turnstile.error };
  }
  return { ok: true, status: 200, body: sanitizeAsk(parsed.value) };
}
