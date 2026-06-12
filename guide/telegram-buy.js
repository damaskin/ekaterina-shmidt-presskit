/* Telegram Mini App для страниц гайда (vanilla, без React).
   Полноэкранный режим, отступ контента под шапку Telegram, нативные кнопки:
   MainButton «Купить гайд» (если страница продающая) и BackButton «Назад».
   Детект и загрузку SDK дублируем намеренно — чтобы не тащить React-хук
   useTelegramWebApp в лёгкий бандл гайда. */

const TG_SDK = 'https://telegram.org/js/telegram-web-app.js';
const HEADER = '#0d0a0f';
const ACCENT = '#ff2d8a';

function getWebApp() {
  return window.Telegram && window.Telegram.WebApp;
}

/** Реальный Telegram-клиент, а не stub в обычном браузере. */
function isTelegramWebApp() {
  if (location.hash.includes('tgWebAppData=')) return true;
  if (/Telegram/i.test(navigator.userAgent)) return true;
  const tg = getWebApp();
  if (!tg) return false;
  if (tg.initData && tg.initData.length > 0) return true;
  const platform = tg.platform;
  return Boolean(platform && platform !== 'unknown' && platform !== 'web');
}

function loadSdk() {
  if (getWebApp()) return Promise.resolve();
  const existing = document.querySelector(`script[src="${TG_SDK}"]`);
  if (existing) {
    return new Promise((resolve) => {
      if (getWebApp()) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TG_SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Telegram SDK failed to load'));
    document.head.appendChild(s);
  });
}

const px = (v) => `${Math.max(0, Math.round(Number(v) || 0))}px`;

/** Отступы под шапку Telegram (notch + бар) и нижнюю safe-area → CSS-переменные. */
function applyInsets(tg) {
  const root = document.documentElement.style;
  const safe = tg.safeAreaInset || {};
  const content = tg.contentSafeAreaInset || {};
  root.setProperty('--tg-top-inset', px((safe.top || 0) + (content.top || 0)));
  root.setProperty('--tg-bottom-inset', px(safe.bottom));
}

/**
 * @param {{ buyUrl?: string|null, getButtonText?: () => string }} opts
 * @returns {{ refreshText: (text: string) => void } | null}
 */
export function setupGuideTelegram({ buyUrl, getButtonText } = {}) {
  if (!isTelegramWebApp()) return null;
  document.documentElement.classList.add('tg-webapp');

  let mainButton = null;

  loadSdk()
    .then(() => {
      const tg = getWebApp();
      if (!tg) return;

      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor(HEADER);
      if (tg.setBackgroundColor) tg.setBackgroundColor(HEADER);
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      try {
        if (tg.requestFullscreen) tg.requestFullscreen();
      } catch {
        /* старые клиенты без fullscreen API */
      }

      applyInsets(tg);
      const onViewport = () => {
        if (!tg.isExpanded) tg.expand();
        applyInsets(tg);
      };
      window.addEventListener('resize', onViewport);
      if (tg.onEvent) {
        tg.onEvent('viewportChanged', onViewport);
        tg.onEvent('safeAreaChanged', onViewport);
        tg.onEvent('contentSafeAreaChanged', onViewport);
      }

      // Нативная кнопка «Назад»: по истории, иначе закрыть Mini App.
      const back = tg.BackButton;
      if (back) {
        back.show();
        back.onClick(() => {
          if (window.history.length > 1) window.history.back();
          else if (tg.close) tg.close();
        });
      }

      // Главная кнопка «Купить» — только на продающей странице (есть buyUrl).
      if (buyUrl && getButtonText && tg.MainButton) {
        mainButton = tg.MainButton;
        mainButton.color = ACCENT;
        mainButton.textColor = '#ffffff';
        mainButton.setText(getButtonText());
        mainButton.show();
        mainButton.onClick(() => {
          if (tg.openTelegramLink) tg.openTelegramLink(buyUrl);
          else window.location.href = buyUrl;
        });
      }
    })
    .catch(() => {
      /* вне Telegram или сеть недоступна — страница работает как обычно */
    });

  return {
    refreshText(text) {
      if (mainButton && text) mainButton.setText(text);
    },
  };
}
