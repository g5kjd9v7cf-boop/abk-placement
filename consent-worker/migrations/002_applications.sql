-- Applications and encrypted files. Run once on an existing database.
-- No email column. No IP column. Ciphertext is AES-GCM output, not the file.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS does not drop data.

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
  withdrawn INTEGER NOT NULL DEFAULT 0
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
