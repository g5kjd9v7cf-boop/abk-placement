-- 24-month talent pool: encrypted contact email on applications.
-- Run once on a database that already has the applications table from 002.
-- Does not add a plaintext email column and does not add an IP column.
-- SQLite rejects a second ADD COLUMN for the same name; do not run this twice.

ALTER TABLE applications ADD COLUMN contact_email_iv TEXT;
ALTER TABLE applications ADD COLUMN contact_email_ciphertext TEXT;
