import { createServer } from 'node:http';
import { getDb } from './db.mjs';
import { handleBooking } from './booking.mjs';
import { handleTelegramUpdate } from './bot.mjs';
import { startTelegramPolling } from './poll.mjs';
import { handleRegister } from './register.mjs';

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
      const result = await handleTelegramUpdate(env, update);
      json(res, result.status, result.body);
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
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
