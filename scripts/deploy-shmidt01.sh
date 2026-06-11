#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-root@167.233.91.168}"
REMOTE_DIR="/opt/ekaterina-shmidt"
RAYN_DEPLOY="/opt/rayn-repo/infra/deploy"

echo "==> Build frontend"
cd "$ROOT"
VITE_BOOKING_API_URL="${VITE_BOOKING_API_URL:-https://shmidt01.ru/api/booking}" npm run build

echo "==> Sync to server"
ssh "$HOST" "mkdir -p $REMOTE_DIR/web $REMOTE_DIR/infra/shmidt01/data"
rsync -az --delete "$ROOT/dist/assets/" "$HOST:$REMOTE_DIR/web/assets/"
rsync -az --delete --exclude 'assets/' "$ROOT/dist/" "$HOST:$REMOTE_DIR/web/"
rsync -az "$ROOT/server/" "$HOST:$REMOTE_DIR/server/"
rsync -az --exclude '.env' --exclude 'data/' "$ROOT/infra/shmidt01/" "$HOST:$REMOTE_DIR/infra/shmidt01/"

echo "==> Build & start booking API"
ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/ekaterina-shmidt/infra/shmidt01
if [[ ! -f .env ]]; then
  echo "Create /opt/ekaterina-shmidt/infra/shmidt01/.env from .env.example first"
  exit 1
fi
docker compose build --pull
docker compose up -d
REMOTE

echo "==> Patch nginx (if snippet not yet included)"
ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
NGINX_CONF=/opt/rayn-repo/infra/deploy/nginx.conf
SNIPPET=/opt/ekaterina-shmidt/infra/shmidt01/nginx-shmidt01.conf
COMPOSE=/opt/rayn-repo/infra/deploy/docker-compose.prod.yml

if ! grep -q 'shmidt01.ru' "$NGINX_CONF"; then
  sed -i '/include \/etc\/nginx\/tenants.d\/\*\.conf;/i \
  include /etc/nginx/shmidt01.conf;' "$NGINX_CONF"
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
PY
fi

cd /opt/rayn-repo/infra/deploy
docker compose -f docker-compose.prod.yml up -d nginx
docker exec rayn-prod-nginx-1 nginx -t
docker exec rayn-prod-nginx-1 nginx -s reload
REMOTE

echo "Done. Set DNS A @ and www -> 91.201.54.196, then issue cert:"
echo "  ssh $HOST 'cd /opt/rayn-repo/infra/deploy && docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d shmidt01.ru -d www.shmidt01.ru --agree-tos -m admin@shmidt01.ru --no-eff-email'"
