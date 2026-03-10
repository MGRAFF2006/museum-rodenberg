#!/bin/sh
# Docker entrypoint: seed public/uploads from dist/uploads on first run.
# When Sevalla mounts a persistent disk at /app/public/uploads, it starts
# empty (except for lost+found from the ext4 filesystem).  This script
# copies the build-time seed files so images are served from the persistent
# disk too (needed for admin-uploaded files to coexist with seed images).

SEED_DIR="/app/dist/uploads"
UPLOAD_DIR="/app/public/uploads"

mkdir -p "$UPLOAD_DIR"

# Count real files, ignoring lost+found (created by ext4 on persistent disks)
REAL_FILES=$(ls "$UPLOAD_DIR" 2>/dev/null | grep -cv '^lost+found$')

# Seed if no real files exist (first deploy or empty persistent disk)
if [ -d "$SEED_DIR" ] && [ "$REAL_FILES" -eq 0 ]; then
  echo "Seeding $UPLOAD_DIR from $SEED_DIR ..."
  cp -r "$SEED_DIR"/* "$UPLOAD_DIR"/
  echo "Seeded $(ls "$UPLOAD_DIR" | grep -cv '^lost+found$') files."
else
  echo "Uploads directory already has $REAL_FILES files, skipping seed."
fi

exec node server/index.js
