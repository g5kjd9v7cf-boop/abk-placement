import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  AGENTMAIL_REQUEST_LIMIT,
  COPY_TO,
  DEFAULT_ORIGINS,
  INBOX_ID,
  MAX_FILE_BYTES,
  classifyCv,
  handleApply,
  parseOrigins,
} from '../src/index.js';

const ENV = { AGENTMAIL_API_KEY: 'test-agentmail-key' };
const PDF = readFileSync(new URL('./fixtures/TEST-Lebenslauf-Karim-Testmann.pdf', import.meta.url));
const APPLICANT = 'TESTBEWERBUNG Karim Testmann';

function pdfBytes(extra = '') {
  return Buffer.from(`%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\n${extra}%%EOF\n`, 'utf8');
}

function mockFetch({ mailStatus = 200 } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('siteverify')) return Response.json({ success: true });
    return new Response('{"message_id":"msg_test","thread_id":"thd_test"}', { status: mailStatus });
  };
  return { impl, calls };
}

function applyRequest(fields, { ip = '203.0.113.10', file = null, filename = 'cv.pdf', origin = 'https://meda-vermittlung.de' } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  if (file) form.set('attachment', new File([file], filename));
  return new Request('https://meda-apply.g5kjd9v7cf.workers.dev/', {
    method: 'POST',
    headers: { Origin: origin, 'CF-Connecting-IP': ip },
    body: form,
  });
}

const CV_FIELDS = {
  form_type: 'cv_upload',
  name: APPLICANT,
  email: 'karim.testmann@example.com',
  phone: '+4915112345678',
  einwilligung_gelesen: 'yes',
  document_version: '2026-09-20-v1',
  consent_checkbox_version: '2026-09-20-v1',
};

function mailed(calls) {
  return calls.find((call) => call.url.includes('api.agentmail.to'));
}

test('the test CV is accepted and the AgentMail request carries it', async () => {
  assert.equal(classifyCv('TEST-Lebenslauf-Karim-Testmann.pdf', PDF.length, PDF).ok, true);
  const mail = mockFetch();
  const logs = [];
  const original = console.log;
  console.log = (line) => logs.push(String(line));
  let response;
  try {
    response = await handleApply(
      applyRequest(CV_FIELDS, { file: PDF, filename: 'TEST-Lebenslauf-Karim-Testmann.pdf', ip: '203.0.113.20' }),
      ENV,
      { fetchImpl: mail.impl, buckets: new Map() }
    );
  } finally {
    console.log = original;
  }
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://meda-vermittlung.de');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(mail.calls.length, 1);
  const sent = mailed(mail.calls);
  assert.equal(sent.url, `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(INBOX_ID)}/messages/send`);
  assert.equal(sent.init.redirect, 'manual');
  assert.equal(sent.init.headers.Authorization, 'Bearer test-agentmail-key');
  const payload = JSON.parse(sent.init.body);
  assert.deepEqual(payload.to, [INBOX_ID]);
  assert.deepEqual(payload.cc, [COPY_TO]);
  assert.equal(payload.reply_to, 'karim.testmann@example.com');
  assert.equal(payload.subject, `MEDA website Bewerbung: ${APPLICANT}`);
  assert.match(payload.text, /name: TESTBEWERBUNG Karim Testmann/);
  assert.match(payload.text, /email: karim\.testmann@example\.com/);
  assert.match(payload.text, /einwilligung_gelesen: yes/);
  assert.match(payload.text, /document_version: 2026-09-20-v1/);
  assert.match(payload.text, /consent_checkbox_version: 2026-09-20-v1/);
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.attachments[0].filename, 'TEST-Lebenslauf-Karim-Testmann.pdf');
  assert.equal(payload.attachments[0].content_type, 'application/pdf');
  assert.equal(payload.attachments[0].content_disposition, 'attachment');
  assert.equal(payload.attachments[0].content, Buffer.from(PDF).toString('base64'));
  assert.ok(sent.init.body.length < AGENTMAIL_REQUEST_LIMIT);
  const logged = logs.join('\n');
  assert.equal(logged.includes('Karim'), false);
  assert.equal(logged.includes('Testmann'), false);
  assert.equal(logged.includes('karim.testmann'), false);
  assert.equal(logged.includes('+4915112345678'), false);
  assert.equal(logged.includes(payload.attachments[0].content.slice(0, 40)), false);
  assert.equal(logged.includes('test-agentmail-key'), false);
  assert.match(logged, /"code":"OK"/);
});

test('GitHub Pages and www are allowed origins', async () => {
  for (const origin of DEFAULT_ORIGINS) {
    const mail = mockFetch();
    const response = await handleApply(
      applyRequest(CV_FIELDS, { file: PDF, filename: 'cv.pdf', origin, ip: '203.0.113.21' }),
      ENV,
      { fetchImpl: mail.impl, buckets: new Map() }
    );
    assert.equal(response.status, 200, origin);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }
});

test('a renamed exe or txt, a file over 5 MB, missing consent, and a wrong Origin are rejected', async () => {
  const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const txt = Buffer.from('Dies ist eine Textdatei, kein Lebenslauf.\n', 'utf8');
  const cases = [
    { file: exe, filename: 'Lebenslauf.pdf', error: 'FILE_TYPE' },
    { file: txt, filename: 'Lebenslauf.docx', error: 'FILE_TYPE' },
    { file: txt, filename: 'notes.txt', error: 'FILE_TYPE' },
    { file: Buffer.from('%PDF-1.4\n1 0 obj<< /JavaScript (app.alert(1)) >>endobj\n%%EOF\n', 'utf8'), filename: 'active.pdf', error: 'FILE_UNSAFE' },
    { file: pdfBytes(), filename: 'cv.pdf.exe', error: 'FILE_EXT' },
    { file: (() => { const big = new Uint8Array(MAX_FILE_BYTES + 1); big.set([0x25, 0x50, 0x44, 0x46]); return big; })(), filename: 'big.pdf', error: 'FILE_SIZE' },
  ];
  for (const [index, sample] of cases.entries()) {
    const mail = mockFetch();
    const response = await handleApply(
      applyRequest(CV_FIELDS, { file: sample.file, filename: sample.filename, ip: `203.0.113.${40 + index}` }),
      ENV,
      { fetchImpl: mail.impl, buckets: new Map() }
    );
    assert.equal(response.status, 400, sample.filename);
    assert.equal((await response.json()).error, sample.error, sample.filename);
    assert.equal(mailed(mail.calls), undefined, sample.filename);
  }

  const mail = mockFetch();
  const missing = await handleApply(
    applyRequest({ ...CV_FIELDS, einwilligung_gelesen: '' }, { file: PDF, filename: 'cv.pdf', ip: '203.0.113.50' }),
    ENV,
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error, 'CONSENT');
  assert.equal(mail.calls.length, 0);

  const evil = await handleApply(
    applyRequest(CV_FIELDS, { file: PDF, filename: 'cv.pdf', origin: 'https://evil.example', ip: '203.0.113.51' }),
    ENV,
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(evil.status, 403);
  assert.equal((await evil.json()).error, 'ORIGIN');
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  assert.equal(mail.calls.length, 0);
});

test('honeypot pretends success and Turnstile is skipped until its secret is set', async () => {
  const mail = mockFetch();
  const honey = await handleApply(
    applyRequest({ ...CV_FIELDS, _honey: 'bot' }, { file: PDF, ip: '203.0.113.60' }),
    ENV,
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(honey.status, 200);
  assert.equal(mail.calls.length, 0);

  const bare = await handleApply(
    applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.61' }),
    {},
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(bare.status, 503);
  assert.equal((await bare.json()).error, 'NOT_CONFIGURED');

  const guarded = mockFetch();
  const blocked = await handleApply(
    applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.62' }),
    { ...ENV, TURNSTILE_SECRET: 'turnstile-test' },
    { fetchImpl: guarded.impl, buckets: new Map() }
  );
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error, 'TURNSTILE');
  assert.equal(guarded.calls.some((call) => call.url.includes('api.agentmail.to')), false);
});

test('rate limit is five posts per IP per hour', async () => {
  const mail = mockFetch();
  const buckets = new Map();
  for (let i = 0; i < 5; i++) {
    const response = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.70' }), ENV, {
      fetchImpl: mail.impl,
      now: 1_000 + i,
      buckets,
    });
    assert.equal(response.status, 200);
  }
  const blocked = await handleApply(applyRequest(CV_FIELDS, { file: pdfBytes(), ip: '203.0.113.70' }), ENV, {
    fetchImpl: mail.impl,
    now: 1_010,
    buckets,
  });
  assert.equal(blocked.status, 429);
  assert.equal((await blocked.json()).error, 'RATE_LIMIT');
});

test('profile applications are mailed without an attachment', async () => {
  const mail = mockFetch();
  const response = await handleApply(
    applyRequest(
      {
        form_type: 'profile_no_cv',
        name: APPLICANT,
        email: 'karim.testmann@example.com',
        phone: '000000',
        experience: 'drei Jahre',
        skills: 'Pflege',
        languages: 'Deutsch B2',
        availability: 'ab sofort',
        sector_path: 'healthcare',
        einwilligung_gelesen: 'yes',
        document_version: '2026-09-20-v1',
        consent_checkbox_version: '2026-09-20-v1',
      },
      { ip: '203.0.113.80' }
    ),
    ENV,
    { fetchImpl: mail.impl, buckets: new Map() }
  );
  assert.equal(response.status, 200);
  const payload = JSON.parse(mailed(mail.calls).init.body);
  assert.equal(payload.attachments, undefined);
  assert.match(payload.text, /experience: drei Jahre/);
  assert.deepEqual(payload.cc, [COPY_TO]);
});

test('worker config is workers.dev only and has no secret values', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /name\s*=\s*"meda-apply"/);
  assert.match(toml, /workers_dev\s*=\s*true/);
  assert.equal(/\[\[routes\]\]/.test(toml), false);
  assert.equal(/pattern\s*=/.test(toml), false);
  assert.equal(/zone_name\s*=/.test(toml), false);
  assert.equal(/\[\[r2_buckets\]\]/.test(toml), false);
  assert.equal(/\[\[d1_databases\]\]/.test(toml), false);
  assert.equal(/AGENTMAIL_API_KEY\s*=\s*".+"/.test(toml), false);
  assert.equal(/TURNSTILE_SECRET\s*=\s*".+"/.test(toml), false);
  for (const origin of DEFAULT_ORIGINS) assert.equal(toml.includes(origin), true, origin);
  assert.deepEqual(parseOrigins({}), DEFAULT_ORIGINS);
  assert.deepEqual(parseOrigins({ ALLOWED_ORIGINS: '*,https://evil.example/phish' }), DEFAULT_ORIGINS);
});

test('the public form posts to the Worker and does not mention FormSubmit', () => {
  const root = new URL('../../', import.meta.url);
  const html = readFileSync(new URL('bewerben.html', root), 'utf8');
  const formJs = readFileSync(new URL('js/bewerben-form.js', root), 'utf8');
  const guard = readFileSync(new URL('js/cv-file-guard.js', root), 'utf8');
  const consent = readFileSync(new URL('js/consent-api.js', root), 'utf8');
  const i18n = readFileSync(new URL('js/i18n.js', root), 'utf8');
  assert.equal(/formsubmit/i.test(html), false);
  assert.match(html, /data-meda-apply/);
  assert.match(html, /name="meda-apply-api" content="https:\/\/meda-apply\.g5kjd9v7cf\.workers\.dev"/);
  assert.match(html, /connect-src 'self'[^"]*https:\/\/meda-apply\.g5kjd9v7cf\.workers\.dev/);
  assert.equal(/form-action 'self' https:\/\/formsubmit/.test(html), false);
  assert.match(html, /js\/bewerben-form\.js/);
  assert.match(formJs, /https:\/\/meda-apply\.g5kjd9v7cf\.workers\.dev/);
  assert.match(html, /meda-vermittlung@agentmail\.to/);
  assert.match(guard, /form\[data-meda-apply\]/);
  assert.match(consent, /form\[data-meda-apply\]/);
  assert.match(i18n, /Vielen Dank\. Wir haben Ihre Bewerbung erhalten\./);
  assert.match(i18n, /Bitte schicken Sie Ihren Lebenslauf an meda-vermittlung@agentmail\.to/);
  const facing = `${html}\n${formJs}`;
  assert.equal(/\bKI\b/.test(facing), false);
  assert.equal(/\bAI\b/.test(facing), false);
});
