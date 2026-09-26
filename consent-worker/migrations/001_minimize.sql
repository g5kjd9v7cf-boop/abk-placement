-- Additive migration for an existing meda-consent D1 database.
-- Run once. A second run fails when a column already exists; stop there.
-- Does not DROP columns and does not delete rows.
-- npx wrangler d1 execute meda-consent --remote --file=./migrations/001_minimize.sql

ALTER TABLE consent_events ADD COLUMN consent_contact INTEGER;
ALTER TABLE consent_events ADD COLUMN consent_share INTEGER;
ALTER TABLE consent_events ADD COLUMN consent_pool INTEGER;
ALTER TABLE consent_events ADD COLUMN withdrawn INTEGER NOT NULL DEFAULT 0;
ALTER TABLE consent_events ADD COLUMN withdrawn_at TEXT;

CREATE INDEX IF NOT EXISTS idx_consent_events_receipt ON consent_events(receipt_ref);
