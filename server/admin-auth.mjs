/**
 * Авторизация админки: пароль → подписанная HMAC cookie-сессия.
 * Без зависимостей от БД — чистый node:crypto (тестируется изолированно).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'sh_admin';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function sessionSecret(env) {
  return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || '';
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function makeToken(env) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString(
    'base64url',
  );
  return `${payload}.${sign(payload, sessionSecret(env))}`;
}

export function verifyToken(env, token) {
  const secret = sessionSecret(env);
  if (!token || !secret) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload, secret))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function cookieHeader(token, maxAgeSec) {
  return [
    `${COOKIE}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/api/admin',
    `Max-Age=${maxAgeSec}`,
  ].join('; ');
}
