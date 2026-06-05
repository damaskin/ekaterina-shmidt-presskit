# Booking → Telegram

Ошибка **«Booking API is not configured»** значит: при сборке сайта не был задан `VITE_BOOKING_API_URL`.  
Токен бота **никогда** не кладём во фронт — только в Cloudflare Worker.

---

## Быстрый фикс (5 шагов)

### 1. Chat ID

Напишите боту в Telegram `/start`, затем локально:

```bash
TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН node scripts/get-telegram-chat-id.mjs
```

Скопируйте число `chat_id` (например `123456789`).

### 2. Cloudflare (бесплатно)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages  
2. **My Profile → API Tokens** → Create Token → шаблон **Edit Cloudflare Workers**  
3. Скопируйте токен и **Account ID** (на главной Workers справа)

### 3. Секреты в GitHub

Репозиторий → **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Значение |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | токен из п.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID |
| `TELEGRAM_BOT_TOKEN` | токен бота |
| `TELEGRAM_CHAT_ID` | chat_id из п.1 |

### 4. Деплой Worker

**Вариант A — через GitHub:**  
Actions → **Deploy Booking Worker** → Run workflow.

**Вариант B — локально:**

```bash
npx wrangler login
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```

После деплоя URL будет вида:

`https://ekaterina-shmidt-booking.<ваш-subdomain>.workers.dev`

Проверка в браузере: `POST` на этот URL из формы (или curl ниже).

### 5. URL в сборку Pages

**Settings → Secrets and variables → Actions → Variables** (не Secrets!):

| Variable | Значение |
|----------|----------|
| `VITE_BOOKING_API_URL` | `https://ekaterina-shmidt-booking.<subdomain>.workers.dev` |

Без слэша в конце.

Пересборка сайта:

```bash
git commit --allow-empty -m "Rebuild Pages with booking API"
git push
```

Или: Actions → **Deploy to GitHub Pages** → Run workflow.

---

## Локальная разработка

Файл `.env.local` (не коммитить):

```
VITE_BOOKING_API_URL=https://ekaterina-shmidt-booking.xxx.workers.dev
```

```bash
npm run dev
```

---

## Проверка Worker (curl)

```bash
curl -X POST "https://ВАШ-WORKER.workers.dev" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"t@t.com\",\"phone\":\"+7999\",\"eventDate\":\"2026-12-01\",\"venue\":\"Club\",\"city\":\"Moscow\",\"message\":\"Test booking message here\"}"
```

Ответ `{"ok":true}` — в Telegram должно прийти сообщение.

---

## Откат / безопасность

Токен, который светился в чате, лучше перевыпустить в [@BotFather](https://t.me/BotFather).
