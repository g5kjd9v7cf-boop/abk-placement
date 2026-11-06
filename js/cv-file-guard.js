/* Browser check for Bewerbung CV uploads. This can be bypassed; see SECURITY.md. */
(function (root) {
  'use strict';

  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_FILES = 1;
  var ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  var ALLOWED = { pdf: 1, doc: 1, docx: 1 };
  var BLOCKED = {
    exe: 1, com: 1, bat: 1, cmd: 1, scr: 1, msi: 1, dll: 1, apk: 1, jar: 1, msp: 1, cpl: 1, pif: 1,
    js: 1, mjs: 1, jse: 1, vbs: 1, vbe: 1, ps1: 1, sh: 1, bash: 1, php: 1, py: 1, rb: 1, pl: 1, wsf: 1,
    html: 1, htm: 1, svg: 1, xhtml: 1, shtml: 1, xml: 1,
    docm: 1, dotm: 1, xlsm: 1, xltm: 1, pptm: 1, potm: 1, ppam: 1, xlam: 1,
    zip: 1, rar: 1, '7z': 1, tar: 1, gz: 1, tgz: 1, bz2: 1, xz: 1, iso: 1, cab: 1
  };

  var KEYS = {
    type: 'app.cv.type',
    ext: 'app.cv.ext',
    size: 'app.cv.size',
    count: 'app.cv.count',
    unsafe: 'app.cv.unsafe'
  };

  function fail(code) {
    return { ok: false, code: code, key: KEYS[code] || KEYS.type };
  }

  function baseName(name) {
    var raw = String(name || '');
    if (/[\\/\u0000]/.test(raw) || /[\u202a-\u202e\u2066-\u2069]/.test(raw)) return null;
    var base = raw.replace(/\\/g, '/').split('/').pop() || '';
    base = base.replace(/^\uFEFF/, '').trim().replace(/[. ]+$/g, '');
    if (!base || /[\u0000-\u001f\u007f]/.test(base)) return null;
    return base;
  }

  function checkName(name) {
    var base = baseName(name);
    if (!base) return 'type';
    var parts = base.split('.');
    if (parts.length < 2 || !parts[0]) return 'type';
    var exts = [];
    for (var i = 1; i < parts.length; i++) {
      var ext = parts[i].toLowerCase();
      if (!ext) return 'type';
      exts.push(ext);
    }
    if (exts.length > 1) return 'ext';
    if (BLOCKED[exts[0]] || !ALLOWED[exts[0]]) return 'type';
    return '';
  }

  function startsWith(bytes, sig) {
    if (!bytes || bytes.length < sig.length) return false;
    for (var i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
    return true;
  }

  function isPdfNameContinue(code) {
    if (code <= 32 || code === 127) return false;
    return code !== 0x28 && code !== 0x29 && code !== 0x3c && code !== 0x3e &&
      code !== 0x5b && code !== 0x5d && code !== 0x7b && code !== 0x7d &&
      code !== 0x2f && code !== 0x25;
  }

  function hasPdfName(bytes, name) {
    var n = name.length;
    if (!bytes || bytes.length < n) return false;
    var first = name.charCodeAt(0);
    outer: for (var i = 0; i <= bytes.length - n; i++) {
      if (bytes[i] !== first) continue;
      for (var j = 1; j < n; j++) {
        if (bytes[i + j] !== name.charCodeAt(j)) continue outer;
      }
      var next = i + n < bytes.length ? bytes[i + n] : -1;
      if (next >= 0 && isPdfNameContinue(next)) continue;
      return true;
    }
    return false;
  }

  function hasAscii(bytes, text) {
    var n = text.length;
    if (!bytes || bytes.length < n) return false;
    var first = text.charCodeAt(0);
    outer: for (var i = 0; i <= bytes.length - n; i++) {
      if (bytes[i] !== first) continue;
      for (var j = 1; j < n; j++) {
        if (bytes[i + j] !== text.charCodeAt(j)) continue outer;
      }
      return true;
    }
    return false;
  }

  function pdfUnsafe(bytes) {
    var js = hasPdfName(bytes, '/JavaScript') || hasPdfName(bytes, '/JS');
    if (js) return true;
    if (hasPdfName(bytes, '/Launch')) return true;
    if (hasPdfName(bytes, '/EmbeddedFile')) return true;
    if (hasPdfName(bytes, '/OpenAction') && js) return true;
    return false;
  }

  function isZip(bytes) {
    return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
      startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  }

  function extensionOf(name) {
    var base = baseName(name);
    if (!base) return '';
    var parts = base.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  function classifyCv(name, size, bytes) {
    var declared = typeof size === 'number' ? size : (bytes ? bytes.length : 0);
    if (declared > MAX_BYTES) return fail('size');
    if (!declared) return fail('type');
    var nameCode = checkName(name);
    if (nameCode) return fail(nameCode);
    if (!bytes || bytes.length < 4) return fail('type');
    var ext = extensionOf(name);
    if (ext === 'pdf') {
      if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return fail('type');
      if (pdfUnsafe(bytes)) return fail('unsafe');
      return { ok: true };
    }
    if (ext === 'doc') {
      if (!startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) return fail('type');
      return { ok: true };
    }
    if (ext === 'docx') {
      if (!isZip(bytes)) return fail('type');
      if (!hasAscii(bytes, 'word/')) return fail('type');
      if (hasAscii(bytes, 'vbaProject.bin')) return fail('unsafe');
      return { ok: true };
    }
    return fail('type');
  }

  function readBytes(file) {
    return new Promise(function (resolve, reject) {
      if (typeof FileReader === 'undefined') {
        reject(new Error('FileReader missing'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          resolve(new Uint8Array(reader.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () {
        reject(reader.error || new Error('read'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function inspectList(fileList) {
    var files = [];
    if (fileList && typeof fileList.length === 'number') {
      for (var i = 0; i < fileList.length; i++) files.push(fileList[i]);
    }
    if (files.length > MAX_FILES) return Promise.resolve(fail('count'));
    if (!files.length) return Promise.resolve({ ok: true });
    var file = files[0];
    var early = classifyCv(file.name, file.size, file.size > MAX_BYTES ? new Uint8Array(0) : null);
    if (!early.ok && (early.code === 'size' || early.code === 'ext' || early.code === 'count' || (early.code === 'type' && checkName(file.name)))) {
      return Promise.resolve(early);
    }
    return readBytes(file).then(function (bytes) {
      return classifyCv(file.name, file.size, bytes);
    });
  }

  function install(doc) {
    if (!doc || !doc.querySelectorAll) return;
    var inputs = doc.querySelectorAll('form.form[action*="formsubmit"] input[type="file"]');
    Array.prototype.forEach.call(inputs, function (input) {
      input.setAttribute('accept', ACCEPT);
      if (input.getAttribute('data-cv-bound') === '1') return;
      input.setAttribute('data-cv-bound', '1');
      input.addEventListener('change', function () {
        var form = input.form;
        if (!form || typeof root.MEDA_showCvError !== 'function') return;
        inspectList(input.files).then(function (result) {
          if (result.ok) root.MEDA_clearCvError(form);
          else root.MEDA_showCvError(form, result.key);
        }).catch(function () {
          root.MEDA_showCvError(form, KEYS.type);
        });
      });
    });
  }

  root.MEDA_cvGuard = {
    MAX_BYTES: MAX_BYTES,
    MAX_FILES: MAX_FILES,
    ACCEPT: ACCEPT,
    classifyCv: classifyCv,
    inspectList: inspectList,
    install: install
  };

  function boot() {
    install(root.document);
  }
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
