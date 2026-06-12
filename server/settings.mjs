/**
 * Типизированный доступ к настройкам гайда.
 * Приоритет: значение из БД (правится в админке) → переменная окружения → дефолт.
 */
import { getSetting } from './db.mjs';
import { GUIDE_CHUNKS } from './guide-content.mjs';

// Разделитель блоков — отдельная строка из 3+ дефисов (возможны пробелы).
const SEPARATOR_LINE = /^\s*-{3,}\s*$/;

export const SETTING_KEYS = {
  price: 'guide_price_rub',
  salesEnabled: 'guide_sales_enabled',
  requireEmail: 'guide_require_email',
  body: 'guide_body',
};

export function getGuidePriceRub(db, env) {
  const raw = (db && getSetting(db, SETTING_KEYS.price)) ?? env?.GUIDE_PRICE_RUB ?? 2000;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 2000;
}

export function isSalesEnabled(db) {
  if (!db) return true;
  return getSetting(db, SETTING_KEYS.salesEnabled) !== '0';
}

export function guideRequiresEmail(db, env) {
  const stored = db ? getSetting(db, SETTING_KEYS.requireEmail) : null;
  if (stored != null) return stored !== '0';
  return String(env?.GUIDE_REQUIRE_EMAIL ?? 'true').toLowerCase() !== 'false';
}

/** Полный редактируемый текст гайда (блоки разделены строкой ---). */
export function getGuideBody(db) {
  const stored = db ? getSetting(db, SETTING_KEYS.body) : null;
  return stored && stored.trim() ? stored : GUIDE_CHUNKS.join('\n---\n');
}

/**
 * Разбивает тело на блоки по строке-разделителю `---`.
 * Построчно (а не по regex с \n до и после), поэтому корректно работает
 * с разделителем в начале/конце файла и с переводами строк Windows (CRLF).
 */
export function splitGuideBody(body) {
  const blocks = [];
  let current = [];
  for (const line of String(body).split(/\r?\n/)) {
    if (SEPARATOR_LINE.test(line)) {
      blocks.push(current.join('\n').trim());
      current = [];
    } else {
      current.push(line);
    }
  }
  blocks.push(current.join('\n').trim());
  return blocks.filter(Boolean);
}

/** Блоки для доставки (по одному сообщению на блок). */
export function getGuideChunks(db) {
  return splitGuideBody(getGuideBody(db));
}
