import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.wrangler']);
const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.md', '.json', '.toml', '.txt', '.yml', '.yaml', '.sql']);
const PUBLIC_EMAILS = new Set(['meda-vermittlung@agentmail.to', 'meda-team@outlook.com']);
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?<![\w])\+[1-9]\d{6,14}|(?<![\w])00[1-9]\d{8,14}/g;
const DOC = /\.(pdf|docx?)$/i;

export const ALLOWED_DOCS = new Set([
  'site/assets/Einwilligung_Datenschutz_Kandidaten_DE.pdf',
  'site/assets/Einwilligung_Datenschutz_Kandidaten_AR.pdf',
  'assets/Einwilligung_Datenschutz_Kandidaten_DE.pdf',
  'assets/Einwilligung_Datenschutz_Kandidaten_AR.pdf',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function scanTree(root, { skip = SKIP_DIRS } = {}) {
  const findings = [];
  const files = [];
  function visit(dir) {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        visit(full);
        continue;
      }
      files.push(full);
    }
  }
  visit(root);
  for (const full of files) {
    const rel = relative(root, full).replaceAll('\\', '/');
    if (DOC.test(rel) && !ALLOWED_DOCS.has(rel)) {
      findings.push({ file: rel, kind: 'document', value: rel });
    }
    if (!TEXT_EXT.has(extname(rel).toLowerCase())) continue;
    const text = readFileSync(full, 'utf8');
    for (const match of text.matchAll(EMAIL)) {
      const email = match[0].toLowerCase();
      if (PUBLIC_EMAILS.has(email)) continue;
      if (email.endsWith('@example.com') || email.endsWith('@example.org')) continue;
      findings.push({ file: rel, kind: 'email', value: email });
    }
    if (rel.endsWith('.test.mjs')) continue;
    for (const match of text.matchAll(PHONE)) {
      findings.push({ file: rel, kind: 'phone', value: match[0] });
    }
  }
  return findings;
}

export function scanRepo(root) {
  return scanTree(root, { skip: SKIP_DIRS });
}

export { walk };
