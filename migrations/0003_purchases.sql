-- Покупки гайда через ЮKassa. Один ряд на попытку покупки.
-- status: awaiting_email → pending → paid → delivered (или canceled)
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  product TEXT NOT NULL DEFAULT 'guide_maldives',
  email TEXT,
  payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'awaiting_email',
  amount TEXT,
  currency TEXT NOT NULL DEFAULT 'RUB',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_purchases_chat ON purchases (chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment ON purchases (payment_id);
