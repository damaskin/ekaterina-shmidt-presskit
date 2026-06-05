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

export function loadTelegramSdk(): Promise<void> {
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

type AreaInset = { top: number; bottom: number; left: number; right: number };

const TG_HEADER_FALLBACK = 52;
const TG_SIDE_FALLBACK = 56;

function readInset(value: Partial<AreaInset> | undefined): AreaInset {
  return {
    top: value?.top ?? 0,
    bottom: value?.bottom ?? 0,
    left: value?.left ?? 0,
    right: value?.right ?? 0,
  };
}

function applyTelegramSafeArea(tg: NonNullable<ReturnType<typeof getWebApp>>) {
  const root = document.documentElement.style;
  const safe = readInset(tg.safeAreaInset);
  const content = readInset(tg.contentSafeAreaInset);

  const headerBarHeight = Math.max(content.top, TG_HEADER_FALLBACK);
  const coverTopInset =
    content.top > 0 ? content.top : safe.top + TG_HEADER_FALLBACK;

  root.setProperty('--tg-safe-area-inset-top', `${safe.top}px`);
  root.setProperty('--tg-safe-area-inset-bottom', `${safe.bottom}px`);
  root.setProperty('--tg-safe-area-inset-left', `${safe.left}px`);
  root.setProperty('--tg-safe-area-inset-right', `${safe.right}px`);
  root.setProperty('--tg-content-safe-area-inset-top', `${content.top}px`);
  root.setProperty('--tg-content-safe-area-inset-bottom', `${content.bottom}px`);
  root.setProperty('--tg-content-safe-area-inset-left', `${content.left}px`);
  root.setProperty('--tg-content-safe-area-inset-right', `${content.right}px`);
  root.setProperty('--tg-header-bar-height', `${headerBarHeight}px`);
  root.setProperty('--tg-cover-top-inset', `${coverTopInset}px`);
  root.setProperty(
    '--tg-header-side-inset',
    `${Math.max(content.left, content.right, TG_SIDE_FALLBACK)}px`,
  );
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

  applyTelegramSafeArea(tg);

  const onViewportChanged = () => {
    if (!tg.isExpanded) tg.expand();
    if (tg.isFullscreen === false) {
      try {
        tg.requestFullscreen?.();
      } catch {
        /* ignore */
      }
    }
    applyTelegramSafeArea(tg);
  };

  window.addEventListener('resize', onViewportChanged);
  tg.onEvent?.('safeAreaChanged', onViewportChanged);
  tg.onEvent?.('contentSafeAreaChanged', onViewportChanged);

  return () => {
    window.removeEventListener('resize', onViewportChanged);
    tg.offEvent?.('safeAreaChanged', onViewportChanged);
    tg.offEvent?.('contentSafeAreaChanged', onViewportChanged);
    document.documentElement.classList.remove('tg-webapp');
    [
      '--tg-safe-area-inset-top',
      '--tg-safe-area-inset-bottom',
      '--tg-safe-area-inset-left',
      '--tg-safe-area-inset-right',
      '--tg-content-safe-area-inset-top',
      '--tg-content-safe-area-inset-bottom',
      '--tg-content-safe-area-inset-left',
      '--tg-content-safe-area-inset-right',
      '--tg-header-bar-height',
      '--tg-cover-top-inset',
      '--tg-header-side-inset',
    ].forEach((name) => document.documentElement.style.removeProperty(name));
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
