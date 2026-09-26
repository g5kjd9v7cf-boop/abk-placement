# MEDA Consent Worker

Cloudflare Worker + D1 append-only log for DSGVO Art. 7 proof, plus short-lived pseudonymous page views.

## Endpoints
- `POST /view` — Erklärung page open
- `POST /submit` — form consent checkbox submit (email required)
- `POST /withdraw` — withdrawal (email required)
- `POST /gate` — Datenschutz choice `datenschutz_accepted` or `datenschutz_declined`
- `POST /pageview` — pseudonymous page visit, only after the visitor accepts
- `GET /stats` — aggregate counts

## Security
- Browser writes must send an `Origin` on the HTTPS allowlist. Other origins are rejected.
- The client cannot choose the event name (except the two gate values) or the timestamp.
- Stored JSON is an allowlist. Emails are kept only on submit and withdrawal.
- IP addresses are stored only as a daily hash, and only when `IP_HASH_PEPPER` is set.
- Bodies over 8 KB are rejected. Each isolate allows 30 writes per minute per IP.
- `/stats` accepts `Authorization: Bearer <token>` or `X-Stats-Token`. A `?token=` query is rejected so the secret is not written to access logs.
- Page-view rows older than 90 days are deleted by the daily cron. Consent, gate, and withdrawal rows are kept for proof.
- If D1 is not bound, writes return HTTP 503. The site must not tell the visitor the event was stored.

## Secrets
Do not put secrets in `wrangler.toml`. A stats token was previously committed and is compromised.

```bash
wrangler secret put STATS_TOKEN
wrangler secret put IP_HASH_PEPPER
```

Generate both with a password manager or `openssl rand -hex 32`. Redeploy after rotating. Anyone who cloned the old repository can still read git history; rotation is what cuts off that access.

## Setup
1. `npm i` in this directory (or `npx wrangler`)
2. `npx wrangler login`
3. Create D1 if needed: `npx wrangler d1 create meda-consent`
4. Put `database_id` into `wrangler.toml`
5. Apply schema: `npx wrangler d1 execute meda-consent --file=./schema.sql`
6. Set the two secrets above
7. `npx wrangler deploy`
8. On the static site, set:
   ```html
   <meta name="meda-consent-api" content="https://YOUR_WORKER.workers.dev">
   ```

## Tests
`npm test` runs the worker against a mock D1 binding. No Cloudflare credentials required.

## Receipt numbers
Format: `MEDA-CONSENT-YYYYMMDD-XXXXXXXX` (8 hex chars from a CSPRNG).
