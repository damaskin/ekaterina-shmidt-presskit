# shmidt01.ru — VPS deploy

Сервер: **91.201.54.196** (Ubuntu 24.04, Docker nginx rayn-prod).

## Что уже на сервере

| Путь | Назначение |
|------|------------|
| `/opt/ekaterina-shmidt/web` | статика presskit |
| `/opt/ekaterina-shmidt/server` | booking API (Node + SQLite) |
| `/opt/ekaterina-shmidt/infra/shmidt01` | docker-compose, nginx snippet |
| `shmidt-booking-api` | контейнер API в сети `rayn-prod_default` |

Nginx отдаёт `shmidt01.ru` по HTTP (bootstrap), проксирует `/api/*` и `/webhook`.

---

## DNS (reg.ru)

В панели домена **shmidt01.ru** → DNS / Ресурсные записи:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A | `@` | `91.201.54.196` | 300 |
| A | `www` | `91.201.54.196` | 300 |

Удалите старые A/CNAME, если указывают на другой хостинг.  
Проверка (через 5–30 мин):

```bash
dig +short shmidt01.ru A @8.8.8.8
# должно быть 91.201.54.196
```

---

## Telegram (.env)

На сервере: `/opt/ekaterina-shmidt/infra/shmidt01/.env`

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_OWNER_ID=...      # ваш chat_id — владелец, /promote
TELEGRAM_CHAT_ID=...       # fallback до появления админов
TELEGRAM_WEBHOOK_SECRET=... # опционально
```

После правок:

```bash
cd /opt/ekaterina-shmidt/infra/shmidt01
docker compose up -d
```

Webhook:

```bash
TELEGRAM_BOT_TOKEN=... \
WORKER_URL=https://shmidt01.ru \
TELEGRAM_WEBHOOK_SECRET=... \
npm run bot:webhook
```

(URL webhook: `https://shmidt01.ru/webhook`)

### Пользователи и админы букинга

| Действие | Как |
|----------|-----|
| Открыли Mini App | chat_id сохраняется автоматически (`POST /api/register`) |
| Написали боту | `/start` — регистрация в SQLite |
| Список всех id | владелец: `/users` |
| Кто получает заявки | владелец: `/admins` |
| Выдать права | `/promote <chat_id>` |
| Снять права | `/demote <chat_id>` |

---

## SSL (после DNS)

```bash
cd /opt/rayn-repo/infra/deploy
docker compose --env-file .env.prod run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d shmidt01.ru -d www.shmidt01.ru \
  --agree-tos -m admin@shmidt01.ru --no-eff-email
```

Затем переключить nginx на HTTPS-конфиг:

```bash
# в docker-compose.prod.yml заменить mount:
# nginx-shmidt01.bootstrap.conf → nginx-shmidt01.conf
cd /opt/rayn-repo/infra/deploy
docker compose --env-file .env.prod up -d nginx
docker exec rayn-prod-nginx-1 nginx -s reload
```

---

## Автодеплой (GitHub Actions)

При пуше в `master` / `main` запускается workflow **Deploy to shmidt01.ru**.

**Secrets** (Settings → Secrets and variables → Actions):

| Secret | Значение |
|--------|----------|
| `SHMIDT01_SSH_PRIVATE_KEY` | приватный SSH-ключ (весь файл, включая `BEGIN/END`) |

**Variables** (опционально):

| Variable | По умолчанию |
|----------|--------------|
| `SHMIDT01_SSH_HOST` | `91.201.54.196` |
| `SHMIDT01_SSH_USER` | `root` |
| `VITE_BOOKING_API_URL` | `https://shmidt01.ru/api/booking` |

На сервере `.env` **не перезаписывается** при деплое.

Ручной запуск: Actions → Deploy to shmidt01.ru → Run workflow.

## Обновление вручную (с локальной машины)

```bash
VITE_BOOKING_API_URL=https://shmidt01.ru/api/booking npm run build
scp -r dist/* root@91.201.54.196:/opt/ekaterina-shmidt/web/
```

Или `bash scripts/deploy-shmidt01.sh` (Git Bash / WSL).

---

## SSH-ключ

В `authorized_keys` добавлен публичный ключ:

`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICAroUPNQSW2CANzBk2m02rWnEwAg6nUd+HRJdL9+Kj3`

Подключение возможно только с **приватным** ключом, парой к этому публичному.
