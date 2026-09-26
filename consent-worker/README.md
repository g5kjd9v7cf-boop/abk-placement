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

## Virtual business number

The phone assistant is a fixed script on `POST /voice/incoming`. It tells the caller it is automatic, writes down the name, an optional email, the request, and the callback number, then emails `meda-vermittlung@agentmail.to` and stores the same text in D1. It does not keep audio, does not give legal advice, and does not promise a visa.

The route answers only after a Twilio auth token is set. Until then it returns 404, and the consent endpoints keep working with `wrangler login` alone. Buy a virtual number in the Twilio account. Do not forward that number to a personal mobile, and do not publish a personal mobile on the site.

In the Twilio number’s voice settings, set the webhook to `POST https://meda-consent.g5kjd9v7cf.workers.dev/voice/incoming`. Then, from this directory:

```bash
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler d1 execute meda-consent --remote --file=./schema.sql
npx wrangler deploy
```

Messages already taken can be read with:

```bash
npx wrangler d1 execute meda-consent --remote --command "SELECT ts, caller_name, caller_number, email, message FROM call_messages ORDER BY ts DESC LIMIT 20"
```

Call-message rows older than 180 days are deleted by the daily cron.

## Tests
`npm test` runs the worker against a mock D1 binding. No Cloudflare credentials required.

## Receipt numbers
Format: `MEDA-CONSENT-YYYYMMDD-XXXXXXXX` (8 hex chars from a CSPRNG).
