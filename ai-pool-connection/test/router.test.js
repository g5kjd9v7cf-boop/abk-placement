import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../src/router.js';
import { Jarvis } from '../src/jarvis.js';

test('router always has the offline provider configured', () => {
  const r = new Router();
  const ids = r.available().map((p) => p.id);
  assert.ok(ids.includes('local-echo'), 'local-echo should be available with no keys');
});

test('candidates are ordered local -> free -> paid then by price', () => {
  const r = new Router();
  const cands = r.candidates();
  const tiers = cands.map((c) => c.tier);
  const rank = { local: 0, free: 1, paid: 2 };
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(rank[tiers[i - 1]] <= rank[tiers[i]], 'tiers must be non-decreasing');
  }
});

test('chat routes to a zero-cost provider when no keys are set', async () => {
  const j = new Jarvis();
  const res = await j.chat('Hello Jarvis');
  assert.equal(res.costUsd, 0);
  assert.equal(res.tier, 'local');
  assert.ok(res.text.length > 0);
});

test('budget cap blocks further paid calls', async () => {
  const r = new Router({ budgetUsd: 0 });
  r.spentUsd = 0; // budget is 0 -> immediately capped
  await assert.rejects(() => r.route({ messages: [{ role: 'user', content: 'hi' }] }), /Budget cap reached/);
});

test('council returns a synthesized answer and a panel', async () => {
  const j = new Jarvis();
  const res = await j.council('What is 2+2?');
  assert.ok(res.final.length > 0);
  assert.ok(Array.isArray(res.panel));
  assert.ok(res.panel.length >= 1);
});
