#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/gse"

echo "== Deploy started =="
cd "$APP_DIR"

echo "== Pulling latest =="
git fetch origin main
git reset --hard origin/main

echo "== Installing dependencies =="
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "== Building workspace =="
pnpm build

echo "== Reloading PM2 =="
pm2 start ecosystem.config.js --update-env || true
pm2 reload all --update-env
pm2 save

echo "== Deploy finished =="
