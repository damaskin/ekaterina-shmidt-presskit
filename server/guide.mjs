/**
 * Флоу покупки гайда и доставка.
 * 1) startGuideFlow — старт (deep-link ?start=guide или слово «ГАЙД»): спросить email.
 * 2) handleGuideEmail — получили email → создать платёж ЮKassa → прислать ссылку.
 * 3) deliverGuide — после успешной оплаты отправить гайд защищёнными сообщениями.
 */
import {
  attachPayment,
  getActivePurchase,
  getMedia,
  listUsers,
  setMediaFileId,
  setPurchaseEmail,
  startPurchase,
} from './db.mjs';
import { sendTelegramMessage, sendTelegramPhoto, userLabel } from './telegram.mjs';
import { readMediaFile } from './media.mjs';
import { createPayment, isYookassaConfigured } from './yookassa.mjs';
import { GUIDE_TITLE } from './guide-content.mjs';
import {
  getGuideChunks,
  getGuidePriceRub,
  guideRequiresEmail,
  isSalesEnabled,
} from './settings.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function priceRub(env) {
  return getGuidePriceRub(env.database, env);
}

function priceLabel(env) {
  return `${priceRub(env).toLocaleString('ru-RU')} ₽`;
}

/** Чек 54-ФЗ требует email; можно отключить (настройка/GUIDE_REQUIRE_EMAIL=false). */
function requiresEmail(env) {
  return guideRequiresEmail(env.database, env);
}

async function reply(env, chatId, text, extra) {
  return sendTelegramMessage(env, chatId, text, extra);
}

function ownerNoteContact() {
  return 'Если что-то пойдёт не так — напишите @shmidt01.';
}

/** Старт покупки. Возвращает true, если обработали. */
export async function startGuideFlow(env, chat) {
  if (!isSalesEnabled(env.database)) {
    await reply(
      env,
      chat.id,
      'ℹ️ Продажа гайда сейчас на паузе. Напишите @shmidt01 — подскажу, когда откроем.',
    );
    return true;
  }

  if (!isYookassaConfigured(env)) {
    await reply(
      env,
      chat.id,
      '⚠️ Оплата пока настраивается. Напишите @shmidt01 — отправлю гайд вручную.',
    );
    return true;
  }

  const purchaseId = startPurchase(env.database, chat.id);

  if (requiresEmail(env)) {
    await reply(
      env,
      chat.id,
      [
        `🌴 <b>${GUIDE_TITLE}</b>`,
        `Цена — <b>${priceLabel(env)}</b>.`,
        '',
        'Для чека по 54-ФЗ нужен ваш <b>email</b> — отправьте его одним сообщением, и я пришлю ссылку на оплату.',
      ].join('\n'),
    );
    return true;
  }

  await createAndSendInvoice(env, chat.id, purchaseId, null);
  return true;
}

/** Пользователь прислал email в статусе awaiting_email. */
export async function handleGuideEmail(env, chat, text, purchase) {
  const email = String(text).trim();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    await reply(
      env,
      chat.id,
      '✉️ Это не похоже на email. Пришлите адрес в формате <code>name@example.com</code> — на него придёт чек.',
    );
    return true;
  }

  setPurchaseEmail(env.database, purchase.id, email);
  await createAndSendInvoice(env, chat.id, purchase.id, email);
  return true;
}

async function createAndSendInvoice(env, chatId, purchaseId, email) {
  try {
    const payment = await createPayment(env, {
      amountValue: priceRub(env),
      description: GUIDE_TITLE,
      metadata: { chat_id: String(chatId), purchase_id: String(purchaseId) },
      email,
    });

    if (!payment.confirmationUrl) {
      throw new Error('no confirmation_url in YooKassa response');
    }

    attachPayment(env.database, purchaseId, {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });

    await reply(
      env,
      chatId,
      [
        `Готово! Нажмите кнопку и оплатите <b>${priceLabel(env)}</b>.`,
        '',
        'Сразу после оплаты гайд придёт сюда, в этот чат. Переслать или скопировать его будет нельзя — это ваша личная копия.',
      ].join('\n'),
      {
        reply_markup: {
          inline_keyboard: [[{ text: `Оплатить ${priceLabel(env)}`, url: payment.confirmationUrl }]],
        },
      },
    );
  } catch (err) {
    console.error('createAndSendInvoice failed', err);
    await reply(
      env,
      chatId,
      `⚠️ Не получилось создать оплату. ${ownerNoteContact()}`,
    );
  }
}

/**
 * Доставка гайда защищёнными сообщениями (protect_content).
 * Возвращает { ok, delivered }.
 */
// Блок-фото: [[photo:<id>]] на отдельной строке, остаток блока — подпись.
const PHOTO_BLOCK_RE = /^\[\[photo:([a-z0-9]+)\]\]\s*([\s\S]*)$/i;
const TG_CAPTION_LIMIT = 1024;

/** Доставка фото-блока. Возвращает 'sent' | 'skip' (нет файла/Telegram отверг) | 'blocked' (403). */
async function deliverPhotoBlock(env, chatId, mediaId, caption) {
  const media = getMedia(env.database, mediaId);
  if (!media) return 'skip'; // фото удалили — пропускаем, не валим весь гайд

  const longCaption = caption.length > TG_CAPTION_LIMIT;
  const cap = longCaption ? '' : caption;

  let res = null;
  if (media.file_id) {
    res = await sendTelegramPhoto(env, chatId, { fileId: media.file_id, caption: cap, protect_content: true });
  }
  if (!res?.ok) {
    const buffer = readMediaFile(env, media.filename);
    if (!buffer) return 'skip';
    res = await sendTelegramPhoto(env, chatId, {
      buffer,
      filename: media.filename,
      mime: media.mime,
      caption: cap,
      protect_content: true,
    });
    if (res?.ok) {
      const fileId = res.result?.photo?.at(-1)?.file_id;
      if (fileId) setMediaFileId(env.database, mediaId, fileId);
    }
  }
  if (!res?.ok) {
    if (res?.error_code === 403) return 'blocked'; // получатель заблокировал бота
    console.error('guide photo rejected by Telegram', mediaId, res?.error_code, res?.description);
    return 'skip'; // слишком большое/битое фото — пропускаем, гайд не валим
  }

  // Подпись длиннее лимита Telegram — досылаем отдельным защищённым сообщением.
  if (longCaption) {
    await sendTelegramMessage(env, chatId, caption, {
      protect_content: true,
      disable_web_page_preview: true,
    });
  }
  return 'sent';
}

export async function deliverGuide(env, chatId) {
  let delivered = 0;
  let blocked = false;

  for (const chunk of getGuideChunks(env.database)) {
    const photo = chunk.match(PHOTO_BLOCK_RE);
    if (photo) {
      const outcome = await deliverPhotoBlock(env, chatId, photo[1], photo[2].trim());
      if (outcome === 'sent') delivered += 1;
      else if (outcome === 'blocked') {
        blocked = true;
        break;
      }
      // 'skip' (удалённое/битое фото) — идём дальше, не прерывая весь гайд
      continue;
    }

    let res = await sendTelegramMessage(env, chatId, chunk, {
      protect_content: true,
      disable_web_page_preview: true,
    });
    // Telegram не смог разобрать HTML (незакрытый тег, голые < или &) → шлём
    // блок обычным текстом, чтобы он не потерялся и не оборвал доставку.
    if (!res?.ok && res?.error_code === 400) {
      console.error('guide chunk HTML parse failed, retry as plain text', res?.description);
      res = await sendTelegramMessage(env, chatId, chunk, {
        protect_content: true,
        disable_web_page_preview: true,
        parse_mode: undefined,
      });
    }

    if (res?.ok) {
      delivered += 1;
    } else if (res?.error_code === 403) {
      blocked = true; // получатель заблокировал бота — дальше слать некому
      break;
    } else {
      // прочую ошибку конкретного блока логируем и продолжаем, а не валим весь гайд
      console.error('guide chunk delivery failed', res?.error_code, res?.description);
    }
  }

  if (delivered > 0 && !blocked) {
    await sendTelegramMessage(
      env,
      chatId,
      '✅ Это весь гайд. Спасибо за покупку — и удачи на кастинге! По вопросам пишите @shmidt01.',
      { protect_content: true },
    );
  }

  return { ok: delivered > 0 && !blocked, delivered };
}

/** Уведомить админов/владельца о продаже. */
export async function notifyAdminsAboutSale(env, purchase) {
  let recipients = [];
  try {
    recipients = listUsers(env.database)
      .filter((u) => u.is_admin)
      .map((u) => u.chat_id);
  } catch {
    /* ignore */
  }
  if (recipients.length === 0 && env.TELEGRAM_CHAT_ID) {
    recipients = [Number(env.TELEGRAM_CHAT_ID)];
  }

  const buyer = (() => {
    try {
      const user = listUsers(env.database).find((u) => u.chat_id === purchase.chat_id);
      return user ? userLabel(user) : `id ${purchase.chat_id}`;
    } catch {
      return `id ${purchase.chat_id}`;
    }
  })();

  const text = [
    '💸 <b>Продажа гайда</b>',
    `Покупатель: ${buyer} (<code>${purchase.chat_id}</code>)`,
    purchase.email ? `Email: ${purchase.email}` : '',
    `Сумма: ${purchase.amount ?? '—'} ${purchase.currency ?? ''}`,
    'Гайд доставлен автоматически.',
  ]
    .filter(Boolean)
    .join('\n');

  for (const chatId of new Set(recipients)) {
    await sendTelegramMessage(env, chatId, text);
  }
}

export { priceLabel };
