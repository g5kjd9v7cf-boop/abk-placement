#!/usr/bin/env node
// Concrete use case for the CodeCraft client: draft missing i18n translations.
//
// The site keeps its strings in js/i18n.js as
//   window.ABK_I18N = { de: {...}, fr: {...}, en: {...}, ar: {...} }
// German (de) is the source of truth. This tool finds keys that exist in `de`
// but are missing (or empty) in a target language, asks an OpenAI-compatible
// model to translate them, and prints the result as JSON for review.
//
// It NEVER writes into js/i18n.js automatically — output is printed (or written
// to a separate --out JSON file) so a human can review before pasting.
//
// Usage:
//   node tools/i18n-translate.mjs --lang fr [--limit 20] [--keys nav.home,nav.contact]
//                                 [--model gpt-4o-mini] [--out fr.draft.json] [--dry-run]
//
// Requires CODECRAFT_BASE_URL and CODECRAFT_API_KEY (see tools/README.md).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import { chatCompletion, isConfigured, CodeCraftConfigError } from './codecraft-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_PATH = resolve(__dirname, '..', 'js', 'i18n.js');

const LANG_NAMES = { fr: 'French', en: 'English', ar: 'Arabic' };

function parseArgs(argv) {
  const args = { limit: Infinity, keys: null, model: undefined, out: null, dryRun: false, lang: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lang') args.lang = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--keys') args.keys = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

// Evaluate the site's own i18n bundle (trusted repo code) inside a minimal
// DOM shim so we can read the translation tables in Node. The bundle runs a
// browser bootstrap on load; the shims make that a harmless no-op.
function loadI18n() {
  const source = readFileSync(I18N_PATH, 'utf8');
  const el = {
    lang: '',
    dir: '',
    title: '',
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {},
    getAttribute() { return null; },
    hasAttribute() { return false; },
    addEventListener() {},
    textContent: '',
    innerHTML: '',
  };
  const document = {
    documentElement: el,
    body: el,
    title: '',
    readyState: 'complete',
    addEventListener() {},
    dispatchEvent() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { ...el }; },
  };
  const sandbox = {
    window: {},
    document,
    navigator: { language: 'de' },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; Object.assign(this, init); } },
    console,
  };
  sandbox.window.document = document;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: I18N_PATH });
  const tables = sandbox.window.ABK_I18N;
  if (!tables || !tables.de) {
    throw new Error(`Could not read window.ABK_I18N from ${I18N_PATH}`);
  }
  return tables;
}

function pickMissing(tables, lang, { keys, limit }) {
  const de = tables.de;
  const target = tables[lang] || {};
  const candidateKeys = keys || Object.keys(de);
  const out = [];
  for (const key of candidateKeys) {
    if (!(key in de)) continue;
    const existing = target[key];
    if (existing == null || existing === '') {
      out.push({ key, de: de[key] });
      if (out.length >= limit) break;
    }
  }
  return out;
}

function buildMessages(langName, items) {
  const dict = {};
  for (const it of items) dict[it.key] = it.de;
  const system =
    `You are a professional translator for a German staffing/recruitment website. ` +
    `Translate the given UI strings from German into ${langName}. ` +
    `Keep the tone professional and concise. Preserve placeholders, punctuation, ` +
    `and any product names (e.g. "MEDA Vermittlung") unchanged. ` +
    `Return ONLY a JSON object mapping each original key to its ${langName} translation, no commentary.`;
  const user = `Translate the values of this JSON object into ${langName}:\n${JSON.stringify(dict, null, 2)}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function parseModelJson(content) {
  let text = content.trim();
  // Strip Markdown code fences if the model wrapped its answer.
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.lang) {
    console.log('Usage: node tools/i18n-translate.mjs --lang <fr|en|ar> [--limit N] [--keys k1,k2] [--model M] [--out file.json] [--dry-run]');
    process.exit(args.help ? 0 : 1);
  }
  if (!LANG_NAMES[args.lang]) {
    console.error(`Unsupported --lang "${args.lang}". Supported: ${Object.keys(LANG_NAMES).join(', ')}`);
    process.exit(1);
  }

  const tables = loadI18n();
  const items = pickMissing(tables, args.lang, { keys: args.keys, limit: args.limit });

  if (items.length === 0) {
    console.error(`Nothing to translate: no missing "${args.lang}" keys for the given selection.`);
    process.exit(0);
  }

  console.error(`Found ${items.length} key(s) to translate into ${LANG_NAMES[args.lang]}.`);

  if (args.dryRun) {
    // Show exactly what would be sent, without calling the API.
    console.log(JSON.stringify(buildMessages(LANG_NAMES[args.lang], items), null, 2));
    return;
  }

  if (!isConfigured()) {
    // Fail safe and loud, but do not touch the network.
    throw new CodeCraftConfigError(
      'Not configured. Set CODECRAFT_BASE_URL and CODECRAFT_API_KEY (via Secrets), ' +
        'or run with --dry-run to preview the request without calling any API.'
    );
  }

  const messages = buildMessages(LANG_NAMES[args.lang], items);
  const content = await chatCompletion(messages, {
    model: args.model,
    temperature: 0.2,
    responseFormat: { type: 'json_object' },
  });

  let translations;
  try {
    translations = parseModelJson(content);
  } catch (err) {
    console.error('Model did not return valid JSON. Raw response follows:\n');
    console.error(content);
    process.exit(2);
  }

  const json = JSON.stringify(translations, null, 2);
  if (args.out) {
    writeFileSync(resolve(process.cwd(), args.out), json + '\n', 'utf8');
    console.error(`Wrote ${Object.keys(translations).length} translation(s) to ${args.out}`);
  } else {
    console.log(json);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
