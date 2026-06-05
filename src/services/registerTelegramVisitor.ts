import { getRegisterApiUrl } from '../lib/bookingApi';

export type TelegramVisitor = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export async function registerTelegramVisitor(
  user: TelegramVisitor,
): Promise<void> {
  const apiUrl = getRegisterApiUrl();
  if (!apiUrl) return;

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      }),
      keepalive: true,
    });
  } catch {
    /* не блокируем UI */
  }
}
