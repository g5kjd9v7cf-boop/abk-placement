import { sanitizeDocumentVersion, sanitizeLocale, sanitizePage } from './policy.js';
import { employerContact, LANGUAGE_RANK, matchPlacement, PROFESSIONS } from './match.js';
import {
  ALGORITHM,
  decodeBase64,
  decodeKeyMaterial,
  encryptDocument,
  MAX_FILE_BYTES,
  sanitizeFileName,
  sniffContentType,
} from './crypto-docs.js';

const COUNTRY_RE = /^[\p{L}\p{M} .'-]{2,60}$/u;
const TYPE_EXT = Object.freeze({
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
});

function validateFile(file) {
  if (!file || typeof file !== 'object') return { error: 'bad_files' };
  const role = file.role === 'cv' || file.role === 'certificate' ? file.role : null;
  if (!role) return { error: 'bad_files' };
  const declared = typeof file.content_type === 'string' ? file.content_type.trim().toLowerCase() : '';
  if (!TYPE_EXT[declared]) return { error: 'bad_content_type' };
  if (typeof file.data_base64 !== 'string') return { error: 'bad_file' };
  if (file.data_base64.replace(/\s/g, '').length > 546140) return { error: 'file_too_large' };
  const bytes = decodeBase64(file.data_base64);
  if (!bytes || bytes.length === 0) return { error: 'bad_file' };
  if (bytes.length > MAX_FILE_BYTES) return { error: 'file_too_large' };
  const sniffed = sniffContentType(bytes);
  if (sniffed !== declared) return { error: 'bad_content_type' };
  return {
    ok: true,
    role,
    name: sanitizeFileName(file.name, TYPE_EXT[declared]),
    content_type: declared,
    bytes,
  };
}

export function parseApplyBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid_body' };
  if (typeof body._honey === 'string' && body._honey.trim()) return { error: 'invalid_request' };
  if (typeof body.company === 'string' && body.company.trim()) return { error: 'invalid_request' };

  const profession = typeof body.profession === 'string' ? body.profession.trim().toLowerCase() : '';
  if (!PROFESSIONS.includes(profession)) return { error: 'bad_profession' };

  const certificates = typeof body.certificates === 'string' ? body.certificates.trim() : '';
  if (!certificates || certificates.length > 400) return { error: 'bad_certificates' };

  const language = typeof body.language_level === 'string' ? body.language_level.trim().toUpperCase() : '';
  if (!LANGUAGE_RANK[language]) return { error: 'bad_language' };

  const years = body.experience_years;
  if (typeof years !== 'number' || !Number.isInteger(years) || years < 0 || years > 60) {
    return { error: 'bad_experience' };
  }

  const country = typeof body.qualification_country === 'string' ? body.qualification_country.trim() : '';
  if (!COUNTRY_RE.test(country)) return { error: 'bad_country' };

  if (body.consent_contact !== true) return { error: 'consent_required' };
  if (typeof body.consent_share !== 'boolean') return { error: 'bad_consent' };
  if (body.consent_pool != null && typeof body.consent_pool !== 'boolean') return { error: 'bad_consent' };

  const page = body.page == null || body.page === '' ? null : sanitizePage(body.page);
  if (body.page != null && body.page !== '' && !page) return { error: 'bad_page' };
  const locale = body.locale_shown == null || body.locale_shown === '' ? null : sanitizeLocale(body.locale_shown);
  if (body.locale_shown != null && body.locale_shown !== '' && !locale) return { error: 'bad_locale' };
  const documentVersion = body.document_version == null || body.document_version === ''
    ? null
    : sanitizeDocumentVersion(body.document_version);
  if (body.document_version != null && body.document_version !== '' && !documentVersion) {
    return { error: 'bad_document_version' };
  }

  if (!Array.isArray(body.files)) return { error: 'bad_files' };
  let cv = 0;
  let certificatesCount = 0;
  const files = [];
  for (let i = 0; i < body.files.length; i++) {
    const checked = validateFile(body.files[i]);
    if (checked.error) return { error: checked.error };
    if (checked.role === 'cv') cv += 1;
    else certificatesCount += 1;
    files.push(checked);
  }
  if (cv !== 1) return { error: 'cv_required' };
  if (certificatesCount > 3) return { error: 'too_many_certificates' };

  return {
    ok: true,
    facts: {
      profession,
      certificates,
      language_level: language,
      experience_years: years,
      qualification_country: country,
    },
    consent: {
      contact: true,
      share: body.consent_share === true,
      pool: body.consent_pool === true,
    },
    page,
    locale,
    document_version: documentVersion,
    files,
  };
}

/**
 * Encrypt files and decide the match before any database write.
 * A missing key returns before file bytes are parsed.
 */
export async function prepareApplication(env, body, deps = {}) {
  const key = decodeKeyMaterial(env && env.DATA_ENCRYPTION_KEY);
  if (!key.ok) return { status: 503, error: key.error, stored: false };

  const parsed = parseApplyBody(body);
  if (parsed.error) return { status: 400, error: parsed.error, stored: false };

  const decision = matchPlacement(parsed.facts);
  const share = parsed.consent.share;
  const contactEmployer = employerContact(decision, share);
  const encrypt = deps.encryptDocument || encryptDocument;
  const files = [];
  for (let i = 0; i < parsed.files.length; i++) {
    const file = parsed.files[i];
    const enc = await encrypt(key.key, file.bytes);
    if (!enc || enc.algorithm !== ALGORITHM || typeof enc.iv !== 'string' || !(enc.ciphertext instanceof Uint8Array)) {
      return { status: 500, error: 'encrypt_failed', stored: false };
    }
    files.push({
      role: file.role,
      file_name: file.name,
      content_type: file.content_type,
      algorithm: enc.algorithm,
      iv: enc.iv,
      ciphertext: enc.ciphertext,
    });
    file.bytes.fill(0);
  }

  return {
    status: 200,
    stored: false,
    record: {
      profession: parsed.facts.profession,
      certificates_text: parsed.facts.certificates,
      language_level: parsed.facts.language_level,
      experience_years: parsed.facts.experience_years,
      qualification_country: parsed.facts.qualification_country,
      share_with_employer: share ? 1 : 0,
      talent_pool: parsed.consent.pool ? 1 : 0,
      process_consent: 1,
      matched_rule_id: decision.matched ? decision.rule_id : null,
      employer_match: contactEmployer ? 1 : 0,
      sample_rule: decision.matched && decision.sample ? 1 : 0,
      locale: parsed.locale,
      document_version: parsed.document_version,
      page: parsed.page,
    },
    files,
    publicResult: {
      matched: decision.matched,
      employer_contact: contactEmployer,
      sample_rule: Boolean(decision.matched && decision.sample),
    },
  };
}

export function publicApplyBody(receipt, ts, prepared) {
  return {
    ok: true,
    receipt_ref: receipt,
    matched: prepared.publicResult.matched,
    employer_contact: prepared.publicResult.employer_contact,
    sample_rule: prepared.publicResult.sample_rule,
    ts,
  };
}

const MATCH_KEYS = Object.freeze([
  'id',
  'receipt',
  'rule_id',
  'profession',
  'share_with_employer',
  'talent_pool',
  'process_consent',
  'sample',
  'created_at',
]);

export function publicMatchRow(row) {
  return {
    id: row.id,
    receipt: row.receipt,
    rule_id: row.matched_rule_id,
    profession: row.profession,
    share_with_employer: row.share_with_employer === 1 || row.share_with_employer === true,
    talent_pool: row.talent_pool === 1 || row.talent_pool === true,
    process_consent: true,
    sample: row.sample_rule === 1 || row.sample_rule === true,
    created_at: row.created_at,
  };
}

export function matchListKeys() {
  return MATCH_KEYS;
}
