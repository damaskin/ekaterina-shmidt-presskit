import {
  getUser,
  listUsers,
  setAdmin,
  upsertUser,
} from './db.js';
import { sendTelegramMessage, userLabel } from './telegram.js';

function ownerId(env) {
  return String(env.TELEGRAM_OWNER_ID || env.TELEGRAM_CHAT_ID || '');
}

function isOwnerChat(chatId, env) {
  const owner = ownerId(env);
  return owner.length > 0 && String(chatId) === owner;
}

function parseCommand(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed.startsWith('/')) return null;
  const [raw, ...rest] = trimmed.split(/\s+/);
  const command = raw.split('@')[0].toLowerCase();
  return { command, args: rest };
}

function formatUserRow(user) {
  const roles = [];
  if (user.is_owner) roles.push('owner');
  else if (user.is_admin) roles.push('admin');
  else roles.push('user');
  return `• <code>${user.chat_id}</code> — ${userLabel(user)} [${roles.join(', ')}]`;
}

async function reply(env, chatId, text) {
  return sendTelegramMessage(env, chatId, text);
}

async function handleStart(env, chat) {
  const owner = isOwnerChat(chat.id, env);
  await upsertUser(env.DB, chat, { isAdmin: owner, isOwner: owner });
  const user = await getUser(env.DB, chat.id);

  if (owner) {
    return reply(
      env,
      chat.id,
      [
        '👋 <b>Вы владелец бота</b>',
        '',
        'Уведомления о букингах с сайта приходят всем <b>админам</b>.',
        '',
        'Команды:',
        '/users — все зарегистрированные',
        '/admins — список админов',
        '/promote &lt;chat_id&gt; — выдать админа',
        '/demote &lt;chat_id&gt; — снять админа',
        '/me — ваш статус',
      ].join('\n'),
    );
  }

  if (user?.is_admin) {
    return reply(
      env,
      chat.id,
      '✅ Вы админ. Уведомления о новых заявках с presskit будут приходить сюда.\n\n/me — статус',
    );
  }

  return reply(
    env,
    chat.id,
    [
      '👋 Вы зарегистрированы в боте presskit.',
      '',
      'Пока вы не админ — уведомления о букингах не приходят.',
      'Попросите владельца выдать права: /promote',
      '',
      `Ваш chat_id: <code>${chat.id}</code>`,
    ].join('\n'),
  );
}

async function handleMe(env, chatId) {
  const user = await getUser(env.DB, chatId);
  if (!user) {
    return reply(env, chatId, 'Сначала отправьте /start');
  }

  const role = user.is_owner ? 'владелец' : user.is_admin ? 'админ' : 'пользователь';
  return reply(
    env,
    chatId,
    [
      `<b>${userLabel(user)}</b>`,
      `chat_id: <code>${user.chat_id}</code>`,
      `роль: <b>${role}</b>`,
      `с: ${user.registered_at}`,
    ].join('\n'),
  );
}

async function handleUsers(env, chatId) {
  const users = await listUsers(env.DB);
  if (users.length === 0) {
    return reply(env, chatId, 'Пока никто не написал /start');
  }

  const chunks = [];
  let block = '<b>Пользователи</b>\n\n';
  for (const user of users) {
    const row = `${formatUserRow(user)}\n`;
    if (block.length + row.length > 3800) {
      chunks.push(block);
      block = '';
    }
    block += row;
  }
  chunks.push(block);
  for (const chunk of chunks) {
    await reply(env, chatId, chunk);
  }
}

async function handleAdmins(env, chatId) {
  const users = await listUsers(env.DB);
  const admins = users.filter((u) => u.is_admin);
  if (admins.length === 0) {
    return reply(env, chatId, 'Админов нет. Владелец: /start, затем /promote &lt;chat_id&gt;');
  }
  return reply(
    env,
    chatId,
    ['<b>Админы</b> (получают букинги)', '', ...admins.map(formatUserRow)].join('\n'),
  );
}

async function handlePromote(env, chatId, args) {
  const targetId = Number(args[0]);
  if (!Number.isFinite(targetId)) {
    return reply(env, chatId, 'Использование: /promote &lt;chat_id&gt;\n\nСписок id: /users');
  }

  const target = await getUser(env.DB, targetId);
  if (!target) {
    return reply(
      env,
      chatId,
      `Пользователь <code>${targetId}</code> не найден. Он должен сначала написать боту /start`,
    );
  }

  if (target.is_owner) {
    return reply(env, chatId, 'Владелец уже имеет все права');
  }

  const ok = await setAdmin(env.DB, targetId, true);
  if (!ok) {
    return reply(env, chatId, 'Не удалось назначить админа');
  }

  await reply(
    env,
    targetId,
    '✅ Вам выдали права <b>админа</b>. Теперь сюда будут приходить заявки с booking-формы presskit.',
  );
  return reply(env, chatId, `✅ ${userLabel(target)} (<code>${targetId}</code>) теперь админ`);
}

async function handleDemote(env, chatId, args) {
  const targetId = Number(args[0]);
  if (!Number.isFinite(targetId)) {
    return reply(env, chatId, 'Использование: /demote &lt;chat_id&gt;');
  }

  const target = await getUser(env.DB, targetId);
  if (!target) {
    return reply(env, chatId, `Пользователь <code>${targetId}</code> не найден`);
  }
  if (target.is_owner) {
    return reply(env, chatId, 'Нельзя снять права с владельца');
  }
  if (!target.is_admin) {
    return reply(env, chatId, 'Этот пользователь не админ');
  }

  await setAdmin(env.DB, targetId, false);
  await reply(env, targetId, 'ℹ️ Права админа сняты. Уведомления о букингах больше не приходят.');
  return reply(env, chatId, `✅ Сняты права админа у ${userLabel(target)} (<code>${targetId}</code>)`);
}

async function handleHelp(env, chatId) {
  const user = await getUser(env.DB, chatId);
  const lines = [
    '<b>Команды</b>',
    '/start — регистрация',
    '/me — ваш статус',
  ];

  if (user?.is_owner) {
    lines.push(
      '/users — все пользователи',
      '/admins — список админов',
      '/promote &lt;chat_id&gt; — выдать админа',
      '/demote &lt;chat_id&gt; — снять админа',
    );
  }

  return reply(env, chatId, lines.join('\n'));
}

export async function handleTelegramUpdate(env, update) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { status: 500, body: { error: 'Bot not configured' } };
  }

  const message = update.message ?? update.edited_message;
  if (!message?.chat || message.chat.type !== 'private') {
    return { status: 200, body: { ok: true, skipped: true } };
  }

  if (!env.DB) {
    if (message.text?.trim().startsWith('/')) {
      await reply(
        env,
        message.chat.id,
        '⚠️ База пользователей ещё не настроена. Владельцу: создать D1 и применить migrations.',
      );
    }
    return { status: 200, body: { ok: true, warning: 'no_db' } };
  }

  const chat = message.chat;
  const parsed = parseCommand(message.text);
  if (!parsed) {
    return { status: 200, body: { ok: true } };
  }

  const { command, args } = parsed;

  if (command === '/start') {
    await handleStart(env, chat);
    return { status: 200, body: { ok: true } };
  }

  const user = await getUser(env.DB, chat.id);
  if (!user && command !== '/help') {
    await reply(env, chat.id, 'Сначала отправьте /start');
    return { status: 200, body: { ok: true } };
  }

  switch (command) {
    case '/help':
      await handleHelp(env, chat.id);
      break;
    case '/me':
      await handleMe(env, chat.id);
      break;
    case '/users':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handleUsers(env, chat.id);
      break;
    case '/admins':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handleAdmins(env, chat.id);
      break;
    case '/promote':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handlePromote(env, chat.id, args);
      break;
    case '/demote':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handleDemote(env, chat.id, args);
      break;
    default:
      await reply(env, chat.id, 'Неизвестная команда. /help');
  }

  return { status: 200, body: { ok: true } };
}
