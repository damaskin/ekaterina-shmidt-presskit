import { isOwnerChat as checkOwnerChat, resolveUserRoles } from './admins.mjs';
import {
  getActivePurchase,
  getUser,
  listPurchases,
  listUsers,
  markPurchaseDelivered,
  setAdmin,
  setUserBlocked,
  upsertUser,
} from './db.mjs';
import { sendTelegramMessage, userLabel } from './telegram.mjs';
import { deliverGuide, handleGuideEmail, startGuideFlow } from './guide.mjs';

function isOwnerChat(chatId, env) {
  return checkOwnerChat(chatId, env, env.database);
}

/** Сохраняем любого, кто взаимодействует с ботом, — для будущих рассылок. */
function captureUser(env, chat) {
  if (!env.database) return;
  const roles = resolveUserRoles(chat, env, env.database);
  upsertUser(env.database, chat, {
    isAdmin: roles.isAdmin,
    isOwner: roles.isOwner,
    touchVisit: true,
  });
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
  const seen = user.last_seen_at ? ` · seen ${user.last_seen_at}` : '';
  return `• <code>${user.chat_id}</code> — ${userLabel(user)} [${roles.join(', ')}]${seen}`;
}

async function reply(env, chatId, text) {
  return sendTelegramMessage(env, chatId, text);
}

async function handleStart(env, chat) {
  const roles = resolveUserRoles(chat, env, env.database);
  await upsertUser(env.database, chat, {
    isAdmin: roles.isAdmin,
    isOwner: roles.isOwner,
  });
  const user = await getUser(env.database, chat.id);

  if (roles.isOwner) {
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
      [
        '✅ Вы админ. Уведомления о новых заявках с presskit будут приходить сюда.',
        '',
        `/me — статус`,
        `chat_id: <code>${chat.id}</code>`,
      ].join('\n'),
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
  const user = await getUser(env.database, chatId);
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
      user.last_seen_at ? `последний визит: ${user.last_seen_at}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

async function handleUsers(env, chatId) {
  const users = await listUsers(env.database);
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
  const users = await listUsers(env.database);
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

  const target = await getUser(env.database, targetId);
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

  const ok = await setAdmin(env.database, targetId, true);
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

  const target = await getUser(env.database, targetId);
  if (!target) {
    return reply(env, chatId, `Пользователь <code>${targetId}</code> не найден`);
  }
  if (target.is_owner) {
    return reply(env, chatId, 'Нельзя снять права с владельца');
  }
  if (!target.is_admin) {
    return reply(env, chatId, 'Этот пользователь не админ');
  }

  await setAdmin(env.database, targetId, false);
  await reply(env, targetId, 'ℹ️ Права админа сняты. Уведомления о букингах больше не приходят.');
  return reply(env, chatId, `✅ Сняты права админа у ${userLabel(target)} (<code>${targetId}</code>)`);
}

async function handleHelp(env, chatId) {
  const user = await getUser(env.database, chatId);
  const lines = [
    '<b>Команды</b>',
    '/start — регистрация',
    '/me — ваш статус',
    '/guide — купить гайд',
  ];

  if (user?.is_owner) {
    lines.push(
      '/users — все пользователи',
      '/admins — список админов',
      '/promote &lt;chat_id&gt; — выдать админа',
      '/demote &lt;chat_id&gt; — снять админа',
      '/sales — последние покупки гайда',
      '/sendguide &lt;chat_id&gt; — выслать гайд вручную',
    );
  }

  return reply(env, chatId, lines.join('\n'));
}

function isGuideTrigger(text) {
  const norm = (text ?? '').trim().toLowerCase().replace(/[«»"]/g, '');
  return ['гайд', 'guide', 'купить гайд', 'buy guide'].includes(norm);
}

/** Покупка гайда: deep-link ?start=guide, слово «ГАЙД», ввод email.
 * Пользователь уже сохранён в captureUser до вызова этой функции. */
async function maybeHandleGuidePurchase(env, chat, text, parsed) {
  if (parsed?.command === '/start' && parsed.args[0]?.toLowerCase() === 'guide') {
    await startGuideFlow(env, chat);
    return true;
  }

  if (parsed?.command === '/guide' || (!parsed && isGuideTrigger(text))) {
    await startGuideFlow(env, chat);
    return true;
  }

  if (!parsed) {
    const active = getActivePurchase(env.database, chat.id);
    if (active?.status === 'awaiting_email') {
      await handleGuideEmail(env, chat, text, active);
      return true;
    }
  }

  return false;
}

function formatPurchaseRow(p) {
  const when = p.paid_at || p.created_at;
  const mark = p.status === 'delivered' ? '✅' : p.status === 'paid' ? '💳' : '⏳';
  return `${mark} <code>${p.chat_id}</code> · ${p.amount ?? '—'} ${p.currency} · ${p.email ?? 'без email'} · ${when}`;
}

async function handleSales(env, chatId) {
  const rows = listPurchases(env.database, 30);
  if (rows.length === 0) {
    return reply(env, chatId, 'Покупок пока нет.');
  }
  return reply(
    env,
    chatId,
    ['<b>Последние покупки гайда</b>', '', ...rows.map(formatPurchaseRow)].join('\n'),
  );
}

async function handleSendGuide(env, chatId, args) {
  const targetId = Number(args[0]);
  if (!Number.isFinite(targetId)) {
    return reply(env, chatId, 'Использование: /sendguide &lt;chat_id&gt;');
  }
  const delivery = await deliverGuide(env, targetId);
  if (!delivery.ok) {
    return reply(
      env,
      chatId,
      `Не удалось доставить (${delivery.delivered} сообщений ушло). Покупатель должен сначала написать боту /start.`,
    );
  }
  const purchase = getActivePurchase(env.database, targetId);
  if (purchase?.payment_id) {
    markPurchaseDelivered(env.database, purchase.payment_id);
  }
  return reply(env, chatId, `✅ Гайд выслан в <code>${targetId}</code>.`);
}

export async function handleTelegramUpdate(env, update) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { status: 500, body: { error: 'Bot not configured' } };
  }

  // Пользователь заблокировал/разблокировал бота — обновляем достижимость.
  const memberUpdate = update.my_chat_member;
  if (memberUpdate?.chat?.type === 'private' && env.database) {
    captureUser(env, memberUpdate.chat);
    const status = memberUpdate.new_chat_member?.status;
    setUserBlocked(env.database, memberUpdate.chat.id, status === 'kicked' || status === 'left');
    return { status: 200, body: { ok: true } };
  }

  const message = update.message ?? update.edited_message;
  if (!message?.chat || message.chat.type !== 'private') {
    return { status: 200, body: { ok: true, skipped: true } };
  }

  if (!env.database) {
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
  const text = message.text ?? '';
  const parsed = parseCommand(text);

  // Сохраняем КАЖДОГО, кто пишет боту (для будущих рассылок), до любой логики.
  captureUser(env, chat);

  // Покупка гайда работает и для обычного текста («ГАЙД», email) — до early-return.
  if (await maybeHandleGuidePurchase(env, chat, text, parsed)) {
    return { status: 200, body: { ok: true } };
  }

  if (!parsed) {
    return { status: 200, body: { ok: true } };
  }

  const { command, args } = parsed;

  if (command === '/start') {
    await handleStart(env, chat);
    return { status: 200, body: { ok: true } };
  }

  const user = await getUser(env.database, chat.id);
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
    case '/sales':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handleSales(env, chat.id);
      break;
    case '/sendguide':
      if (!isOwnerChat(chat.id, env)) {
        await reply(env, chat.id, 'Только для владельца');
        break;
      }
      await handleSendGuide(env, chat.id, args);
      break;
    default:
      await reply(env, chat.id, 'Неизвестная команда. /help');
  }

  return { status: 200, body: { ok: true } };
}
