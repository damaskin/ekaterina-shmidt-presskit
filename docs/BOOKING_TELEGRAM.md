# Booking → Telegram

Форма на сайте шлёт `POST` на Cloudflare Worker. Worker:

1. **Сохраняет заявку** в D1 (`bookings`)
2. **Шлёт уведомление** всем **админам** из базы (`users.is_admin = 1`)
3. Если админов ещё нет — fallback на `TELEGRAM_CHAT_ID`

Пользователи регистрируются в боте (`/start`). Владелец назначает админов — те получают букинги.

---

## Архитектура

| Endpoint | Назначение |
|----------|------------|
| `POST /` | заявка с сайта (как раньше) |
| `POST /webhook` | команды Telegram-бота |
| `GET /health` | проверка worker |

**Таблицы D1:**

- `users` — chat_id, имя, `is_admin`, `is_owner`
- `bookings` — история заявок с сайта

---

## Первичная настройка

### 1. Секреты GitHub (Actions → Secrets)

| Secret | Обязательно | Описание |
|--------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | да | Edit Cloudflare Workers |
| `CLOUDFLARE_ACCOUNT_ID` | да | Account ID |
| `TELEGRAM_BOT_TOKEN` | да | токен от @BotFather |
| `TELEGRAM_OWNER_ID` | да* | chat_id владельца (может /promote) |
| `TELEGRAM_CHAT_ID` | да* | fallback для уведомлений до появления админов |
| `D1_DATABASE_ID` | да | UUID базы D1 (см. ниже) |
| `TELEGRAM_WEBHOOK_SECRET` | нет | секрет для `POST /webhook` |

\* `TELEGRAM_OWNER_ID` и `TELEGRAM_CHAT_ID` могут совпадать (один человек).

Узнать chat_id:

```bash
TELEGRAM_BOT_TOKEN=xxx node scripts/get-telegram-chat-id.mjs
```

### 2. Создать D1 и миграции

```bash
npm install
npx wrangler login
npm run d1:create
```

Скопируйте `database_id` из вывода → в `wrangler.toml` вместо `REPLACE_WITH_D1_DATABASE_ID`  
**и** добавьте тот же UUID в GitHub Secret `D1_DATABASE_ID`.

```bash
npm run d1:migrate:remote
```

### 3. Деплой Worker

Actions → **Deploy Booking Worker** → Run workflow  
или локально:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_OWNER_ID
npx wrangler secret put TELEGRAM_CHAT_ID
# опционально:
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npm run deploy:booking
```

URL: `https://ekaterina-shmidt-booking.<subdomain>.workers.dev`

### 4. Webhook бота

```bash
TELEGRAM_BOT_TOKEN=xxx \
WORKER_URL=https://ekaterina-shmidt-booking.xxx.workers.dev \
TELEGRAM_WEBHOOK_SECRET=your-random-secret \
npm run bot:webhook
```

Если задали `TELEGRAM_WEBHOOK_SECRET` — тот же секрет в GitHub Secrets и в `setWebhook`.

### 5. URL для фронта (GitHub Variables)

| Variable | Значение |
|----------|----------|
| `VITE_BOOKING_API_URL` | `https://ekaterina-shmidt-booking.xxx.workers.dev` |

Пересоберите Pages (push или Run workflow).

---

## Команды бота (личка)

| Команда | Кто | Действие |
|---------|-----|----------|
| `/start` | все | регистрация в базе |
| `/me` | все | статус и chat_id |
| `/help` | все | список команд |
| `/users` | владелец | все пользователи |
| `/admins` | владелец | кто получает букинги |
| `/promote <chat_id>` | владелец | сделать админом |
| `/demote <chat_id>` | владелец | снять админа |

**Сценарий:**

1. Владелец пишет боту `/start` → становится owner + admin
2. Менеджер пишет `/start` → видит свой `chat_id`
3. Владелец: `/promote 123456789`
4. Менеджер начинает получать уведомления о заявках с сайта

---

## Локальная разработка

`.env.local` (не коммитить):

```
VITE_BOOKING_API_URL=http://127.0.0.1:8787
```

```bash
npm run d1:migrate:local
npm run worker:dev
```

Для webhook на локалку нужен туннель (cloudflared / ngrok) — на проде проще.

---

## Проверка

**Форма / curl:**

```bash
curl -X POST "https://ВАШ-WORKER.workers.dev" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"t@t.com\",\"phone\":\"+79991234567\",\"eventDate\":\"2026-12-01\",\"venue\":\"Club\",\"city\":\"Moscow\",\"message\":\"Test booking message here\"}"
```

Ответ: `{"ok":true,"notified":1}` — сообщение ушло админам.

**Health:**

```bash
curl https://ВАШ-WORKER.workers.dev/health
```

---

## Безопасность

- Токен бота только в Worker secrets, не во фронт
- Перевыпустите токен в @BotFather, если светился в чате
- `TELEGRAM_WEBHOOK_SECRET` защищает `/webhook` от посторонних POST
