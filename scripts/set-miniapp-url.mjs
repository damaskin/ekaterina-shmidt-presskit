/**
 * TELEGRAM_BOT_TOKEN=xxx node scripts/set-miniapp-url.mjs [url]
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.argv[2] ?? 'https://shmidt01.ru';

if (!token) {
  console.error('Need TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: 'Open',
      web_app: { url },
    },
  }),
});

const data = await res.json();
console.log('setChatMenuButton:', data);

const info = await fetch(`https://api.telegram.org/bot${token}/getChatMenuButton`).then((r) =>
  r.json(),
);
console.log('getChatMenuButton:', info);
