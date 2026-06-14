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

/**
 * Проверяет подпись Telegram Mini App initData (другая схема, чем у Login Widget).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Возвращает распарсенного пользователя или null.
 */
function verifyTmaInitData(botToken, initData) {
  if (typeof initData !== 'string' || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params.entries()]
    .map(([k, v]) => [k, v])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (expected !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (!Number.isFinite(age) || age < 0 || age > AUTH_MAX_AGE_SEC) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
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

  let user = null;
  if (typeof body?.tma_init_data === 'string' && body.tma_init_data) {
    user = verifyTmaInitData(env.TELEGRAM_BOT_TOKEN, body.tma_init_data);
    if (!user?.id) {
      return { status: 401, body: { error: 'Неверная подпись Telegram Mini App.' } };
    }
  } else {
    const tgAuth = body?.tg_auth;
    if (!tgAuth?.id || !tgAuth?.hash) {
      return { status: 400, body: { error: 'Требуется авторизация через Telegram' } };
    }
    if (!verifyTelegramHash(env.TELEGRAM_BOT_TOKEN, tgAuth)) {
      return { status: 401, body: { error: 'Неверная подпись Telegram. Попробуйте войти заново.' } };
    }
    user = tgAuth;
  }

  const chatId = Number(user.id);
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
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      username: user.username ?? null,
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
