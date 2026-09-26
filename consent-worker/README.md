# MEDA Consent Worker

Cloudflare Worker + D1. It stores a short proof of consent and page views: event name, server time, page path, a random receipt id, and yes/no consent flags. It does not store email addresses, IP addresses, or raw request bodies.

Applications are separate. The apply form sends structured facts, a contact email, and file bytes to `POST /apply` over HTTPS. The worker encrypts each file and the email with AES-GCM before insert. It stores file ciphertext, the file IV, the label `AES-GCM`, and the email as ciphertext plus its own IV. It does not store a plaintext email column. It stores the typed facts needed for the rule check (profession, certificate names, language, experience years, qualification country, consent flags, matched rule id). It does not decrypt files while matching. Every accepted application is kept for 24 months so a later rule can match it.

## Endpoints

- `POST /view` — declaration page opened (`erklaerung_view`)
- `POST /submit` — form consent (`consent_given`), returns `receipt_ref`
- `POST /withdraw` — restricts every consent row with that receipt and deletes the application, the file ciphertext, and the encrypted email for that receipt. Unknown receipts return 404. This does not delete FormSubmit or AgentMail messages. No email confirmation is sent.
- `POST /pageview` — minimized page view (`page_visit`)
- `POST /apply` — encrypted application. Returns the receipt and whether a rule matched. It does not return the candidate email, ciphertext, or file bytes. A missing `DATA_ENCRYPTION_KEY` rejects the upload and stores nothing.
- `GET /stats` — aggregate counts only. Header `Authorization: Bearer <STATS_TOKEN>`. Query-string tokens are rejected with HTTP 400.
- `GET /matches` — current matches (a rule id is set). Same bearer token as `/stats`. Each row is match id, rule id, profession, consent flags, receipt, sample flag, created time, and the decrypted contact email. No ciphertext and no file bytes. A profile with no current rule is not listed.
- `POST /matches/refresh` — same bearer token. Re-runs the matcher on stored profile facts and the current rules, without decrypting files, then returns the same match list.

`/gate` is not a route. Unknown event names are rejected. The client timestamp is ignored. Consent bodies larger than 4KB are rejected. Apply bodies larger than 2.5MB are rejected. Each file must be PDF, JPEG, or PNG, at most 400KB, and the content type must match the file header. `Origin` must be one of:

- `https://meda-vermittlung.de`
- `https://www.meda-vermittlung.de`
- `https://g5kjd9v7cf-boop.github.io`

`http://` origins are not allowed. The allowlist is in `src/policy.js`, not an environment variable that can reintroduce them.

JSON responses send `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, and `Cache-Control: no-store`.

Placement rules live in `data/placement-rules.json`. Open examples for the public vocational categories on the site are marked `CC0-1.0` and `sample: true`. The MEDA Ausbildung rule is `meda-own` and is also a sample. None of them is a checked live vacancy. Matching does not read file bytes.

## Secrets

`STATS_TOKEN` must not be committed. A previous value was stored in `wrangler.toml` on a public repository and is burned. This repository cannot delete that git history and cannot rotate the Cloudflare secret for you.

After you rotate the token in Cloudflare, set the new one only as a secret:

```sh
npx wrangler secret put STATS_TOKEN
```

Application files need a separate 32-byte key, base64-encoded. Generate it locally and store it only as a secret:

```sh
npx wrangler secret put DATA_ENCRYPTION_KEY
```

Do not write either value into git, into wrangler `[vars]`, or into the static site. The worker reads `env.STATS_TOKEN` and `env.DATA_ENCRYPTION_KEY`. If the stats token is missing, `/stats`, `/matches`, and `/matches/refresh` return 401. If the encryption key is missing or not 32 bytes, `/apply` and `/matches/refresh` return 503 and `/apply` stores nothing.

Failed admin authentications are limited to 8 per 60 seconds per client IP inside a single Worker isolate. The counter is process memory only. It is not shared across isolates and it is not stored in D1. IP addresses are not written to the database.

## Retention

Consent-log rows older than six calendar months are deleted. Application rows and encrypted file rows older than twenty-four calendar months are deleted. Both cutoffs run on:

- the scheduled handler (`15 3 * * *` in `wrangler.toml`)
- a delete of expired rows when a request is handled

You must deploy the worker for the cron trigger to exist (`npx wrangler deploy`). This repository cannot deploy it.

## Schema

Fresh database:

```sh
npx wrangler d1 execute meda-consent --remote --file=./schema.sql
```

Existing database. Run each file once. `001` adds columns and does not drop legacy email or ip_hash columns. `002` adds the application tables. `003` adds the encrypted contact-email columns. Do not run `003` twice.

```sh
npx wrangler d1 execute meda-consent --remote --file=./migrations/001_minimize.sql
npx wrangler d1 execute meda-consent --remote --file=./migrations/002_applications.sql
npx wrangler d1 execute meda-consent --remote --file=./migrations/003_talent_pool.sql
```

New consent writes leave `email`, `ip_hash`, `user_agent`, `referrer`, and `session_id` null. `payload_json` is `{}`. Application rows have no plaintext email column and no IP column. The contact address is stored only as AES-GCM ciphertext.

## Local check

```sh
npm test
node --check src/index.js
node --check src/policy.js
node --check src/apply.js
node --check src/match.js
node --check src/crypto-docs.js
```

## Static site

The apply form posts only to this worker. The contact form still posts to FormSubmit. Pages that call this worker set:

```html
<meta name="meda-consent-api" content="https://meda-consent.g5kjd9v7cf.workers.dev">
```
