#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Museum Rodenberg – Development startup
#
# Starts all services needed for local development:
#   1. Convex backend  (Docker)
#   2. Push Convex schema (automatic)
#   3. Vite dev server (app + Express API via dev plugin)
#
# Usage:
#   npm run dev:full                    # standard dev (HMR + Convex)
#   npm run dev:full -- --translate     # + LibreTranslate
#   npm run dev:full -- --dashboard     # + Convex dashboard
#   npm run dev:full -- --all           # everything
#   npm run dev:full -- --no-docker     # skip Docker (manage containers yourself)
#
# For a production-like local stack (Docker Compose only, no HMR):
#   npm run dev:docker
#
# Stop: Ctrl+C (kills all background processes)
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SKIP_DOCKER=false
START_DASHBOARD=false
START_TRANSLATE=false

for arg in "$@"; do
  case "$arg" in
    --no-docker)   SKIP_DOCKER=true ;;
    --dashboard)   START_DASHBOARD=true ;;
    --translate)   START_TRANSLATE=true ;;
    --all)         START_DASHBOARD=true; START_TRANSLATE=true ;;
  esac
done

# Track background PIDs for cleanup
PIDS=()
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  echo -e "${GREEN}All processes stopped.${NC}"
}
trap cleanup EXIT INT TERM

# ── 1. Docker services ───────────────────────────────────────────
if [ "$SKIP_DOCKER" = false ]; then
  # Detect docker compose command (must test daemon access, not just binary)
  if docker compose version &>/dev/null && docker info &>/dev/null; then
    DC="docker compose"
  elif command -v docker-compose &>/dev/null && docker info &>/dev/null; then
    DC="docker-compose"
  elif sudo docker compose version &>/dev/null; then
    DC="sudo docker compose"
  elif sudo docker-compose version &>/dev/null; then
    DC="sudo docker-compose"
  else
    echo -e "${RED}Error: docker compose not found or Docker daemon not accessible.${NC}"
    echo "Install docker compose, or add your user to the docker group:"
    echo "  sudo usermod -aG docker \$USER"
    echo "Or use --no-docker if Convex is already running."
    exit 1
  fi

  # Build the list of services to start (convex-backend has no profile, always starts)
  SERVICES="convex-backend"
  [ "$START_DASHBOARD" = true ] && SERVICES="$SERVICES --profile dashboard"
  [ "$START_TRANSLATE" = true ] && SERVICES="$SERVICES --profile translate"

  # Start Docker services
  echo -e "${CYAN}Starting Docker services...${NC}"
  if [ "$START_DASHBOARD" = true ] || [ "$START_TRANSLATE" = true ]; then
    PROFILES=""
    [ "$START_DASHBOARD" = true ] && PROFILES="$PROFILES --profile dashboard"
    [ "$START_TRANSLATE" = true ] && PROFILES="$PROFILES --profile translate"
    $DC $PROFILES up -d convex-backend $([ "$START_DASHBOARD" = true ] && echo "convex-dashboard") $([ "$START_TRANSLATE" = true ] && echo "libretranslate")
  else
    $DC up -d convex-backend
  fi

  # Wait for Convex backend health
  echo -e "${CYAN}Waiting for Convex backend to be healthy...${NC}"
  TRIES=0
  MAX_TRIES=30
  until curl -sf http://127.0.0.1:3210/version &>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge "$MAX_TRIES" ]; then
      echo -e "${RED}Convex backend did not become healthy after ${MAX_TRIES}s${NC}"
      echo "Check logs: $DC logs convex-backend"
      exit 1
    fi
    sleep 1
  done
  echo -e "${GREEN}Convex backend is ready.${NC}"
else
  echo -e "${YELLOW}Skipping Docker (--no-docker). Checking Convex backend...${NC}"
  if ! curl -sf http://127.0.0.1:3210/version &>/dev/null; then
    echo -e "${RED}Convex backend not reachable at http://127.0.0.1:3210${NC}"
    exit 1
  fi
  echo -e "${GREEN}Convex backend is reachable.${NC}"
fi

# ── 2. Check for admin key ───────────────────────────────────────
if [ ! -f .env.local ] || ! grep -q '^CONVEX_SELF_HOSTED_ADMIN_KEY=' .env.local 2>/dev/null; then
  echo -e "${YELLOW}No admin key found in .env.local${NC}"
  echo "Generate one with:"
  echo "  docker compose exec convex-backend ./generate_admin_key.sh"
  echo "Then add to .env.local:"
  echo "  CONVEX_SELF_HOSTED_ADMIN_KEY=<key>"
  exit 1
fi

# ── 3. Push Convex schema ───────────────────────────────────────
echo -e "${CYAN}Pushing Convex schema...${NC}"
npx convex dev --once --typecheck=disable
echo -e "${GREEN}Schema pushed.${NC}"

# ── 4. Start Convex dev watcher (watches for schema changes) ────
echo -e "${CYAN}Starting Convex dev watcher...${NC}"
npx convex dev --typecheck=disable &
PIDS+=($!)

# Give Convex dev a moment to start before Vite
sleep 2

# ── 5. Start Vite dev server ────────────────────────────────────
echo -e "${CYAN}Starting Vite dev server...${NC}"
npx vite &
PIDS+=($!)

# ── Ready ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Museum Rodenberg – Development Environment${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "  App:             ${CYAN}http://localhost:5173${NC}"
echo -e "  Convex backend:  ${CYAN}http://localhost:3210${NC}"
[ "$START_DASHBOARD" = true ] && echo -e "  Convex dashboard: ${CYAN}http://localhost:6791${NC}"
[ "$START_TRANSLATE" = true ] && echo -e "  LibreTranslate:   ${CYAN}http://localhost:5000${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop all services"
echo ""

# Wait for any background process to exit
wait
