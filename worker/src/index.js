const ALLOWED_ORIGINS = [
  'https://damaskin.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') ?? '';
  const allow =
    ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function line(label, value) {
  if (!value || !String(value).trim()) return '';
  return `\n${label}: <b>${escapeHtml(String(value).trim())}</b>`;
}

function formatTelegramMessage(data) {
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
      : '',
    '',
    `🕐 <i>Отправлено: ${escapeHtml(sentAt)} (MSK)</i>`,
    '🔗 <i>DJ Presskit · Booking</i>',
  ]
    .filter(Boolean)
    .join('');
}

function validateBody(body) {
  const required = ['name', 'email', 'eventDate', 'venue'];
  for (const key of required) {
    if (!body?.[key] || !String(body[key]).trim()) {
      return `Missing field: ${key}`;
    }
  }
  const email = String(body.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email';
  }
  return null;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, cors);
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ error: 'Server not configured' }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    const validationError = validateBody(body);
    if (validationError) {
      return json({ error: validationError }, 400, cors);
    }

    const text = formatTelegramMessage(body);

    try {
      const tgResponse = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );

      const tgResult = await tgResponse.json();
      if (!tgResult.ok) {
        console.error('Telegram API error', tgResult);
        return json({ error: 'Telegram delivery failed' }, 502, cors);
      }

      return json({ ok: true }, 200, cors);
    } catch (err) {
      console.error(err);
      return json({ error: 'Server error' }, 500, cors);
    }
  },
};
