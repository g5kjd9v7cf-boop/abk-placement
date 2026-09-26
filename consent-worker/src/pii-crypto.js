// PII crypto helpers shared by the Worker (encrypt-on-write) and the offline
// decrypt script. Uses only WebCrypto + base64 globals, which exist in both the
// Cloudflare Workers runtime and Node 18+.
//
// Design:
//   - One secret `PII_SECRET` (high-entropy). Two purpose-separated keys are
//     derived from it with HKDF-SHA256:
//       * AES-256-GCM key  -> encrypt/decrypt the raw consent payload at rest
//       * HMAC-SHA256 key  -> deterministic email fingerprint for lookups
//   - AES-GCM uses a fresh random 12-byte IV per record, so the same input
//     never yields the same ciphertext. Output format: "v1:<b64 iv>:<b64 ct+tag>".
//   - The HMAC is deterministic (same email -> same digest) so records remain
//     findable for withdrawals / data-subject requests without storing the
//     plaintext email.

const HKDF_SALT = new TextEncoder().encode('meda-consent-pii-v1');
const ENC_INFO = new TextEncoder().encode('meda-pii-enc-v1');
const MAC_INFO = new TextEncoder().encode('meda-pii-mac-v1');

// Cache derived keys per-secret within an isolate to avoid re-deriving on every
// request.
const keyCache = new Map();

function utf8(s) {
  return new TextEncoder().encode(s);
}

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(str) {
  const s = atob(str);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
}

function toHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

async function getKeys(secret) {
  if (!secret) throw new Error('PII_SECRET is not set');
  if (keyCache.has(secret)) return keyCache.get(secret);

  const base = await crypto.subtle.importKey('raw', utf8(secret), 'HKDF', false, ['deriveKey']);
  const encKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: ENC_INFO },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const macKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: MAC_INFO },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign']
  );
  const keys = { encKey, macKey };
  keyCache.set(secret, keys);
  return keys;
}

// Encrypt a UTF-8 string. Returns "v1:<b64 iv>:<b64 ciphertext+tag>".
export async function encryptString(secret, plaintext) {
  const { encKey } = await getKeys(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, utf8(plaintext)));
  return `v1:${toB64(iv)}:${toB64(ct)}`;
}

// Reverse of encryptString. Throws if the token is malformed or authentication
// fails (wrong key / tampered ciphertext).
export async function decryptString(secret, token) {
  const parts = String(token).split(':');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('Unrecognized ciphertext format (expected "v1:<iv>:<ct>")');
  }
  const { encKey } = await getKeys(secret);
  const iv = fromB64(parts[1]);
  const ct = fromB64(parts[2]);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encKey, ct);
  return new TextDecoder().decode(pt);
}

// Deterministic, lowercase-normalized email fingerprint (hex HMAC-SHA256).
export async function emailHmac(secret, email) {
  if (email == null || email === '') return null;
  const { macKey } = await getKeys(secret);
  const norm = String(email).trim().toLowerCase();
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', macKey, utf8(norm)));
  return toHex(sig);
}

// True when the ciphertext appears to be in our versioned format.
export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('v1:');
}
