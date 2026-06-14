/**
 * POST /guide-buy — создание покупки через браузер.
 * Клиент авторизуется через Telegram Login Widget, сервер верифицирует подпись,
 * создаёт платёж ЮKassa и возвращает ссылку для редиректа.
 * После payment.succeeded бот доставит гайд на chat_id покупателя.
 */
import { createHash, createHmac } from 'node:crypto';
import { attachPayment, setPurchaseEmail, startPurchase, upsertUser } from './db.mjs';
import { GUIDE_TITLE } from './guide-content.mjs';
import { createPayment, isYookassaConfigured } from './yookassa.mjs';
import { getGuidePriceRub, guideRequiresEmail, isSalesEnabled } from './settings.mjs';

const AUTH_MAX_AGE_SEC = 86400; // 24 часа

/**
 * Проверяет подпись Telegram Login Widget.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramHash(botToken, data) {
  const { hash, ...fields } = data;
  if (!hash) return false;

  const checkString = Object.keys(fields)
    .filter((k) => fields[k] != null && fields[k] !== '')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (expected !== hash) return false;

  const age = Math.floor(Date.now() / 1000) - Number(fields.auth_date);
  return age >= 0 && age <= AUTH_MAX_AGE_SEC;
}

export async function handleGuideBuy(env, body) {
  if (!env.database) {
    return { status: 503, body: { error: 'База данных недоступна' } };
  }
  if (!isSalesEnabled(env.database)) {
    return { status: 403, body: { error: 'Продажа гайда временно приостановлена. Напишите @shmidt01.' } };
  }
  if (!isYookassaConfigured(env)) {
    return { status: 503, body: { error: 'Оплата временно недоступна. Напишите @shmidt01.' } };
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { status: 503, body: { error: 'Bot not configured' } };
  }

  const tgAuth = body?.tg_auth;
  if (!tgAuth?.id || !tgAuth?.hash) {
    return { status: 400, body: { error: 'Требуется авторизация через Telegram' } };
  }
  if (!verifyTelegramHash(env.TELEGRAM_BOT_TOKEN, tgAuth)) {
    return { status: 401, body: { error: 'Неверная подпись Telegram. Попробуйте войти заново.' } };
  }

  const chatId = Number(tgAuth.id);
  const requireEmail = guideRequiresEmail(env.database, env);
  const email = typeof body?.email === 'string' ? body.email.trim() : null;

  if (requireEmail && !email) {
    return { status: 400, body: { code: 'email_required', error: 'Введите email для чека' } };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { status: 400, body: { error: 'Некорректный email' } };
  }

  upsertUser(
    env.database,
    {
      id: chatId,
      first_name: tgAuth.first_name ?? null,
      last_name: tgAuth.last_name ?? null,
      username: tgAuth.username ?? null,
    },
    { touchVisit: true },
  );

  const purchaseId = startPurchase(env.database, chatId);
  if (email) setPurchaseEmail(env.database, purchaseId, email);

  const priceRub = getGuidePriceRub(env.database, env);

  let payment;
  try {
    payment = await createPayment(env, {
      amountValue: priceRub,
      description: GUIDE_TITLE,
      metadata: { chat_id: String(chatId), purchase_id: String(purchaseId) },
      email: requireEmail ? email : null,
    });
  } catch (err) {
    console.error('guide-buy createPayment failed', err);
    return { status: 502, body: { error: 'Не удалось создать платёж. Попробуйте позже.' } };
  }

  attachPayment(env.database, purchaseId, {
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
  });

  return { status: 200, body: { ok: true, confirmationUrl: payment.confirmationUrl } };
}
