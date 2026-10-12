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
6. Set the stats secret before deploying (never a `[vars]` entry):
   ```sh
   npx wrangler secret put STATS_TOKEN
   ```
   Generate a new value locally. Do not commit it.
7. `wrangler deploy`
   Confirm `GET /stats` with the new value returns 200 and the previous value returns 401. Then discard the previous value.
8. On the static site, endpoints come from `site/js/meda-config.js`.
   Leave `API_ORIGIN` empty until `api.meda-vermittlung.de` DNS is live.
   Then set `API_ORIGIN` to `https://api.meda-vermittlung.de`.
   Consent calls use `/consent/...` on that host and `/...` on workers.dev.

## Receipt numbers
Format: `MEDA-CONSENT-YYYYMMDD-XXXX` (random 4 hex).

## CORS
Allow GitHub Pages origin: `https://g5kjd9v7cf-boop.github.io`

## Note
Phase 1 ships this scaffold only — do not require wrangler login to use the static site.
