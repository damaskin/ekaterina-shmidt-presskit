import { resolveUserRoles } from './admins.mjs';
import { upsertUser } from './db.mjs';

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
  const parsed = parseUser(body);
  if (parsed.error) {
    return { status: 400, body: { error: parsed.error } };
  }

  const roles = resolveUserRoles(parsed.chat, env);

  upsertUser(env.database, parsed.chat, {
    isAdmin: roles.isAdmin,
    isOwner: roles.isOwner,
    touchVisit: true,
  });

  return { status: 200, body: { ok: true } };
}
