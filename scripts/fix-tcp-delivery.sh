#!/usr/bin/env bash
# PMTU black hole: часть клиентов (RU ISP) обрывает TCP после ~16KB.
# Сервер отдаёт нормально; ломается маршрут до VPS. CF proxy — надёжный фикс.
set -euo pipefail

SYSCTL_FILE=/etc/sysctl.d/99-shmidt-tcp.conf
cat >"$SYSCTL_FILE" <<'EOF'
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_slow_start_after_idle = 0
EOF
sysctl -p "$SYSCTL_FILE"

clamp_mss() {
  local chain=$1
  local extra=${2:-}
  iptables -t mangle -D "$chain" -p tcp --tcp-flags SYN,RST SYN $extra -j TCPMSS --set-mss 1200 2>/dev/null || true
  iptables -t mangle -A "$chain" -p tcp --tcp-flags SYN,RST SYN $extra -j TCPMSS --set-mss 1200
}

IFACE=$(ip route show default | awk '{print $5; exit}')
clamp_mss FORWARD
clamp_mss INPUT
if [ -n "$IFACE" ]; then
  iptables -t mangle -D POSTROUTING -p tcp --tcp-flags SYN,RST SYN -o "$IFACE" -j TCPMSS --set-mss 1200 2>/dev/null || true
  iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -o "$IFACE" -j TCPMSS --set-mss 1200
  echo "TCPMSS 1200 on FORWARD/INPUT/POSTROUTING ($IFACE)"
fi

DAEMON=/etc/docker/daemon.json
mkdir -p /etc/docker
python3 - <<'PY'
import json
from pathlib import Path
p = Path("/etc/docker/daemon.json")
data = json.loads(p.read_text()) if p.exists() else {}
changed = data.get("userland-proxy") is not False
data["userland-proxy"] = False
p.write_text(json.dumps(data, indent=2) + "\n")
print("userland-proxy=false" + (" (restart docker if first time)" if changed else " (already set)"))
PY

echo "TCP delivery tuning applied."
