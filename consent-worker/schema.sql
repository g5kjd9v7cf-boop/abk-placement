-- Append-only consent / gate / view log (no UPDATE/DELETE in app code)
CREATE TABLE IF NOT EXISTS consent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  ts TEXT NOT NULL,
  document_version TEXT,
  locale_shown TEXT,
  layout TEXT,
  session_id TEXT,
  email TEXT,              -- null once PII_SECRET is configured (see email_hmac + encrypted payload_json)
  email_hmac TEXT,         -- deterministic HMAC-SHA256 of the email, for lookups without storing plaintext
  form_type TEXT,
  receipt_ref TEXT,
  user_agent TEXT,
  referrer TEXT,
  page TEXT,
  ip_hash TEXT,
  payload_json TEXT NOT NULL,  -- AES-256-GCM ciphertext ("v1:iv:ct") when PII_SECRET is set
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_consent_events_ts ON consent_events(ts);
CREATE INDEX IF NOT EXISTS idx_consent_events_session ON consent_events(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_events_receipt ON consent_events(receipt_ref);
CREATE INDEX IF NOT EXISTS idx_consent_events_email_hmac ON consent_events(email_hmac);

-- Existing databases created before email_hmac was added need a one-time
-- migration (SQLite has no ADD COLUMN IF NOT EXISTS; run once, ignore if it
-- already exists):
--   ALTER TABLE consent_events ADD COLUMN email_hmac TEXT;
--   CREATE INDEX IF NOT EXISTS idx_consent_events_email_hmac ON consent_events(email_hmac);
