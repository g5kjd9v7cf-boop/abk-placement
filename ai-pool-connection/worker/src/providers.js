// Provider registry for the Cloudflare Worker runtime.
//
// Same idea as the Node version: one legitimate key per provider (from Worker
// secrets), prefer free/open models, never pool tokens across accounts. Uses
// only Web-standard APIs (fetch) so it runs on Workers.

const estTokens = (t) => Math.max(1, Math.ceil((t || '').length / 4));

function openAICompatible({ id, label, tier, defaultBaseUrl, keyVar, baseVar, models, extraHeaders }, env) {
  const apiKey = env[keyVar];
  const baseUrl = (env[baseVar] || defaultBaseUrl).replace(/\/+$/, '');
  return {
    id,
    label,
    tier,
    configured: Boolean(apiKey && baseUrl),
    models,
    async chat({ model, messages, temperature = 0.7, maxTokens = 1024 }) {
      const modelDef = models.find((m) => m.id === model) || models[0];
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(extraHeaders || {}),
        },
        body: JSON.stringify({ model: modelDef.id, messages, temperature, max_tokens: maxTokens }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${label} HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      const usage = {
        promptTokens: data.usage?.prompt_tokens ?? estTokens(JSON.stringify(messages)),
        completionTokens: data.usage?.completion_tokens ?? estTokens(text),
      };
      return { text, model: modelDef.id, usage, costUsd: 0 };
    },
  };
}

function localEcho() {
  return {
    id: 'local-echo',
    label: 'Local Reasoner (offline)',
    tier: 'local',
    configured: true,
    models: [{ id: 'local-reasoner' }],
    async chat({ messages }) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const q = (lastUser?.content || '').trim();
      const text = q
        ? `Jarvis here (offline demo mode). You said: "${q.slice(0, 160)}". Add a Groq or OpenRouter key as a Worker secret and I'll answer with real models — routing to the cheapest capable one first.`
        : "Hi, I'm Jarvis. Add a provider key to get real answers.";
      return { text, model: 'local-reasoner', usage: { promptTokens: estTokens(q), completionTokens: estTokens(text) }, costUsd: 0 };
    },
  };
}

export function buildProviders(env) {
  return [
    localEcho(),
    openAICompatible(
      {
        id: 'groq',
        label: 'Groq',
        tier: 'free',
        defaultBaseUrl: 'https://api.groq.com/openai/v1',
        keyVar: 'GROQ_API_KEY',
        baseVar: 'GROQ_BASE_URL',
        models: [
          { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
          { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
        ],
      },
      env,
    ),
    openAICompatible(
      {
        id: 'openrouter',
        label: 'OpenRouter',
        tier: 'free',
        defaultBaseUrl: 'https://openrouter.ai/api/v1',
        keyVar: 'OPENROUTER_API_KEY',
        baseVar: 'OPENROUTER_BASE_URL',
        extraHeaders: { 'X-Title': 'AI Pool Connection' },
        models: [
          { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B (free)' },
          { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)' },
        ],
      },
      env,
    ),
    openAICompatible(
      {
        id: 'codecraft',
        label: 'CodeCraft (shared gateway)',
        tier: 'free',
        defaultBaseUrl: env.CODECRAFT_BASE_URL || '',
        keyVar: 'CODECRAFT_API_KEY',
        baseVar: 'CODECRAFT_BASE_URL',
        models: [{ id: env.CODECRAFT_MODEL || 'gpt-4o-mini', label: 'CodeCraft' }],
      },
      env,
    ),
    openAICompatible(
      {
        id: 'xai',
        label: 'Grok (xAI)',
        tier: 'paid',
        defaultBaseUrl: 'https://api.x.ai/v1',
        keyVar: 'XAI_API_KEY',
        baseVar: 'XAI_BASE_URL',
        models: [{ id: 'grok-2-latest', label: 'Grok 2' }],
      },
      env,
    ),
  ];
}

const TIER_RANK = { local: 0, free: 1, paid: 2 };

// Pick the best (cheapest) configured provider. The offline Local Reasoner is a
// last resort: it is used only after every real provider, so adding any real
// key immediately takes over. Real providers are ordered by tier (local model >
// free > paid).
export function pickProviders(providers, { prefer, allowPaid = false } = {}) {
  let configured = providers.filter((p) => p.configured);
  // Paid providers are opt-in to avoid surprise spend on a public deployment.
  if (!allowPaid) configured = configured.filter((p) => p.tier !== 'paid');
  const real = configured.filter((p) => p.id !== 'local-echo').sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  const echo = configured.filter((p) => p.id === 'local-echo');
  let list = real.concat(echo);
  if (prefer) {
    const pref = list.filter((p) => p.id === prefer);
    if (pref.length) return pref.concat(list.filter((p) => p.id !== prefer));
  }
  return list;
}

export async function routeChat(providers, { messages, prefer, allowPaid = false }) {
  const candidates = pickProviders(providers, { prefer, allowPaid });
  if (!candidates.length) throw new Error('No configured providers.');
  const errors = [];
  for (const p of candidates) {
    try {
      const r = await p.chat({ model: p.models[0].id, messages });
      return { ...r, providerId: p.id, providerLabel: p.label, tier: p.tier };
    } catch (err) {
      errors.push(`${p.label}: ${err.message}`);
    }
  }
  throw new Error(`All providers failed: ${errors.join('; ')}`);
}

export function statusOf(providers) {
  return {
    providers: providers.map((p) => ({ id: p.id, label: p.label, tier: p.tier, configured: p.configured })),
  };
}
