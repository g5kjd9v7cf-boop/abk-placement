import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/cv-file-guard.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);
const guard = context.MEDA_cvGuard;

const MAX = guard.MAX_BYTES;
const safePdf = Buffer.from('%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<< /Root 1 0 R >>\n%%EOF\n', 'utf8');

function zipStored(entryName, body) {
  const name = Buffer.from(entryName);
  const data = Buffer.from(body);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  return Buffer.concat([header, name, data]);
}

const safeDocx = zipStored('word/document.xml', '<w:document/>');
const safeDoc = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]);

test('a real PDF, DOC, and DOCX pass the magic-byte check', () => {
  assert.equal(guard.classifyCv('lebenslauf.pdf', safePdf.length, safePdf).ok, true);
  assert.equal(guard.classifyCv('lebenslauf.doc', safeDoc.length, safeDoc).ok, true);
  assert.equal(guard.classifyCv('lebenslauf.docx', safeDocx.length, safeDocx).ok, true);
  assert.equal(guard.classifyCv('plain.pdf', safePdf.length, Buffer.from('%PDF-1.4\n1 0 obj<< /OpenAction 2 0 R >>endobj\n%%EOF\n')).ok, true);
});

test('renamed executables, scripts, html, svg, macros, and archives are rejected', () => {
  const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);
  assert.equal(guard.classifyCv('cv.pdf', exe.length, exe).code, 'type');
  assert.equal(guard.classifyCv('run.exe', exe.length, exe).code, 'type');
  assert.equal(guard.classifyCv('cv.pdf.exe', safePdf.length, safePdf).code, 'ext');
  assert.equal(guard.classifyCv('page.html', 32, Buffer.from('<!DOCTYPE html><html></html>')).code, 'type');
  assert.equal(guard.classifyCv('icon.svg', 48, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).code, 'type');
  assert.equal(guard.classifyCv('note.pdf', 48, Buffer.from('<html><body>no</body></html>')).code, 'type');
  assert.equal(guard.classifyCv('macro.docm', safeDocx.length, safeDocx).code, 'type');
  assert.equal(guard.classifyCv('files.zip', safeDocx.length, safeDocx).code, 'type');
  assert.equal(guard.classifyCv('photos.docx', zipStored('readme.txt', 'hello').length, zipStored('readme.txt', 'hello')).code, 'type');
  const macroDocx = Buffer.concat([safeDocx, Buffer.from('vbaProject.bin')]);
  assert.equal(guard.classifyCv('cv.docx', macroDocx.length, macroDocx).code, 'unsafe');
});

test('an oversized file and more than one file are rejected', async () => {
  assert.equal(guard.classifyCv('big.pdf', MAX + 1, safePdf).code, 'size');
  assert.equal(guard.classifyCv('edge.pdf', MAX, safePdf).ok, true);
  const counted = await guard.inspectList([
    { name: 'a.pdf', size: safePdf.length },
    { name: 'b.pdf', size: safePdf.length },
  ]);
  assert.equal(counted.code, 'count');
});

test('a PDF with active content is rejected and a plain PDF is not', () => {
  const samples = [
    '%PDF-1.4\n1 0 obj<< /JavaScript (app.alert(1)) >>endobj\n%%EOF\n',
    '%PDF-1.4\n1 0 obj<< /JS (app.alert(1)) >>endobj\n%%EOF\n',
    '%PDF-1.4\n1 0 obj<< /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>endobj\n%%EOF\n',
    '%PDF-1.4\n1 0 obj<< /Launch /F (cmd.exe) >>endobj\n%%EOF\n',
    '%PDF-1.4\n1 0 obj<< /EmbeddedFile 2 0 R >>endobj\n%%EOF\n',
  ];
  for (const text of samples) {
    const bytes = Buffer.from(text, 'utf8');
    assert.equal(guard.classifyCv('cv.pdf', bytes.length, bytes).code, 'unsafe', text.slice(0, 40));
  }
});
