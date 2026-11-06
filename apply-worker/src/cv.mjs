/**
 * Server-side CV check. Same rules as js/cv-file-guard.js:
 * one PDF, DOC, or DOCX, at most 5 MB, magic bytes, no second extension,
 * no active PDF content, no Word macro part.
 * The browser check can be skipped. This one cannot.
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Set(['pdf', 'doc', 'docx']);
const BLOCKED = new Set([
  'exe', 'com', 'bat', 'cmd', 'scr', 'msi', 'dll', 'apk', 'jar', 'msp', 'cpl', 'pif',
  'js', 'mjs', 'jse', 'vbs', 'vbe', 'ps1', 'sh', 'bash', 'php', 'py', 'rb', 'pl', 'wsf',
  'html', 'htm', 'svg', 'xhtml', 'shtml', 'xml',
  'docm', 'dotm', 'xlsm', 'xltm', 'pptm', 'potm', 'ppam', 'xlam',
  'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'iso', 'cab',
]);

function fail(error) {
  return { ok: false, error };
}

export function baseName(name) {
  const raw = String(name || '');
  if (/[\\/\u0000]/.test(raw) || /[\u202a-\u202e\u2066-\u2069]/.test(raw)) return '';
  let base = raw.replace(/\\/g, '/').split('/').pop() || '';
  base = base.replace(/^\uFEFF/, '').trim().replace(/[. ]+$/g, '');
  if (!base || /[\u0000-\u001f\u007f]/.test(base)) return '';
  return base;
}

function checkName(name) {
  const base = baseName(name);
  if (!base) return 'FILE_TYPE';
  const parts = base.split('.');
  if (parts.length < 2 || !parts[0]) return 'FILE_TYPE';
  const exts = [];
  for (let i = 1; i < parts.length; i++) {
    const ext = parts[i].toLowerCase();
    if (!ext) return 'FILE_TYPE';
    exts.push(ext);
  }
  if (exts.length > 1) return 'FILE_EXT';
  if (BLOCKED.has(exts[0]) || !ALLOWED.has(exts[0])) return 'FILE_TYPE';
  return '';
}

function startsWith(bytes, sig) {
  if (!bytes || bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
  return true;
}

function isPdfNameContinue(code) {
  if (code <= 32 || code === 127) return false;
  return code !== 0x28 && code !== 0x29 && code !== 0x3c && code !== 0x3e &&
    code !== 0x5b && code !== 0x5d && code !== 0x7b && code !== 0x7d &&
    code !== 0x2f && code !== 0x25;
}

function hasPdfName(bytes, name) {
  const n = name.length;
  if (!bytes || bytes.length < n) return false;
  const first = name.charCodeAt(0);
  outer: for (let i = 0; i <= bytes.length - n; i++) {
    if (bytes[i] !== first) continue;
    for (let j = 1; j < n; j++) {
      if (bytes[i + j] !== name.charCodeAt(j)) continue outer;
    }
    const next = i + n < bytes.length ? bytes[i + n] : -1;
    if (next >= 0 && isPdfNameContinue(next)) continue;
    return true;
  }
  return false;
}

function hasAscii(bytes, text) {
  const n = text.length;
  if (!bytes || bytes.length < n) return false;
  const first = text.charCodeAt(0);
  outer: for (let i = 0; i <= bytes.length - n; i++) {
    if (bytes[i] !== first) continue;
    for (let j = 1; j < n; j++) {
      if (bytes[i + j] !== text.charCodeAt(j)) continue outer;
    }
    return true;
  }
  return false;
}

function pdfUnsafe(bytes) {
  const js = hasPdfName(bytes, '/JavaScript') || hasPdfName(bytes, '/JS');
  if (js) return true;
  if (hasPdfName(bytes, '/Launch')) return true;
  if (hasPdfName(bytes, '/EmbeddedFile')) return true;
  return false;
}

function isZip(bytes) {
  return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
}

export function extensionOf(name) {
  const base = baseName(name);
  if (!base) return '';
  const parts = base.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function classifyCv(name, size, bytes) {
  const actual = bytes ? bytes.length : 0;
  const declared = typeof size === 'number' ? size : actual;
  if (declared > MAX_FILE_BYTES || actual > MAX_FILE_BYTES) return fail('FILE_SIZE');
  if (!declared || !actual) return fail('FILE_TYPE');
  const nameCode = checkName(name);
  if (nameCode) return fail(nameCode);
  if (bytes.length < 4) return fail('FILE_TYPE');
  const ext = extensionOf(name);
  if (ext === 'pdf') {
    if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return fail('FILE_TYPE');
    if (pdfUnsafe(bytes)) return fail('FILE_UNSAFE');
    return { ok: true, ext };
  }
  if (ext === 'doc') {
    if (!startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) return fail('FILE_TYPE');
    return { ok: true, ext };
  }
  if (ext === 'docx') {
    if (!isZip(bytes)) return fail('FILE_TYPE');
    if (!hasAscii(bytes, 'word/')) return fail('FILE_TYPE');
    if (hasAscii(bytes, 'vbaProject.bin')) return fail('FILE_UNSAFE');
    return { ok: true, ext };
  }
  return fail('FILE_TYPE');
}

export function safeFileName(filename, ext) {
  const base = baseName(filename).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 80);
  const stem = base.replace(/\.[A-Za-z0-9]+$/, '') || 'cv';
  return `${stem}.${ext}`;
}
