# Deploying Holorra on a VPS

One Next.js process behind Caddy, which serves your domain over HTTPS and renews the certificate itself.
No database, no queue, no cron. Tested layout: Ubuntu 22.04 / 24.04 or Debian 12, 1 vCPU, 2 GB RAM or more.

| File | Goes to | Purpose |
| --- | --- | --- |
| `setup.sh` | run once as root | installs Node.js 20 and Caddy, creates the `holorra` user, adds swap on small machines, installs the service and Caddy config |
| `holorra.service` | `/etc/systemd/system/` | runs `next start` on `127.0.0.1:3000`, restarts on failure |
| `Caddyfile` | `/etc/caddy/Caddyfile` | HTTPS for your domain, reverse proxy to the app, long cache for static assets |
| `deploy.sh` | run after each update | `npm ci`, `npm run build`, restart, local health check |

## 1. DNS

At your domain registrar, point the domain at the VPS:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | your VPS IPv4 address |
| `CNAME` | `www` | your domain |

Wait until `ping your.domain` answers with the VPS address before step 3; Caddy needs it to get the certificate.

## 2. Copy the code to the server

The repository is private, so either push the files from your machine:

```bash
rsync -az --delete \
  --exclude node_modules --exclude '.next*' --exclude .env.local --exclude .git \
  ./ root@YOUR_VPS_IP:/opt/holorra/
```

or clone on the server with a GitHub token or deploy key:

```bash
git clone https://github.com/mrnetwork0001/Holorra.git /opt/holorra
```

## 3. One-time setup

```bash
ssh root@YOUR_VPS_IP
cd /opt/holorra
DOMAIN=your.domain bash deploy/setup.sh
nano /etc/holorra.env        # optional: AHOLO_API_KEY=..., AHOLO_REGION=com or cn
```

## 4. Build and start

```bash
bash /opt/holorra/deploy/deploy.sh
```

It prints `local check: HTTP 200` and the `/api/aholo/status` JSON. Then open `https://your.domain`,
`https://your.domain/studio?play=1` and `https://your.domain/docs`.

## Updating

Copy the new code (step 2) and run `deploy.sh` again. The site is down for the few seconds of the restart only;
the build happens while the old version is still serving.

## Notes

- **Mainland China visitors.** A VPS in Hong Kong, Singapore or Japan is reachable from mainland China without an ICP
  filing. A server inside mainland China needs ICP filing before it may serve a domain on ports 80/443.
- **Logs:** `journalctl -u holorra -f` (app) and `journalctl -u caddy -f` (HTTPS, proxy).
- **Secrets** live only in `/etc/holorra.env` (mode 600). Never commit `.env.local`.
- **Large downloads.** The asset proxy streams result files up to 120 MB; the Caddyfile disables response buffering
  for it and allows 120 s per request.
