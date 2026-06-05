import { useEffect } from 'react';

const TG_HEADER = '#0d0a0f';
const TG_BG = '#0d0a0f';

function getWebApp() {
  return window.Telegram?.WebApp;
}

/** Fullscreen Mini App в Telegram + без свайпа для закрытия */
export function useTelegramWebApp(): void {
  useEffect(() => {
    const tg = getWebApp();
    if (!tg) return;

    document.documentElement.classList.add('tg-webapp');

    tg.ready();
    tg.expand();
    tg.setHeaderColor?.(TG_HEADER);
    tg.setBackgroundColor?.(TG_BG);
    tg.disableVerticalSwipes?.();
    tg.enableClosingConfirmation?.();
    tg.requestFullscreen?.();

    const onViewportChanged = () => {
      if (!tg.isExpanded) tg.expand();
      if (tg.isFullscreen === false) tg.requestFullscreen?.();
    };

    window.addEventListener('resize', onViewportChanged);

    return () => {
      window.removeEventListener('resize', onViewportChanged);
      document.documentElement.classList.remove('tg-webapp');
      tg.enableVerticalSwipes?.();
      tg.exitFullscreen?.();
    };
  }, []);
}

export function isTelegramWebApp(): boolean {
  const tg = getWebApp();
  return Boolean(tg?.platform && tg.platform !== 'unknown');
}
