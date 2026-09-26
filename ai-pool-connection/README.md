# AI Pool Connection

A **Jarvis-style assistant** that pools multiple AI providers behind one interface,
routes each request to the **cheapest capable model** (free/open models first,
paid APIs only when needed), and enforces a **budget cap**. It offers both a
**CLI** and a **web chat UI**, plus a **Council mode** where several models
collaborate and a coordinator (preferring Grok/xAI) synthesizes a final answer.

> This project uses **your own legitimate API keys**, one per provider, each
> within that provider's normal terms. It does **not** pool, share, or rotate
> tokens across accounts to bypass rate limits or billing.

## Providers

| Provider | Tier | Env var | Notes |
| --- | --- | --- | --- |
| Local Reasoner | local | — | Offline demo fallback, always available, zero cost |
| Ollama | local | `OLLAMA_HOST` | Local open models (Hermes/Llama/Mistral), zero cost |
| OpenRouter | free | `OPENROUTER_API_KEY` | Free models incl. **Hermes 3**, Llama, Mistral |
| Groq | free | `GROQ_API_KEY` | Fast open models, generous free tier |
| Grok (xAI) | paid | `XAI_API_KEY` | Official xAI API |
| OpenAI | paid | `OPENAI_API_KEY` | GPT-4o / 4o-mini |
| Anthropic | paid | `ANTHROPIC_API_KEY` | Claude 3.5 |

With no keys set, everything still runs against the offline Local Reasoner so you
can try the UX; add any key to get real model answers.

## Quick start

```bash
cd ai-pool-connection
npm install
cp .env.example .env   # add the keys you own (optional to start)

# CLI
npm run cli

# Web UI (http://localhost:8787)
npm run web
```

## Routing logic

1. Build candidate `(provider, model)` pairs from configured providers.
2. Sort by tier (`local` → `free` → `paid`), then by estimated price.
3. Call the best candidate; on failure, fall back to the next.
4. Track spend and refuse paid calls once `BUDGET_USD` is exhausted.

## CLI commands

- `/status` — show providers and budget
- `/council <text>` — run multi-agent council
- `/prefer <id> <text>` — force a provider (e.g. `/prefer xai explain quantum tunneling`)
- `/reset` — clear the conversation
- `/exit` — quit

## Security

This is safe for **local, personal use** out of the box, and has guardrails for
going further. Key points:

- **Keys are never committed.** They come from env/secrets; `.env` is gitignored.
- **Localhost-only by default.** The web server binds to `127.0.0.1`, so it is not
  reachable from the network unless you set `HOST=0.0.0.0`.
- **Optional token auth.** Set `SERVER_AUTH_TOKEN` to require a bearer token on
  every `/api` call. The web UI prompts for it once and stores it locally.
- **Rate limiting.** Per-IP limit (`RATE_LIMIT_PER_MIN`, default 30/min) to blunt
  abuse and runaway cost.
- **Budget cap.** `BUDGET_USD` stops paid calls once the cap is hit.
- **Small surface.** Only dependency is Express; the model has no tools/side effects.

**Before putting this on a VPS or any public host:**

1. Set a strong `SERVER_AUTH_TOKEN`.
2. Put it behind a reverse proxy (nginx/Caddy) that terminates **HTTPS/TLS**.
3. Keep `BUDGET_USD` conservative and monitor the budget panel.
4. Never commit real keys; use the host's secret/env mechanism.

Not yet included (add if you go multi-user/production): per-user session
isolation, persistent auth/accounts, audit logging, and prompt-injection review
if you later give the assistant tools.

## Tests

```bash
npm test
```
