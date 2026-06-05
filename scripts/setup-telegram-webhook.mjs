/**
 * Регистрирует webhook бота на Worker.
 *
 * TELEGRAM_BOT_TOKEN=xxx \
 * WORKER_URL=https://ekaterina-shmidt-booking.xxx.workers.dev \
 * TELEGRAM_WEBHOOK_SECRET=optional-secret \
 * node scripts/setup-telegram-webhook.mjs
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const workerUrl = process.env.WORKER_URL?.replace(/\/$/, '');
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !workerUrl) {
  console.error('Need TELEGRAM_BOT_TOKEN and WORKER_URL');
  process.exit(1);
}

const webhookUrl = `${workerUrl}/webhook`;

const body = {
  url: webhookUrl,
  allowed_updates: ['message', 'edited_message'],
  drop_pending_updates: true,
};
if (secret) body.secret_token = secret;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));

if (!data.ok) process.exit(1);

const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
console.log(await info.json());
