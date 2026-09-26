# MEDA Consent Worker (Phase 2 scaffold)

Cloudflare Worker + D1 append-only log for DSGVO Art. 7 proof.

## Endpoints
- `POST /view` — Erklärung page open / PDF download
- `POST /submit` — form consent checkbox submit
- `POST /withdraw` — withdrawal
- `POST /gate` — Datenschutz gate accept/decline

## Setup (when CF credentials available)
1. `npm i -g wrangler` (or use npx)
2. `wrangler login`
3. Create D1: `wrangler d1 create meda-consent`
4. Put database_id into `wrangler.toml`
5. Apply schema: `wrangler d1 execute meda-consent --file=./schema.sql`
6. `wrangler deploy`
7. On the static site, set:
   ```html
   <meta name="meda-consent-api" content="https://YOUR_WORKER.workers.dev">
   ```
   on pages that load `js/consent-api.js` (or site-wide in a shared head).

## Receipt numbers
Format: `MEDA-CONSENT-YYYYMMDD-XXXX` (random 4 hex).

## Security

### Stats token (secret — never commit it)
The `GET /stats` endpoint is gated by `STATS_TOKEN`. It is a secret and is **not**
stored in `wrangler.toml`. Configure it out-of-band:

```bash
# production
wrangler secret put STATS_TOKEN

# local dev (choose one)
wrangler dev --var STATS_TOKEN:<token>
# or create consent-worker/.dev.vars (gitignored):  STATS_TOKEN=<token>
```

Provide the token via an `Authorization: Bearer <token>` header (preferred, so it
does not end up in URLs / access logs). The legacy `?token=` query parameter is
still accepted for backward compatibility. The token is compared in constant
time.

> A `STATS_TOKEN` was previously committed to `wrangler.toml`. Treat it as
> compromised: generate a new one, set it via `wrangler secret put`, and redeploy.

### CORS / origin enforcement
Allowed origins come from `ALLOWED_ORIGINS` (comma-separated) and default to the
GitHub Pages origin `https://g5kjd9v7cf-boop.github.io`. In addition to CORS
response headers, write routes (`/view`, `/submit`, `/withdraw`, `/gate`,
`/pageview`) reject requests whose `Origin` is present but not allowlisted
(HTTP 403), so third-party pages cannot POST spam events. Requests without an
`Origin` header (server-to-server) are still accepted.

Responses include `X-Content-Type-Options: nosniff`.

## Note
Phase 1 ships this scaffold only — do not require wrangler login to use the static site.
