import { upsertUser } from './db.js';

function parseUser(body) {
  const id = Number(body?.id ?? body?.chat_id);
  if (!Number.isFinite(id) || id <= 0) {
    return { error: 'Invalid user id' };
  }

  return {
    chat: {
      id,
      username: body.username ? String(body.username).trim() : null,
      first_name: body.first_name ? String(body.first_name).trim() : null,
      last_name: body.last_name ? String(body.last_name).trim() : null,
    },
  };
}

export async function handleRegister(env, body) {
  if (!env.DB) {
    return { status: 503, body: { error: 'Database not configured' } };
  }

  const parsed = parseUser(body);
  if (parsed.error) {
    return { status: 400, body: { error: parsed.error } };
  }

  const ownerId = String(env.TELEGRAM_OWNER_ID || env.TELEGRAM_CHAT_ID || '');
  const isOwner =
    ownerId.length > 0 && String(parsed.chat.id) === ownerId;

  await upsertUser(env.DB, parsed.chat, {
    isAdmin: isOwner,
    isOwner,
    touchVisit: true,
  });

  return { status: 200, body: { ok: true } };
}
