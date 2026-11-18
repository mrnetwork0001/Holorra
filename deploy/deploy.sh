#!/usr/bin/env bash
# Build and (re)start Holorra on the VPS. Run as root from /opt/holorra after each code update:
#   bash deploy/deploy.sh
set -euo pipefail
cd /opt/holorra
chown -R holorra:holorra /opt/holorra
sudo -u holorra npm ci --no-audit --no-fund
sudo -u holorra npm run build
systemctl restart holorra
sleep 3
curl -fsS -o /dev/null -w "local check: HTTP %{http_code}\n" http://127.0.0.1:3000/
curl -fsS http://127.0.0.1:3000/api/aholo/status | head -c 300; echo
