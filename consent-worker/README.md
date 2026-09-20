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

## CORS
Allow GitHub Pages origin: `https://g5kjd9v7cf-boop.github.io`

## Note
Phase 1 ships this scaffold only — do not require wrangler login to use the static site.
