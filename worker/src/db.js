export async function upsertUser(db, chat, { isAdmin = false, isOwner = false } = {}) {
  const chatId = chat.id;
  await db
    .prepare(
      `INSERT INTO users (chat_id, username, first_name, last_name, is_admin, is_owner, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(chat_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         is_admin = CASE WHEN excluded.is_owner = 1 THEN 1 WHEN users.is_admin = 1 THEN 1 WHEN excluded.is_admin = 1 THEN 1 ELSE users.is_admin END,
         is_owner = CASE WHEN excluded.is_owner = 1 THEN 1 ELSE users.is_owner END,
         updated_at = datetime('now')`,
    )
    .bind(
      chatId,
      chat.username ?? null,
      chat.first_name ?? null,
      chat.last_name ?? null,
      isAdmin ? 1 : 0,
      isOwner ? 1 : 0,
    )
    .run();
}

export async function getUser(db, chatId) {
  return db
    .prepare(
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, registered_at
       FROM users WHERE chat_id = ?`,
    )
    .bind(chatId)
    .first();
}

export async function listUsers(db) {
  const { results } = await db
    .prepare(
      `SELECT chat_id, username, first_name, last_name, is_admin, is_owner, registered_at
       FROM users ORDER BY registered_at ASC`,
    )
    .all();
  return results ?? [];
}

export async function getAdminChatIds(db) {
  const { results } = await db
    .prepare(`SELECT chat_id FROM users WHERE is_admin = 1 ORDER BY chat_id`)
    .all();
  return (results ?? []).map((row) => row.chat_id);
}

export async function setAdmin(db, chatId, isAdmin) {
  const result = await db
    .prepare(
      `UPDATE users SET is_admin = ?, updated_at = datetime('now')
       WHERE chat_id = ? AND is_owner = 0`,
    )
    .bind(isAdmin ? 1 : 0, chatId)
    .run();
  return result.meta.changes > 0;
}

export async function saveBooking(db, data) {
  const result = await db
    .prepare(
      `INSERT INTO bookings (name, email, phone, event_date, venue, city, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.name.trim(),
      data.email.trim(),
      data.phone.trim(),
      data.eventDate.trim(),
      data.venue.trim(),
      data.city.trim(),
      data.message.trim(),
    )
    .run();
  return result.meta.last_row_id;
}
