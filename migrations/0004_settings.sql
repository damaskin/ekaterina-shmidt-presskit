-- Настройки, редактируемые из админ-панели (цена, вкл/выкл продаж, текст гайда).
-- Хранилище ключ-значение; типизация — на стороне приложения (server/settings.mjs).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
