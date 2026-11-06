import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const i18nSource = readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const consentMessages = [...i18nSource.matchAll(/"app\.consent\.required": "((?:\\.|[^"\\])*)"/g)]
  .map((match) => JSON.parse(`"${match[1]}"`));
const MESSAGES = {
  de: consentMessages[0],
  fr: consentMessages[1],
  en: consentMessages[2],
  ar: consentMessages[3],
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const info = statSync(file);
      if (!info.isFile()) throw new Error('not a file');
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

function isFormEndpoint(url, method, resourceType, contentType) {
  if (/formsubmit\.co/i.test(url)) return true;
  if (/meda-apply\.g5kjd9v7cf\.workers\.dev/i.test(url) && method === 'POST') return true;
  if (method !== 'POST') return false;
  if (resourceType === 'document') return true;
  return /multipart\/form-data|application\/x-www-form-urlencoded/i.test(contentType || '');
}

async function storageSnapshot(page) {
  return page.evaluate(() => {
    const local = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      local[key] = localStorage.getItem(key);
    }
    return {
      localKeys: Object.keys(local).sort(),
      cookieConsent: localStorage.getItem('meda_cookie_consent'),
      queue: sessionStorage.getItem('meda_consent_queue'),
    };
  });
}

async function messageOf(page, index) {
  return page.locator('form.form').nth(index).locator('.consent-required-msg').evaluate((el) => ({
    hidden: el.hidden,
    text: (el.textContent || '').trim(),
  }));
}

async function fillShared(form) {
  await form.locator('input[name="name"]').fill('TEST TEST');
  await form.locator('input[name="email"]').fill('test@example.invalid');
  await form.locator('input[name="phone"]').fill('000000');
}

test('fresh visitor can submit Bewerbung only after the consent checkboxes', async () => {
  assert.equal(consentMessages.length, 4, 'app.consent.required must exist in DE, FR, EN and AR');
  const { server, origin } = await startServer();
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'meda-consent-'));
  const dummyFile = path.join(userDataDir, 'dummy-cv.pdf');
  const safePdf = Buffer.from('%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< /Root 1 0 R >>\n%%EOF\n', 'utf8');
  writeFileSync(dummyFile, safePdf);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: '/usr/local/bin/google-chrome',
    viewport: { width: 1280, height: 900 },
    locale: 'de-DE',
    args: ['--no-first-run', '--no-default-browser-check', '--disable-sync'],
  });
  const page = context.pages()[0] || await context.newPage();
  const formPosts = [];
  const consentCalls = [];

  try {
    await context.route('**/*', async (route) => {
      const req = route.request();
      const url = req.url();
      const method = req.method();
      const contentType = req.headers()['content-type'] || '';
      if (isFormEndpoint(url, method, req.resourceType(), contentType)) {
        formPosts.push({
          url,
          method,
          body: req.postData() || '',
        });
        await route.abort('aborted');
        return;
      }
      if (/workers\.dev|formsubmit\.co/i.test(url)) {
        consentCalls.push({ url, method });
        await route.abort('aborted');
        return;
      }
      if (/fonts\.googleapis|fonts\.gstatic/i.test(url)) {
        await route.abort('aborted');
        return;
      }
      await route.continue();
    });

    await page.goto(`${origin}/bewerben.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('.js-gate-accept-de').click();
    await page.waitForSelector('#meda-datenschutz-gate', { state: 'detached' });
    await page.waitForFunction(() => (sessionStorage.getItem('meda_consent_queue') || '').includes('datenschutz_accepted'));

    const opened = await storageSnapshot(page);
    assert.equal(opened.cookieConsent, null);
    assert.ok(opened.localKeys.includes('meda_datenschutz_gate'));
    assert.equal(opened.localKeys.includes('meda_cookie_consent'), false);
    assert.deepEqual(opened.localKeys, ['abk_lang', 'meda_datenschutz_gate', 'meda_sid']);

    await page.evaluate(() => {
      document.querySelectorAll('form.form').forEach((form) => {
        let ref = form.querySelector('input[name="ref_code"]');
        if (!ref) {
          ref = document.createElement('input');
          ref.type = 'hidden';
          ref.name = 'ref_code';
          form.appendChild(ref);
        }
        ref.value = 'M001';
      });
    });

    const formA = page.locator('form.form').nth(0);
    const formB = page.locator('form.form').nth(1);
    await fillShared(formA);
    await formA.locator('input[type="file"]').setInputFiles(dummyFile);
    await fillShared(formB);
    await formB.locator('textarea[name="experience"]').fill('TEST Erfahrung');
    await formB.locator('textarea[name="skills"]').fill('TEST Kenntnisse');
    await formB.locator('input[name="languages"]').fill('TEST');
    await formB.locator('input[name="availability"]').fill('TEST');
    await formB.locator('select[name="sector_path"]').selectOption('other');

    await formB.locator('button[type="submit"]').click();
    let blocked = await messageOf(page, 1);
    assert.equal(blocked.hidden, false);
    assert.equal(blocked.text, MESSAGES.de);
    assert.equal(formPosts.length, 0);

    for (const lang of ['fr', 'en', 'ar', 'de']) {
      await page.locator(`.lang-switch button[data-lang="${lang}"]`).click();
      blocked = await messageOf(page, 1);
      assert.equal(blocked.hidden, false, lang);
      assert.equal(blocked.text, MESSAGES[lang], lang);
    }

    await formA.locator('button[type="submit"]').click();
    const blockedA = await messageOf(page, 0);
    assert.equal(blockedA.hidden, false);
    assert.equal(blockedA.text, MESSAGES.de);
    assert.equal(formPosts.length, 0);
    const stillBlocked = await storageSnapshot(page);
    assert.equal(stillBlocked.cookieConsent, null);
    assert.deepEqual(stillBlocked.localKeys, opened.localKeys);

    async function submitAllowed(form, index, formType) {
      const before = formPosts.length;
      await form.locator('input[name="einwilligung_gelesen"]').check();
      const cleared = await messageOf(page, index);
      assert.equal(cleared.hidden, true);
      const invalid = await form.evaluate((el) => [...el.elements].filter((field) => field.willValidate && !field.validity.valid).map((field) => ({
        name: field.name,
        type: field.type,
        value: field.type === 'file' ? field.files.length : field.value,
        message: field.validationMessage,
      })));
      if (invalid.length) throw new Error(`form ${formType} still invalid: ${JSON.stringify(invalid)}`);
      await form.locator('button[type="submit"]').click({ noWaitAfter: true });
      const deadline = Date.now() + 5000;
      while (formPosts.length === before && Date.now() < deadline) {
        await page.waitForTimeout(50);
      }
      assert.equal(formPosts.length, before + 1);
      const hit = formPosts[formPosts.length - 1];
      assert.match(hit.url, /^https:\/\/meda-apply\.g5kjd9v7cf\.workers\.dev\/?$/);
      assert.equal(hit.method, 'POST');
      assert.match(hit.body, /name="ref_code"[\s\S]*M001|ref_code=[^&]*M001/);
      assert.match(hit.body, /TEST TEST|name=TEST(?:\+|%20)TEST/);
      assert.match(hit.body, /test(?:@|%40)example\.invalid/);
      assert.match(hit.body, new RegExp(formType));
      await page.waitForFunction(() => (sessionStorage.getItem('meda_consent_queue') || '').includes('consent_given'));
      const after = await storageSnapshot(page);
      assert.equal(after.cookieConsent, null);
      assert.deepEqual(after.localKeys, opened.localKeys);
      assert.match(after.queue, /consent_given/);
      assert.match(after.queue, new RegExp(formType));
    }

    await submitAllowed(formB, 1, 'profile_no_cv');

    await formA.locator('input[name="einwilligung_gelesen"]').check();
    const rejected = [
      {
        name: 'cv.pdf',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]),
        snippet: 'nicht akzeptiert',
      },
      {
        name: 'cv.pdf.exe',
        mimeType: 'application/pdf',
        buffer: safePdf,
        snippet: 'cv.pdf.exe',
      },
      {
        name: 'big.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.concat([safePdf, Buffer.alloc(5 * 1024 * 1024)]),
        snippet: '5 MB',
      },
      {
        name: 'active.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n1 0 obj<< /JavaScript (app.alert(1)) >>endobj\n%%EOF\n', 'utf8'),
        snippet: 'aktive Inhalte',
      },
      {
        name: 'page.html',
        mimeType: 'text/html',
        buffer: Buffer.from('<!DOCTYPE html><html><body>TEST</body></html>', 'utf8'),
        snippet: 'nicht akzeptiert',
      },
      {
        name: 'icon.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'),
        snippet: 'nicht akzeptiert',
      },
    ];
    for (const sample of rejected) {
      const before = formPosts.length;
      const consentBefore = consentCalls.length;
      await formA.locator('input[type="file"]').setInputFiles({
        name: sample.name,
        mimeType: sample.mimeType,
        buffer: sample.buffer,
      });
      await formA.locator('button[type="submit"]').click();
      const cvError = formA.locator('.cv-file-error');
      await cvError.filter({ hasText: sample.snippet }).waitFor({ state: 'visible', timeout: 5000 });
      const text = ((await cvError.textContent()) || '').trim();
      assert.match(text, new RegExp(sample.snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.equal(await formA.locator('input[type="file"]').evaluate((el) => el.files.length), 0, sample.name);
      assert.equal(await formA.locator('input[type="file"]').getAttribute('aria-invalid'), 'true', sample.name);
      assert.equal(await formA.locator('.cv-file-alt').evaluate((el) => el.hidden), false, sample.name);
      assert.match((await formA.locator('.cv-file-alt').textContent()) || '', /Profil ohne Lebenslauf/);
      assert.equal(formPosts.length, before, sample.name);
      assert.equal(consentCalls.length, consentBefore, sample.name);
    }
    const afterRejects = await storageSnapshot(page);
    assert.equal(afterRejects.cookieConsent, null);
    assert.deepEqual(afterRejects.localKeys, opened.localKeys);

    await formA.locator('input[type="file"]').setInputFiles(dummyFile);
    await submitAllowed(formA, 0, 'cv_upload');
    assert.equal(formPosts.length, 2);
    assert.ok(consentCalls.some((call) => /\/gate$/.test(new URL(call.url).pathname)));
    assert.ok(consentCalls.some((call) => /\/submit$/.test(new URL(call.url).pathname)));
  } finally {
    await context.close();
    server.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});

test('gate, file choice, and the worker code are explained before another send', async () => {
  const { server, origin } = await startServer();
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'meda-cv-ux-'));
  const safePdf = Buffer.from('%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< /Root 1 0 R >>\n%%EOF\n', 'utf8');
  const shots = '/opt/cursor/artifacts';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: '/usr/local/bin/google-chrome',
    viewport: { width: 1280, height: 900 },
    locale: 'de-DE',
    args: ['--no-first-run', '--no-default-browser-check', '--disable-sync'],
  });
  const page = context.pages()[0] || await context.newPage();
  let applyMode = 'abort';
  let releaseApply = () => {};
  let applyPosts = 0;

  try {
    await context.route('**/*', async (route) => {
      const req = route.request();
      const url = req.url();
      if (/meda-apply\.g5kjd9v7cf\.workers\.dev/i.test(url) && req.method() === 'POST') {
        applyPosts += 1;
        if (applyMode === 'hold') {
          await new Promise((resolve) => { releaseApply = resolve; });
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ ok: false, error: 'FILE_TYPE' }),
          });
          return;
        }
        await route.abort('aborted');
        return;
      }
      if (/workers\.dev|formsubmit\.co|fonts\.googleapis|fonts\.gstatic/i.test(url)) {
        await route.abort('aborted');
        return;
      }
      await route.continue();
    });

    await page.goto(`${origin}/bewerben.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const form = document.querySelector('form[data-meda-apply]');
      form.querySelector('[name="name"]').value = 'TEST TEST';
      form.querySelector('[name="email"]').value = 'test@example.invalid';
      form.querySelector('[name="attachment"]').removeAttribute('required');
      form.querySelector('[name="einwilligung_gelesen"]').checked = true;
      form.requestSubmit();
    });
    const gateMsg = page.locator('#meda-datenschutz-gate .gate-required-msg');
    await gateMsg.waitFor({ state: 'visible', timeout: 5000 });
    assert.match((await gateMsg.textContent()) || '', /Datenschutzerklärung/);
    const gateButton = page.locator('.js-gate-accept-de');
    assert.equal(await gateButton.getAttribute('aria-invalid'), 'true');
    await page.screenshot({ path: `${shots}/bewerben-gate-error.png` });
    assert.equal(applyPosts, 0);

    await gateButton.click();
    await page.waitForSelector('#meda-datenschutz-gate', { state: 'detached' });
    await page.evaluate(() => {
      document.querySelector('[name="attachment"]').setAttribute('required', '');
    });

    const formA = page.locator('form.form').first();
    await formA.locator('[name="name"]').fill('TEST TEST');
    await formA.locator('[name="email"]').fill('test@example.invalid');
    await formA.locator('input[type="file"]').setInputFiles({
      name: 'lebenslauf.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('kein lebenslauf'),
    });
    const cvError = formA.locator('.cv-file-error');
    await cvError.filter({ hasText: 'nicht akzeptiert' }).waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await formA.locator('input[type="file"]').evaluate((el) => el.files.length), 0);
    assert.equal(await formA.locator('.cv-file-alt').evaluate((el) => el.hidden), false);
    await cvError.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/bewerben-file-type-error.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await cvError.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.screenshot({ path: `${shots}/bewerben-file-type-error-mobile.png` });
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(applyPosts, 0);

    await formA.locator('input[type="file"]').setInputFiles({
      name: 'zu-gross.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.concat([safePdf, Buffer.alloc(5 * 1024 * 1024)]),
    });
    await cvError.filter({ hasText: 'zu groß' }).waitFor({ state: 'visible', timeout: 5000 });
    await cvError.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/bewerben-file-size-error.png` });

    await formA.locator('input[type="file"]').setInputFiles({
      name: 'lebenslauf.pdf',
      mimeType: 'application/pdf',
      buffer: safePdf,
    });
    await cvError.waitFor({ state: 'hidden', timeout: 5000 });
    await formA.locator('[name="einwilligung_gelesen"]').uncheck();
    await formA.locator('button[type="submit"]').click();
    const consentMsg = formA.locator('.consent-required-msg');
    await consentMsg.waitFor({ state: 'visible', timeout: 5000 });
    await consentMsg.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/bewerben-consent-error.png` });
    assert.equal(applyPosts, 0);

    await formA.locator('[name="einwilligung_gelesen"]').check();
    applyMode = 'hold';
    await formA.locator('button[type="submit"]').click();
    const sendButton = formA.locator('button[type="submit"]');
    const started = Date.now() + 5000;
    while (applyPosts < 1 && Date.now() < started) await page.waitForTimeout(50);
    assert.equal(applyPosts, 1);
    await page.waitForFunction(() => {
      const btn = document.querySelector('form[data-meda-apply] button[type="submit"]');
      return btn && btn.disabled && btn.classList.contains('is-sending') && /Wird gesendet/.test(btn.textContent || '') && /20 Sekunden/.test(btn.textContent || '');
    }, null, { timeout: 5000 });
    await sendButton.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/bewerben-sending.png` });
    await page.evaluate(() => document.querySelector('form[data-meda-apply]').requestSubmit());
    await page.waitForTimeout(150);
    assert.equal(applyPosts, 1);

    releaseApply();
    await cvError.filter({ hasText: 'nicht akzeptiert' }).waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForFunction(() => {
      const btn = document.querySelector('form[data-meda-apply] button[type="submit"]');
      return btn && !btn.disabled && !btn.classList.contains('is-sending') && /Lebenslauf senden/.test(btn.textContent || '');
    }, null, { timeout: 5000 });
    assert.equal(await formA.locator('input[type="file"]').evaluate((el) => el.files.length), 0);
    await cvError.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/bewerben-server-file-type.png` });
  } finally {
    try { releaseApply(); } catch { /* already released */ }
    await context.close();
    server.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});
