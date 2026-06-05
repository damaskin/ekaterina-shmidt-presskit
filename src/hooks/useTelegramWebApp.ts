import { useEffect } from 'react';

const TG_HEADER = '#0d0a0f';
const TG_BG = '#0d0a0f';
const TG_SDK = 'https://telegram.org/js/telegram-web-app.js';

function getWebApp() {
  return window.Telegram?.WebApp;
}

/** Реальный Telegram-клиент, не stub SDK в обычном браузере */
export function isTelegramWebApp(): boolean {
  if (location.hash.includes('tgWebAppData=')) return true;
  if (/Telegram/i.test(navigator.userAgent)) return true;

  const tg = getWebApp();
  if (!tg) return false;

  if (tg.initData && tg.initData.length > 0) return true;

  const platform = tg.platform;
  return Boolean(platform && platform !== 'unknown' && platform !== 'web');
}

function loadTelegramSdk(): Promise<void> {
  if (getWebApp()) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TG_SDK}"]`,
  );
  if (existing) {
    return new Promise((resolve) => {
      if (getWebApp()) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TG_SDK;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Telegram SDK failed to load'));
    document.head.appendChild(script);
  });
}

function initTelegramWebApp(tg: NonNullable<ReturnType<typeof getWebApp>>) {
  document.documentElement.classList.add('tg-webapp');

  tg.ready();
  tg.expand();
  tg.setHeaderColor?.(TG_HEADER);
  tg.setBackgroundColor?.(TG_BG);
  tg.disableVerticalSwipes?.();
  tg.enableClosingConfirmation?.();

  try {
    tg.requestFullscreen?.();
  } catch {
    /* старые клиенты без fullscreen API */
  }

  const onViewportChanged = () => {
    if (!tg.isExpanded) tg.expand();
    if (tg.isFullscreen === false) {
      try {
        tg.requestFullscreen?.();
      } catch {
        /* ignore */
      }
    }
  };

  window.addEventListener('resize', onViewportChanged);

  return () => {
    window.removeEventListener('resize', onViewportChanged);
    document.documentElement.classList.remove('tg-webapp');
    tg.enableVerticalSwipes?.();
    try {
      tg.exitFullscreen?.();
    } catch {
      /* ignore */
    }
  };
}

/** Fullscreen Mini App в Telegram + без свайпа для закрытия */
export function useTelegramWebApp(): void {
  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    loadTelegramSdk()
      .then(() => {
        if (cancelled) return;
        const tg = getWebApp();
        if (!tg || !isTelegramWebApp()) return;
        cleanup = initTelegramWebApp(tg);
      })
      .catch(() => {
        /* вне Telegram или сеть недоступна — сайт работает как обычно */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
