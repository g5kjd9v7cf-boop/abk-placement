# MEDA e-sign Worker (stub, not deployed)

Free-path F1 scaffold for `POST /esign/submit`. No Youtrust or DocuSign SDK. This folder is **not deployed**; the static pages keep submit disabled while `legal_approved` is false and show a **local** `REF-*` preview only.

## Behaviour

- Forces `binding: false` and `status: ENTWURF`. A client value of `binding: true` is ignored.
- Returns `403 LEGAL_NOT_APPROVED` / `Legal-Freigabe ausstehend` unless `LEGAL_APPROVED_PACK_IDS` lists the pack id. The default var is empty.
- Public ids only: `EMP-*` required for employers, optional `CAND-*` (or a legacy `REF-*` brought from an older site link) for candidate/family. Success returns a new `REF-*`.
- Dual notify is a stub (`delivered: false`) aimed at `meda-vermittlung@agentmail.to` and `MEDA-team@outlook.com`. No mail is sent.

## When deploy is actually wanted

1. `npx wrangler login`
2. Create D1 + R2, uncomment the bindings in `wrangler.toml`, apply `schema.sql`.
3. Keep `LEGAL_APPROVED_PACK_IDS` empty until Ahmed sets a counsel-approved pack id.
4. `npx wrangler deploy`
5. Put the workers.dev URL in `<meta name="meda-esign-api">` on the sign pages.

Until then the pages do not call this Worker.
