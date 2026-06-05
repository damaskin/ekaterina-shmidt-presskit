import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  detectLocale,
  detectSystemLocale,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  readStoredLocale,
} from '../i18n/locales';
import { isTelegramWebApp, loadTelegramSdk } from '../hooks/useTelegramWebApp';
import { applyDocumentSeo } from '../lib/seo';
import type { Locale, LocaleMessages } from '../i18n/types';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: LocaleMessages;
  dir: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);

    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    if (readStoredLocale()) return;

    const applySystemLocale = () => {
      if (readStoredLocale()) return;
      setLocaleState(detectSystemLocale());
    };

    if (!isTelegramWebApp()) return;

    loadTelegramSdk()
      .then(applySystemLocale)
      .catch(() => {
        /* ignore */
      });
  }, []);

  const t = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const dir = t.dir;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    applyDocumentSeo(locale, t);

    const url = new URL(window.location.href);
    if (url.searchParams.get('lang') !== locale) {
      url.searchParams.set('lang', locale);
      window.history.replaceState(null, '', url);
    }
  }, [locale, dir, t]);

  const value = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [locale, setLocale, t, dir],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}
