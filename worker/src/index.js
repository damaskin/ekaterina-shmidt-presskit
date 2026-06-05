import { handleBooking } from './booking.js';
import { handleTelegramUpdate } from './bot.js';

const ALLOWED_ORIGINS = [
  'https://damaskin.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') ?? '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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

function getPathname(url) {
  const path = new URL(url).pathname;
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    const pathname = getPathname(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET' && pathname === '/health') {
      return json({ ok: true }, 200, cors);
    }

    if (request.method === 'POST' && pathname === '/webhook') {
      const secret = env.TELEGRAM_WEBHOOK_SECRET;
      if (secret) {
        const header = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (header !== secret) {
          return json({ error: 'Unauthorized' }, 401);
        }
      }

      let update;
      try {
        update = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const result = await handleTelegramUpdate(env, update);
      return json(result.body, result.status);
    }

    if (request.method === 'POST' && (pathname === '' || pathname === '/')) {
      const result = await handleBooking(request, env);
      return json(result.body, result.status, cors);
    }

    return json({ error: 'Not found' }, 404, cors);
  },
};
