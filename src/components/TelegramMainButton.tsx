import { useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
import { useI18n } from '../context/LocaleContext';
import { isTelegramWebApp, loadTelegramSdk } from '../hooks/useTelegramWebApp';
import { registerTelegramVisitor } from '../services/registerTelegramVisitor';

const ACCENT = '#ff2d8a';
const ACCENT_TEXT = '#ffffff';

function getWebApp() {
  return window.Telegram?.WebApp;
}

/**
 * Нативные кнопки Telegram на главной (пресс-кит):
 * - форма закрыта → MainButton «Закрыть» и BackButton закрывают Mini App;
 * - форма открыта → MainButton отправляет заявку, BackButton закрывает форму.
 * Сам букинг открывается обычной кнопкой на странице.
 */
export default function TelegramMainButton() {
  const { isOpen, close, formStatus, requestSubmit } = useBooking();
  const { t } = useI18n();

  const mainClickRef = useRef<(() => void) | undefined>(undefined);
  const backClickRef = useRef<(() => void) | undefined>(undefined);

  // Монтаж: грузим SDK, регистрируем визитёра, показываем кнопки.
  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadTelegramSdk()
      .then(() => {
        if (cancelled) return;
        const tg = getWebApp();
        if (!tg) return;

        const user = tg.initDataUnsafe?.user;
        if (user?.id) {
          void registerTelegramVisitor({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        }

        if (tg.MainButton) {
          tg.MainButton.color = ACCENT;
          tg.MainButton.textColor = ACCENT_TEXT;
          tg.MainButton.show();
        }
        tg.BackButton?.show();

        cleanup = () => {
          tg.MainButton?.hide();
          tg.MainButton?.hideProgress();
          tg.BackButton?.hide();
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

  // Обновляем подписи и действия кнопок при смене состояния формы.
  useEffect(() => {
    if (!isTelegramWebApp()) return;

    let cancelled = false;

    loadTelegramSdk()
      .then(() => {
        if (cancelled) return;
        const tg = getWebApp();
        if (!tg) return;

        const closeApp = () => tg.close?.();

        // MainButton
        const mainButton = tg.MainButton;
        if (mainButton) {
          let label: string;
          let action: () => void;

          if (!isOpen) {
            label = t.booking.successClose; // «Закрыть»
            action = closeApp;
          } else if (formStatus === 'success') {
            label = t.booking.successClose;
            action = close;
          } else {
            label = t.booking.mainButtonSubmit;
            action = requestSubmit;
          }

          if (mainClickRef.current) mainButton.offClick(mainClickRef.current);
          mainButton.setText(label);
          mainClickRef.current = action;
          mainButton.onClick(action);
          mainButton.show();

          if (formStatus === 'sending') {
            mainButton.showProgress(true);
            mainButton.disable();
          } else {
            mainButton.hideProgress();
            mainButton.enable();
          }
        }

        // BackButton: форма открыта → закрыть форму, иначе → закрыть Mini App.
        const backButton = tg.BackButton;
        if (backButton) {
          const backAction = () => {
            if (isOpen) close();
            else closeApp();
          };
          if (backClickRef.current) backButton.offClick(backClickRef.current);
          backClickRef.current = backAction;
          backButton.onClick(backAction);
          backButton.show();
        }
      })
      .catch(() => {
        /* вне Telegram */
      });

    return () => {
      cancelled = true;
      const tg = getWebApp();
      if (tg?.MainButton && mainClickRef.current) tg.MainButton.offClick(mainClickRef.current);
      if (tg?.BackButton && backClickRef.current) tg.BackButton.offClick(backClickRef.current);
    };
  }, [
    isOpen,
    formStatus,
    close,
    requestSubmit,
    t.booking.mainButtonSubmit,
    t.booking.successClose,
  ]);

  return null;
}
