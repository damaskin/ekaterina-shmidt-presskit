import { useEffect, type RefObject } from 'react';
import { isTelegramWebApp, loadTelegramSdk } from './useTelegramWebApp';

const TG_MAIN_BUTTON_HEIGHT = 48;
const TG_PLAYER_GAP = 20;

function getWebApp() {
  return window.Telegram?.WebApp;
}

function readBottomReserve(tg: NonNullable<ReturnType<typeof getWebApp>>) {
  const safeBottom = tg.safeAreaInset?.bottom ?? 0;
  const contentBottom = tg.contentSafeAreaInset?.bottom ?? 0;
  return contentBottom > 0 ? contentBottom : safeBottom + TG_MAIN_BUTTON_HEIGHT;
}

/** Якорит плеер и стрелку cover к Main Button через bottom (плеер в portal на body). */
export function useTelegramPlayerLayout(
  playerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let disposed = false;
    let bound = false;
    let ro: ResizeObserver | undefined;

    const update = () => {
      if (disposed) return;

      const player = playerRef.current;
      const tg = getWebApp();
      if (!player || !tg) return;

      const reserve = readBottomReserve(tg);
      const bottomPx = reserve + TG_PLAYER_GAP;
      const playerHeight = player.offsetHeight;

      player.style.top = 'auto';
      player.style.bottom = `${bottomPx}px`;

      const scroll = document.querySelector<HTMLElement>('.slide-cover__scroll');
      if (scroll) {
        scroll.style.top = 'auto';
        scroll.style.bottom = `${bottomPx + playerHeight + 12}px`;
      }

      document.documentElement.style.setProperty(
        '--tg-content-bottom-reserve',
        `${reserve}px`,
      );
      if (playerHeight > 0) {
        document.documentElement.style.setProperty(
          '--tg-audio-player-height',
          `${playerHeight}px`,
        );
      }
    };

    const bind = () => {
      if (bound || disposed || !playerRef.current) return;
      bound = true;

      update();

      window.addEventListener('resize', update);

      const tg = getWebApp();
      tg?.onEvent?.('viewportChanged', update);
      tg?.onEvent?.('contentSafeAreaChanged', update);
      tg?.onEvent?.('safeAreaChanged', update);

      ro = new ResizeObserver(update);
      ro.observe(playerRef.current);
    };

    void loadTelegramSdk().then(() => {
      if (!disposed) bind();
    });

    const retry = window.setInterval(() => {
      bind();
      if (bound) window.clearInterval(retry);
    }, 50);

    return () => {
      disposed = true;
      window.clearInterval(retry);
      ro?.disconnect();

      window.removeEventListener('resize', update);

      const tg = getWebApp();
      tg?.offEvent?.('viewportChanged', update);
      tg?.offEvent?.('contentSafeAreaChanged', update);
      tg?.offEvent?.('safeAreaChanged', update);

      playerRef.current?.style.removeProperty('top');
      playerRef.current?.style.removeProperty('bottom');

      const scroll = document.querySelector<HTMLElement>('.slide-cover__scroll');
      scroll?.style.removeProperty('top');
      scroll?.style.removeProperty('bottom');
    };
  }, [playerRef]);
}
