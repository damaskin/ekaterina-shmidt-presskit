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

export {
  DEFAULT_LOCALE,
  detectLocale,
  detectSystemLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
} from '../detectLocale';
