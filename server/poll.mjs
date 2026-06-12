import { handleTelegramUpdate } from './bot.mjs';

async function webhookIsSet(token) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    return Boolean(data.ok && data.result?.url);
  } catch {
    return false;
  }
}

/** Long polling, пока webhook не настроен (нет HTTPS). */
export async function startTelegramPolling(env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  if (env.TELEGRAM_USE_POLLING === 'false') return;
  if (await webhookIsSet(token)) {
    console.log('telegram: webhook active, polling disabled');
    return;
  }

  console.log('telegram: starting long polling (no webhook)');

  let offset = 0;
  let running = true;

  const loop = async () => {
    while (running) {
      try {
        const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
        url.searchParams.set('timeout', '25');
        url.searchParams.set('offset', String(offset));
        url.searchParams.set(
          'allowed_updates',
          JSON.stringify(['message', 'edited_message', 'my_chat_member']),
        );

        const res = await fetch(url);
        const data = await res.json();

        if (!data.ok) {
          console.error('telegram poll error', data);
          await sleep(5000);
          continue;
        }

        for (const update of data.result ?? []) {
          offset = update.update_id + 1;
          await handleTelegramUpdate(env, update);
        }
      } catch (err) {
        console.error('telegram poll failed', err);
        await sleep(5000);
      }
    }
  };

  loop();

  return () => {
    running = false;
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
