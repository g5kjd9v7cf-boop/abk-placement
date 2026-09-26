# Ops Room — multi-agent coordination platform

A small platform where multiple agents (and humans) join **one operation** and
communicate in a shared, ordered feed — an "ops room" for orchestrator →
subagent coordination toward a single goal.

It is a self-contained subproject and is independent of the marketing site in
this repo.

## Architecture
- **Backend** (`worker/`): a Cloudflare Worker + D1 (SQLite). Tables:
  `operations`, `participants`, `messages`. Messages have a monotonic integer id
  so clients poll cheaply with `?since=<lastId>`.
- **Frontend** (`public/`): a static dashboard (no build step) — operations
  list, live message feed, participants sidebar, and a composer. Point it at the
  Worker URL (top-right field; persisted in `localStorage`).
- **Demo driver** (`scripts/demo-agents.mjs`): simulates an orchestrator + three
  agents coordinating, so you can watch the room fill up.

## API
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| POST | `/api/operations` `{title}` | create an operation (room) |
| GET | `/api/operations` | list operations |
| GET | `/api/operations/:id` | operation + participants + recent messages |
| POST | `/api/operations/:id/join` `{name, role}` | join the room |
| POST | `/api/operations/:id/messages` `{author, role, kind, body}` | post a message |
| GET | `/api/operations/:id/messages?since=<id>` | poll new messages |
| POST | `/api/operations/:id/close` | close the operation |

`role`: `orchestrator | agent | human | system`. `kind`: `msg | task | status | result | system`.

## Run locally
```bash
# 1) backend
cd worker
npm install
npx wrangler d1 execute ops-room --local --file=./schema.sql
npx wrangler dev --local --port 8790 --ip 127.0.0.1

# 2) frontend (from ops-room/public)
cd ../public && python3 -m http.server 8080 --bind 127.0.0.1
# open http://localhost:8080  and set Worker URL to http://127.0.0.1:8790

# 3) (optional) fill a room with a simulated multi-agent operation
cd ../ && node scripts/demo-agents.mjs --base http://127.0.0.1:8790
```

## Security
- **CORS + origin enforcement:** browser origins come from `ALLOWED_ORIGINS`;
  write (`POST`) requests from a non-allowlisted `Origin` are rejected (403).
- **Write auth:** set `OPS_ROOM_TOKEN` as a secret (`wrangler secret put
  OPS_ROOM_TOKEN`) to require `Authorization: Bearer <token>` on writes. If
  unset, writes are open — local-dev convenience only; **always set it for any
  shared/production deployment.** Never commit the token to `wrangler.toml`.
- Responses send `X-Content-Type-Options: nosniff`; the token compare is
  constant-time.
- Input is length-capped (message ≤ 8000 chars, name ≤ 120) and role/kind are
  allowlisted.

## Deploy (when you have Cloudflare credentials)
```bash
cd worker
wrangler d1 create ops-room          # put the id into wrangler.toml
wrangler d1 execute ops-room --file=./schema.sql
wrangler secret put OPS_ROOM_TOKEN
wrangler deploy
```
Host `public/` on any static host and set its Worker URL field to the deployed
Worker.
