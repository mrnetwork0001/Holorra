#!/usr/bin/env bash
# Redeploy from your machine: build here, upload, restart on the server. Other apps on the host are untouched.
#   HOST=root@38.49.216.120 bash deploy/redeploy.sh
set -euo pipefail
HOST="${HOST:-root@38.49.216.120}"
cd "$(dirname "$0")/.."
rm -rf .next && npx next build
git checkout -- tsconfig.json 2>/dev/null || true   # next build may append its types path
EXCL=(--exclude node_modules --exclude '.next' --exclude '.next-*' --exclude .env.local --exclude .env --exclude .git
      --exclude tsconfig.tsbuildinfo --exclude CLAUDE.md --exclude CLAUDE_CODE_STARTER_PROMPTS.md --exclude .claude
      --exclude .DS_Store --exclude .lock-sha)
rsync -az --delete "${EXCL[@]}" ./ "$HOST:/opt/holorra/"
rsync -az --delete --exclude cache .next/ "$HOST:/opt/holorra/.next/"
ssh "$HOST" 'bash /opt/holorra/deploy/deploy.sh'
