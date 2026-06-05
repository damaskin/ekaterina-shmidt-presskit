import type { Locale } from './types';

export const INTL_LOCALES: Record<Locale, string> = {
  en: 'en',
  de: 'de',
  ar: 'ar',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  zh: 'zh-CN',
};

export function weekdayLabels(locale: Locale): string[] {
  const intl = INTL_LOCALES[locale];
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat(intl, { weekday: 'short' }).format(date);
  });
}
