#!/usr/bin/env bash
set -euo pipefail

NGINX_CONF=/opt/rayn-repo/infra/deploy/nginx.conf
COMPOSE=/opt/rayn-repo/infra/deploy/docker-compose.prod.yml
TENANTS_DIR=/opt/rayn-repo/infra/deploy/tenants.d
PRESSKIT_INFRA=/opt/ekaterina-shmidt/infra/shmidt01
COMPOSE_PATCHED=0

# tenants.d — основной vhost shmidt01.ru (не shmidt01.conf)
if [ -f "${PRESSKIT_INFRA}/tenants.d/shmidt01.ru.conf" ]; then
  install -d "$TENANTS_DIR"
  cp "${PRESSKIT_INFRA}/tenants.d/shmidt01.ru.conf" "${TENANTS_DIR}/shmidt01.ru.conf"
  echo "Synced tenants.d/shmidt01.ru.conf"
fi

# Убрать битый include, если файла нет в контейнере
if grep -q 'include /etc/nginx/shmidt01.conf' "$NGINX_CONF" \
  && ! docker compose --env-file /opt/rayn-repo/infra/deploy/.env.prod \
    -f "$COMPOSE" exec -T nginx test -f /etc/nginx/shmidt01.conf 2>/dev/null; then
  sed -i '/include \/etc\/nginx\/shmidt01.conf;/d' "$NGINX_CONF"
  echo "Removed stale include /etc/nginx/shmidt01.conf"
fi

if ! grep -q 'shmidt-presskit' "$COMPOSE"; then
  python3 - <<'PY'
from pathlib import Path
p = Path("/opt/rayn-repo/infra/deploy/docker-compose.prod.yml")
text = p.read_text()
needle = "      - ../../apps/landing:/var/www/rayn-landing:ro\n"
insert = needle + "      - /opt/ekaterina-shmidt/web:/var/www/shmidt-presskit:ro\n"
if "/var/www/shmidt-presskit" not in text:
    text = text.replace(needle, insert)
    p.write_text(text)
    print("Patched docker-compose.prod.yml volumes")
PY
  COMPOSE_PATCHED=1
fi

cd /opt/rayn-repo/infra/deploy
if [ "$COMPOSE_PATCHED" = 1 ]; then
  docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --no-deps --force-recreate nginx
else
  echo "Compose unchanged — reloading nginx only"
fi
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T nginx nginx -t
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T nginx nginx -s reload

echo "--- smoke ---"
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/ | grep -o '<title>[^<]*</title>'
MAIN=$(curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/ | grep -o 'main-[^"]*\.js' | head -1)
curl -sfk -o /dev/null -w "main_js=%{http_code}\n" --resolve shmidt01.ru:443:127.0.0.1 "https://shmidt01.ru/assets/${MAIN}"
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/api/health
