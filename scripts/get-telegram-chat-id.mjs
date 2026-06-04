/**
 * Показывает chat_id из последних сообщений боту.
 * Использование: TELEGRAM_BOT_TOKEN=xxx node scripts/get-telegram-chat-id.mjs
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();
if (!data.ok) {
  console.error(data);
  process.exit(1);
}

const chats = new Map();
for (const u of data.result ?? []) {
  const chat = u.message?.chat ?? u.channel_post?.chat;
  if (chat) chats.set(chat.id, chat);
}

if (chats.size === 0) {
  console.log('Нет сообщений. Напишите боту /start в Telegram и запустите снова.');
  process.exit(0);
}

console.log('Доступные chat_id:');
for (const [id, chat] of chats) {
  const title = chat.title ?? `${chat.first_name ?? ''} ${chat.last_name ?? ''}`.trim();
  console.log(`  ${id}  —  ${title || chat.username || 'chat'}`);
}
