import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import worker from '../src/index.js';
import { extractEmail, purgeOldCallMessages } from '../src/voice.js';

const TOKEN = 'twilio-test-token';

function mockDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          const call = { sql, args };
          calls.push(call);
          return {
            async run() {
              call.kind = 'run';
              return { success: true };
            },
          };
        },
      };
    },
  };
}

function sign(url, params, token = TOKEN) {
  const keys = Object.keys(params).sort();
  let data = url;
  keys.forEach((key) => {
    data += key + params[key];
  });
  return createHmac('sha1', token).update(data).digest('base64');
}

function voiceRequest(path, params, { token = TOKEN, signature } = {}) {
  const url = 'https://worker.test' + path;
  const body = new URLSearchParams(params).toString();
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': signature === undefined ? sign(url, params, token) : signature,
    },
    body,
  });
}

test('voice stays closed without a telephony token', async () => {
  const db = mockDb();
  const res = await worker.fetch(
    voiceRequest('/voice/incoming', { CallSid: 'CA1', From: '+491511234567' }, { token: '', signature: 'x' }),
    { DB: db }
  );
  assert.equal(res.status, 404);
  assert.equal(db.calls.length, 0);
});

test('voice rejects a bad signature and a personal line is not named', async () => {
  const db = mockDb();
  const res = await worker.fetch(
    voiceRequest('/voice/incoming', { CallSid: 'CA1', From: '+491511234567' }, { signature: 'not-a-signature' }),
    { DB: db, TWILIO_AUTH_TOKEN: TOKEN }
  );
  assert.equal(res.status, 403);
  assert.equal(db.calls.length, 0);
  const src = readFileSync(new URL('../src/voice.js', import.meta.url), 'utf8');
  assert.equal(src.includes('55409685'), false);
});

test('welcome discloses the assistant and does not promise a visa', async () => {
  const res = await worker.fetch(
    voiceRequest('/voice/incoming', { CallSid: 'CA1', From: '+491511234567' }),
    { DB: mockDb(), TWILIO_AUTH_TOKEN: TOKEN }
  );
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.match(xml, /automatischen Assistenten/);
  assert.match(xml, /keine Zusage für ein Visum/);
  assert.match(xml, /keine Tonaufnahme/);
  assert.match(xml, /Google\.de-DE-Neural2-C/);
  assert.equal(xml.includes('55409685'), false);
});

test('a completed call stores the caller number and emails the inbox', async () => {
  const db = mockDb();
  const mailed = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    mailed.push({ url, body: JSON.parse(opts.body) });
    return new Response('{"success":"true"}', { status: 200 });
  };
  try {
    const path = '/voice/step?stage=number&lang=de&name=Ada%20Lovelace&mail=ada%40example.com&msg=R%C3%BCckfrage%20zur%20Pflege&from=%2B491511234567';
    const params = { CallSid: 'CA9', From: '+491511234567', SpeechResult: 'ja' };
    const res = await worker.fetch(
      voiceRequest(path, params),
      { DB: db, TWILIO_AUTH_TOKEN: TOKEN, CALL_INBOX: 'meda-vermittlung@agentmail.to' }
    );
    assert.equal(res.status, 200);
    const xml = await res.text();
    assert.match(xml, /Nachricht ist aufgenommen/);
    assert.match(xml, /<Hangup\/>/);
    const insert = db.calls.find((call) => /INSERT INTO call_messages/.test(call.sql));
    assert.ok(insert);
    assert.equal(insert.args[2], 'Ada Lovelace');
    assert.equal(insert.args[3], '+491511234567');
    assert.equal(insert.args[4], 'ada@example.com');
    assert.match(insert.args[5], /Pflege/);
    assert.equal(JSON.stringify(insert.args).includes('55409685'), false);
    assert.equal(mailed.length, 1);
    assert.match(mailed[0].url, /formsubmit\.co\/ajax\/meda-vermittlung%40agentmail\.to/);
    assert.match(mailed[0].body.message, /\+491511234567/);
    assert.equal(JSON.stringify(mailed[0].body).includes('55409685'), false);
  } finally {
    globalThis.fetch = original;
  }
});

test('english digit chooses the english voice', async () => {
  const res = await worker.fetch(
    voiceRequest('/voice/step?stage=lang', { Digits: '2', From: '+491511234567' }),
    { DB: mockDb(), TWILIO_AUTH_TOKEN: TOKEN }
  );
  const xml = await res.text();
  assert.match(xml, /Please say your name/);
  assert.match(xml, /Google\.en-GB-Neural2-C/);
});

test('spoken email words become an address', () => {
  assert.equal(extractEmail('ada at example punkt com'), 'ada@example.com');
  assert.equal(extractEmail('keine'), '');
});

test('old call messages are deleted after 180 days', async () => {
  const db = mockDb();
  const result = await purgeOldCallMessages({ DB: db }, new Date('2026-09-26T00:00:00.000Z'));
  assert.equal(result.ok, true);
  assert.match(db.calls[0].sql, /DELETE FROM call_messages/);
  assert.equal(db.calls[0].args[0] < '2026-06-26T00:00:00.000Z', true);
});

test('consent writes still reject a foreign origin', async () => {
  const db = mockDb();
  const res = await worker.fetch(
    new Request('https://worker.test/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
        'CF-Connecting-IP': '203.0.113.50',
      },
      body: JSON.stringify({ event: 'page_visit' }),
    }),
    { DB: db, ALLOWED_ORIGINS: 'https://meda-vermittlung.de', TWILIO_AUTH_TOKEN: TOKEN }
  );
  assert.equal(res.status, 403);
  assert.equal(db.calls.length, 0);
});
