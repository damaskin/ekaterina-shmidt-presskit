import { useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { useI18n } from '../context/LocaleContext';
import { isTelegramWebApp, loadTelegramSdk } from '../hooks/useTelegramWebApp';
import { registerTelegramVisitor } from '../services/registerTelegramVisitor';

const ACCENT = '#ff2d8a';
const ACCENT_TEXT = '#ffffff';

function getWebApp() {
  return window.Telegram?.WebApp;
}

/** Main Button в Telegram: BOOKING → открыть форму, SEND REQUEST → отправить.
 *  BackButton на главной скрыт — Telegram показывает нативную «Закрыть»
 *  (на странице гайда BackButton показывается и работает как «Назад»). */
export default function TelegramMainButton() {
  const { isOpen, open, close, formStatus, requestSubmit } = useBooking();
  const { t } = useI18n();

  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadTelegramSdk()
      .then(() => {
        if (cancelled) return;

        const tg = getWebApp();
        const mainButton = tg?.MainButton;
        if (!mainButton) return;

        // На главной нет «Назад» — прячем BackButton, чтобы Telegram показал «Закрыть».
        tg.BackButton?.hide();

        const user = tg.initDataUnsafe?.user;
        if (user?.id) {
          void registerTelegramVisitor({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        }

        mainButton.color = ACCENT;
        mainButton.textColor = ACCENT_TEXT;
        mainButton.show();

        cleanup = () => {
          mainButton.hide();
          mainButton.hideProgress();
        };
      })
      .catch(() => {
        /* вне Telegram */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let cancelled = false;
    let clickHandler: (() => void) | undefined;

    loadTelegramSdk()
      .then(() => {
        if (cancelled) return;

        const mainButton = getWebApp()?.MainButton;
        if (!mainButton) return;

        let label: string;
        let action: () => void;

        if (!isOpen) {
          label = t.booking.mainButton;
          action = open;
        } else if (formStatus === 'success') {
          label = t.booking.successClose;
          action = close;
        } else {
          label = t.booking.mainButtonSubmit;
          action = requestSubmit;
        }

        if (clickHandler) {
          mainButton.offClick(clickHandler);
        }

        mainButton.setText(label);
        clickHandler = action;
        mainButton.onClick(clickHandler);

        if (formStatus === 'sending') {
          mainButton.showProgress(true);
          mainButton.disable();
        } else {
          mainButton.hideProgress();
          mainButton.enable();
        }
      })
      .catch(() => {
        /* вне Telegram */
      });

    return () => {
      cancelled = true;
      const mainButton = getWebApp()?.MainButton;
      if (mainButton && clickHandler) {
        mainButton.offClick(clickHandler);
      }
    };
  }, [
    isOpen,
    formStatus,
    open,
    close,
    requestSubmit,
    t.booking.mainButton,
    t.booking.mainButtonSubmit,
    t.booking.successClose,
  ]);

  return null;
}
