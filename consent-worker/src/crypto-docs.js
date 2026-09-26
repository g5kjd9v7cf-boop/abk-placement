/** AES-GCM for application files. The key is an env secret, never a [vars] value. */

export const ALGORITHM = 'AES-GCM';
export const MAX_FILE_BYTES = 400 * 1024;
export const MAX_FILE_BASE64 = 546140;
export const MAX_APPLY_BODY_BYTES = 2500000;

const TYPES = Object.freeze({
  'application/pdf': Object.freeze({ ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }),
  'image/jpeg': Object.freeze({ ext: 'jpg', magic: [0xff, 0xd8, 0xff] }),
  'image/png': Object.freeze({
    ext: 'png',
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  }),
});

export function encodeBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function decodeBase64(input) {
  if (typeof input !== 'string') return null;
  const clean = input.replace(/\s/g, '');
  if (!clean || clean.length > MAX_FILE_BASE64) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return null;
  try {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export function decodeKeyMaterial(secret) {
  if (typeof secret !== 'string' || !secret.trim()) {
    return { ok: false, error: 'encryption_key_missing' };
  }
  const clean = secret.trim().replace(/\s/g, '');
  let bytes = null;
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) bytes = null;
    else {
      const bin = atob(clean);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    }
  } catch {
    bytes = null;
  }
  if (!bytes || bytes.length !== 32) return { ok: false, error: 'encryption_key_invalid' };
  return { ok: true, key: bytes };
}

export function sniffContentType(bytes) {
  if (!(bytes instanceof Uint8Array)) return null;
  const names = Object.keys(TYPES);
  for (let i = 0; i < names.length; i++) {
    const spec = TYPES[names[i]];
    if (bytes.length < spec.magic.length) continue;
    let same = true;
    for (let j = 0; j < spec.magic.length; j++) {
      if (bytes[j] !== spec.magic[j]) {
        same = false;
        break;
      }
    }
    if (same) return names[i];
  }
  return null;
}

export function sanitizeFileName(name, ext) {
  const base = typeof name === 'string' ? name.split(/[/\\]/).pop() : '';
  const clean = (base || '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 80);
  if (clean && clean.includes('.')) return clean;
  return 'file.' + ext;
}

async function aesGcmEncrypt(keyBytes, plain) {
  if (!(keyBytes instanceof Uint8Array) || keyBytes.length !== 32) {
    throw new Error('encryption_key_invalid');
  }
  if (!(plain instanceof Uint8Array) || plain.length === 0) {
    throw new Error('bad_plaintext');
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return {
    algorithm: ALGORITHM,
    iv: encodeBase64(iv),
    ciphertext: new Uint8Array(cipherBuf),
  };
}

export async function encryptUtf8(keyBytes, text) {
  if (typeof text !== 'string' || !text) throw new Error('bad_plaintext');
  const plain = new TextEncoder().encode(text);
  if (plain.length > 1024) throw new Error('bad_plaintext');
  const enc = await aesGcmEncrypt(keyBytes, plain);
  plain.fill(0);
  return {
    algorithm: enc.algorithm,
    iv: enc.iv,
    ciphertext: encodeBase64(enc.ciphertext),
  };
}

export async function decryptUtf8(keyBytes, ivB64, cipherB64) {
  if (!(keyBytes instanceof Uint8Array) || keyBytes.length !== 32) {
    throw new Error('encryption_key_invalid');
  }
  const iv = decodeBase64(ivB64);
  const cipher = decodeBase64(cipherB64);
  if (!iv || iv.length !== 12 || !cipher || cipher.length < 17) throw new Error('bad_ciphertext');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plainBuf);
}

export async function encryptDocument(keyBytes, plain) {
  if (!(keyBytes instanceof Uint8Array) || keyBytes.length !== 32) {
    throw new Error('encryption_key_invalid');
  }
  if (!(plain instanceof Uint8Array) || plain.length === 0 || plain.length > MAX_FILE_BYTES) {
    throw new Error('bad_file');
  }
  return aesGcmEncrypt(keyBytes, plain);
}

export function allowedContentTypes() {
  return Object.keys(TYPES);
}
