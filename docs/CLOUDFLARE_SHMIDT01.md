# Cloudflare для shmidt01.ru (фикс обрыва загрузки)

## Симптом

В DevTools скрипты/CSS висят в **Pending**, скачивание обрывается на ~16–20 KB.
На сервере `curl --resolve shmidt01.ru:443:127.0.0.1` отдаёт файлы целиком за миллисекунды.

Это **не лимит nginx**, а **PMTU black hole** на маршруте клиент → VPS `167.233.91.168`.

## Решение (рекомендуется)

Проксировать домен через **Cloudflare** (бесплатный план).

1. Добавить зону `shmidt01.ru` в [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Сменить NS у регистратора на NS Cloudflare.
3. DNS записи:
   - `A` `shmidt01.ru` → `167.233.91.168` — **Proxied** (оранжевое облако)
   - `A` `www` → `167.233.91.168` — **Proxied** или CNAME на `shmidt01.ru`
4. SSL/TLS → **Full (strict)**.
5. Speed → Optimization → включить **Brotli** и **Auto Minify** (опционально).
6. Caching → Configuration:
   - `/assets/*` — Cache Everything, Edge TTL 1 month (у нас immutable хэши)
   - HTML — Respect origin (`no-cache` уже в nginx)

После пропагации DNS (обычно 5–30 мин) статика качается с edge CF, обрыв на 16 KB исчезает.

## Проверка

```bash
curl -sI https://shmidt01.ru/ | grep -i cf-ray
```

Должна быть строка `cf-ray: ...` — трафик идёт через Cloudflare.

## Альтернатива: Cloudflare Tunnel

Если NS менять нельзя — [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) на VPS.
Требует аккаунт CF и `cloudflared` на сервере.
