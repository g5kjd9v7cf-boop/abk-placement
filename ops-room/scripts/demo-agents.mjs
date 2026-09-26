#!/usr/bin/env node
// Simulates an orchestrator + subagents coordinating in one Ops Room operation,
// so the platform visibly "works". Uses Node 18+ built-in fetch.
//
//   node scripts/demo-agents.mjs --base http://127.0.0.1:8790 [--title "..."]
//        [--token <OPS_ROOM_TOKEN>] [--op <existing-operation-id>] [--delay 700]

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const BASE = (args.base || 'http://127.0.0.1:8790').replace(/\/+$/, '');
const TOKEN = args.token && args.token !== true ? args.token : process.env.OPS_ROOM_TOKEN || '';
const DELAY = Number(args.delay || 700);

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}
async function post(path, body) {
  const r = await fetch(BASE + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
}
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  let opId = args.op && args.op !== true ? args.op : null;
  if (!opId) {
    const title = args.title && args.title !== true ? args.title : 'OP-DEMO-777: ship the pricing page';
    const op = await post('/api/operations', { title });
    opId = op.id;
    console.log(`Created operation ${opId} — "${title}"`);
  }

  const orchestrator = 'Orchestrator';
  const agents = ['Agent-Frontend', 'Agent-Backend', 'Agent-QA'];
  await post(`/api/operations/${opId}/join`, { name: orchestrator, role: 'orchestrator' });
  for (const a of agents) await post(`/api/operations/${opId}/join`, { name: a, role: 'agent' });

  const script = [
    [orchestrator, 'orchestrator', 'task', 'Kickoff OP-DEMO-777. Agent-Frontend: build the pricing UI. Agent-Backend: expose /api/pricing. Agent-QA: prepare test cases. Report status here.'],
    ['Agent-Frontend', 'agent', 'status', 'Ack. Scaffolding pricing page + 3 tier cards. ETA a few steps.'],
    ['Agent-Backend', 'agent', 'status', 'Ack. Adding /api/pricing returning tiers from D1.'],
    ['Agent-QA', 'agent', 'status', 'Ack. Drafting cases: currency formatting, empty state, 402 handling.'],
    ['Agent-Backend', 'agent', 'result', '/api/pricing is live: returns [starter, pro, max] with prices. Frontend can integrate.'],
    ['Agent-Frontend', 'agent', 'msg', '@Agent-Backend great — wiring cards to /api/pricing now.'],
    ['Agent-Frontend', 'agent', 'result', 'Pricing UI renders all 3 tiers from the live API. Responsive + a11y labels done.'],
    ['Agent-QA', 'agent', 'result', 'Ran 12 cases: 12 pass. Found + confirmed fix for missing € on the Max tier.'],
    [orchestrator, 'orchestrator', 'status', 'All slices green. Consolidating and closing the operation.'],
  ];

  for (const [author, role, kind, body] of script) {
    await post(`/api/operations/${opId}/messages`, { author, role, kind, body });
    console.log(`  ${author} [${kind}]: ${body.slice(0, 60)}${body.length > 60 ? '…' : ''}`);
    await sleep(DELAY);
  }

  console.log(`\nDone. Open the dashboard and select the operation to watch the room:`);
  console.log(`  ${opId}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
