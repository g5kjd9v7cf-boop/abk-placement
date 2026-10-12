# Security checklist

This file stays in the repo and is not copied to the Cloudflare Pages output.
Nothing here is a deploy. Ahmed or operations still has to do the dashboard steps.

## Done in this code

- Pages headers: HSTS `max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a closed Permissions-Policy, COOP `same-origin`, CORP `same-origin`, COEP `credentialless`.
- CSP uses `script-src 'self'` plus `https://challenges.cloudflare.com` only. `style-src` and `font-src` are `'self'`. There is no `unsafe-inline`. Inline `style` attributes and the two script style assignments are gone.
- Fonts are self-hosted (Inter, Source Serif 4). FormSubmit is gone.
- Third-party script policy: every site script is same-origin. Turnstile's `api.js` is the only third-party script. It is host-pinned in CSP. It is not SRI-pinned, because Cloudflare rotates that file. COEP is `credentialless` so the Turnstile frame can load; `require-corp` would block it.
- `bewerben.html` posts to the apply Worker. A CV is checked for size (5 MB) and type (extension plus PDF / DOC / DOCX magic bytes), then mailed through AgentMail and dropped. It is not written to R2, D1, or the site.
- Apply Worker: Turnstile siteverify, per-IP rate limit (5 per hour, in-memory per isolate), CORS allowlist of `https://meda-vermittlung.de` and `https://www.meda-vermittlung.de`, honeypot, production rejection of `CAND-DEMO-*` / `EMP-DEMO-*` / `REF-DEMO-*` tokens. Logs are status codes only.
- Turnstile site key is `TURNSTILE_SITE_KEY` in `site/js/meda-config.js` (empty until the widget exists). `TURNSTILE_SECRET`, `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`, and `DELIVER_TO` are Worker secrets. They are not in toml.
- Consent Worker: `STATS_TOKEN` is read from the environment and compared in constant time. Demo tokens are rejected when `REJECT_DEMO_TOKENS=true`. Posts and `/stats` are rate-limited. CORS is the production allowlist.
- E-sign Worker: same CORS, rate limit, and demo-token rule. Recipients come only from `DELIVER_TO`. An empty secret does not fall back to a hardcoded inbox. Client `deliver_to` is ignored.
- Ask Worker: this repo has config only. The toml sets the production allowlist and `REJECT_DEMO_TOKENS=true` and says the live script must do the same checks. Do not deploy `ask-worker/` from here.
- A CI gitleaks job scans full git history (`.github/workflows/gitleaks.yml`). The two commits that added and removed the old stats token are allowlisted by SHA in `.gitleaks.toml`. The token value is not in that file.
- `scripts/pii-scan.mjs` fails the test suite if the repo or the built `dist/` contains an unexpected email, a phone number, or a document that is not one of the two legal Einwilligung PDFs.
- `ops-templates/employer-accept-deny-draft.md` is an internal draft. It has no candidate record. It stays in git and is not published.

## Still to do in the dashboard

Do these before calling the move finished. This pull request does not merge and does not deploy.

1. Make the GitHub repository private, then turn GitHub Pages off. The order and the DNS cutover are in `DEPLOY-CLOUDFLARE.md`.
2. Turn on 2FA for every person and bot that can access the repository, Cloudflare, or the AgentMail inbox.
3. Turn on GitHub secret scanning and push protection. The gitleaks workflow is the CI check; GitHub's own scanning is still a setting.
4. On Cloudflare: WAF and bot rules for the zone, plus a rate-limit rule in front of `/apply`, `/consent`, and `/esign`. The Worker limits are per isolate and are not a global ceiling.
5. Turn on DNSSEC for `meda-vermittlung.de`.
6. Rotate `STATS_TOKEN`. The old value was in git history. Generate a new one locally, run `npx wrangler secret put STATS_TOKEN` from `consent-worker/`, deploy only when you mean to, and confirm the old value gets 401. Do not commit the new value.
7. Set the apply secrets with `wrangler secret put`: `TURNSTILE_SECRET`, `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`, `DELIVER_TO`. Put the public Turnstile site key in `TURNSTILE_SITE_KEY`. Rotate the AgentMail key if it has been copied into a chat, screenshot, or log.
8. Submit `meda-vermittlung.de` to the HSTS preload list only after HTTPS is stable on the apex and `www`, including subdomains. The header is already in `site/_headers`.
9. Create the Pages project from the private repo, set the build output to `dist/`, attach the custom domain, and only then uncomment the `api.meda-vermittlung.de` routes. Workers stay undeployed until that DNS exists.
10. Vendor the live ask Worker into this repo before its next deploy, and give it the same constant-time compare, rate limit, demo-token rejection, secret-only config, and log rule. Do not deploy the config-only `ask-worker/` directory.

## Data retention and deletion (GDPR)

Counsel should confirm the periods. The code does not add a public delete API.

- Applications: the CV and the profile exist only in the AgentMail message. Delete that message within 6 months if no contract is formed. If a placement file is opened, keep the message only as long as that file requires, then delete it. The Worker does not keep a copy.
- Consent events in D1 are the Art. 7 record (including the email on a consent submit). A working assumption is 3 years, pending counsel. The table is append-only. An erasure request needs a counsel-approved manual procedure; do not bolt a delete route onto the public Worker.
- Page-view storage keeps a daily hash of the IP, not the raw address.
- The e-sign Worker is not deployed and does not store signatures yet. When it is, signatures need their own retention decision before the first real submit.
- Access, correction, and deletion requests go to the public contact addresses on the imprint. The inbox owner carries those out.
