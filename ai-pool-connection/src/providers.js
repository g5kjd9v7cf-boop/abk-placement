// Provider registry for AI Pool Connection.
//
// Every provider uses ONE legitimate API key that you own (read from an env
// var / secret). Nothing here pools, shares, or rotates tokens across accounts
// to bypass provider limits — each provider is called within its normal terms.
//
// A provider exposes:
//   id, label, tier ('local' | 'free' | 'paid'), configured (bool),
//   models: [{ id, label, promptPer1k, completionPer1k }],
//   chat({ model, messages, temperature, maxTokens, signal }) ->
//     { text, model, usage: { promptTokens, completionTokens }, costUsd }

const estTokens = (text) => Math.max(1, Math.ceil((text || '').length / 4));

function usageCost(model, usage) {
  const p = (usage.promptTokens / 1000) * (model.promptPer1k || 0);
  const c = (usage.completionTokens / 1000) * (model.completionPer1k || 0);
  return +(p + c).toFixed(6);
}

// Generic adapter for OpenAI-compatible chat/completions endpoints.
function openAICompatible({ id, label, tier, baseUrl, envKey, models, extraHeaders }) {
  const apiKey = process.env[envKey];
  return {
    id,
    label,
    tier,
    envKey,
    configured: Boolean(apiKey),
    models,
    async chat({ model, messages, temperature = 0.7, maxTokens = 1024, signal }) {
      const modelDef = models.find((m) => m.id === model) || models[0];
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(extraHeaders || {}),
        },
        body: JSON.stringify({
          model: modelDef.id,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${label} HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      const usage = {
        promptTokens: data.usage?.prompt_tokens ?? estTokens(JSON.stringify(messages)),
        completionTokens: data.usage?.completion_tokens ?? estTokens(text),
      };
      return { text, model: modelDef.id, usage, costUsd: usageCost(modelDef, usage) };
    },
  };
}

// Anthropic uses a different request/response shape.
function anthropicProvider() {
  const envKey = 'ANTHROPIC_API_KEY';
  const apiKey = process.env[envKey];
  const models = [
    { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', promptPer1k: 0.0008, completionPer1k: 0.004 },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', promptPer1k: 0.003, completionPer1k: 0.015 },
  ];
  return {
    id: 'anthropic',
    label: 'Anthropic Claude',
    tier: 'paid',
    envKey,
    configured: Boolean(apiKey),
    models,
    async chat({ model, messages, temperature = 0.7, maxTokens = 1024, signal }) {
      const modelDef = models.find((m) => m.id === model) || models[0];
      const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
      const convo = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: modelDef.id, system, messages: convo, temperature, max_tokens: maxTokens }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Anthropic HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      const text = (data.content || []).map((b) => b.text || '').join('');
      const usage = {
        promptTokens: data.usage?.input_tokens ?? estTokens(JSON.stringify(messages)),
        completionTokens: data.usage?.output_tokens ?? estTokens(text),
      };
      return { text, model: modelDef.id, usage, costUsd: usageCost(modelDef, usage) };
    },
  };
}

// Local Ollama (open models like Hermes/Llama/Mistral). No key, no cost.
function ollamaProvider() {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'hermes3';
  const models = [{ id: model, label: `${model} (local)`, promptPer1k: 0, completionPer1k: 0 }];
  return {
    id: 'ollama',
    label: 'Ollama (local open models)',
    tier: 'local',
    envKey: 'OLLAMA_HOST',
    // Marked configured only when explicitly opted in, since reachability is checked at call time.
    configured: Boolean(process.env.OLLAMA_HOST),
    models,
    async chat({ messages, temperature = 0.7, signal }) {
      const res = await fetch(`${host}/api/chat`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature } }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      const text = data.message?.content ?? '';
      const usage = { promptTokens: estTokens(JSON.stringify(messages)), completionTokens: estTokens(text) };
      return { text, model, usage, costUsd: 0 };
    },
  };
}

// CodeCraft: a shared, env-configured OpenAI-compatible gateway. This uses the
// exact CODECRAFT_* contract defined by the collaborating agent's client
// (tools/codecraft-client.mjs) so both projects run on one platform. When that
// file is present (after the branches merge) we reuse it directly; otherwise we
// fall back to a built-in call with the identical contract. No request is made
// until CODECRAFT_BASE_URL and CODECRAFT_API_KEY are configured.
function codecraftProvider() {
  const baseUrl = (process.env.CODECRAFT_BASE_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.CODECRAFT_API_KEY || '').trim();
  const model = (process.env.CODECRAFT_MODEL || 'gpt-4o-mini').trim();
  // CodeCraft is pitched as a free-token gateway; default cost 0 and free tier,
  // overridable if you point it at a paid endpoint.
  const tier = process.env.CODECRAFT_TIER || 'free';
  const models = [{ id: model, label: `CodeCraft (${model})`, promptPer1k: 0, completionPer1k: 0 }];
  return {
    id: 'codecraft',
    label: 'CodeCraft (shared gateway)',
    tier,
    envKey: 'CODECRAFT_API_KEY',
    configured: Boolean(baseUrl && apiKey),
    models,
    async chat({ messages, temperature = 0.7, maxTokens = 1024, signal }) {
      // Prefer the collaborating agent's shared client when it exists in-repo.
      let shared = null;
      try {
        shared = await import('../../tools/codecraft-client.mjs');
      } catch {
        shared = null;
      }
      let text;
      if (shared && typeof shared.chatCompletion === 'function') {
        text = await shared.chatCompletion(messages, { temperature, maxTokens, signal });
      } else {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`CodeCraft HTTP ${res.status}: ${body.slice(0, 300)}`);
        }
        const data = await res.json();
        text = data.choices?.[0]?.message?.content ?? '';
      }
      const usage = { promptTokens: estTokens(JSON.stringify(messages)), completionTokens: estTokens(text) };
      return { text, model, usage, costUsd: usageCost(models[0], usage) };
    },
  };
}

// Offline fallback so the app is demonstrable end-to-end without any keys.
// Produces a deterministic, role-aware reply. Never touches the network.
function localEchoProvider() {
  const models = [{ id: 'local-reasoner', label: 'Local Reasoner (offline demo)', promptPer1k: 0, completionPer1k: 0 }];
  return {
    id: 'local-echo',
    label: 'Local Reasoner (offline)',
    tier: 'local',
    envKey: null,
    configured: true,
    models,
    async chat({ messages, role }) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const q = (lastUser?.content || '').trim();
      const persona = role || 'assistant';
      let text;
      if (!q) {
        text = "Hi, I'm Jarvis. Ask me anything and I'll route it to the best available model.";
      } else if (persona === 'coordinator') {
        text = `Coordinator synthesis (offline demo): I reviewed the worker responses about "${truncate(q, 80)}" and merged their points into a single answer. Add a provider API key to replace this with real model output.`;
      } else {
        text =
          `Jarvis here (offline demo mode). You said: "${truncate(q, 160)}".\n` +
          `I'm running without provider keys, so this is a local placeholder reply. ` +
          `Add a key (e.g. XAI_API_KEY for Grok, GROQ_API_KEY, OPENROUTER_API_KEY, or run Ollama) ` +
          `and I'll answer with real models — always routing to the cheapest capable one first.`;
      }
      const usage = { promptTokens: estTokens(JSON.stringify(messages)), completionTokens: estTokens(text) };
      return { text, model: 'local-reasoner', usage, costUsd: 0 };
    },
  };
}

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function buildProviders() {
  const providers = [
    localEchoProvider(),
    ollamaProvider(),
    // CodeCraft shared gateway (interoperates with tools/codecraft-client.mjs).
    codecraftProvider(),
    // OpenRouter: gateway to many open/free models incl. Hermes. Free-tagged models cost 0.
    openAICompatible({
      id: 'openrouter',
      label: 'OpenRouter',
      tier: 'free',
      baseUrl: 'https://openrouter.ai/api/v1',
      envKey: 'OPENROUTER_API_KEY',
      extraHeaders: { 'HTTP-Referer': 'https://meda-vermittlung.de', 'X-Title': 'AI Pool Connection' },
      models: [
        { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B (free)', promptPer1k: 0, completionPer1k: 0 },
        { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)', promptPer1k: 0, completionPer1k: 0 },
        { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)', promptPer1k: 0, completionPer1k: 0 },
      ],
    }),
    // Groq: very fast, generous free tier for open models.
    openAICompatible({
      id: 'groq',
      label: 'Groq',
      tier: 'free',
      baseUrl: 'https://api.groq.com/openai/v1',
      envKey: 'GROQ_API_KEY',
      models: [
        { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', promptPer1k: 0, completionPer1k: 0 },
        { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', promptPer1k: 0, completionPer1k: 0 },
      ],
    }),
    // Grok via official xAI API.
    openAICompatible({
      id: 'xai',
      label: 'Grok (xAI)',
      tier: 'paid',
      baseUrl: 'https://api.x.ai/v1',
      envKey: 'XAI_API_KEY',
      models: [
        { id: 'grok-2-latest', label: 'Grok 2', promptPer1k: 0.002, completionPer1k: 0.01 },
      ],
    }),
    openAICompatible({
      id: 'openai',
      label: 'OpenAI',
      tier: 'paid',
      baseUrl: 'https://api.openai.com/v1',
      envKey: 'OPENAI_API_KEY',
      models: [
        { id: 'gpt-4o-mini', label: 'GPT-4o mini', promptPer1k: 0.00015, completionPer1k: 0.0006 },
        { id: 'gpt-4o', label: 'GPT-4o', promptPer1k: 0.0025, completionPer1k: 0.01 },
      ],
    }),
    anthropicProvider(),
  ];
  return providers;
}

export const TIER_RANK = { local: 0, free: 1, paid: 2 };
