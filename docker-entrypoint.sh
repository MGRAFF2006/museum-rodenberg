#!/bin/sh
# Docker entrypoint: seed public/uploads from dist/uploads on first run.
# When Sevalla mounts a persistent disk at /app/public/uploads, it starts
# empty.  This script copies the build-time seed files so images work
# immediately without manual upload.

SEED_DIR="/app/dist/uploads"
UPLOAD_DIR="/app/public/uploads"

mkdir -p "$UPLOAD_DIR"

# Only seed if the uploads directory is empty (first deploy)
if [ -d "$SEED_DIR" ] && [ -z "$(ls -A "$UPLOAD_DIR" 2>/dev/null)" ]; then
  echo "Seeding $UPLOAD_DIR from $SEED_DIR ..."
  cp -r "$SEED_DIR"/* "$UPLOAD_DIR"/
  echo "Seeded $(ls "$UPLOAD_DIR" | wc -l) files."
else
  echo "Uploads directory already has $(ls "$UPLOAD_DIR" 2>/dev/null | wc -l) files, skipping seed."
fi

exec node server/index.js
