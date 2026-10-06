// Jarvis: conversation manager on top of the cost-aware Router.
//
// Two modes:
//   - chat:    single best/cheapest model answers (fast, cheap).
//   - council: several available models act as "workers" in parallel, then a
//              coordinator (preferring Grok/xAI when available) synthesizes one
//              answer. This is the "agents working together" mode.

import { Router } from './router.js';

export const JARVIS_SYSTEM = `You are Jarvis, the assistant for the "AI Pool Connection" project.
You are helpful, concise, and direct. You coordinate multiple AI models behind the
scenes and always prefer the cheapest capable model. Answer the user's question
clearly. If you are unsure, say so.`;

export class Jarvis {
  constructor(opts = {}) {
    this.router = new Router(opts);
    this.history = [{ role: 'system', content: JARVIS_SYSTEM }];
  }

  reset() {
    this.history = [{ role: 'system', content: JARVIS_SYSTEM }];
  }

  status() {
    return this.router.status();
  }

  async chat(userText, { prefer } = {}) {
    this.history.push({ role: 'user', content: userText });
    const res = await this.router.route({ messages: this.history, prefer });
    this.history.push({ role: 'assistant', content: res.text });
    return res;
  }

  // Council mode: gather independent answers, then coordinate.
  async council(userText, { maxWorkers = 3 } = {}) {
    const workerCands = this.router.pick({ allowOffline: true });
    // De-duplicate by provider so different services contribute.
    const seen = new Set();
    const workers = [];
    for (const c of workerCands) {
      if (seen.has(c.provider.id)) continue;
      seen.add(c.provider.id);
      workers.push(c);
      if (workers.length >= maxWorkers) break;
    }

    const workerMessages = [
      { role: 'system', content: `${JARVIS_SYSTEM}\nYou are one member of a panel. Give your own best, independent answer.` },
      { role: 'user', content: userText },
    ];

    const workerResults = await Promise.all(
      workers.map(async (c) => {
        try {
          const r = await this.router.route({
            messages: workerMessages,
            prefer: c.provider.id,
            role: 'worker',
          });
          return { ok: true, provider: r.providerLabel, tier: r.tier, model: r.model, text: r.text, costUsd: r.costUsd };
        } catch (err) {
          return { ok: false, provider: c.provider.label, error: err.message };
        }
      }),
    );

    const good = workerResults.filter((r) => r.ok);

    // Coordinator: prefer Grok, else best available; falls back to offline.
    const panelText = good
      .map((r, i) => `Panelist ${i + 1} (${r.provider}):\n${r.text}`)
      .join('\n\n');
    const coordMessages = [
      {
        role: 'system',
        content: `${JARVIS_SYSTEM}\nYou are the coordinator. Synthesize the panelists' answers into one clear, correct response. Resolve disagreements and be concise.`,
      },
      { role: 'user', content: `Question:\n${userText}\n\nPanelist answers:\n${panelText || '(none)'}\n\nProvide the final synthesized answer.` },
    ];
    const coord = await this.router.route({
      messages: coordMessages,
      prefer: this.router.available().some((p) => p.id === 'xai') ? 'xai' : undefined,
      role: 'coordinator',
    });

    this.history.push({ role: 'user', content: userText });
    this.history.push({ role: 'assistant', content: coord.text });

    return {
      final: coord.text,
      coordinator: { provider: coord.providerLabel, model: coord.model, tier: coord.tier, costUsd: coord.costUsd },
      panel: workerResults,
      totalCostUsd: this.router.status().spentUsd,
    };
  }
}
