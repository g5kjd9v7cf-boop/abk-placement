import assert from 'node:assert/strict';
import test from 'node:test';
import { guardAsk } from '../src/guards.mjs';

function askRequest(body, ip = '203.0.113.50') {
  return new Request('https://meda-ask.example/intake', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip, Origin: 'https://meda-vermittlung.de' },
    body: JSON.stringify(body),
  });
}

test('ask guard strips deliver_to and does not log the message', async () => {
  const logs = [];
  const original = console.log;
  console.log = (line) => logs.push(String(line));
  let result;
  try {
    result = await guardAsk(
      askRequest({
        channel: 'contact',
        page: 'kontakt.html',
        deliver_to: 'attacker@example.com',
        ops: {
          deliver_to: 'attacker@example.com',
          email: 'zzq-candidate@example.com',
          message: 'hello',
          name: 'ZZQ Candidate',
        },
      }),
      { REJECT_DEMO_TOKENS: 'true', REQUIRE_TURNSTILE: 'false' },
      { buckets: new Map() }
    );
  } finally {
    console.log = original;
  }
  assert.equal(result.ok, true);
  assert.equal(result.body.deliver_to, undefined);
  assert.equal(result.body.ops.deliver_to, undefined);
  assert.equal(result.body.ops.email, 'zzq-candidate@example.com');
  const logged = logs.join('\n');
  assert.equal(logged.includes('zzq-candidate'), false);
  assert.equal(logged.includes('attacker@example.com'), false);
  assert.equal(logged.includes('ZZQ'), false);
});

test('ask guard enforces turnstile when the flag is on', async () => {
  const result = await guardAsk(
    askRequest({ channel: 'contact', ops: { message: 'hello' }, turnstile_token: 'nope' }, '203.0.113.51'),
    { REQUIRE_TURNSTILE: 'true', TURNSTILE_SECRET: 'secret', REJECT_DEMO_TOKENS: 'true' },
    {
      buckets: new Map(),
      fetchImpl: async () => Response.json({ success: false }),
    }
  );
  assert.equal(result.status, 403);
  assert.equal(result.error, 'TURNSTILE');
});
