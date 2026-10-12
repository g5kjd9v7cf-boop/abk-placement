import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanRepo } from './pii-scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('repo has no candidate emails, phones, or CV files', () => {
  const findings = scanRepo(root);
  assert.deepEqual(findings, [], JSON.stringify(findings, null, 2));
});
