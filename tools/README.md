# tools/ — optional dev helpers

These are **developer-only** utilities. They are not part of the deployed static
site or the Cloudflare consent worker, and they run nothing at build time.

## CodeCraft client (`codecraft-client.mjs`)

A tiny, dependency-free client for any **OpenAI-compatible** chat API (OpenAI,
Groq, a self-hosted gateway, etc.). It is provider-agnostic on purpose:

- No endpoint and no API key are hardcoded. Both are read from environment
  variables at call time, so nothing sensitive is committed and **no network
  request is made until you configure it**.
- If it is unconfigured, it throws a clear error and does nothing.

### Configuration (via Secrets — never commit keys)

| Variable | Required | Example |
| --- | --- | --- |
| `CODECRAFT_BASE_URL` | yes | `https://api.groq.com/openai/v1` |
| `CODECRAFT_API_KEY` | yes | `sk-...` (add in the Secrets panel) |
| `CODECRAFT_MODEL` | no | defaults to `gpt-4o-mini` |

Point `CODECRAFT_BASE_URL` at whichever provider you trust. Any OpenAI-compatible
`/chat/completions` endpoint works. Prefer a provider you can verify; treat
unofficial "free token" gateways as untrusted (your prompts pass through them).

## i18n translation drafting (`i18n-translate.mjs`)

`js/i18n.js` stores UI strings as `window.ABK_I18N = { de, fr, en, ar }`, with
German as the source of truth. This tool finds keys present in `de` but missing
in a target language and drafts translations for review. It **never** edits
`js/i18n.js`; it prints JSON (or writes a separate `--out` file) for a human to
review before pasting.

```bash
# Preview the exact request without calling any API (no key needed):
node tools/i18n-translate.mjs --lang fr --limit 10 --dry-run

# Draft the first 20 missing French strings (requires the env vars above):
node tools/i18n-translate.mjs --lang fr --limit 20 --out fr.draft.json

# Only specific keys:
node tools/i18n-translate.mjs --lang ar --keys nav.home,nav.contact
```

Supported target languages: `fr`, `en`, `ar`. Requires Node 18+ (built-in `fetch`).
