CREATE TABLE IF NOT EXISTS user_memory (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  channel_id  TEXT NOT NULL,
  fact        TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel_id, fact)
);

CREATE INDEX IF NOT EXISTS idx_user_channel
  ON user_memory(user_id, channel_id);

CREATE TABLE IF NOT EXISTS channel_model_overrides (
  channel_id  TEXT PRIMARY KEY,
  model       TEXT NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
