import Database from 'better-sqlite3';

const dbPath = process.argv[2] || '/data/booking.sqlite';
const db = new Database(dbPath);
const users = db
  .prepare(
    `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, registered_at, last_seen_at
     FROM users ORDER BY registered_at`,
  )
  .all();
console.log(JSON.stringify(users, null, 2));
