#!/usr/bin/env bash
# Install dependencies and (re)start Holorra, ON THE SERVER, from /opt/holorra.
# Builds on the server only if no .next build was uploaded (building needs ~2 GB RAM).
set -euo pipefail
cd /opt/holorra
chown -R holorra:holorra /opt/holorra
SUM=$(sha256sum package-lock.json | cut -d" " -f1)
if [ ! -d node_modules ] || [ "$(cat .lock-sha 2>/dev/null)" != "$SUM" ]; then
  runuser -u holorra -- env HOME=/home/holorra nice -n 10 ionice -c3 npm ci --no-audit --no-fund --loglevel=error
  echo "$SUM" > .lock-sha
fi
[ -f .next/BUILD_ID ] || runuser -u holorra -- env HOME=/home/holorra nice -n 10 npm run build
systemctl restart holorra
for i in $(seq 1 30); do c=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3720/ || true); [ "$c" = "200" ] && break; sleep 1; done
echo "holorra local check: HTTP $c"
