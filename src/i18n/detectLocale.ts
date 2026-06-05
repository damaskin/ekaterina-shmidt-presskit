import type { Locale } from './types';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'presskit-locale';

const SUPPORTED_LOCALES = new Set<Locale>([
  'en',
  'ru',
  'de',
  'ar',
  'hi',
  'es',
  'fr',
  'zh',
]);

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && SUPPORTED_LOCALES.has(value as Locale);
}

function localeFromTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;

  const normalized = tag.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return null;

  const [primary] = normalized.split('-');
  if (isLocale(primary)) return primary;

  if (primary === 'zh' || normalized.startsWith('zh-')) return 'zh';

  return null;
}

function detectTelegramLocale(): Locale | null {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  const fromApp = localeFromTag(tg.languageCode);
  if (fromApp) return fromApp;

  return localeFromTag(tg.initDataUnsafe?.user?.language_code);
}

function detectBrowserLocale(): Locale | null {
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const tag of candidates) {
    const locale = localeFromTag(tag);
    if (locale) return locale;
  }

  return null;
}

/** Telegram → браузер → English */
export function detectSystemLocale(): Locale {
  return detectTelegramLocale() ?? detectBrowserLocale() ?? DEFAULT_LOCALE;
}

export function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : null;
}

export function detectLocale(): Locale {
  return readStoredLocale() ?? detectSystemLocale();
}
