/**
 * Webhook ЮKassa. Тело уведомления не доверяем — перепроверяем платёж через API.
 * URL на сервере: POST /api/payments/yookassa (nginx срезает /api → /payments/yookassa).
 * Настраивается в кабинете ЮKassa: HTTP-уведомления → событие payment.succeeded.
 */
import {
  getPurchaseByPayment,
  markPurchaseDelivered,
  markPurchasePaid,
} from './db.mjs';
import { getPayment, isYookassaConfigured } from './yookassa.mjs';
import { deliverGuide, notifyAdminsAboutSale } from './guide.mjs';

export async function handleYookassaWebhook(env, body) {
  if (!isYookassaConfigured(env) || !env.database) {
    return { status: 503, body: { error: 'not configured' } };
  }

  const event = body?.event;
  const paymentId = body?.object?.id;

  if (!paymentId) {
    return { status: 400, body: { error: 'no payment id' } };
  }

  // Реагируем только на успешную оплату; на остальные события — тихий 200.
  if (event !== 'payment.succeeded') {
    return { status: 200, body: { ok: true, ignored: event ?? 'unknown' } };
  }

  // Перепроверяем у ЮKassa — тело вебхука не является доказательством оплаты.
  let payment;
  try {
    payment = await getPayment(env, paymentId);
  } catch (err) {
    console.error('yookassa verify failed', err);
    return { status: 502, body: { error: 'verify failed' } }; // ЮKassa повторит
  }

  if (payment?.status !== 'succeeded') {
    return { status: 200, body: { ok: true, status: payment?.status } };
  }

  const purchase = getPurchaseByPayment(env.database, paymentId);
  if (!purchase) {
    console.error('yookassa: paid but purchase not found', paymentId);
    return { status: 200, body: { ok: true, unknown: true } };
  }

  // Идемпотентность: уже доставлено — выходим.
  if (purchase.delivered_at) {
    return { status: 200, body: { ok: true, already: true } };
  }

  markPurchasePaid(env.database, paymentId);

  const delivery = await deliverGuide(env, purchase.chat_id);
  if (!delivery.ok) {
    // Не помечаем delivered — вернём 5xx, ЮKassa повторит уведомление.
    return { status: 500, body: { error: 'delivery failed' } };
  }

  markPurchaseDelivered(env.database, paymentId);
  void notifyAdminsAboutSale(env, getPurchaseByPayment(env.database, paymentId)).catch(
    (err) => console.error('sale notify failed', err),
  );

  return { status: 200, body: { ok: true } };
}
