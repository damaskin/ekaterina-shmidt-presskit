/**
 * Рассылка по всем пользователям бота.
 * Шлём фоном с троттлингом (~20 msg/sec — под лимиты Telegram), 403 помечаем
 * как заблокировавших, на 429 ждём retry_after. Итог уходит админам в Telegram.
 * Параллельные рассылки запрещены (in-memory лок).
 */
import { listBroadcastRecipients, listUsers, setUserBlocked } from './db.mjs';
import { sendTelegramMessage } from './telegram.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE_MS = 45; // ~22 сообщения в секунду

let running = false;

export function isBroadcasting() {
  return running;
}

function adminRecipients(env) {
  let ids = [];
  try {
    ids = listUsers(env.database)
      .filter((u) => u.is_admin)
      .map((u) => u.chat_id);
  } catch {
    /* ignore */
  }
  if (ids.length === 0 && env.TELEGRAM_CHAT_ID) ids = [Number(env.TELEGRAM_CHAT_ID)];
  return [...new Set(ids)];
}

// Рассылку шлём как обычный текст (parse_mode отключён), чтобы случайные
// символы < и & не ломали доставку; ссылки оставляем с превью.
function sendOptions() {
  return { parse_mode: undefined, disable_web_page_preview: false };
}

/**
 * Запускает рассылку в фоне. Возвращает сразу.
 * @returns {{ started: boolean, queued?: number }}
 */
export function startBroadcast(env, text) {
  if (running) return { started: false };
  const recipients = listBroadcastRecipients(env.database);
  running = true;

  void (async () => {
    let sent = 0;
    let failed = 0;
    let blocked = 0;
    try {
      for (const chatId of recipients) {
        let res = await sendTelegramMessage(env, chatId, text, sendOptions());
        if (!res?.ok && res?.error_code === 429) {
          await sleep(((res.parameters?.retry_after ?? 1) + 1) * 1000);
          res = await sendTelegramMessage(env, chatId, text, sendOptions());
        }
        if (res?.ok) {
          sent += 1;
        } else {
          failed += 1;
          if (res?.error_code === 403) {
            setUserBlocked(env.database, chatId, true);
            blocked += 1;
          }
        }
        await sleep(THROTTLE_MS);
      }
    } catch (err) {
      console.error('broadcast failed', err);
    } finally {
      running = false;
      const summary = [
        '📣 <b>Рассылка завершена</b>',
        `Получателей: ${recipients.length}`,
        `Доставлено: ${sent}`,
        `Не доставлено: ${failed}`,
        blocked ? `Заблокировали бота: ${blocked}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      for (const id of adminRecipients(env)) {
        try {
          await sendTelegramMessage(env, id, summary);
        } catch {
          /* ignore */
        }
      }
    }
  })();

  return { started: true, queued: recipients.length };
}
