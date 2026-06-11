#!/usr/bin/env bash
set -euo pipefail

echo "=== HOST ==="
hostname
uptime

echo "=== WEB INDEX (asset refs) ==="
grep assets /opt/ekaterina-shmidt/web/index.html | head -5
stat /opt/ekaterina-shmidt/web/index.html | grep Modify

echo "=== ASSETS ==="
ls -lt /opt/ekaterina-shmidt/web/assets/*.js 2>/dev/null | head -8

echo "=== NGINX MOUNT ==="
docker exec rayn-prod-nginx-1 ls -la /var/www/shmidt-presskit/index.html
docker exec rayn-prod-nginx-1 test -f /etc/nginx/tenants.d/shmidt01.ru.conf && echo "tenants.d/shmidt01.ru.conf OK"

echo "=== CURL LOCAL ==="
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/api/health
echo
curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/ | grep -o 'main-[^"]*\.js' || true
MAIN=$(curl -sfk --resolve shmidt01.ru:443:127.0.0.1 https://shmidt01.ru/ | grep -o 'main-[^"]*\.js' | head -1)
if [ -n "$MAIN" ]; then
  curl -sfk -o /dev/null -w "main_js_status=%{http_code}\n" --resolve shmidt01.ru:443:127.0.0.1 "https://shmidt01.ru/assets/$MAIN"
fi

echo "=== DOCKER ==="
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'nginx|shmidt' || true

echo "=== BOOKING ENV ==="
test -f /opt/ekaterina-shmidt/infra/shmidt01/.env && echo ".env OK" || echo ".env MISSING"
grep -q '^TELEGRAM_BOT_TOKEN=.\+' /opt/ekaterina-shmidt/infra/shmidt01/.env 2>/dev/null && echo "token OK" || echo "token MISSING"

echo "=== AUTHORIZED_KEYS (deploy) ==="
grep -c 'ICAroUPNQSW2CANzBk2m02rWnEwAg6nUd' /root/.ssh/authorized_keys 2>/dev/null || echo "deploy pubkey not found"
