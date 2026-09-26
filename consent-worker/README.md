# MEDA Consent Worker

Cloudflare Worker + D1 log for DSGVO Art. 7 proof, plus short-lived pseudonymous page views.

The operator deploys this with a Cloudflare login. There is no API token, no stats password, and no IP pepper.

## Endpoints
- `POST /view` — Erklärung page open
- `POST /submit` — form consent checkbox submit (email required)
- `POST /withdraw` — withdrawal (email required)
- `POST /gate` — Datenschutz choice `datenschutz_accepted` or `datenschutz_declined`
- `POST /pageview` — pseudonymous page visit, only after the visitor accepts

`GET /stats` is closed. Counts are read from D1 with the Cloudflare account, for example:

```bash
npx wrangler d1 execute meda-consent --remote --command "SELECT event, COUNT(*) AS n FROM consent_events GROUP BY event"
```

## Security
- Browser writes must send an `Origin` on the HTTPS allowlist. Other origins are rejected.
- The client cannot choose the event name (except the two gate values) or the timestamp.
- Stored JSON is an allowlist. Emails are kept only on submit and withdrawal.
- IP addresses are not written to D1. The in-memory rate limit uses the connecting address and forgets it when the isolate stops.
- Bodies over 8 KB are rejected. Each isolate allows 30 writes per minute per address.
- Page-view rows older than 90 days are deleted by the daily cron. Consent, gate, and withdrawal rows are kept for proof.
- If D1 is not bound, writes return HTTP 503. The site must not tell the visitor the event was stored.

## Deploy
From this directory, on the machine of the Cloudflare account owner:

```bash
npm i
npx wrangler login
npx wrangler deploy
```

`wrangler login` opens a browser. Do not create an API token for this deploy. Do not run `wrangler secret put`.

D1 database `meda-consent` is already named in `wrangler.toml`. If the database is new, create it once with `npx wrangler d1 create meda-consent`, put the id in `wrangler.toml`, then apply `schema.sql`:

```bash
npx wrangler d1 execute meda-consent --remote --file=./schema.sql
```

## Tests
`npm test` runs the worker against a mock D1 binding. No Cloudflare credentials required.

## Receipt numbers
Format: `MEDA-CONSENT-YYYYMMDD-XXXXXXXX` (8 hex chars from a CSPRNG).
