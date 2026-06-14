import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { getDb } from './db.mjs';
import { handleAdmin } from './admin.mjs';
import { handleBooking } from './booking.mjs';
import { handleTelegramUpdate } from './bot.mjs';
import { handleGuideBuy } from './guide-buy.mjs';
import { handleYookassaWebhook } from './payments.mjs';
import { startTelegramPolling } from './poll.mjs';
import { handleRegister } from './register.mjs';
import { getGuidePriceRub, guideRequiresEmail, isSalesEnabled } from './settings.mjs';

const PORT = Number(process.env.PORT || 3002);
const DB_PATH = process.env.DB_PATH || '/data/booking.sqlite';

const ALLOWED_ORIGINS = new Set([
  'https://shmidt01.ru',
  'https://www.shmidt01.ru',
  'https://damaskin.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://shmidt01.ru';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(res, status, data, extra = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...extra,
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function pathname(url) {
  const path = new URL(url, 'http://localhost').pathname;
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const database = getDb(DB_PATH);
const env = {
  get database() {
    return database;
  },
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TELEGRAM_OWNER_ID: process.env.TELEGRAM_OWNER_ID,
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
  TELEGRAM_AUTO_ADMIN_USERNAMES: process.env.TELEGRAM_AUTO_ADMIN_USERNAMES,
  TELEGRAM_AUTO_ADMIN_IDS: process.env.TELEGRAM_AUTO_ADMIN_IDS,
  TELEGRAM_USE_POLLING: process.env.TELEGRAM_USE_POLLING,
  YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID,
  YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY,
  GUIDE_PRICE_RUB: process.env.GUIDE_PRICE_RUB,
  GUIDE_VAT_CODE: process.env.GUIDE_VAT_CODE,
  GUIDE_REQUIRE_EMAIL: process.env.GUIDE_REQUIRE_EMAIL,
  GUIDE_RETURN_URL: process.env.GUIDE_RETURN_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  DB_PATH,
  MEDIA_DIR: process.env.MEDIA_DIR || join(dirname(DB_PATH), 'guide-media'),
};

const server = createServer(async (req, res) => {
  const origin = req.headers.origin ?? '';
  const cors = corsHeaders(origin);
  const path = pathname(req.url ?? '/');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
    json(res, 200, { ok: true }, cors);
    return;
  }

  // Публичная цена гайда для статической страницы /guide/ (меняется в админке).
  if (req.method === 'GET' && (path === '/guide-price' || path === '/api/guide-price')) {
    json(
      res,
      200,
      {
        priceRub: getGuidePriceRub(env.database, env),
        currency: 'RUB',
        salesEnabled: isSalesEnabled(env.database),
        requireEmail: guideRequiresEmail(env.database, env),
      },
      cors,
    );
    return;
  }

  if (req.method === 'POST' && (path === '/guide-buy' || path === '/api/guide-buy')) {
    try {
      const body = await readJson(req);
      const result = await handleGuideBuy(env, body);
      json(res, result.status, result.body, cors);
    } catch {
      json(res, 500, { error: 'Server error' }, cors);
    }
    return;
  }

  if (req.method === 'POST' && (path === '/webhook' || path === '/api/webhook')) {
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const header = req.headers['x-telegram-bot-api-secret-token'];
      if (header !== env.TELEGRAM_WEBHOOK_SECRET) {
        json(res, 401, { error: 'Unauthorized' });
        return;
      }
    }

    try {
      const update = await readJson(req);
      // Telegram ждёт быстрый 200 — ответы боту шлём асинхронно
      json(res, 200, { ok: true });
      void handleTelegramUpdate(env, update).catch((err) => {
        console.error('telegram update failed', err);
      });
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
    }
    return;
  }

  if (
    req.method === 'POST' &&
    (path === '/payments/yookassa' || path === '/api/payments/yookassa')
  ) {
    try {
      const body = await readJson(req);
      const result = await handleYookassaWebhook(env, body);
      json(res, result.status, result.body);
    } catch (err) {
      console.error('yookassa webhook failed', err);
      json(res, 500, { error: 'Server error' });
    }
    return;
  }

  if (path === '/admin' || path.startsWith('/admin/') ||
      path === '/api/admin' || path.startsWith('/api/admin/')) {
    try {
      const result = await handleAdmin(env, req, path, readJson);
      if (result.raw) {
        res.writeHead(result.status, result.headers ?? {});
        res.end(result.raw);
      } else {
        json(res, result.status, result.body, result.headers ?? {});
      }
    } catch (err) {
      console.error('admin request failed', err);
      json(res, 500, { error: 'Server error' });
    }
    return;
  }

  if (
    req.method === 'POST' &&
    (path === '/register' || path === '/api/register')
  ) {
    try {
      const body = await readJson(req);
      const result = await handleRegister(env, body);
      json(res, result.status, result.body, cors);
    } catch {
      json(res, 400, { error: 'Invalid JSON' }, cors);
    }
    return;
  }

  if (
    req.method === 'POST' &&
    (path === '' ||
      path === '/' ||
      path === '/api' ||
      path === '/booking' ||
      path === '/api/booking')
  ) {
    try {
      const result = await handleBooking(req, env, readJson);
      json(res, result.status, result.body, cors);
    } catch {
      json(res, 500, { error: 'Server error' }, cors);
    }
    return;
  }

  json(res, 404, { error: 'Not found' }, cors);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`booking-api listening on :${PORT}`);
  void startTelegramPolling(env);
});
