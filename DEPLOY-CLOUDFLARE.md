# Deploy MEDA on Cloudflare Pages

The public site is the `dist/` directory produced by `node scripts/build-site.mjs`. Workers, ops templates, docs, and this file stay in the Git repo and are not copied into `dist/`.

`site/js/meda-config.js` has one switch, `API_ORIGIN`. It is empty on purpose. Empty keeps the current workers.dev hosts. Set it to `https://api.meda-vermittlung.de` only after the DNS records below answer on HTTPS.

## 1. Pages project

Cloudflare Pages on the free plan can build a private GitHub repo.

1. In the Cloudflare dashboard open **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and choose this repository (`g5kjd9v7cf-boop/abk-placement`).
3. Production branch: `main`.
4. Framework preset: **None**.
5. Build command: `node scripts/build-site.mjs`
6. Build output directory: `dist`
7. Root directory: `/` (repository root). No environment variables are required for the static build.
8. Save and deploy.

If the Git connector refuses a public repo, do step 5 (make the GitHub repo private) first, then return here. Do not point Pages at the repository root. The root still contains workers and ops files.

## 2. Check the build output

On the `*.pages.dev` URL, these must load:

- `/` and `/index.html`
- `/bewerben.html`
- `/impressum.html`
- `/datenschutz.html`
- `/einwilligung.html`
- `/contract-draft.html`, `/employer-sign.html`, `/family-sign.html`
- `/css/styles.css`, `/js/main.js`, `/assets/hero-hospital.jpg`

Unknown paths, including the ones below, must be a real HTTP 404 whose body is `dist/404.html` (Seite nicht gefunden). They must not return the homepage. There is no SPA `_redirects` rule.

These must 404:

- `/consent-worker/wrangler.toml`
- `/esign-worker/schema.sql`
- `/ops-templates/employer-accept-deny-draft.md`
- `/DEPLOY-CLOUDFLARE.md`
- `/data/ask-meda-kb.json`
- any `*.md`, `*.toml`, or `*.sql`

`/data/esign/*.json` stays, because the e-sign pages fetch those packs. The published JSON omits `content_sha256`, `fee_placeholder`, and `source_body_version_line`.

Response headers on HTML come from `site/_headers`: HSTS, CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`. There is no `Access-Control-Allow-Origin` on Pages.

## 3. Custom domain

In the Pages project open **Custom domains** and add:

- `meda-vermittlung.de`
- `www.meda-vermittlung.de`

Wait until both show **Active**.

## 4. DNS

The zone for `meda-vermittlung.de` should be on Cloudflare so Pages can write the records. Remove the GitHub Pages records once the Pages hostnames are active:

- Apex `A` / `AAAA` records aimed at GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
- `www` `CNAME` aimed at `g5kjd9v7cf-boop.github.io`

Pages will add, or you add manually:

- `meda-vermittlung.de` → CNAME to `<project>.pages.dev` (Cloudflare flattens the apex)
- `www` → CNAME to `<project>.pages.dev`

Both should be proxied (orange cloud). The repo `CNAME` file is the old GitHub Pages hint. It is not copied into `dist/`. Delete it after GitHub Pages is disabled.

### API host, after the site is on Cloudflare

Add `api.meda-vermittlung.de` only when you are ready to leave workers.dev. Workers on the zone do not need a separate origin record if the route is attached; Cloudflare documents the route as enough when the zone is proxied. Uncomment the route blocks, then deploy:

| Worker | Route pattern | wrangler file |
| --- | --- | --- |
| meda-ask | `api.meda-vermittlung.de/ask/*` | `ask-worker/wrangler.toml` (config only — the script is not in this repo) |
| meda-consent | `api.meda-vermittlung.de/consent/*` | `consent-worker/wrangler.toml` |
| meda-esign | `api.meda-vermittlung.de/esign/*` | `esign-worker/wrangler.toml` |

The ask script must keep serving `/chat` and `/intake` on `*.workers.dev`, and also `/ask/chat` and `/ask/intake` on the new host. It must ignore `ops.deliver_to` from the browser and stamp recipients from the `DELIVER_TO` secret:

```sh
cd ask-worker
npx wrangler secret put DELIVER_TO
```

Do not deploy from `ask-worker/` until the real script is vendored there. Put the secret on the already deployed `meda-ask` Worker.

Consent paths are `/view`, `/submit`, `/withdraw`, `/gate`, `/pageview`, `/stats` on workers.dev, and the same suffixes under `/consent` on the API host. E-sign stays `/esign/submit` and `/esign/health`.

Then set `API_ORIGIN` in `site/js/meda-config.js` to `https://api.meda-vermittlung.de` and redeploy Pages. Until that DNS answers, leave `API_ORIGIN` as `''`.

## 5. Make the GitHub repo private and turn GitHub Pages off

GitHub Pages is still serving the whole repo root until this is done. Do it as soon as the Pages custom domain works.

1. GitHub → **Settings → General → Danger zone → Change repository visibility → Private**.
2. GitHub → **Settings → Pages → Build and deployment → Source → None**.
3. Remove `meda-vermittlung.de` from the GitHub Pages custom domain so it stops issuing certificates for it.

## 6. Rotate STATS_TOKEN

The old value lived in `consent-worker/wrangler.toml` `[vars]`. Treat it as compromised. It is not written in this file.

1. Generate a new value on your machine, for example `openssl rand -hex 24`. Do not commit it and do not paste it into git, Pages, or this doc.
2. From `consent-worker/`:

   ```sh
   npx wrangler secret put STATS_TOKEN
   npx wrangler deploy
   ```

3. `GET https://meda-consent.g5kjd9v7cf.workers.dev/stats?token=<new>` returns 200.
4. The same URL with the previous value returns 401.
5. Update the ops bookmark that calls `/stats`. Discard the previous value.

Deploying this revision without the secret removes the old `[vars]` binding, and `/stats` stays 401 until the secret is set.

## 7. Delete stale branches

List only. Do not delete them from this change. Skip any branch whose pull request is still open. In particular do not delete `cursor/contract-esign-both-sides-bbe4` while PR #26 is open.

Open pull requests — leave the branch until the PR is closed:

- `cursor/contract-esign-both-sides-bbe4` (PR #26)
- `cursor/pages-health-workflow-a937` (PR #13)
- `cursor/add-ops-room-platform-f11e` (PR #7)
- `cursor/security-legal-hardening-37dc` (PR #6)
- `cursor/security-legal-hardening-7d0e` (PR #5)
- `cursor/harden-consent-worker-f11e` (PR #4)
- `cursor/add-codecraft-helper-f11e` (PR #3)
- `cursor/ai-pool-connection-6cf8` (PR #2)
- `cursor/add-cloud-agent-environment-f11e` (PR #1)

Merged or closed — safe to delete after a quick look:

- `cursor/add-outlook-contact-email-c240`
- `cursor/deploy-ask-meda-20260928h-8e3c`
- `cursor/employer-ai-redesign-e8ed`
- `cursor/employer-ask-meda-welcome-5983`
- `cursor/employer-hero-partner-note-e8ed`
- `cursor/employer-pitch-copy-0521` (closed, not merged)
- `cursor/employer-platform-port-33ae`
- `cursor/employer-reviewed-source-e8ed`
- `cursor/esign-full-locale-304b`
- `cursor/esign-soft-launch-424e`
- `cursor/esign-ui-polish-3e1b`
- `cursor/home-meda-one-teaser-21c0`
- `cursor/home-why-meda-one-21c0`
- `cursor/meda-one-showcase-21c0`
- `cursor/public-copy-cleanup-d6d2`
- `feat/arbeitgeber-platform-20260928e`
- `feat/ask-meda-widget-ux-20261006`

Example, after you have reviewed the list yourself:

```sh
git push origin --delete cursor/esign-full-locale-304b
```

## Follow-up

`site/bewerben.html` still posts to FormSubmit (`https://formsubmit.co/...`). Move that form to our own Worker so the inbox is not in the form action. Contact and accept/deny already post to the ask Worker and no longer send `deliver_to`.
