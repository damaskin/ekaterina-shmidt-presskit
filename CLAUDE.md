# Ekaterina Shmidt — DJ Presskit

Одностраничный пресс-кит диджея: React 19 + Vite 7 + TypeScript (strict) + framer-motion, WebGL-эффекты (Aurora, SplashCursor). Работает в трёх средах: сайт **shmidt01.ru** (VPS), зеркало на **GitHub Pages**, **Telegram Mini App** с формой букинга.

## Команды

```bash
npm run dev              # dev-сервер http://localhost:5173
npm run build            # tsc -b + vite build + sitemap → dist/
npm run build:ghpages    # то же, но base=/ekaterina-shmidt-presskit/
node scripts/check-bundle-url.mjs   # после build: проверить, что API-URL запечён в бандл
```

Тестов и линтера в проекте нет; проверка корректности — `npm run build` (включает tsc).

## Архитектура

- `src/slides/` — 6 полноэкранных слайдов (cover, about, styles, experience, releases, rider), scroll-snap.
- `src/components/` — оверлеи: AudioPlayer (WAV-микс с WebAudio-визуализацией), NavDots, BookingModal, LanguageSwitcher; `effects/` — Aurora (WebGL-шейдер с CSS-fallback), SplashCursor. Тяжёлые эффекты гейтятся `usePerformanceProfile`.
- `src/i18n/` — самописная i18n, 8 локалей (en/ru/de/ar/hi/es/fr/zh, ar — RTL); смена локали переписывает SEO-блок head через `lib/seo.ts`.
- Telegram Mini App: `useTelegramWebApp` (детект, fullscreen, safe-area → CSS-переменные `--tg-*`), `TelegramMainButton` управляет сабмитом формы через `BookingContext.registerSubmitHandler`, `useTelegramPlayerLayout` якорит плеер на bottom:12px. Скролл в TG переносится с body на `#root` (`telegram-webapp.css`).

## ДВА бэкенда букинга — синхронизировать вручную!

| | `server/` (ПРОД) | `worker/` (резерв) |
|---|---|---|
| Платформа | Node + SQLite в Docker на VPS | Cloudflare Worker + D1 |
| Деплой | автоматически при push в master | только вручную (workflow_dispatch) |
| Бот | `server/bot.mjs` | `worker/src/bot.js` (почти копия) |

Боевой API — `https://shmidt01.ru/api/booking` (nginx срезает `/api`, в коде маршруты `/booking`, `/register`, `/webhook`, `/payments/yookassa`, `/health`). Правки логики бота/букинга нужно вносить в обе реализации или осознанно забить на worker/.

## Продажа гайда (только server/)

Платный гайд продаётся через бота с оплатой в ЮKassa и доставкой защищёнными сообщениями (`protect_content`). Кнопка на `/guide/` → `t.me/<bot>?start=guide` → бот спрашивает email (чек 54-ФЗ) → платёж ЮKassa → webhook `payment.succeeded` на `/api/payments/yookassa` → бот отдаёт текст гайда. Код: `server/guide*.mjs`, `server/yookassa.mjs`, `server/payments.mjs`, таблица `purchases`. Текст гайда в `server/guide-content.mjs` — дефолт, копия веб-страницы (синхронизировать вручную); из админки текст можно переопределить (хранится в таблице `settings`). Реализовано **только в server/** (worker/ не трогали). Runbook и переменные окружения — `docs/GUIDE_SALES.md`. Username бота для кнопки — `VITE_GUIDE_BOT_USERNAME` (запекается в бандл).

**Админ-панель** `shmidt01.ru/admin` (вход по `ADMIN_PASSWORD`, cookie-сессия HMAC), вкладки (Обзор/Пользователи/Покупки/Гайд/Рассылка): статистика, список пользователей с ролями и статусом блокировки, таблица покупок со статусами + повторная отправка, цена/вкл-выкл продаж, редактор текста гайда, **рассылка по всем пользователям**. Статика — `admin/` (Vite-вход), API — `server/admin.mjs` под `/api/admin/*`, авторизация — `server/admin-auth.mjs`, настройки — `server/settings.mjs` + таблица `settings` (перекрывают env). Cookie `Secure` → только HTTPS.

**Сохранение пользователей и рассылка.** `bot.mjs` сохраняет (`captureUser`) КАЖДОГО, кто пишет боту, и ловит `my_chat_member` (блок/разблок → флаг `users.is_blocked`). Для `my_chat_member` в `allowed_updates` добавлен этот тип (drain-telegram.mjs, setup-telegram-webhook.mjs, poll.mjs). Рассылка — `server/broadcast.mjs`: фоновая, троттлинг ~20 msg/sec, 403 → пометка заблокировавших, 429 → retry_after, итог админам в Telegram. Только не-заблокировавшие (`is_blocked=0`).

## Деплой

- **Каждый push в master** запускает два workflow: GitHub Pages и VPS (rsync по SSH на root@167.233.91.168, пересборка Docker-контейнера API, дренаж Telegram-очереди, смоук-тест). Старый IP 91.201.54.196 мёртв (сервер переехал в июне 2026).
- nginx на VPS — **чужой** (контейнер соседнего проекта rayn-prod в `/opt/rayn-repo`); `scripts/fix-nginx-shmidt01.sh` при каждом деплое идемпотентно вшивает конфиг shmidt01. Якорные строки патча хрупкие — если домен вдруг отвечает RaynBot'ом, смотреть сюда.
- Секреты Telegram живут только на сервере в `/opt/ekaterina-shmidt/infra/shmidt01/.env` (rsync их не трогает).
- `wrangler.toml` содержит плейсхолдер `REPLACE_WITH_D1_DATABASE_ID` — это норма, CI подставляет секрет sed'ом.
- Runbooks: `docs/SHMIDT01_DEPLOY.md` (актуальный, VPS), `docs/BOOKING_TELEGRAM.md` (worker-путь).

## Грабли

- `scripts/verify-deploy.mjs` и `verify-deploy-api.mjs` шлют **реальную** заявку — админы получат уведомление в Telegram. Не запускать просто так.
- API-URL запекается в бандл на этапе сборки (`VITE_BOOKING_API_URL`); ghpages-сборка без него — известный класс багов, для этого есть `scripts/check-bundle-url.mjs`.
- Ассеты дублируются в `assets/` (исходники) и `public/assets/` (идёт в dist) — скрипты пишут в обе, руками не рассинхронизировать.
- Логотип на обложке — `logo-reference.svg` (генерируется `npm run assets:logo-svg` из `assets/logo-reference-source.jpg`); PNG-версии в приложении не используются.
- Разработка на Windows, исполнение на Linux: деплой-скрипты повсюду чистят CRLF (`sed -i 's/\r$//'`). Шелл-скрипты сохранять с LF.
- В git закоммичен WAV-микс 36,7 МБ (`public/assets/DJ SHMIDT - Burning Inside mix downtempo.WAV`).
- Локального `.env` нет: при `npm run dev` форма букинга ходит на боевой `https://shmidt01.ru/api/booking` (CORS разрешает localhost:5173) — отправка формы из dev создаёт реальную заявку.
