import Database from 'better-sqlite3';

const chatId = Number(process.argv[2]);
const dbPath = process.argv[3] || '/data/booking.sqlite';

if (!Number.isFinite(chatId)) {
  console.error('Usage: node promote-user.mjs <chat_id> [db_path]');
  process.exit(1);
}

const db = new Database(dbPath);
const user = db
  .prepare(`SELECT chat_id, username, is_admin, is_owner FROM users WHERE chat_id = ?`)
  .get(chatId);

if (!user) {
  console.error(`User ${chatId} not found`);
  process.exit(1);
}

db.prepare(
  `UPDATE users SET is_admin = 1, updated_at = datetime('now') WHERE chat_id = ? AND is_owner = 0`,
).run(chatId);

const updated = db
  .prepare(`SELECT chat_id, username, first_name, is_admin, is_owner FROM users WHERE chat_id = ?`)
  .get(chatId);

console.log(JSON.stringify(updated, null, 2));
