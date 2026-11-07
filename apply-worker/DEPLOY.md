# Deploy meda-apply

Worker name: `meda-apply`. It stays on `workers.dev`. Do not add a route or a custom domain.

Run these from `apply-worker/` on a machine logged in to the MEDA Cloudflare account:

```sh
npx wrangler deploy
npx wrangler secret put AGENTMAIL_API_KEY
```

`AGENTMAIL_API_KEY` is the only required secret. The Worker sends with `POST https://api.agentmail.to/v0/inboxes/meda-vermittlung%40agentmail.to/messages/send`. The JSON body uses `to` `meda-vermittlung@agentmail.to`, `cc` `MEDA-team@outlook.com`, and an attachment `{ filename, content_type, content_disposition: "attachment", content }` where `content` is standard base64.

Turnstile is optional. Leave it unset until the page actually posts a token. If this secret is set and the token is missing, every application is rejected.

```sh
npx wrangler secret put TURNSTILE_SECRET
```

The form reads the Worker URL from `<meta name="meda-apply-api">` in `bewerben.html`. The default is `https://meda-apply.g5kjd9v7cf.workers.dev`, and that host is in the page `connect-src`. Change the meta tag and the CSP together if the host changes.

Send one test application after the secret is stored, and confirm it is in `meda-vermittlung@agentmail.to` and in `MEDA-team@outlook.com`, before merging the page change.

AgentMail limits the whole JSON request to 6 MB. Base64 makes a CV near the 5 MB form limit larger than that, so the Worker refuses it and the page asks the candidate to send the file to `meda-vermittlung@agentmail.to`.
