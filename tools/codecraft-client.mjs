// Reusable, provider-agnostic client for any OpenAI-compatible chat API
// (e.g. OpenAI, Groq, or a self-hosted / gateway endpoint such as "CodeCraft").
//
// Safety by design:
//   - No endpoint and no credentials are hardcoded here. Everything is read
//     from environment variables at call time, so nothing is committed and no
//     request is made until you explicitly configure it.
//   - Configure via Secrets (never paste keys into the repo):
//       CODECRAFT_BASE_URL  e.g. https://api.groq.com/openai/v1
//       CODECRAFT_API_KEY   your bearer token
//       CODECRAFT_MODEL     optional, default below
//
// Requires Node 18+ (uses the built-in global fetch). No dependencies.

export const DEFAULT_MODEL = process.env.CODECRAFT_MODEL || 'gpt-4o-mini';

export class CodeCraftConfigError extends Error {}
export class CodeCraftApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Returns { baseUrl, apiKey, model } or throws CodeCraftConfigError with a
// clear message listing the missing variables. Never returns partial config.
export function getConfig(env = process.env) {
  const missing = [];
  const rawBase = (env.CODECRAFT_BASE_URL || '').trim();
  const apiKey = (env.CODECRAFT_API_KEY || '').trim();
  if (!rawBase) missing.push('CODECRAFT_BASE_URL');
  if (!apiKey) missing.push('CODECRAFT_API_KEY');
  if (missing.length) {
    throw new CodeCraftConfigError(
      `CodeCraft client is not configured. Set ${missing.join(' and ')} ` +
        `(add them in the Secrets panel). No request was made.`
    );
  }
  return {
    baseUrl: rawBase.replace(/\/+$/, ''),
    apiKey,
    model: (env.CODECRAFT_MODEL || DEFAULT_MODEL).trim(),
  };
}

// Non-throwing check so callers can degrade gracefully when unconfigured.
export function isConfigured(env = process.env) {
  try {
    getConfig(env);
    return true;
  } catch {
    return false;
  }
}

// Call the chat completions endpoint. Returns the assistant message content
// string. Throws CodeCraftConfigError (unconfigured) or CodeCraftApiError.
export async function chatCompletion(
  messages,
  { model, temperature = 0.2, maxTokens, responseFormat, signal, timeoutMs = 60000, env } = {}
) {
  const cfg = getConfig(env);
  const url = `${cfg.baseUrl}/chat/completions`;

  const payload = {
    model: model || cfg.model,
    messages,
    temperature,
  };
  if (maxTokens != null) payload.max_tokens = maxTokens;
  if (responseFormat) payload.response_format = responseFormat;

  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    throw new CodeCraftApiError(`Request to ${url} failed: ${err && err.message ? err.message : err}`);
  } finally {
    if (timer) clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new CodeCraftApiError(`CodeCraft API returned HTTP ${res.status}`, {
      status: res.status,
      body: text.slice(0, 2000),
    });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new CodeCraftApiError('CodeCraft API returned non-JSON response', { body: text.slice(0, 2000) });
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new CodeCraftApiError('CodeCraft API response had no message content', { body: text.slice(0, 2000) });
  }
  return content;
}
