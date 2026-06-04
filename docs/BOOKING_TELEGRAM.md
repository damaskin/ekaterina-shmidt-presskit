# Booking → Telegram

Токен бота **нельзя** хранить во фронтенде или в git. Используется Cloudflare Worker.

## 1. Chat ID

1. Напишите боту в Telegram любое сообщение (например `/start`).
2. Локально:

```bash
TELEGRAM_BOT_TOKEN=ваш_токен node scripts/get-telegram-chat-id.mjs
```

Скопируйте `chat_id`.

## 2. Деплой Worker

```bash
npm install -g wrangler
wrangler login
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler deploy
```

Скопируйте URL вида `https://ekaterina-shmidt-booking.<subdomain>.workers.dev`.

## 3. GitHub Pages

В репозитории: **Settings → Secrets and variables → Actions → Variables**

- `VITE_BOOKING_API_URL` = URL worker (без слэша в конце)

Пересоберите сайт (push в `master`).

## 4. Локальная разработка

Файл `.env.local`:

```
VITE_BOOKING_API_URL=https://...
```

---

Если токен бота светился в чате — отзовите в [@BotFather](https://t.me/BotFather) и выпустите новый.
