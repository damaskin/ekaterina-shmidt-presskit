import type { Locale, LocaleMessages, LocaleOption } from '../types';
import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { hi } from './hi';
import { zh } from './zh';

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', label: 'EN', nativeName: 'English', dir: 'ltr' },
  { code: 'de', label: 'DE', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ar', label: 'AR', nativeName: 'العربية', dir: 'rtl' },
  { code: 'hi', label: 'HI', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'es', label: 'ES', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'FR', nativeName: 'Français', dir: 'ltr' },
  { code: 'zh', label: 'ZH', nativeName: '中文', dir: 'ltr' },
];

export const MESSAGES: Record<Locale, LocaleMessages> = {
  en,
  de,
  ar,
  hi,
  es,
  fr,
  zh,
};

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'presskit-locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && value in MESSAGES;
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;

  const browser = navigator.language.slice(0, 2).toLowerCase();
  if (isLocale(browser)) return browser;

  return DEFAULT_LOCALE;
}
