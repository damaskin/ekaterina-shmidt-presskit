import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  chat_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_owner INTEGER NOT NULL DEFAULT 0,
  is_blocked INTEGER NOT NULL DEFAULT 0,
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users (is_admin);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
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
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS guide_media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT,
  file_id TEXT,
  bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

let db;

export function getDb(dbPath) {
  if (db) return db;
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.exec(SCHEMA);
  try {
    db.exec(`ALTER TABLE users ADD COLUMN last_seen_at TEXT`);
  } catch {
    /* already exists */
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0`);
  } catch {
    /* already exists */
  }
  return db;
}

export function upsertUser(
  database,
  chat,
  { isAdmin = false, isOwner = false, touchVisit = false } = {},
) {
  database
    .prepare(
      `INSERT INTO users (chat_id, username, first_name, last_name, is_admin, is_owner, updated_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END)
       ON CONFLICT(chat_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         is_admin = CASE WHEN excluded.is_owner = 1 THEN 1 WHEN users.is_admin = 1 THEN 1 WHEN excluded.is_admin = 1 THEN 1 ELSE users.is_admin END,
         is_owner = CASE WHEN excluded.is_owner = 1 THEN 1 ELSE users.is_owner END,
         is_blocked = 0,
         updated_at = datetime('now'),
         last_seen_at = CASE WHEN ? = 1 THEN datetime('now') ELSE users.last_seen_at END`,
    )
    .run(
      chat.id,
      chat.username ?? null,
      chat.first_name ?? null,
      chat.last_name ?? null,
      isAdmin ? 1 : 0,
      isOwner ? 1 : 0,
      touchVisit ? 1 : 0,
      touchVisit ? 1 : 0,
    );
}

export function getUser(database, chatId) {
  return database
    .prepare(
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, registered_at, last_seen_at
       FROM users WHERE chat_id = ?`,
    )
    .get(chatId);
}

export function listUsers(database) {
  return database
    .prepare(
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, is_blocked, registered_at, last_seen_at
       FROM users ORDER BY registered_at ASC`,
    )
    .all();
}

/** Пользователи для админки: новые сверху, с лимитом. */
export function listUsersForAdmin(database, limit = 500) {
  return database
    .prepare(
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, is_blocked, registered_at, last_seen_at
       FROM users ORDER BY COALESCE(last_seen_at, registered_at) DESC LIMIT ?`,
    )
    .all(limit);
}

/* ── Аудитория для рассылок ─────────────────────────── */

export function setUserBlocked(database, chatId, blocked) {
  database
    .prepare(`UPDATE users SET is_blocked = ?, updated_at = datetime('now') WHERE chat_id = ?`)
    .run(blocked ? 1 : 0, chatId);
}

/** chat_id всех, кому можно слать рассылку (не заблокировали бота). */
export function listBroadcastRecipients(database) {
  return database
    .prepare(`SELECT chat_id FROM users WHERE is_blocked = 0 ORDER BY chat_id`)
    .all()
    .map((row) => row.chat_id);
}

export function audienceCounts(database) {
  const total = database.prepare(`SELECT COUNT(*) AS c FROM users`).get().c;
  const blocked = database.prepare(`SELECT COUNT(*) AS c FROM users WHERE is_blocked = 1`).get().c;
  return { total, reachable: total - blocked, blocked };
}

export function getAdminChatIds(database) {
  return database
    .prepare(`SELECT chat_id FROM users WHERE is_admin = 1 ORDER BY chat_id`)
    .all()
    .map((row) => row.chat_id);
}

export function setAdmin(database, chatId, isAdmin) {
  const result = database
    .prepare(
      `UPDATE users SET is_admin = ?, updated_at = datetime('now')
       WHERE chat_id = ? AND is_owner = 0`,
    )
    .run(isAdmin ? 1 : 0, chatId);
  return result.changes > 0;
}

export function setOwner(database, chatId, isOwner = true) {
  database
    .prepare(
      `UPDATE users SET is_owner = ?, is_admin = CASE WHEN ? = 1 THEN 1 ELSE is_admin END,
       updated_at = datetime('now') WHERE chat_id = ?`,
    )
    .run(isOwner ? 1 : 0, isOwner ? 1 : 0, chatId);
}

/* ── Покупки гайда ──────────────────────────────────── */

const PURCHASE_COLUMNS = `id, chat_id, product, email, payment_id, status, amount, currency, created_at, updated_at, paid_at, delivered_at`;

/** Активная незавершённая покупка (ждём email или оплату) для чата. */
export function getActivePurchase(database, chatId, product = 'guide_maldives') {
  return database
    .prepare(
      `SELECT ${PURCHASE_COLUMNS} FROM purchases
       WHERE chat_id = ? AND product = ? AND status IN ('awaiting_email', 'pending')
       ORDER BY id DESC LIMIT 1`,
    )
    .get(chatId, product);
}

/** Создаёт (или переиспользует) ряд покупки в статусе awaiting_email. */
export function startPurchase(database, chatId, product = 'guide_maldives') {
  const active = getActivePurchase(database, chatId, product);
  if (active) {
    database
      .prepare(
        `UPDATE purchases SET status = 'awaiting_email', payment_id = NULL,
         updated_at = datetime('now') WHERE id = ?`,
      )
      .run(active.id);
    return active.id;
  }
  const result = database
    .prepare(`INSERT INTO purchases (chat_id, product) VALUES (?, ?)`)
    .run(chatId, product);
  return result.lastInsertRowid;
}

export function setPurchaseEmail(database, id, email) {
  database
    .prepare(`UPDATE purchases SET email = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(email, id);
}

export function attachPayment(database, id, { paymentId, amount, currency = 'RUB' }) {
  database
    .prepare(
      `UPDATE purchases SET payment_id = ?, amount = ?, currency = ?, status = 'pending',
       updated_at = datetime('now') WHERE id = ?`,
    )
    .run(paymentId, amount, currency, id);
}

export function getPurchaseByPayment(database, paymentId) {
  return database
    .prepare(`SELECT ${PURCHASE_COLUMNS} FROM purchases WHERE payment_id = ?`)
    .get(paymentId);
}

export function getPurchaseById(database, id) {
  return database.prepare(`SELECT ${PURCHASE_COLUMNS} FROM purchases WHERE id = ?`).get(id);
}

export function markPurchasePaid(database, paymentId) {
  database
    .prepare(
      `UPDATE purchases SET status = 'paid', paid_at = COALESCE(paid_at, datetime('now')),
       updated_at = datetime('now') WHERE payment_id = ?`,
    )
    .run(paymentId);
}

export function markPurchaseDelivered(database, paymentId) {
  database
    .prepare(
      `UPDATE purchases SET status = 'delivered', delivered_at = datetime('now'),
       updated_at = datetime('now') WHERE payment_id = ?`,
    )
    .run(paymentId);
}

export function listPurchases(database, limit = 30) {
  return database
    .prepare(
      `SELECT ${PURCHASE_COLUMNS} FROM purchases
       WHERE status IN ('pending', 'paid', 'delivered')
       ORDER BY id DESC LIMIT ?`,
    )
    .all(limit);
}

/** Покупки для админки: опциональный фильтр по статусу. */
export function queryPurchases(database, { status, limit = 100 } = {}) {
  if (status) {
    return database
      .prepare(`SELECT ${PURCHASE_COLUMNS} FROM purchases WHERE status = ? ORDER BY id DESC LIMIT ?`)
      .all(status, limit);
  }
  return database
    .prepare(`SELECT ${PURCHASE_COLUMNS} FROM purchases ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

/** Сводка для дашборда: счётчики по статусам, выручка, конверсия. */
export function purchaseStats(database) {
  const byStatus = {};
  for (const row of database
    .prepare(`SELECT status, COUNT(*) AS c FROM purchases GROUP BY status`)
    .all()) {
    byStatus[row.status] = row.c;
  }
  const paid = database
    .prepare(
      `SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) AS revenue, COUNT(*) AS c
       FROM purchases WHERE status IN ('paid', 'delivered')`,
    )
    .get();
  const total = database.prepare(`SELECT COUNT(*) AS c FROM purchases`).get().c;
  return {
    total,
    paidCount: paid.c,
    revenue: paid.revenue,
    delivered: byStatus.delivered ?? 0,
    byStatus,
  };
}

/* ── Настройки (ключ-значение) ──────────────────────── */

export function getSetting(database, key) {
  const row = database.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row ? row.value : null;
}

/* ── Фото гайда ─────────────────────────────────────── */

export function insertMedia(database, { id, filename, mime, bytes }) {
  database
    .prepare(`INSERT INTO guide_media (id, filename, mime, bytes) VALUES (?, ?, ?, ?)`)
    .run(id, filename, mime ?? null, bytes ?? null);
}

export function listMedia(database) {
  return database
    .prepare(`SELECT id, filename, mime, bytes, created_at FROM guide_media ORDER BY created_at DESC`)
    .all();
}

export function getMedia(database, id) {
  return database
    .prepare(`SELECT id, filename, mime, file_id, bytes FROM guide_media WHERE id = ?`)
    .get(id);
}

export function deleteMedia(database, id) {
  database.prepare(`DELETE FROM guide_media WHERE id = ?`).run(id);
}

export function setMediaFileId(database, id, fileId) {
  database.prepare(`UPDATE guide_media SET file_id = ? WHERE id = ?`).run(fileId, id);
}

export function setSetting(database, key, value) {
  database
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .run(key, value == null ? null : String(value));
}

export function saveBooking(database, data) {
  const result = database
    .prepare(
      `INSERT INTO bookings (name, email, phone, event_date, venue, city, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.name.trim(),
      data.email.trim(),
      data.phone.trim(),
      data.eventDate.trim(),
      data.venue.trim(),
      data.city.trim(),
      data.message.trim(),
    );
  return result.lastInsertRowid;
}
