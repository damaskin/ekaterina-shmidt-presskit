/**
 * Админ-панель: API под /admin/* (через nginx — /api/admin/*).
 * Авторизация — пароль (ADMIN_PASSWORD) → подписанная cookie-сессия (HMAC).
 * Статика панели лежит отдельно (admin/index.html), сюда ходит только JSON.
 */
import { randomBytes } from 'node:crypto';
import {
  audienceCounts,
  deleteMedia,
  getActivePurchase,
  getMedia,
  getSetting,
  insertMedia,
  listMedia,
  listUsersForAdmin,
  markPurchaseDelivered,
  purchaseStats,
  queryPurchases,
  setSetting,
} from './db.mjs';
import { deliverGuide } from './guide.mjs';
import { isBroadcasting, startBroadcast } from './broadcast.mjs';
import { MAX_MEDIA_BYTES, MIME_EXT, readMediaFile, removeMediaFile, saveMediaFile } from './media.mjs';
import {
  SETTING_KEYS,
  getGuideBody,
  getGuidePriceRub,
  getGuideReturnUrl,
  getGuideVatCode,
  getYookassaSecretKey,
  getYookassaShopId,
  guideRequiresEmail,
  isSalesEnabled,
  splitGuideBody,
} from './settings.mjs';
import {
  COOKIE,
  SESSION_TTL_MS,
  cookieHeader,
  makeToken,
  parseCookies,
  safeEqual,
  verifyToken,
} from './admin-auth.mjs';

const TG_LIMIT = 4096;

// Примитивный анти-брутфорс по IP (в памяти процесса).
const attempts = new Map(); // ip → { count, until }
const MAX_ATTEMPTS = 10;
const LOCK_MS = 10 * 60 * 1000;

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isLocked(ip) {
  const rec = attempts.get(ip);
  return rec && rec.until > Date.now() && rec.count >= MAX_ATTEMPTS;
}

function registerFail(ip) {
  const rec = attempts.get(ip) || { count: 0, until: 0 };
  rec.count += 1;
  rec.until = Date.now() + LOCK_MS;
  attempts.set(ip, rec);
}

function isAuthed(env, req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  return verifyToken(env, token);
}

function settingsView(env) {
  const db = env.database;
  const shopId = getYookassaShopId(db, env);
  const secret = getYookassaSecretKey(db, env);
  return {
    priceRub: getGuidePriceRub(db, env),
    salesEnabled: isSalesEnabled(db),
    requireEmail: guideRequiresEmail(db, env),
    yookassaConfigured: Boolean(shopId && secret),
    // Платёжная система. Секретный ключ не отдаём — только факт, что он задан.
    shopId,
    secretKeySet: Boolean(secret),
    vatCode: getGuideVatCode(db, env),
    returnUrl: getGuideReturnUrl(db, env),
    webhookUrl: 'https://shmidt01.ru/api/payments/yookassa',
  };
}

/**
 * @returns {{status:number, body:any, headers?:Record<string,string>}}
 */
export async function handleAdmin(env, req, path, readJson) {
  const route = path.replace(/^\/api/, ''); // /admin/...
  const method = req.method;

  if (!env.ADMIN_PASSWORD) {
    return { status: 503, body: { error: 'admin disabled: set ADMIN_PASSWORD' } };
  }
  if (!env.database) {
    return { status: 503, body: { error: 'database unavailable' } };
  }

  // — Логин —
  if (route === '/admin/login' && method === 'POST') {
    const ip = clientIp(req);
    if (isLocked(ip)) {
      return { status: 429, body: { error: 'Слишком много попыток. Подождите 10 минут.' } };
    }
    let body;
    try {
      body = await readJson(req);
    } catch {
      return { status: 400, body: { error: 'Invalid JSON' } };
    }
    if (!safeEqual(body?.password ?? '', env.ADMIN_PASSWORD)) {
      registerFail(ip);
      return { status: 401, body: { error: 'Неверный пароль' } };
    }
    attempts.delete(ip);
    return {
      status: 200,
      body: { ok: true },
      headers: { 'Set-Cookie': cookieHeader(makeToken(env), SESSION_TTL_MS / 1000) },
    };
  }

  if (route === '/admin/logout' && method === 'POST') {
    return { status: 200, body: { ok: true }, headers: { 'Set-Cookie': cookieHeader('', 0) } };
  }

  // — Всё остальное требует сессии —
  if (!isAuthed(env, req)) {
    return { status: 401, body: { error: 'unauthorized' } };
  }

  if (route === '/admin/session' && method === 'GET') {
    return { status: 200, body: { ok: true } };
  }

  if (route === '/admin/overview' && method === 'GET') {
    return {
      status: 200,
      body: {
        stats: purchaseStats(env.database),
        settings: settingsView(env),
        audience: audienceCounts(env.database),
      },
    };
  }

  if (route === '/admin/audience' && method === 'GET') {
    return { status: 200, body: { ...audienceCounts(env.database), broadcasting: isBroadcasting() } };
  }

  if (route === '/admin/users' && method === 'GET') {
    return { status: 200, body: { users: listUsersForAdmin(env.database, 500) } };
  }

  // — Фото гайда —
  if (route === '/admin/media' && method === 'GET') {
    return { status: 200, body: { media: listMedia(env.database) } };
  }

  if (route === '/admin/media' && method === 'POST') {
    if (Number(req.headers['content-length'] || 0) > 14 * 1024 * 1024) {
      return { status: 413, body: { error: 'Файл слишком большой' } };
    }
    const body = await readJson(req).catch(() => ({}));
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(body?.data ?? '');
    if (!match) {
      return { status: 400, body: { error: 'Поддерживаются JPEG, PNG, WebP, GIF' } };
    }
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_MEDIA_BYTES) {
      return { status: 400, body: { error: 'Размер 0 или больше 8 МБ' } };
    }
    const id = randomBytes(6).toString('hex');
    const filename = `${id}.${MIME_EXT[mime]}`;
    saveMediaFile(env, filename, buffer);
    insertMedia(env.database, { id, filename, mime, bytes: buffer.length });
    return { status: 200, body: { id, mime, bytes: buffer.length } };
  }

  if (route.startsWith('/admin/media/')) {
    const id = decodeURIComponent(route.slice('/admin/media/'.length));
    const media = getMedia(env.database, id);

    if (method === 'GET') {
      const buffer = media ? readMediaFile(env, media.filename) : null;
      if (!buffer) return { status: 404, body: { error: 'not found' } };
      return {
        status: 200,
        raw: buffer,
        headers: { 'Content-Type': media.mime || 'application/octet-stream', 'Cache-Control': 'private, max-age=300' },
      };
    }

    if (method === 'DELETE') {
      if (media) {
        removeMediaFile(env, media.filename);
        deleteMedia(env.database, id);
      }
      return { status: 200, body: { ok: true } };
    }
  }

  if (route === '/admin/broadcast' && method === 'POST') {
    if (isBroadcasting()) {
      return { status: 409, body: { error: 'Рассылка уже выполняется' } };
    }
    const body = await readJson(req).catch(() => ({}));
    const text = String(body?.text ?? '').trim();
    if (!text) return { status: 400, body: { error: 'Текст рассылки пуст' } };
    if (text.length > TG_LIMIT) {
      return { status: 400, body: { error: `Слишком длинно (макс ${TG_LIMIT})` } };
    }
    const result = startBroadcast(env, text);
    if (!result.started) {
      return { status: 409, body: { error: 'Рассылка уже выполняется' } };
    }
    return { status: 200, body: { ok: true, queued: result.queued } };
  }

  if (route === '/admin/purchases' && method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const status = url.searchParams.get('status') || undefined;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
    return { status: 200, body: { purchases: queryPurchases(env.database, { status, limit }) } };
  }

  if (route === '/admin/purchases/resend' && method === 'POST') {
    const body = await readJson(req).catch(() => ({}));
    const chatId = Number(body?.chat_id);
    if (!Number.isFinite(chatId)) {
      return { status: 400, body: { error: 'chat_id required' } };
    }
    const delivery = await deliverGuide(env, chatId);
    if (!delivery.ok) {
      return {
        status: 502,
        body: { error: `Доставлено ${delivery.delivered} сообщений. Покупатель должен написать боту /start.` },
      };
    }
    const purchase = getActivePurchase(env.database, chatId);
    if (purchase?.payment_id) markPurchaseDelivered(env.database, purchase.payment_id);
    return { status: 200, body: { ok: true, delivered: delivery.delivered } };
  }

  if (route === '/admin/settings') {
    if (method === 'GET') return { status: 200, body: settingsView(env) };
    if (method === 'POST') {
      const body = await readJson(req).catch(() => ({}));
      if (body.priceRub != null) {
        const price = Math.round(Number(body.priceRub));
        if (!Number.isFinite(price) || price <= 0) {
          return { status: 400, body: { error: 'Цена должна быть положительным числом' } };
        }
        setSetting(env.database, SETTING_KEYS.price, price);
      }
      if (body.salesEnabled != null) {
        setSetting(env.database, SETTING_KEYS.salesEnabled, body.salesEnabled ? '1' : '0');
      }
      if (body.requireEmail != null) {
        setSetting(env.database, SETTING_KEYS.requireEmail, body.requireEmail ? '1' : '0');
      }
      // — Реквизиты ЮKassa —
      if (body.shopId != null) {
        setSetting(env.database, SETTING_KEYS.shopId, String(body.shopId).trim());
      }
      // Секрет меняем только если прислали непустой (пустое поле = не трогать).
      if (typeof body.secretKey === 'string' && body.secretKey.trim()) {
        setSetting(env.database, SETTING_KEYS.secretKey, body.secretKey.trim());
      }
      if (body.vatCode != null) {
        const vat = Number(body.vatCode);
        setSetting(env.database, SETTING_KEYS.vatCode, String(vat >= 1 && vat <= 6 ? vat : 1));
      }
      if (body.returnUrl != null) {
        setSetting(env.database, SETTING_KEYS.returnUrl, String(body.returnUrl).trim());
      }
      return { status: 200, body: settingsView(env) };
    }
  }

  if (route === '/admin/guide') {
    if (method === 'GET') {
      const body = getGuideBody(env.database);
      const chunks = splitGuideBody(body);
      return {
        status: 200,
        body: {
          body,
          chunkCount: chunks.length,
          lengths: chunks.map((c) => c.length),
          limit: TG_LIMIT,
          custom: getSetting(env.database, SETTING_KEYS.body) != null,
        },
      };
    }
    if (method === 'POST') {
      const payload = await readJson(req).catch(() => ({}));
      const body = String(payload?.body ?? '');
      const chunks = splitGuideBody(body);
      if (chunks.length === 0) {
        return { status: 400, body: { error: 'Текст гайда пуст' } };
      }
      const tooLong = chunks
        .map((c, i) => ({ i: i + 1, len: c.length }))
        .filter((c) => c.len > TG_LIMIT);
      if (tooLong.length) {
        return {
          status: 400,
          body: {
            error: `Блоки превышают лимит Telegram (${TG_LIMIT}): ${tooLong
              .map((c) => `#${c.i} — ${c.len}`)
              .join(', ')}. Разделите их строкой ---`,
          },
        };
      }
      setSetting(env.database, SETTING_KEYS.body, body);
      return { status: 200, body: { ok: true, chunkCount: chunks.length, lengths: chunks.map((c) => c.length) } };
    }
  }

  if (route === '/admin/test-send' && method === 'POST') {
    const body = await readJson(req).catch(() => ({}));
    const chatId = Number(body?.chat_id);
    if (!Number.isFinite(chatId)) {
      return { status: 400, body: { error: 'chat_id required' } };
    }
    const delivery = await deliverGuide(env, chatId);
    return delivery.ok
      ? { status: 200, body: { ok: true, delivered: delivery.delivered } }
      : { status: 502, body: { error: 'Не доставлено. Получатель должен написать боту /start.' } };
  }

  return { status: 404, body: { error: 'not found' } };
}
