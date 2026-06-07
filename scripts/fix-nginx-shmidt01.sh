#!/usr/bin/env bash
set -euo pipefail

NGINX_CONF=/opt/rayn-repo/infra/deploy/nginx.conf
COMPOSE=/opt/rayn-repo/infra/deploy/docker-compose.prod.yml

if ! grep -q 'shmidt01.conf' "$NGINX_CONF"; then
  sed -i '/include \/etc\/nginx\/tenants.d\/\*\.conf;/i \  include /etc/nginx/shmidt01.conf;' "$NGINX_CONF"
  echo "Patched nginx.conf include"
fi

if ! grep -q 'shmidt-presskit' "$COMPOSE"; then
  python3 - <<'PY'
from pathlib import Path
p = Path("/opt/rayn-repo/infra/deploy/docker-compose.prod.yml")
text = p.read_text()
needle = "      - ../../apps/landing:/var/www/rayn-landing:ro\n"
insert = needle + "      - /opt/ekaterina-shmidt/web:/var/www/shmidt-presskit:ro\n      - /opt/ekaterina-shmidt/infra/shmidt01/nginx-shmidt01.conf:/etc/nginx/shmidt01.conf:ro\n"
if "/var/www/shmidt-presskit" not in text:
    text = text.replace(needle, insert)
    p.write_text(text)
    print("Patched docker-compose.prod.yml volumes")
PY
fi

cd /opt/rayn-repo/infra/deploy
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d nginx
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T nginx nginx -t
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T nginx nginx -s reload

echo "--- smoke ---"
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/ | grep -o '<title>[^<]*</title>'
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/api/health
