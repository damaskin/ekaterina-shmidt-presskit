/**
 * Минимальный клиент ЮKassa (https://yookassa.ru/developers/api).
 * Аутентификация — Basic shopId:secretKey. Все суммы — строки "1234.00".
 */
import { randomUUID } from 'node:crypto';
import {
  getGuideReturnUrl,
  getGuideVatCode,
  getYookassaSecretKey,
  getYookassaShopId,
} from './settings.mjs';

const API = 'https://api.yookassa.ru/v3';

function authHeader(env) {
  const shopId = getYookassaShopId(env.database, env);
  const secret = getYookassaSecretKey(env.database, env);
  if (!shopId || !secret) return null;
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');
}

export function isYookassaConfigured(env) {
  return Boolean(authHeader(env));
}

/** "2000" / "2000.5" → "2000.00". ЮKassa требует ровно 2 знака. */
export function formatAmount(value) {
  return Number(value).toFixed(2);
}

/**
 * Создаёт платёж. Возвращает { id, status, confirmationUrl, amount, currency }.
 * receipt передаётся, если включён чек (54-ФЗ) — нужен email покупателя.
 */
export async function createPayment(env, { amountValue, description, metadata, email }) {
  const auth = authHeader(env);
  if (!auth) throw new Error('YooKassa is not configured');

  const currency = 'RUB';
  const value = formatAmount(amountValue);
  const returnUrl = getGuideReturnUrl(env.database, env);

  const body = {
    amount: { value, currency },
    capture: true,
    confirmation: { type: 'redirect', return_url: returnUrl },
    description,
    metadata,
  };

  // Чек 54-ФЗ: предмет расчёта + email покупателя.
  if (email) {
    const vatCode = getGuideVatCode(env.database, env); // 1 = «без НДС» (самозанятые/НПД)
    body.receipt = {
      customer: { email },
      items: [
        {
          description: description.slice(0, 128),
          quantity: '1.00',
          amount: { value, currency },
          vat_code: vatCode,
          payment_mode: 'full_payment',
          payment_subject: 'service',
        },
      ],
    };
  }

  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Idempotence-Key': randomUUID(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const reason = data?.description || data?.code || res.status;
    throw new Error(`YooKassa createPayment failed: ${reason}`);
  }

  return {
    id: data.id,
    status: data.status,
    amount: data.amount?.value,
    currency: data.amount?.currency,
    confirmationUrl: data.confirmation?.confirmation_url,
  };
}

/** Перепроверка статуса платежа (не доверяем телу вебхука). */
export async function getPayment(env, paymentId) {
  const auth = authHeader(env);
  if (!auth) throw new Error('YooKassa is not configured');

  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`YooKassa getPayment failed: ${data?.description || res.status}`);
  }
  return data;
}
