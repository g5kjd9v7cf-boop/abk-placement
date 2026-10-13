import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = join(root, 'site');

const ALLOWED = {
  'bewerben.html:cv_upload': [
    '_honey',
    'form_type',
    'name',
    'email',
    'phone',
    'attachment',
    'document_version',
    'consent_checkbox_version',
    'einwilligung_gelesen',
  ],
  'bewerben.html:profile_no_cv': [
    '_honey',
    'form_type',
    'name',
    'email',
    'phone',
    'experience',
    'skills',
    'languages',
    'availability',
    'sector_path',
    'document_version',
    'consent_checkbox_version',
    'einwilligung_gelesen',
  ],
  'kontakt.html:meda-kontakt-form': [
    'role',
    'name',
    'email',
    'company',
    'sector',
    'message',
    'document_version',
    'consent_checkbox_version',
    'einwilligung_gelesen',
  ],
  'widerruf.html:widerruf-form': ['receipt_ref', 'email', 'confirm_withdraw'],
  'fuer-arbeitgeber.html:meda-anmeldung-form': [
    'name',
    'email',
    'phone',
    'hr_email',
    'path',
    'role',
    'lang',
    'experience',
    'target_country',
    'certs_note',
    'docs_listed',
    'einwilligung_gelesen',
  ],
};

const SENSITIVE = /pass|passport|geburt|birth|religion|iban|steuer|address|street|photo|selfie|national|svnr|sozial/i;

function formsIn(html) {
  const found = [];
  const re = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let match;
  while ((match = re.exec(html))) {
    const id = (match[1].match(/\bid="([^"]+)"/) || [])[1] || '';
    const type = (match[2].match(/name="form_type"\s+value="([^"]+)"/) || [])[1] || '';
    const names = [...match[2].matchAll(/\bname="([^"]+)"/g)].map((item) => item[1]);
    found.push({ id, type, names });
  }
  return found;
}

test('every public form matches the data-minimisation allowlist', () => {
  const seen = new Set();
  for (const file of ['bewerben.html', 'kontakt.html', 'widerruf.html', 'fuer-arbeitgeber.html']) {
    const html = readFileSync(join(site, file), 'utf8');
    for (const form of formsIn(html)) {
      const key = form.type ? `${file}:${form.type}` : `${file}:${form.id}`;
      seen.add(key);
      assert.deepEqual(form.names, ALLOWED[key], key);
      for (const name of form.names) assert.equal(SENSITIVE.test(name), false, name);
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(ALLOWED).sort());
});
