# AI Pool Connection — Cloudflare Worker (iPhone-friendly)

Deploys the AI Pool Connection chat as a single Cloudflare Worker. It serves a
**password-gated, mobile-first web page** plus the pooling API, so you just open
a normal `https://…` link in **iPhone Safari** — nothing to install on the phone.

Keys live in **Worker secrets**, never in the code. With no keys it runs an
offline demo; add a free Groq or OpenRouter key to get real answers.

## Deploy (one time, from a computer)

```bash
cd ai-pool-connection/worker
npm install
npx wrangler login                     # opens Cloudflare auth in your browser

# Set your login password and at least one free provider key:
npx wrangler secret put APP_PASSWORD          # choose a strong password
npx wrangler secret put GROQ_API_KEY          # from https://console.groq.com (free)
npx wrangler secret put OPENROUTER_API_KEY    # from https://openrouter.ai (free models)

npx wrangler deploy
```

`wrangler deploy` prints your URL, e.g.
`https://ai-pool-connection.<your-subdomain>.workers.dev`.
Open that on your iPhone, sign in with `APP_PASSWORD`, and chat.

### Optional extra providers (secrets)
- `XAI_API_KEY` — Grok via xAI
- `CODECRAFT_BASE_URL` + `CODECRAFT_API_KEY` (+ `CODECRAFT_MODEL`) — shared gateway

### Add to your home screen (app-like)
In Safari: Share → **Add to Home Screen**. It opens full-screen like an app.

## Local test

```bash
npx wrangler dev            # http://localhost:8787
```

## Security notes
- **Fail closed:** the Worker returns `503` until `APP_PASSWORD` is set (only
  `ALLOW_OPEN=true` disables the gate, for local dev).
- `APP_PASSWORD` gates every page and API call; the session is an HMAC cookie
  (`HttpOnly`, `Secure`, `SameSite=Lax`). Password compare is constant-time over
  fixed-length hashes (no length leak).
- **Rate limiting:** best-effort per-IP throttles on `/login`
  (`LOGIN_RATE_PER_MIN`, default 8) and `/api/chat` (`CHAT_RATE_PER_MIN`,
  default 20). Workers can span isolates, so for hard guarantees also add a
  **Cloudflare Rate Limiting / WAF** rule on these paths in the dashboard.
- **Spend control:** paid providers (e.g. Grok/xAI) are **off unless
  `ALLOW_PAID=true`**, and clients cannot force a provider — so a public deploy
  defaults to free/local models only.
- Security headers on every response: `frame-ancestors 'none'` + `X-Frame-Options: DENY`
  (anti-clickjacking), `Referrer-Policy`, `nosniff`.
- Request bodies are size-capped; chat input is length-limited.
- Set a strong password and keep provider keys in secrets only. This is a
  single-user gate; for multiple private users, add per-user accounts.
