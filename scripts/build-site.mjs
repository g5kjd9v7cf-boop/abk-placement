import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = join(root, 'site');
const distDir = join(root, 'dist');

const COPY_DIRS = ['css', 'js', 'assets', 'fonts'];
const ROOT_FILES = new Set(['_headers', 'robots.txt']);
const ALLOWED_EXT = new Set([
  '.html',
  '.css',
  '.js',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.ico',
  '.txt',
  '.webmanifest',
  '.woff',
  '.woff2',
]);
const PACKS = [
  'candidate-soft-launch-0.14.json',
  'employer-soft-launch-0.5.json',
  'family-soft-launch-0.6.json',
];
const CLIENT_PACK_KEYS = [
  'id',
  'version',
  'party',
  'lang',
  'legal_approved',
  'binding',
  'status',
  'title',
  'kicker',
  'preamble',
  'no_cv_upload',
  'withdrawal',
  'translations',
  'sections',
  'checklist',
  'ui_notices',
  'offer',
];
const FORBIDDEN_DIR_NAMES = new Set([
  'ops-templates',
  'consent-worker',
  'esign-worker',
  'ask-worker',
  'apply-worker',
  'node_modules',
  '.wrangler',
  'scripts',
  'test',
]);
const FORBIDDEN_EXT = new Set(['.md', '.toml', '.sql', '.lock']);

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

function assertAllowedFile(name) {
  if (ROOT_FILES.has(name)) return;
  const ext = extname(name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Refusing to publish ' + name);
  }
}

function copyTree(srcDir, destDir) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (FORBIDDEN_DIR_NAMES.has(entry.name) || FORBIDDEN_EXT.has(extname(entry.name).toLowerCase())) {
      throw new Error('Refusing to publish ' + src);
    }
    if (entry.isDirectory()) {
      copyTree(src, dest);
      continue;
    }
    if (!entry.isFile()) continue;
    assertAllowedFile(entry.name);
    copyFile(src, dest);
  }
}

function clientPack(pack) {
  const out = {};
  for (const key of CLIENT_PACK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(pack, key)) out[key] = pack[key];
  }
  return out;
}

function audit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (FORBIDDEN_DIR_NAMES.has(entry.name)) {
      throw new Error('Published output contains ' + full);
    }
    if (entry.isDirectory()) {
      audit(full);
      continue;
    }
    const ext = extname(entry.name).toLowerCase();
    if (FORBIDDEN_EXT.has(ext) || entry.name === 'wrangler.toml' || entry.name === 'CNAME') {
      throw new Error('Published output contains ' + full);
    }
  }
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const name of readdirSync(siteDir)) {
  const src = join(siteDir, name);
  const info = statSync(src);
  if (info.isDirectory()) {
    if (!COPY_DIRS.includes(name)) throw new Error('Refusing to publish site/' + name);
    copyTree(src, join(distDir, name));
    continue;
  }
  if (!info.isFile()) continue;
  if (name.endsWith('.html') || ROOT_FILES.has(name)) {
    assertAllowedFile(name);
    copyFile(src, join(distDir, name));
    continue;
  }
  throw new Error('Refusing to publish site/' + name);
}

const packOut = join(distDir, 'data', 'esign');
mkdirSync(packOut, { recursive: true });
for (const name of PACKS) {
  const pack = JSON.parse(readFileSync(join(root, 'data', 'esign', name), 'utf8'));
  const published = clientPack(pack);
  if (!published.sections || !published.checklist || !published.id) {
    throw new Error('Client pack is missing render fields: ' + name);
  }
  if ('content_sha256' in published || 'fee_placeholder' in published || 'source_body_version_line' in published) {
    throw new Error('Client pack still has server-only fields: ' + name);
  }
  writeFileSync(join(packOut, name), JSON.stringify(published, null, 2) + '\n');
}

for (const name of ['index.html', '404.html']) {
  const dest = join(distDir, name);
  let isFile = false;
  try {
    isFile = statSync(dest).isFile();
  } catch {
    isFile = false;
  }
  if (!isFile) {
    throw new Error('Pages output is missing ' + name);
  }
}

const notFound = readFileSync(join(distDir, '404.html'), 'utf8');
if (!notFound.includes('Seite nicht gefunden')) {
  throw new Error('404.html must be the branded not-found page');
}
if (!/noindex/i.test(notFound)) {
  throw new Error('404.html must be noindex');
}
if (!/href="index\.html"/.test(notFound)) {
  throw new Error('404.html must link to the homepage');
}

audit(distDir);
console.log('Pages output written to dist/');
