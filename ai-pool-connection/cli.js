#!/usr/bin/env node
// Jarvis CLI chat. Commands:
//   /status            show providers + budget
//   /council <text>    run multi-agent council on <text>
//   /prefer <id>       force a provider (e.g. /prefer xai)
//   /reset             clear conversation
//   /exit              quit

import readline from 'node:readline';
import { Jarvis } from './src/jarvis.js';

const jarvis = new Jarvis();

function printBanner() {
  const s = jarvis.status();
  const configured = s.providers.filter((p) => p.configured).map((p) => `${p.label}[${p.tier}]`).join(', ');
  console.log('\n=== AI Pool Connection — Jarvis CLI ===');
  console.log(`Budget: $${s.budgetUsd} | Configured providers: ${configured}`);
  console.log('Type a message, or /help for commands.\n');
}

function printStatus() {
  const s = jarvis.status();
  console.log('\n--- Status ---');
  for (const p of s.providers) {
    console.log(`  ${p.configured ? '[on] ' : '[off]'} ${p.label} (${p.tier}) — models: ${p.models.join(', ')}`);
  }
  console.log(`  Spent: $${s.spentUsd} / $${s.budgetUsd} (remaining $${s.remainingUsd}) over ${s.callCount} calls`);
  console.log('');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'you> ' });

printBanner();
rl.prompt();

rl.on('line', async (line) => {
  const text = line.trim();
  try {
    if (!text) {
      // ignore
    } else if (text === '/help') {
      console.log('Commands: /status, /council <text>, /prefer <id> <text>, /reset, /exit');
    } else if (text === '/exit' || text === '/quit') {
      rl.close();
      return;
    } else if (text === '/status') {
      printStatus();
    } else if (text === '/reset') {
      jarvis.reset();
      console.log('(conversation reset)');
    } else if (text.startsWith('/council')) {
      const q = text.replace('/council', '').trim();
      if (!q) {
        console.log('usage: /council <your question>');
      } else {
        const r = await jarvis.council(q);
        console.log('\n[council] panel:');
        r.panel.forEach((p, i) => {
          if (p.ok) console.log(`  Panelist ${i + 1} (${p.provider}, ${p.tier}): ${p.text.slice(0, 120)}${p.text.length > 120 ? '…' : ''}`);
          else console.log(`  Panelist ${i + 1} (${p.provider}) failed: ${p.error}`);
        });
        console.log(`\njarvis (coordinator via ${r.coordinator.provider})> ${r.final}`);
        console.log(`   [total cost this session: $${r.totalCostUsd}]\n`);
      }
    } else if (text.startsWith('/prefer')) {
      const rest = text.replace('/prefer', '').trim();
      const [id, ...msg] = rest.split(/\s+/);
      const q = msg.join(' ');
      if (!id || !q) {
        console.log('usage: /prefer <provider-id> <your question>');
      } else {
        const r = await jarvis.chat(q, { prefer: id });
        console.log(`jarvis (${r.providerLabel} / ${r.model}, $${r.costUsd})> ${r.text}\n`);
      }
    } else {
      const r = await jarvis.chat(text);
      console.log(`jarvis (${r.providerLabel} / ${r.model}, $${r.costUsd})> ${r.text}\n`);
    }
  } catch (err) {
    console.error(`error: ${err.message}\n`);
  }
  rl.prompt();
});

rl.on('close', () => {
  const s = jarvis.status();
  console.log(`\nSession spend: $${s.spentUsd}. Bye.`);
  process.exit(0);
});
