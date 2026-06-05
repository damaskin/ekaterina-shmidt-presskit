function parseList(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
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

export function resolveUserRoles(chat, env) {
  const owner = isOwnerChat(chat.id, env);
  const autoAdmin = isAutoAdmin(chat, env);

  return {
    isOwner: owner,
    isAdmin: owner || autoAdmin,
  };
}

function isOwnerChat(chatId, env) {
  const owner = String(env.TELEGRAM_OWNER_ID || env.TELEGRAM_CHAT_ID || '');
  return owner.length > 0 && String(chatId) === owner;
}
