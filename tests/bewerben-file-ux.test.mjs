import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

function loadI18n() {
  const source = readFileSync(new URL('js/i18n.js', root), 'utf8');
  const document = {
    readyState: 'loading',
    documentElement: { lang: 'de' },
    body: null,
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
  };
  const context = {
    document,
    navigator: { language: 'de' },
    localStorage: { getItem() { return null; }, setItem() {} },
    console,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.ABK_I18N;
}

const packs = loadI18n();

const expected = {
  de: {
    'app.cv.type': 'Diese Datei wird nicht akzeptiert. Bitte laden Sie Ihren Lebenslauf als PDF, DOC oder DOCX hoch.',
    'app.cv.size': 'Die Datei ist zu groß. Maximal 5 MB.',
    'app.cv.alt': 'Ohne Lebenslauf können Sie Option B nutzen: Profil ohne Lebenslauf.',
    'app.send.sending': 'Wird gesendet … bitte warten (bis zu 20 Sekunden)',
    'app.gate.required': 'Bitte akzeptieren Sie die Datenschutzerklärung, bevor Sie das Formular senden.',
  },
  fr: {
    'app.cv.type': 'Ce fichier n’est pas accepté. Veuillez téléverser votre CV au format PDF, DOC ou DOCX.',
    'app.cv.size': 'Le fichier est trop volumineux. Maximum 5 Mo.',
    'app.cv.alt': 'Sans CV, vous pouvez utiliser l’option B : profil sans CV.',
    'app.send.sending': 'Envoi en cours … veuillez patienter (jusqu’à 20 secondes)',
  },
  en: {
    'app.cv.type': 'This file is not accepted. Please upload your CV as a PDF, DOC or DOCX file.',
    'app.cv.size': 'The file is too large. Maximum 5 MB.',
    'app.cv.alt': 'Without a CV you can use option B: profile without a CV.',
    'app.send.sending': 'Sending … please wait (up to 20 seconds)',
  },
  ar: {
    'app.cv.type': 'هذا الملف غير مقبول. يرجى رفع السيرة الذاتية بصيغة PDF أو DOC أو DOCX.',
    'app.cv.size': 'الملف كبير جدًا. الحد الأقصى 5 ميغابايت.',
    'app.cv.alt': 'من دون سيرة ذاتية يمكنكم استخدام الخيار ب: ملف مهني بدون سيرة ذاتية.',
    'app.send.sending': 'جارٍ الإرسال … يرجى الانتظار (حتى 20 ثانية)',
  },
};

test('file, size, hint, and sending copy exist in every site language', () => {
  assert.deepEqual(Object.keys(packs).sort(), ['ar', 'de', 'en', 'fr']);
  for (const [lang, messages] of Object.entries(expected)) {
    for (const [key, value] of Object.entries(messages)) {
      assert.equal(packs[lang][key], value, `${lang} ${key}`);
    }
    for (const key of ['app.cv.ext', 'app.cv.count', 'app.cv.unsafe', 'app.send.invalid', 'app.consent.required', 'app.gate.required']) {
      assert.equal(typeof packs[lang][key], 'string', `${lang} ${key}`);
      assert.ok(packs[lang][key].length > 8, `${lang} ${key}`);
    }
  }
});

test('new Bewerbung messages avoid banned wording', () => {
  const keys = ['app.cv.type', 'app.cv.size', 'app.cv.alt', 'app.cv.ext', 'app.cv.unsafe', 'app.send.sending', 'app.send.invalid', 'app.gate.required'];
  const banned = /\b(KI|AI|Maghreb|Visum|Garantie|Gebühr|visa)\b/i;
  for (const pack of Object.values(packs)) {
    for (const key of keys) assert.equal(banned.test(pack[key]), false, pack[key]);
  }
});

test('every apply-worker error code is mapped on the page', () => {
  const source = readFileSync(new URL('js/bewerben-form.js', root), 'utf8');
  const context = { console, document: {}, navigator: { language: 'de' } };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  const mapped = {
    ...context.MEDA_applyErrors.FILE_CODES,
    ...context.MEDA_applyErrors.STATUS_CODES,
    CONSENT: 'app.consent.required',
  };
  const worker = readFileSync(new URL('apply-worker/src/index.js', root), 'utf8')
    + readFileSync(new URL('apply-worker/src/cv.mjs', root), 'utf8');
  const codes = new Set(['FILE_EXT', 'FILE_COUNT']);
  for (const match of worker.matchAll(/fail\([^)]*'([A-Z_]+)'/g)) codes.add(match[1]);
  for (const code of codes) {
    assert.equal(typeof mapped[code], 'string', code);
    assert.match(source, new RegExp(code));
  }
  assert.equal(mapped.FILE_TYPE, 'app.cv.type');
  assert.equal(mapped.FILE_SIZE, 'app.cv.size');
  assert.equal(mapped.FILE_UNSAFE, 'app.cv.unsafe');
});
