#!/usr/bin/env bash
# One-time server setup, run as root ON THE SERVER after the code is in /opt/holorra:
#   DOMAIN=holorra.example.com bash /opt/holorra/deploy/setup.sh
# Safe on a shared host: it never overwrites an existing Caddyfile, never restarts Caddy (graceful reload only)
# and touches no other service. Needs Node.js >= 20 and Caddy v2 already installed.
set -euo pipefail
: "${DOMAIN:?set DOMAIN=your.domain}"
command -v node >/dev/null || { echo "Install Node.js 20+ first"; exit 1; }
command -v caddy >/dev/null || { echo "Install Caddy v2 first (https://caddyserver.com/docs/install)"; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"

id holorra >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/holorra --shell /usr/sbin/nologin holorra
chown -R holorra:holorra /opt/holorra
[ -f /etc/holorra.env ] || { printf 'AHOLO_API_KEY=\nAHOLO_REGION=com\n' > /etc/holorra.env; chmod 600 /etc/holorra.env; }

# app service
install -m 644 "$HERE/holorra.service" /etc/systemd/system/holorra.service
systemctl daemon-reload
systemctl enable holorra >/dev/null

# Caddy: our own file in conf.d; add the import line only if the main Caddyfile lacks it
mkdir -p /etc/caddy/conf.d
sed "s/holorra.example.com/${DOMAIN}/g" "$HERE/holorra.caddy" > /etc/caddy/conf.d/holorra.caddy
grep -q 'import /etc/caddy/conf.d/\*.caddy' /etc/caddy/Caddyfile 2>/dev/null || {
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
  printf '\nimport /etc/caddy/conf.d/*.caddy\n' >> /etc/caddy/Caddyfile
}
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
echo "Setup done. Next: bash /opt/holorra/deploy/deploy.sh (on the server) or deploy/redeploy.sh (from your machine)."
