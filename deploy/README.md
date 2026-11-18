# Deploying Holorra on a VPS

Production runs this way at **https://holorra.xyz**: one Next.js process behind Caddy, on a host that also runs
other apps. Nothing here edits another app's config, restarts Caddy (graceful reloads only) or builds on the server.

| File | Goes to | Purpose |
| --- | --- | --- |
| `holorra.service` | `/etc/systemd/system/` | `next start` on `127.0.0.1:3720`, restarts on failure, capped at 1 GB RAM |
| `holorra.caddy` | `/etc/caddy/conf.d/` | HTTPS for the domain, `www` redirect, assets served from disk, HTTP/3 off for this site only |
| `setup.sh` | run once on the server | creates the `holorra` user, installs the service and the Caddy file, validates, reloads |
| `deploy.sh` | run on the server | `npm ci` only when the lockfile changed, restart, local health check |
| `redeploy.sh` | run on your machine | build locally, upload code and build, run `deploy.sh` on the server |

## First deploy

1. **DNS** at the registrar: `A @ → server IP`, `CNAME www → your domain`.
2. **Build and upload** from your machine (the server only installs packages; a build needs ~2 GB RAM):
   ```bash
   HOST=root@SERVER_IP bash deploy/redeploy.sh   # first run: builds, uploads, then deploy.sh fails until setup ran
   ```
   or copy the files by hand (`rsync` excluding `node_modules`, `.next*`, `.env*`, `.git`).
3. **One-time setup** on the server (needs Node.js 20+ and Caddy v2 already installed):
   ```bash
   DOMAIN=your.domain bash /opt/holorra/deploy/setup.sh
   bash /opt/holorra/deploy/deploy.sh
   ```
4. **Optional key**: put `AHOLO_API_KEY=...` in `/etc/holorra.env` (mode 600) and `systemctl restart holorra` to let
   visitors run live jobs on your credits. Without it, visitors can still paste their own key in the studio.

## Updates

```bash
HOST=root@SERVER_IP bash deploy/redeploy.sh
```

About 2 s of downtime during the restart.

## Notes

- **Logs:** `journalctl -u holorra -f` (app), `journalctl -u caddy -f` (HTTPS, proxy).
- **Undo:** `systemctl disable --now holorra`, delete `/etc/caddy/conf.d/holorra.caddy`, `systemctl reload caddy`,
  remove `/opt/holorra`, `/etc/holorra.env` and the unit file.
- **HTTP/3:** large downloads over QUIC were slow on our host, so `holorra.caddy` drops the `Alt-Svc` header for this
  site; browsers stay on HTTP/2. Other sites on the same Caddy keep HTTP/3.
- **Mainland China:** a host in Hong Kong, Singapore or Japan needs no ICP filing; a host inside mainland China does.
