import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanTree } from './pii-scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

test('pages build publishes only the public site', () => {
  const built = spawnSync(process.execPath, ['scripts/build-site.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);

  const files = walk(dist).map((full) => full.slice(dist.length + 1).replaceAll('\\', '/'));
  const wanted = [
    'index.html',
    '404.html',
    'bewerben.html',
    'impressum.html',
    'datenschutz.html',
    'einwilligung.html',
    'accept.html',
    'deny.html',
    'contract-draft.html',
    'employer-sign.html',
    'family-sign.html',
    'css/styles.css',
    'css/fonts.css',
    'fonts/inter-latin.woff2',
    'fonts/source-serif-4-latin-500.woff2',
    'js/main.js',
    'js/meda-config.js',
    'assets/hero-hospital.jpg',
    'data/esign/candidate-soft-launch-0.14.json',
    'data/esign/employer-soft-launch-0.5.json',
    'data/esign/family-soft-launch-0.6.json',
    '_headers',
    'robots.txt',
  ];
  for (const rel of wanted) assert.equal(files.includes(rel), true, rel);

  const bannedSnippets = [
    'ops-templates',
    'consent-worker',
    'esign-worker',
    'ask-worker',
    'node_modules',
    '.wrangler',
    'DEPLOY-CLOUDFLARE.md',
    'SECURITY-CHECKLIST.md',
    'SECURITY.md',
    'apply-worker',
    '.github',
    'gitleaks',
    'schema.sql',
    'wrangler.toml',
    'ask-meda-kb.json',
    'CNAME',
  ];
  for (const rel of files) {
    for (const banned of bannedSnippets) {
      assert.equal(rel.includes(banned), false, rel);
    }
    assert.equal(/\.(md|toml|sql|lock)$/i.test(rel), false, rel);
  }
  assert.equal(existsSync(join(dist, 'data', 'ask-meda-kb.json')), false);

  for (const name of [
    'candidate-soft-launch-0.14.json',
    'employer-soft-launch-0.5.json',
    'family-soft-launch-0.6.json',
  ]) {
    const published = JSON.parse(readFileSync(join(dist, 'data', 'esign', name), 'utf8'));
    assert.equal('content_sha256' in published, false);
    assert.equal('fee_placeholder' in published, false);
    assert.equal('source_body_version_line' in published, false);
    assert.ok(Array.isArray(published.sections) && published.sections.length > 0);
    assert.ok(Array.isArray(published.checklist) && published.checklist.length > 0);
  }

  const headers = readFileSync(join(dist, '_headers'), 'utf8');
  assert.match(headers, /Strict-Transport-Security:/);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /script-src-attr 'none'/);
  assert.match(headers, /Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; trusted-types meda/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /max-age=63072000; includeSubDomains; preload/);
  assert.match(headers, /Cross-Origin-Opener-Policy: same-origin/);
  assert.match(headers, /Cross-Origin-Embedder-Policy: credentialless/);
  assert.match(headers, /Cross-Origin-Resource-Policy: same-origin/);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers, /https:\/\/api\.meda-vermittlung\.de/);
  assert.equal(headers.includes('unsafe-inline'), false);
  assert.equal(headers.includes('formsubmit'), false);
  assert.equal(headers.includes('fonts.googleapis'), false);
  assert.equal(headers.includes('Access-Control-Allow-Origin'), false);
  assert.equal(headers.includes("'*'"), false);
  assert.match(headers, /^\/\*/m);

  const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
  for (const rule of ['/sign', '/consent', '/accept', '/deny', '/contract-draft', '/employer-sign', '/family-']) {
    assert.match(robots, new RegExp('Disallow:\\s*' + rule.replace('/', '\\/')));
  }

  const einwilligung = readFileSync(join(dist, 'einwilligung.html'), 'utf8');
  assert.match(einwilligung, /noindex,follow/);
  const notFound = readFileSync(join(dist, '404.html'), 'utf8');
  const home = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(notFound, /Seite nicht gefunden/);
  assert.match(notFound, /noindex,nofollow/);
  assert.match(notFound, /href="index\.html"/);
  assert.equal(notFound.includes('<script'), false);
  assert.notEqual(notFound, home);
  const bewerben = readFileSync(join(dist, 'bewerben.html'), 'utf8');
  assert.match(bewerben, /data-meda-apply/);
  assert.match(bewerben, /challenges\.cloudflare\.com/);
  assert.equal(bewerben.includes('formsubmit'), false);

  const publishedText = files
    .filter((rel) => /\.(html|js)$/.test(rel))
    .map((rel) => readFileSync(join(dist, rel), 'utf8'))
    .join('\n');
  assert.equal(publishedText.includes('deliver_to'), false);
  assert.equal(publishedText.includes('<script>'), false);
  assert.equal(publishedText.includes('style='), false);
  assert.equal(publishedText.includes('formsubmit'), false);
  assert.equal(publishedText.includes('fonts.googleapis'), false);
  assert.equal(publishedText.includes("content=\"https://meda-"), false);
  const publishedFindings = scanTree(dist);
  assert.deepEqual(publishedFindings, []);
  const securityTxt = readFileSync(join(dist, '.well-known', 'security.txt'), 'utf8');
  assert.match(securityTxt, /^Contact: mailto:meda-vermittlung@agentmail.to$/m);
  assert.match(securityTxt, /^Expires: /m);
  assert.equal(publishedText.includes('<script>'), false);
  assert.equal(/<script(?![^>]*\bsrc=)/.test(publishedText), false);
});

test('stats token is not a wrangler var', () => {
  const toml = readFileSync(join(root, 'consent-worker', 'wrangler.toml'), 'utf8');
  assert.equal(/STATS_TOKEN\s*=/.test(toml), false);
  assert.match(toml, /wrangler secret put STATS_TOKEN/);
  assert.equal(/[0-9a-f]{32,}/i.test(toml), false);
  const esign = readFileSync(join(root, 'esign-worker', 'wrangler.toml'), 'utf8');
  assert.match(esign, /REJECT_DEMO_TOKENS\s*=\s*"true"/);
  assert.match(esign, /api\.meda-vermittlung\.de\/esign\/\*/);
  const ask = readFileSync(join(root, 'ask-worker', 'wrangler.toml'), 'utf8');
  assert.match(ask, /api\.meda-vermittlung\.de\/ask\/\*/);
  assert.match(ask, /REJECT_DEMO_TOKENS\s*=\s*"true"/);
  assert.match(toml, /api\.meda-vermittlung\.de\/consent\/\*/);
  assert.match(toml, /REJECT_DEMO_TOKENS\s*=\s*"true"/);
  assert.equal(toml.includes('github.io'), false);
  assert.equal(esign.includes('github.io'), false);
  assert.equal(esign.includes('localhost'), false);
});
