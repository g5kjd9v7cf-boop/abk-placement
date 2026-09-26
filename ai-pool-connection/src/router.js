// Cost-aware router: picks the cheapest capable model per request, tracks
// spend, and enforces a budget cap. Preference order: local (0 cost) -> free
// tier -> paid, and within a tier the lowest estimated price wins.

import { buildProviders, TIER_RANK } from './providers.js';

export class Router {
  constructor(opts = {}) {
    this.providers = buildProviders();
    this.budgetUsd = opts.budgetUsd ?? Number(process.env.BUDGET_USD ?? 1);
    this.spentUsd = 0;
    this.calls = [];
  }

  available() {
    return this.providers.filter((p) => p.configured);
  }

  // Flatten configured providers into rankable (provider, model) candidates.
  candidates() {
    const list = [];
    for (const p of this.available()) {
      for (const m of p.models) {
        const price = (m.promptPer1k || 0) + (m.completionPer1k || 0);
        list.push({ provider: p, model: m, tier: p.tier, price });
      }
    }
    list.sort((a, b) => {
      if (TIER_RANK[a.tier] !== TIER_RANK[b.tier]) return TIER_RANK[a.tier] - TIER_RANK[b.tier];
      return a.price - b.price;
    });
    return list;
  }

  // Pick candidates honoring an optional preferred provider id and a flag to
  // skip the offline local-echo when real providers exist.
  pick({ prefer, allowOffline = true } = {}) {
    let cands = this.candidates();
    const realExists = cands.some((c) => c.provider.id !== 'local-echo');
    if (!allowOffline && realExists) cands = cands.filter((c) => c.provider.id !== 'local-echo');
    // The offline Local Reasoner is a last resort: order it after every real
    // provider so adding any real key takes over automatically.
    if (realExists) {
      cands = cands
        .filter((c) => c.provider.id !== 'local-echo')
        .concat(cands.filter((c) => c.provider.id === 'local-echo'));
    }
    if (prefer) {
      const preferred = cands.filter((c) => c.provider.id === prefer);
      if (preferred.length) return [...preferred, ...cands.filter((c) => c.provider.id !== prefer)];
    }
    return cands;
  }

  remainingBudget() {
    return +(this.budgetUsd - this.spentUsd).toFixed(6);
  }

  record(entry) {
    this.spentUsd = +(this.spentUsd + (entry.costUsd || 0)).toFixed(6);
    this.calls.push({ ...entry, at: new Date().toISOString() });
  }

  // Route a single message list to the best model, with fallback on failure.
  async route({ messages, prefer, allowOffline = true, role, temperature, maxTokens }) {
    if (this.spentUsd >= this.budgetUsd) {
      throw new Error(`Budget cap reached ($${this.budgetUsd}). Spent $${this.spentUsd}.`);
    }
    const cands = this.pick({ prefer, allowOffline });
    if (!cands.length) throw new Error('No configured providers available.');

    const errors = [];
    for (const c of cands) {
      const priceEst = c.price;
      if (priceEst > 0 && this.remainingBudget() <= 0) continue;
      try {
        const result = await c.provider.chat({
          model: c.model.id,
          messages,
          role,
          temperature,
          maxTokens,
        });
        this.record({
          providerId: c.provider.id,
          providerLabel: c.provider.label,
          tier: c.provider.tier,
          model: result.model,
          usage: result.usage,
          costUsd: result.costUsd,
        });
        return {
          text: result.text,
          providerId: c.provider.id,
          providerLabel: c.provider.label,
          tier: c.provider.tier,
          model: result.model,
          usage: result.usage,
          costUsd: result.costUsd,
        };
      } catch (err) {
        errors.push(`${c.provider.label}: ${err.message}`);
        // try next candidate
      }
    }
    throw new Error(`All providers failed:\n- ${errors.join('\n- ')}`);
  }

  status() {
    return {
      budgetUsd: this.budgetUsd,
      spentUsd: this.spentUsd,
      remainingUsd: this.remainingBudget(),
      callCount: this.calls.length,
      providers: this.providers.map((p) => ({
        id: p.id,
        label: p.label,
        tier: p.tier,
        configured: p.configured,
        models: p.models.map((m) => m.id),
      })),
    };
  }
}
