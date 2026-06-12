-- Фото для гайда. Файлы лежат в /data/guide-media/, в таблице — метаданные.
-- file_id — кэш Telegram (после первой отправки, чтобы не загружать повторно).
CREATE TABLE IF NOT EXISTS guide_media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT,
  file_id TEXT,
  bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
