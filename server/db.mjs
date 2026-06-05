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
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, registered_at, last_seen_at
       FROM users ORDER BY registered_at ASC`,
    )
    .all();
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
