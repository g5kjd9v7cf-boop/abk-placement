# Partner portal

This file stays in the repo and is not copied to the Cloudflare Pages output. Nothing here is deployed. The Worker flag `PARTNER_PORTAL` is `false`. While it is false, `/esign/partner/*` answers 404. Signing stays `binding: false` and `status: ENTWURF`, the same rule as the meda-esign Worker.

Ahmed approves this design before anyone sets the flag. Counsel still has to approve a clause pack before a signature is kept. The `SIGNATURES` bucket and the D1 binding in `esign-worker/wrangler.toml` stay commented.

## What a partner can do

An employer or other partner signs and downloads only the contracts stored for that partner. The session carries one `partner_id`. List, sign, and download compare that id with the contract. A mismatch is 404, including when the contract exists for someone else. The client cannot choose another partner id, and `binding: true` on the body is ignored.

There is no public portal page and no search tool. The employer page only describes a future talent-pool search for long-term partners. That search stays behind `PARTNER_PORTAL=false` with the rest of this portal.

## Login

Two methods, both rate-limited per IP:

- Magic link. `POST /esign/partner/magic-link` takes `partner_id` and `email`. The directory check uses a constant-time compare. Unknown partners get the same `{ ok: true, delivered: false }` as known ones. The token is stored only as a SHA-256 hash, expires in 15 minutes, and works once. The HTTP response never includes the token. This stub does not send mail. `delivered` stays false unless a later mailer is injected, and even then the response body stays empty of the token. `POST /esign/partner/magic-link/consume` exchanges a valid token for a session.
- Passkey. `POST /esign/partner/passkey/options` returns a short-lived challenge and does not return an email or a display name. `POST /esign/partner/passkey/finish` calls a WebAuthn verifier. The default verifier returns `NOT_CONFIGURED`. A challenge that does not match the partner is `LOGIN_FAILED`. Do not treat this stub as passkey verification.

Login responses set `partner_session` as `HttpOnly; Secure; SameSite=Strict` and also return the session bearer once. Later calls send `Authorization: Bearer` or that cookie.

Turnstile runs on magic-link issue, passkey options, passkey finish, and sign, through `REQUIRE_TURNSTILE`. That flag is still false until `TURNSTILE_SECRET` exists. When the portal flag is turned on later, turn Turnstile on as well.

## Signer copy

Every signer — candidate, family, employer, or partner — receives their own copy of the signed contract. After the signature checks pass, the body must include `copy`. At least one of these is required:

- `copy.email`: the address the signer types for their own copy.
- `copy.download`: `true` when they want the PDF.

Both may be set. If neither is set, or the address is not a single email, the response is `COPY_REQUIRED` or `COPY_EMAIL_INVALID`. There is no `ref_id` and nothing is stored. `deliver_to` is not a copy address and is ignored.

MEDA always receives its own copy as well, at both public inboxes: `meda-vermittlung@agentmail.to` and `MEDA-team@outlook.com`. Those two sends happen even when the signer only downloads. They are not taken from `DELIVER_TO`.

Signing is not complete until every chosen signer channel and both MEDA sends have succeeded. Email-only completes when the mailer accepts the signer message and both MEDA messages. Download-only stays `COPY_PENDING` until `GET` of the PDF bytes. Both waits for the mailer and for that download. A mailer that returns not ok, or throws, ends as `COPY_FAILED` with no `ref_id`. The stub mailer records the acceptance and does not open a network connection. Replace it with the real sender before any deploy. `binding` stays false.

Candidate, family, and employer use `POST /esign/submit`. A pending download is `GET /esign/copy?t=…`, one use, 15 minutes, and the PDF response carries `X-MEDA-Ref` only after the copy is complete. Partners use `POST /esign/partner/sign` and the existing private file route. The public pages still do not call these routes.

## Private PDFs and signed links

A successful sign writes a PDF under `private/{partner_id}/{contract_id}.pdf`. The object is the commented `SIGNATURES` bucket when that binding exists. Until then the bytes stay in isolate memory and disappear when the isolate does. `publicUrl` is always null. A stored object that exposes a URL is refused and the response is a generic `ERROR`.

`POST /esign/partner/download` returns a relative path `/esign/partner/file?t=…` and an expiry. The token is HMAC-SHA256 over `{ partner_id, contract_id, exp }` using `PARTNER_LINK_SECRET` (a Wrangler secret, minimum 16 characters, not in git). The default life is 5 minutes, clamped to 30–900 seconds via `PARTNER_LINK_TTL_SECONDS`. The file route still requires the same partner's session. Another partner's session, a tampered token, or an expired token does not return the PDF. The file response is `application/pdf` with `Cache-Control: private, no-store` and a generic filename. It is not an R2 URL.

## Audit log

Each isolate keeps an append-only list. A later D1 table `partner_audit` is sketched in `esign-worker/schema.sql` and is not applied. Events are `MAGIC_ISSUED`, `LOGIN`, `LOGIN_FAILED`, `SIGN`, `SIGN_REFUSED`, `LINK_ISSUED`, `DOWNLOAD`, `DOWNLOAD_DENIED`, `ACCESS_DENIED`, `COPY_DELIVERED`, and `COPY_FAILED`. A delivery row records time, action, channel (`email` or `download`), recipient (`signer` or `meda`), destination, ref id, and party. The destination is the inbox for an email and empty for a download. Each MEDA inbox is its own row, and the signer's own email is its own row. Failed cross-partner attempts omit the other contract id. Rows do not store the signer name, a token, or the PDF. Partners do not get an audit route. Console logs stay the shared safe log: code, status, and route. They do not include the destination.

## Limits

| Route | Limit |
| --- | --- |
| Magic-link issue | 5 per hour per IP |
| Magic-link consume and passkey | 10 per hour per IP |
| Sign | 10 per hour per IP |
| Download link | 30 per hour per IP |
| File | 60 per hour per IP |

Login bodies are capped at 8 KB. Sign uses the e-sign JSON cap. These counters are per isolate. A Cloudflare rate-limit rule is still required before go-live.

## What Ahmed does before this can leave the stub

- Keep `PARTNER_PORTAL` false in this pull request.
- Approve passkeys or magic links as the only login. Pick a WebAuthn library and set the relying party to `meda-vermittlung.de`. User handles are random ids in D1, not email addresses.
- Put the partner directory in D1. Do not commit partner emails.
- Set `PARTNER_LINK_SECRET` with `npx wrangler secret put`. Do not commit it.
- Sign AVV contracts with Cloudflare before uncommenting `SIGNATURES` or `DB`.
- Tell operations to drop the `t` query from access logs for `/esign/partner/file`.
- Leave the public site without a portal page until the flag, the verifier, and storage are approved together.
- Counsel confirms how long signed drafts and the audit rows are kept. The stub has no public delete route.
