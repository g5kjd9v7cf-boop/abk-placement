-- Fresh install. Existing databases: run migrations/001_minimize.sql once,
-- then migrations/002_applications.sql once, then migrations/003_talent_pool.sql once.
-- Legacy columns (email, ip_hash, user_agent, referrer, session_id, payload_json)
-- stay so old rows can be restricted without a destructive rebuild.
-- New writes leave the personal-data columns NULL and payload_json as '{}'.

CREATE TABLE IF NOT EXISTS consent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  ts TEXT NOT NULL,
  document_version TEXT,
  locale_shown TEXT,
  layout TEXT,
  session_id TEXT,
  email TEXT,
  form_type TEXT,
  receipt_ref TEXT,
  user_agent TEXT,
  referrer TEXT,
  page TEXT,
  ip_hash TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  consent_contact INTEGER,
  consent_share INTEGER,
  consent_pool INTEGER,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  withdrawn_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_events_ts ON consent_events(ts);
CREATE INDEX IF NOT EXISTS idx_consent_events_receipt ON consent_events(receipt_ref);

-- Encrypted applications. Structured facts are stored for the rule check.
-- File bytes are ciphertext only. The contact email is AES-GCM ciphertext
-- (contact_email_ciphertext + contact_email_iv). There is no plaintext email
-- column and no IP column. Rows are kept for 24 months.

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  profession TEXT NOT NULL,
  certificates_text TEXT NOT NULL,
  language_level TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  qualification_country TEXT NOT NULL,
  share_with_employer INTEGER NOT NULL DEFAULT 0,
  talent_pool INTEGER NOT NULL DEFAULT 0,
  process_consent INTEGER NOT NULL DEFAULT 1,
  matched_rule_id TEXT,
  employer_match INTEGER NOT NULL DEFAULT 0,
  sample_rule INTEGER NOT NULL DEFAULT 1,
  withdrawn INTEGER NOT NULL DEFAULT 0,
  contact_email_iv TEXT,
  contact_email_ciphertext TEXT
);

CREATE TABLE IF NOT EXISTS application_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_ref TEXT NOT NULL,
  role TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_receipt ON applications(receipt);
CREATE INDEX IF NOT EXISTS idx_app_files_receipt ON application_files(receipt_ref);
CREATE INDEX IF NOT EXISTS idx_app_files_created ON application_files(created_at);
