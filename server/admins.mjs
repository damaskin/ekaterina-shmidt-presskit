import { getUser } from './db.mjs';

function parseIdList(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseList(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

export function ownerIds(env) {
  const ids = new Set(parseIdList(env.TELEGRAM_OWNER_ID));
  for (const id of parseIdList(env.TELEGRAM_CHAT_ID)) ids.add(id);
  return ids;
}

export function isOwnerInEnv(chatId, env) {
  return ownerIds(env).has(String(chatId));
}

export function isOwnerChat(chatId, env, database) {
  if (isOwnerInEnv(chatId, env)) return true;
  if (!database) return false;
  const user = getUser(database, chatId);
  return Boolean(user?.is_owner);
}

export function autoAdminUsernames(env) {
  const fromEnv = parseList(env.TELEGRAM_AUTO_ADMIN_USERNAMES);
  return new Set([...fromEnv, 'shmidt01']);
}

export function autoAdminIds(env) {
  return new Set(
    parseList(env.TELEGRAM_AUTO_ADMIN_IDS).map((id) => Number(id)).filter(Number.isFinite),
  );
}

export function isAutoAdmin(chat, env) {
  const username = String(chat.username ?? '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  if (username && autoAdminUsernames(env).has(username)) {
    return true;
  }

  return autoAdminIds(env).has(Number(chat.id));
}

export function resolveUserRoles(chat, env, database) {
  const existing = database ? getUser(database, chat.id) : null;
  const isOwner = isOwnerInEnv(chat.id, env) || Boolean(existing?.is_owner);
  const autoAdmin = isAutoAdmin(chat, env);

  return {
    isOwner,
    isAdmin: isOwner || autoAdmin || Boolean(existing?.is_admin),
  };
}
