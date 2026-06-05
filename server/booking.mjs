import { getAdminChatIds, saveBooking } from './db.mjs';
import { formatBookingMessage, notifyRecipients } from './telegram.mjs';

function validateBody(body) {
  const required = [
    'name',
    'email',
    'phone',
    'eventDate',
    'venue',
    'city',
    'message',
  ];
  for (const key of required) {
    if (!body?.[key] || !String(body[key]).trim()) {
      return `Missing field: ${key}`;
    }
  }
  const email = String(body.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email';
  }
  const phoneDigits = String(body.phone).replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return 'Invalid phone';
  }
  return null;
}

async function resolveRecipientIds(env) {
  if (env.database) {
    try {
      const adminIds = await getAdminChatIds(env.database);
      if (adminIds.length > 0) return adminIds;
    } catch (err) {
      console.error('admin lookup failed', err);
    }
  }
  return env.TELEGRAM_CHAT_ID ? [Number(env.TELEGRAM_CHAT_ID)] : [];
}

export async function handleBooking(_request, env, readJson) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { status: 500, body: { error: 'Server not configured' } };
  }

  let body;
  try {
    body = await readJson(_request);
  } catch {
    return { status: 400, body: { error: 'Invalid JSON' } };
  }

  const validationError = validateBody(body);
  if (validationError) {
    return { status: 400, body: { error: validationError } };
  }

  if (env.database) {
    try {
      await saveBooking(env.database, body);
    } catch (err) {
      console.error('booking save failed', err);
    }
  }

  const recipients = await resolveRecipientIds(env);
  if (recipients.length === 0) {
    return { status: 500, body: { error: 'No notification recipients configured' } };
  }

  const text = formatBookingMessage(body);
  const delivery = await notifyRecipients(env, recipients, text);

  if (!delivery.ok) {
    console.error('Telegram delivery failed', delivery.errors);
    return { status: 502, body: { error: 'Telegram delivery failed' } };
  }

  return {
    status: 200,
    body: { ok: true, notified: delivery.delivered },
  };
}
