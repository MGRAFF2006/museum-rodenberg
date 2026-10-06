#!/bin/sh
set -eu

# Seed an empty persistent volume once, preserving existing uploaded content.
UPLOAD_DIR=/app/public/uploads
mkdir -p "$UPLOAD_DIR"
if [ -z "$(find "$UPLOAD_DIR" -mindepth 1 -maxdepth 1 ! -name lost+found -print -quit)" ]; then
  cp -R /app/seed-uploads/. "$UPLOAD_DIR"/
fi
exec node server/index.js
