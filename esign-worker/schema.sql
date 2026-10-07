-- SignRecord scaffold. Not applied. binding is always 0 / ENTWURF until counsel clears a later migration.
CREATE TABLE IF NOT EXISTS sign_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_id TEXT NOT NULL UNIQUE,
  party_type TEXT NOT NULL,
  public_token TEXT,
  clause_pack_id TEXT NOT NULL,
  clause_pack_version TEXT,
  content_sha256 TEXT,
  checkbox_map TEXT NOT NULL,
  signer_display_name TEXT NOT NULL,
  signature_r2_key TEXT,
  ip TEXT,
  user_agent TEXT,
  signed_at TEXT NOT NULL,
  binding INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ENTWURF',
  created_at TEXT NOT NULL
);
