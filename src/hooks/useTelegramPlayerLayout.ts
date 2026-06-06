import { useEffect, type RefObject } from 'react';
import { isTelegramWebApp, loadTelegramSdk } from './useTelegramWebApp';

const TG_PLAYER_BOTTOM = 12;

function getWebApp() {
  return window.Telegram?.WebApp;
}

/** Якорит плеер и стрелку cover в Telegram (плеер в portal на body). */
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
      if (!player) return;

      const playerHeight = player.offsetHeight;

      player.style.top = 'auto';
      player.style.bottom = `${TG_PLAYER_BOTTOM}px`;

      const scroll = document.querySelector<HTMLElement>('.slide-cover__scroll');
      if (scroll) {
        scroll.style.top = 'auto';
        scroll.style.bottom = `${TG_PLAYER_BOTTOM + playerHeight + 12}px`;
      }

      document.documentElement.style.setProperty(
        '--tg-player-bottom',
        `${TG_PLAYER_BOTTOM}px`,
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
