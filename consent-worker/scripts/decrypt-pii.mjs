#!/usr/bin/env node
// Authorized offline utility to read PII the Worker encrypted at rest.
// Requires the same PII_SECRET the Worker uses. Runs on Node 18+.
//
// Decrypt a stored payload_json ciphertext:
//   PII_SECRET=... node scripts/decrypt-pii.mjs 'v1:<iv>:<ct>'
//   ... | node scripts/decrypt-pii.mjs -            # read ciphertext from stdin
//
// Compute the lookup fingerprint for an email (to find that person's rows):
//   PII_SECRET=... node scripts/decrypt-pii.mjs --hmac-email [email protected]
//
// Never pass PII_SECRET on the command line in a shared shell; prefer env.

import { readFileSync } from 'node:fs';
import { decryptString, emailHmac } from '../src/pii-crypto.js';

const secret = process.env.PII_SECRET || '';
if (!secret) {
  console.error('PII_SECRET is not set in the environment. Refusing to run.');
  process.exit(1);
}

const args = process.argv.slice(2);

async function main() {
  if (args[0] === '--hmac-email') {
    const email = args[1];
    if (!email) {
      console.error('Usage: --hmac-email <address>');
      process.exit(1);
    }
    console.log(await emailHmac(secret, email));
    return;
  }

  let token = args[0];
  if (!token || token === '-') {
    token = readFileSync(0, 'utf8').trim();
  }
  if (!token) {
    console.error('No ciphertext provided. Pass "v1:<iv>:<ct>" as an argument or via stdin.');
    process.exit(1);
  }

  try {
    const plaintext = await decryptString(secret, token);
    console.log(plaintext);
  } catch (err) {
    console.error(`Decryption failed: ${err && err.message ? err.message : err}`);
    console.error('(wrong PII_SECRET, corrupted ciphertext, or not an encrypted value)');
    process.exit(2);
  }
}

main();
