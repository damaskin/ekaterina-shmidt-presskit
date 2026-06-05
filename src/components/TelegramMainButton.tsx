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

/** Розовая Main Button в Telegram — всегда видна, открывает booking */
export default function TelegramMainButton() {
  const { open } = useBooking();
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

        const user = tg.initDataUnsafe?.user;
        if (user?.id) {
          void registerTelegramVisitor({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        }

        const label = t.booking.mainButton;
        mainButton.setText(label);
        mainButton.color = ACCENT;
        mainButton.textColor = ACCENT_TEXT;
        mainButton.enable();
        mainButton.show();

        const onClick = () => open();
        mainButton.onClick(onClick);

        cleanup = () => {
          mainButton.offClick(onClick);
          mainButton.hide();
        };
      })
      .catch(() => {
        /* вне Telegram */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [open, t.booking.mainButton]);

  return null;
}
