-- Append-only consent / gate / view log (no UPDATE/DELETE in app code)
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
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_consent_events_ts ON consent_events(ts);
CREATE INDEX IF NOT EXISTS idx_consent_events_session ON consent_events(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_events_receipt ON consent_events(receipt_ref);
