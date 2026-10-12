# Security checklist

This file stays in the repo and is not copied to the Cloudflare Pages output.
Nothing here is a deploy. Ahmed or operations still has to do the dashboard steps.

## Done in this code

- Pages headers: HSTS `max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a closed Permissions-Policy, COOP `same-origin`, CORP `same-origin`, COEP `credentialless`.
- CSP uses `script-src 'self'` plus `https://challenges.cloudflare.com` only. `style-src` and `font-src` are `'self'`. There is no `unsafe-inline`. Inline `style` attributes and the two script style assignments are gone.
- Fonts are self-hosted (Inter, Source Serif 4). FormSubmit is gone.
- Third-party script policy: every site script is same-origin. Turnstile's `api.js` is the only third-party script. It is host-pinned in CSP. It is not SRI-pinned, because Cloudflare rotates that file. COEP is `credentialless` so the Turnstile frame can load; `require-corp` would block it.
- `bewerben.html` posts to the apply Worker. A CV is checked for size (5 MB) and type (extension plus PDF / DOC / DOCX magic bytes), then mailed through AgentMail. A private-storage stub (`apply-worker/src/retention.mjs`) can put the same bytes in a bucket under a random `private/…` key with `delete_at` metadata. The HTTP response never includes that key or a URL. The bucket binding is not enabled in this PR.
- Apply Worker: Turnstile siteverify, per-IP rate limit (5 per hour, in-memory per isolate), CORS allowlist of `https://meda-vermittlung.de` and `https://www.meda-vermittlung.de`, honeypot, production rejection of `CAND-DEMO-*` / `EMP-DEMO-*` / `REF-DEMO-*` tokens. Logs are status codes only.
- Turnstile site key is `TURNSTILE_SITE_KEY` in `site/js/meda-config.js` (empty until the widget exists). `TURNSTILE_SECRET`, `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`, and `DELIVER_TO` are Worker secrets. They are not in toml.
- Consent Worker: `STATS_TOKEN` is read from the environment and compared in constant time. Demo tokens are rejected when `REJECT_DEMO_TOKENS=true`. Posts and `/stats` are rate-limited. CORS is the production allowlist.
- E-sign Worker: same CORS, rate limit, and demo-token rule. Ops notify recipients come only from `DELIVER_TO`. An empty secret does not fall back to a hardcoded inbox. Client `deliver_to` is ignored. A signature stays incomplete until the signer chooses email, download, or both and that copy is accepted. MEDA's copy is always recorded for `meda-vermittlung@agentmail.to` and `MEDA-team@outlook.com`. The stub does not transmit mail.
- Partner portal: design in `PARTNER-PORTAL.md` (not published). Code is `esign-worker/src/partner-portal.mjs`, on the meda-esign Worker, with `PARTNER_PORTAL=false`. Routes answer 404 while the flag is off. Login is a passkey ceremony or a magic link. Passkey finish stays `NOT_CONFIGURED` until a WebAuthn verifier exists. The magic link is not mailed and the token is not in the HTTP response. A partner session can sign and download only that partner's contracts. Signed PDFs use the commented `SIGNATURES` bucket, or isolate memory when it is unbound, under `private/{partner_id}/…`, with `publicUrl` null. Downloads are HMAC links that expire (default 5 minutes) and still require that partner's session. An audit list records action, time, partner id, and contract id, plus each copy delivery (channel, recipient, and destination). The partner signs only after choosing email, download, or both, and MEDA's two public inboxes are included. Login and signing use the Turnstile flag and per-IP rate limits. `binding` stays false. The flag stays false.
- Ask Worker: this repo has config only. The toml sets the production allowlist and `REJECT_DEMO_TOKENS=true` and says the live script must do the same checks. Do not deploy `ask-worker/` from here.
- CSP also sets `script-src-attr 'none'` and a report-only Trusted Types policy (`require-trusted-types-for 'script'; trusted-types meda`). There is no inline script. Enforcement of Trusted Types waits until a `meda` policy exists in the pages.
- Consent, e-sign, and the ask guard verify Turnstile only when `REQUIRE_TURNSTILE=true`. The flag is `false` until `TURNSTILE_SECRET` is set. JSON bodies are size-capped. Database errors returned to the browser are the code `ERROR`.
- The ask Worker script is still not in this repo. `ask-worker/src/guards.mjs` is the hook it must call. Do not set `main` and do not deploy that directory.
- CI runs gitleaks (`.github/workflows/gitleaks.yml`), CodeQL (`.github/workflows/codeql.yml`), and `npm audit --audit-level=high` (`.github/workflows/dependency-audit.yml`). The two commits that added and removed the old stats token are allowlisted by SHA in `.gitleaks.toml`. The token value is not in that file.
- `SECURITY.md` and `site/.well-known/security.txt` name the public inbox as the vulnerability contact. `security.txt` is published. `SECURITY.md` is not.
- `scripts/pii-scan.mjs` fails the test suite if the repo or the built `dist/` contains an unexpected email, a phone number, or a document that is not one of the two legal Einwilligung PDFs.
- `ops-templates/employer-accept-deny-draft.md` is an internal draft. It has no candidate record. It stays in git and is not published.

## Still to do in the dashboard

Do these before calling the move finished. This pull request does not merge and does not deploy.

1. Make the GitHub repository private, then turn GitHub Pages off. The order and the DNS cutover are in `DEPLOY-CLOUDFLARE.md`.
2. Turn on 2FA or a passkey for every person who can access GitHub, Cloudflare, AgentMail, and Outlook (`MEDA-team@outlook.com`). Remove access that is no longer needed and write down who still has it.
3. Turn on GitHub secret scanning and push protection. The gitleaks workflow is the CI check; GitHub's own scanning is still a setting.
4. On Cloudflare: WAF and bot rules for the zone, plus a rate-limit rule in front of `/apply`, `/consent`, and `/esign`. The Worker limits are per isolate and are not a global ceiling.
5. Turn on DNSSEC for `meda-vermittlung.de`.
6. Rotate `STATS_TOKEN`. The old value was in git history. Generate a new one locally, run `npx wrangler secret put STATS_TOKEN` from `consent-worker/`, deploy only when you mean to, and confirm the old value gets 401. Do not commit the new value.
7. Set the apply secrets with `wrangler secret put`: `TURNSTILE_SECRET`, `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`, `DELIVER_TO`. Put the public Turnstile site key in `TURNSTILE_SITE_KEY`. Rotate the AgentMail key if it has been copied into a chat, screenshot, or log.
8. Submit `meda-vermittlung.de` to the HSTS preload list only after HTTPS is stable on the apex and `www`, including subdomains. The header is already in `site/_headers`.
9. Create the Pages project from the private repo, set the build output to `dist/`, attach the custom domain, and only then uncomment the `api.meda-vermittlung.de` routes. Workers stay undeployed until that DNS exists.
10. Vendor the live ask Worker into this repo before its next deploy, and give it the same constant-time compare, rate limit, demo-token rejection, secret-only config, and log rule. Do not deploy the config-only `ask-worker/` directory.
11. Leave `PARTNER_PORTAL` false. Before any later approval: choose a WebAuthn verifier, set `PARTNER_LINK_SECRET` with `wrangler secret put`, sign the AVV contracts, and keep the `SIGNATURES` binding commented until storage is approved. Do not add a public portal page. Cloudflare access logs must drop the `t` query on `/esign/partner/file` before that route exists. The partner directory lives in D1, not in git.

## Ahmed approves these operational controls

These are not done by this pull request.

- Access review: list GitHub collaborators, Cloudflare members, AgentMail inbox access, and the Outlook mailbox. Remove anyone who no longer works on MEDA. Repeat when someone joins or leaves.
- Backups: export the consent D1 database on a schedule Ahmed chooses, and keep that export where the public site cannot read it. The private CV bucket, once enabled, needs the same. Test that a restore works before relying on it.
- Incident plan: who is told, how the public inbox is checked, and how a key is rotated. `SECURITY.md` and `/.well-known/security.txt` are the public reporting path. Ahmed names the person who answers.
- DSGVO TOMs: a short description of the measures already in this repo (encryption in transit, access limited to the operators, no public CV URLs, log redaction, retention) plus the hosting locations of Cloudflare and AgentMail. Counsel should sign off.
- AVV contracts: a processing agreement with Cloudflare and with AgentMail before candidate files are stored or mailed in production. Outlook, if it receives candidate mail, needs the same. Do not turn the private CV bucket on before those contracts exist.

## Data retention and deletion (GDPR)

Counsel should confirm the periods. The code does not add a public delete API.

- Applications: the profile and the CV are mailed to the ops inbox. Delete that message within 180 days if no contract is formed. The private-bucket stub uses the same 180 days (`CV_RETENTION_DAYS`, clamped to 30–730) and a scheduled delete. Until the bucket is bound, the inbox is the only copy. Neither copy is a public URL. If a placement file is opened, keep the record only as long as that file requires.

## Data minimisation of the public forms

Reviewed against the fields in the HTML. A test fails if a form gains a field that is not on this list, or if a field name looks like a passport, birth date, religion, bank, tax, address, photo, or social-security number.

- Bewerben, CV: name, email, optional phone, one PDF/DOC/DOCX, consent version. No photo, no address, no ID number.
- Bewerben, profile: the same contact fields plus experience, skills, languages, availability, and sector. No file.
- Kontakt: role, name, email, optional company, sector, message, consent. No CV.
- Widerruf: optional receipt number, email, confirmation. Nothing else.
- Arbeitgeber-Anmeldung: name, email, optional phone, optional HR email, path, role, language level, experience yes/no, target region, and two free-text notes. No file upload. The placeholder no longer asks for a passport copy. Free text can still contain an ID number if the person types one; the form does not require it.

Consent events in D1 are the Art. 7 record (including the email on a consent submit). A working assumption is 3 years, pending counsel. The table is append-only. An erasure request needs a counsel-approved manual procedure; do not bolt a delete route onto the public Worker. Page-view storage keeps a daily hash of the IP, not the raw address. The e-sign Worker is not deployed and does not store signatures yet. Access, correction, and deletion requests go to the public contact addresses on the imprint.
