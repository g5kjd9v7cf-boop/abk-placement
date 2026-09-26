-- Fresh install. Existing databases: run migrations/001_minimize.sql once.
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
