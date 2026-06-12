export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function line(label, value) {
  if (!value || !String(value).trim()) return '';
  return `\n${label}: <b>${escapeHtml(String(value).trim())}</b>`;
}

export function formatBookingMessage(data) {
  const sentAt = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return [
    '🎧 <b>Новая заявка — Ekaterina Shmidt</b>',
    '━━━━━━━━━━━━━━━━━━',
    line('👤 Имя', data.name),
    line('📧 Email', data.email),
    line('📱 Телефон', data.phone),
    line('📅 Дата события', data.eventDate),
    line('📍 Площадка', data.venue),
    line('🏙 Город', data.city),
    data.message?.trim()
      ? `\n💬 <b>Сообщение:</b>\n<i>${escapeHtml(data.message.trim())}</i>`
      : ''
    ,
    '',
    `🕐 <i>Отправлено: ${escapeHtml(sentAt)} (MSK)</i>`,
    '🔗 <i>shmidt01.ru · Booking</i>',
  ]
    .filter(Boolean)
    .join('');
}

export async function sendTelegramMessage(env, chatId, text, extra = {}) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      }),
    },
  );
  return response.json();
}

/**
 * Отправка фото. По fileId — JSON (без повторной загрузки), иначе multipart с буфером.
 * Возвращает ответ Telegram (в т.ч. result.photo[].file_id для кэша).
 */
export async function sendTelegramPhoto(env, chatId, { buffer, fileId, filename, mime, caption, protect_content = false }) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

  if (fileId) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fileId,
        caption: caption || undefined,
        parse_mode: caption ? 'HTML' : undefined,
        protect_content,
      }),
    });
    return response.json();
  }

  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) {
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
  }
  if (protect_content) form.append('protect_content', 'true');
  form.append('photo', new Blob([buffer], { type: mime || 'image/jpeg' }), filename || 'photo.jpg');

  const response = await fetch(url, { method: 'POST', body: form });
  return response.json();
}

export async function notifyRecipients(env, chatIds, text) {
  const unique = [...new Set(chatIds.filter(Boolean))];
  if (unique.length === 0) return { ok: false, delivered: 0, errors: ['no recipients'] };

  const results = await Promise.allSettled(
    unique.map((chatId) => sendTelegramMessage(env, chatId, text)),
  );

  let delivered = 0;
  const errors = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.ok) delivered += 1;
    else if (result.status === 'fulfilled') errors.push(result.value?.description ?? 'Telegram error');
    else errors.push(String(result.reason));
  }

  return { ok: delivered > 0, delivered, errors };
}

export function userLabel(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (user.username) return `@${user.username}`;
  return `id ${user.chat_id}`;
}
