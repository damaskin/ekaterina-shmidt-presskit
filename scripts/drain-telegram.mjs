/**
 * Сбрасывает webhook и обрабатывает очередь через getUpdates.
 * TELEGRAM_BOT_TOKEN=xxx node scripts/drain-telegram.mjs
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const apiBase = process.env.API_BASE ?? 'http://127.0.0.1:3002';

if (!token) {
  console.error('Need TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });
console.log('webhook deleted');

let offset = 0;
let processed = 0;

for (let round = 0; round < 20; round += 1) {
  const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
  url.searchParams.set('timeout', '5');
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) {
    console.error(data);
    break;
  }
  if (!data.result?.length) {
    console.log('queue empty');
    break;
  }

  for (const update of data.result) {
    offset = update.update_id + 1;
    const fwd = await fetch(`${apiBase}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    console.log('update', update.update_id, fwd.status);
    processed += 1;
  }
}

console.log('processed', processed);

const set = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://shmidt01.ru/webhook',
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: false,
  }),
});
console.log(await set.json());
