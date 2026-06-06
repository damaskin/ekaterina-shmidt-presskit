import type { RequestContactResponse } from '../types/telegram-web-app';

export function canRequestTelegramContact(): boolean {
  return typeof window.Telegram?.WebApp?.requestContact === 'function';
}

function readPhoneFromResponse(response: RequestContactResponse | undefined): string | null {
  if (!response || response.status !== 'sent') return null;
  return response.responseUnsafe?.contact?.phone_number ?? null;
}

/** Native Telegram popup — user shares phone number with the Mini App. */
export function requestTelegramContactPhone(): Promise<string | null> {
  return new Promise((resolve) => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.requestContact) {
      resolve(null);
      return;
    }

    tg.requestContact((success, response) => {
      if (!success) {
        resolve(null);
        return;
      }
      resolve(readPhoneFromResponse(response));
    });
  });
}
