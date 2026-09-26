-- Ops Room: shared coordination space for multi-agent operations.

CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',   -- open | closed
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',    -- orchestrator | agent | human | system
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (operation_id, name)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  kind TEXT NOT NULL DEFAULT 'msg',      -- msg | status | task | result | system
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_op ON messages(operation_id, id);
CREATE INDEX IF NOT EXISTS idx_participants_op ON participants(operation_id);
