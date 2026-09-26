# MEDA Consent Worker

Cloudflare Worker + D1. It stores a short proof of consent and page views: event name, server time, page path, a random receipt id, and yes/no consent flags. It does not store email addresses, IP addresses, raw request bodies, or uploaded files.

## Endpoints

- `POST /view` — declaration page opened (`erklaerung_view`)
- `POST /submit` — form consent (`consent_given`), returns `receipt_ref`
- `POST /withdraw` — marks every stored row with that receipt id as restricted (`consent_withdrawn`). Unknown receipts return 404. This does not delete FormSubmit or AgentMail messages.
- `POST /pageview` — minimized page view (`page_visit`)
- `GET /stats` — aggregate counts only. Header `Authorization: Bearer <STATS_TOKEN>`. Query-string tokens are rejected with HTTP 400.

`/gate` is not a route. Unknown event names are rejected. The client timestamp is ignored. Bodies larger than 4KB are rejected. `Origin` must be one of:

- `https://meda-vermittlung.de`
- `https://www.meda-vermittlung.de`
- `https://g5kjd9v7cf-boop.github.io`

`http://` origins are not allowed. The allowlist is in `src/policy.js`, not an environment variable that can reintroduce them.

JSON responses send `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, and `Cache-Control: no-store`.

## Secrets and the burned token

`STATS_TOKEN` must not be committed. A previous value was stored in `wrangler.toml` on a public repository and is burned. This repository cannot delete that git history and cannot rotate the Cloudflare secret for you.

After you rotate the token in Cloudflare, set the new one only as a secret:

```sh
npx wrangler secret put STATS_TOKEN
```

Do not write the new value into git. The worker reads `env.STATS_TOKEN`. If it is missing, `/stats` returns 401.

Failed stats authentications are limited to 8 per 60 seconds per client IP inside a single Worker isolate. The counter is process memory only. It is not shared across isolates and it is not stored in D1. IP addresses are not written to the database.

## Retention

Rows older than six calendar months are deleted by:

- the scheduled handler (`15 3 * * *` in `wrangler.toml`)
- a delete of expired rows when a request is handled

You must deploy the worker for the cron trigger to exist (`npx wrangler deploy`). This repository cannot deploy it.

## Schema

Fresh database:

```sh
npx wrangler d1 execute meda-consent --remote --file=./schema.sql
```

Existing database (adds columns, does not drop the legacy email or ip_hash columns):

```sh
npx wrangler d1 execute meda-consent --remote --file=./migrations/001_minimize.sql
```

New writes leave `email`, `ip_hash`, `user_agent`, `referrer`, and `session_id` null. `payload_json` is `{}`.

## Local check

```sh
npm test
node --check src/index.js
node --check src/policy.js
```

## Static site

Pages that call this worker set:

```html
<meta name="meda-consent-api" content="https://meda-consent.g5kjd9v7cf.workers.dev">
```
