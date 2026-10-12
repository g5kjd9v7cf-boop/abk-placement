# MEDA e-sign Worker (stub, not deployed)

Free-path F1 scaffold for `POST /esign/submit`. No Youtrust or DocuSign SDK. This folder is **not deployed**; the static pages keep submit disabled while `legal_approved` is false and show a **local** `REF-*` preview only.

## Behaviour

- Forces `binding: false` and `status: ENTWURF`. A client value of `binding: true` is ignored.
- Returns `403 LEGAL_NOT_APPROVED` / `Legal-Freigabe ausstehend` unless `LEGAL_APPROVED_PACK_IDS` lists the pack id. The default var is empty.
- Public ids only: `EMP-*` required for employers, optional `CAND-*` (or a legacy `REF-*` brought from an older site link) for candidate/family. Success returns a new `REF-*`.
- When `REJECT_DEMO_TOKENS` is `true` (the production var), a public token containing `-DEMO-` is refused with `403 DEMO_TOKEN_REJECTED`. Tests omit the flag.
- Notify recipients come from the `DELIVER_TO` secret (comma-separated). If that secret is unset, the Worker reports no recipients. A `deliver_to` field on the request is ignored. No mail is sent (`delivered: false`).
- The partner portal (`/esign/partner/*`) is a stub behind `PARTNER_PORTAL=false`. It forces `binding: false`. The design is `PARTNER-PORTAL.md`. Do not deploy it from this repo.

## When deploy is actually wanted

1. `npx wrangler login`
2. Create D1 + R2, uncomment the bindings in `wrangler.toml`, apply `schema.sql`.
3. Keep `LEGAL_APPROVED_PACK_IDS` empty until Ahmed sets a counsel-approved pack id.
4. `npx wrangler deploy`
5. Leave `API_ORIGIN` empty in `site/js/meda-config.js` until `api.meda-vermittlung.de` DNS is live. The pages keep the workers.dev fallback until then. Uncomment the `api.meda-vermittlung.de/esign/*` route in `wrangler.toml` at the same time.

Until then the pages do not call this Worker.
