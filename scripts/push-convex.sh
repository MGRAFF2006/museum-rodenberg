#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Push Convex schema to local or Sevalla backend
#
# Usage:
#   bash scripts/push-convex.sh              # push to local (default)
#   bash scripts/push-convex.sh --prod       # push to Sevalla
#   bash scripts/push-convex.sh --prod --url URL --key KEY  # explicit creds
#
# The script temporarily overrides CONVEX_SELF_HOSTED_URL and
# CONVEX_SELF_HOSTED_ADMIN_KEY for the push, then restores .env.local.
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TARGET="local"
EXPLICIT_URL=""
EXPLICIT_KEY=""

for arg in "$@"; do
  case "$arg" in
    --prod|--production|--sevalla) TARGET="prod" ;;
    --url=*)  EXPLICIT_URL="${arg#*=}" ;;
    --key=*)  EXPLICIT_KEY="${arg#*=}" ;;
  esac
done

# ── Read credentials ─────────────────────────────────────────────

if [ "$TARGET" = "prod" ]; then
  echo -e "${CYAN}Pushing Convex schema to Sevalla (production)...${NC}"

  if [ -n "$EXPLICIT_URL" ] && [ -n "$EXPLICIT_KEY" ]; then
    CONVEX_URL="$EXPLICIT_URL"
    CONVEX_KEY="$EXPLICIT_KEY"
  elif [ -n "${CONVEX_PROD_URL:-}" ] && [ -n "${CONVEX_PROD_ADMIN_KEY:-}" ]; then
    # CI environment variables
    CONVEX_URL="$CONVEX_PROD_URL"
    CONVEX_KEY="$CONVEX_PROD_ADMIN_KEY"
  else
    # Parse from .env.local (commented-out Sevalla section)
    if [ ! -f .env.local ]; then
      echo -e "${RED}No .env.local found. Provide --url and --key, or set CONVEX_PROD_URL/CONVEX_PROD_ADMIN_KEY.${NC}"
      exit 1
    fi
    CONVEX_URL=$(grep -E '^\s*#?\s*CONVEX_SELF_HOSTED_URL=.*sevalla|^\s*#?\s*CONVEX_SELF_HOSTED_URL=.*proxy' .env.local | head -1 | sed 's/^[# ]*//' | cut -d= -f2-)
    CONVEX_KEY=$(grep -E '^\s*#?\s*CONVEX_SELF_HOSTED_ADMIN_KEY=.*01f067' .env.local | head -1 | sed 's/^[# ]*//' | cut -d= -f2-)

    if [ -z "$CONVEX_URL" ] || [ -z "$CONVEX_KEY" ]; then
      echo -e "${RED}Could not find Sevalla credentials in .env.local.${NC}"
      echo "Either uncomment the Sevalla section, or pass --url=... --key=..."
      echo "Or set CONVEX_PROD_URL and CONVEX_PROD_ADMIN_KEY env vars (for CI)."
      exit 1
    fi
  fi
else
  echo -e "${CYAN}Pushing Convex schema to local backend...${NC}"
  CONVEX_URL="http://127.0.0.1:3210"

  if [ -f .env.local ]; then
    CONVEX_KEY=$(grep -E '^CONVEX_SELF_HOSTED_ADMIN_KEY=' .env.local | head -1 | cut -d= -f2-)
  fi

  if [ -z "${CONVEX_KEY:-}" ]; then
    echo -e "${RED}No admin key found in .env.local${NC}"
    exit 1
  fi

  # Verify local backend is reachable
  if ! curl -sf "$CONVEX_URL/version" &>/dev/null; then
    echo -e "${RED}Convex backend not reachable at $CONVEX_URL${NC}"
    echo "Start it with: docker compose up -d convex-backend"
    exit 1
  fi
fi

# ── Push schema ──────────────────────────────────────────────────

echo -e "${CYAN}Target: $CONVEX_URL${NC}"

CONVEX_SELF_HOSTED_URL="$CONVEX_URL" \
CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_KEY" \
  npx convex dev --once --typecheck=disable

echo -e "${GREEN}Convex schema pushed successfully to ${TARGET}.${NC}"

# ── Restore .env.local if convex dev overwrote VITE_ vars ───────
# npx convex dev --once sometimes writes VITE_CONVEX_URL to .env.local
# pointing to the target. Restore local values if we were pushing to prod.
if [ "$TARGET" = "prod" ] && [ -f .env.local ]; then
  # Check if VITE_CONVEX_URL was changed to the prod URL
  if grep -q "VITE_CONVEX_URL=.*sevalla\|VITE_CONVEX_URL=.*proxy" .env.local 2>/dev/null; then
    echo -e "${YELLOW}Restoring VITE_CONVEX_URL to local value in .env.local...${NC}"
    sed -i 's|^VITE_CONVEX_URL=.*|VITE_CONVEX_URL=http://127.0.0.1:3210|' .env.local
    echo -e "${GREEN}Restored.${NC}"
  fi
fi
