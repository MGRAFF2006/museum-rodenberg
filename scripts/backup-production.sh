#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
dc=(docker compose --env-file .env.production -f docker-compose.production.yml)
destination="${MUSEUM_BACKUP_ROOT:-$PWD/backups}/$(date -u +%Y-%m-%dT%H-%M-%SZ)"
mkdir -p "$destination"

# Freeze curator writes while exporting the database and copying disk media.
# Restart on failure too; never report an incomplete backup as successful.
"${dc[@]}" stop museum
trap '"${dc[@]}" start museum' EXIT
"${dc[@]}" run --rm -v "$destination:/backup" convex-setup \
  npx convex export --path /backup/convex.zip --include-file-storage
"${dc[@]}" cp museum:/app/public/uploads "$destination/uploads"
echo "Database and uploads saved to $destination"
