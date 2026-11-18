#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu 22.04 / 24.04 or Debian 12 VPS, run as root:
#   DOMAIN=holorra.example.com bash setup.sh
# Then copy the code to /opt/holorra (see deploy/README.md) and run deploy.sh.
set -euo pipefail
: "${DOMAIN:?set DOMAIN=your.domain}"

apt-get update
apt-get install -y curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https rsync

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Caddy (automatic HTTPS)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy

# app user and folders
id holorra >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin holorra
mkdir -p /opt/holorra && chown holorra:holorra /opt/holorra
[ -f /etc/holorra.env ] || { printf 'AHOLO_API_KEY=\nAHOLO_REGION=com\n' > /etc/holorra.env; chmod 600 /etc/holorra.env; }

# 2 GB swap so `next build` does not run out of memory on small VPSs
if ! swapon --show | grep -q swapfile && [ "$(free -m | awk '/Mem:/{print $2}')" -lt 3000 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# service + Caddy config
install -m 644 "$(dirname "$0")/holorra.service" /etc/systemd/system/holorra.service
sed "s/holorra.example.com/${DOMAIN}/g" "$(dirname "$0")/Caddyfile" > /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable holorra
systemctl reload caddy || systemctl restart caddy

# firewall, if ufw is present
if command -v ufw >/dev/null; then ufw allow OpenSSH; ufw allow 80; ufw allow 443; fi
echo "Setup done. Put AHOLO_API_KEY in /etc/holorra.env (optional), copy the code to /opt/holorra, then run deploy.sh."
