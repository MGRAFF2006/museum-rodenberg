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

# Track background PIDs for `wait -n`
PIDS=()
# Every background job of this script is a development service. Cleanup finds
# them in Bash's job table rather than PIDS, so a service forked just before a
# signal arrives (before its PID is recorded) is still stopped.
LIVE_JOBS=()
find_live_jobs() {
  local line
  LIVE_JOBS=()
  # Read `jobs` through direct command substitutions: those report this
  # shell's job table, unlike `jobs` inside a pipeline subshell.
  while IFS= read -r line; do
    if [[ $line =~ ^\[([0-9]+)\] ]]; then LIVE_JOBS+=("%${BASH_REMATCH[1]}"); fi
  done <<< "$(jobs -r)"$'\n'"$(jobs -s)"
}
# Signal job specs, never saved PIDs: Bash checks each job process is still
# alive while SIGCHLD is blocked, so a reaped (and possibly reused) PID is
# never signalled.
signal_live_jobs() {
  local job
  find_live_jobs
  for job in "${LIVE_JOBS[@]}"; do
    kill "-$1" "$job" 2>/dev/null || true
  done
}
# Wait up to about two seconds for every service job to end.
wait_for_live_jobs() {
  local attempt
  for ((attempt = 0; attempt < 20; attempt++)); do
    find_live_jobs
    if [ "${#LIVE_JOBS[@]}" -eq 0 ]; then return 0; fi
    sleep 0.1
  done
  find_live_jobs
  [ "${#LIVE_JOBS[@]}" -eq 0 ]
}
# Set before exiting to explain why the session ended.
EXIT_REASON=""
cleanup() {
  local status=$? stopped=true
  trap - EXIT
  # Output may be a closed pipe: stopping services must not depend on it.
  trap '' INT TERM PIPE
  # Stop the services before writing anything: a write to a full output pipe
  # blocks until its reader drains it. Shutdown is bounded while the output is
  # drained or closed; a reader that stops draining can also block earlier
  # writes (the startup banner, Bash's report of a killed service), just as it
  # blocks the services writing to the same output.
  signal_live_jobs TERM
  # A service can ignore SIGTERM (including during startup). Give it a
  # bounded grace period before forcing the remaining services to exit.
  if ! wait_for_live_jobs; then
    signal_live_jobs KILL
    # A process in uninterruptible I/O can outlive SIGKILL; report it rather
    # than waiting without a deadline.
    wait_for_live_jobs || stopped=false
  fi
  {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    if [ -n "$EXIT_REASON" ]; then echo -e "${RED}${EXIT_REASON}${NC}"; fi
    if [ "$stopped" = true ]; then
      echo -e "${GREEN}All processes stopped.${NC}"
    else
      echo -e "${RED}Services still running after SIGKILL: $(jobs -pr) $(jobs -ps)${NC}" >&2
    fi
  } || true
  return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# A closed output pipe would otherwise kill Bash without running cleanup.
trap 'exit 141' PIPE

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

  # Services to start and the Compose profiles they need (convex-backend has
  # no profile and always starts). Arrays, not command substitutions: Bash 5.2
  # fails to run a signal trap during a substitution followed by another one
  # in the same command.
  PROFILES=()
  SERVICES=(convex-backend)
  if [ "$START_DASHBOARD" = true ]; then
    PROFILES+=(--profile dashboard)
    SERVICES+=(convex-dashboard)
  fi
  if [ "$START_TRANSLATE" = true ]; then
    PROFILES+=(--profile translate)
    SERVICES+=(libretranslate)
  fi

  # Start Docker services
  echo -e "${CYAN}Starting Docker services...${NC}"
  $DC "${PROFILES[@]}" up -d "${SERVICES[@]}"

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
./node_modules/.bin/convex dev --once --typecheck=disable
echo -e "${GREEN}Schema pushed.${NC}"

# ── 4. Start Convex dev watcher (watches for schema changes) ────
echo -e "${CYAN}Starting Convex dev watcher...${NC}"
# Once a service runs, its status decides the session: a closed output pipe
# must not replace it. Ignore SIGPIPE (a trap action would be traced under
# `bash -x` and raise SIGPIPE again), so writes may fail from here on,
# including Bash's own report of a service killed by a signal. Each service
# restores the default SIGPIPE action just before it starts, after turning
# off `bash -x` tracing so no trace write can hit a closed pipe in between.
trap '' PIPE
( set +x; trap - PIPE; exec ./node_modules/.bin/convex dev --typecheck=disable ) &
PIDS+=($!)

# ── 5. Start Vite dev server ────────────────────────────────────
echo -e "${CYAN}Starting Vite dev server...${NC}" || true
( set +x; trap - PIPE; exec ./node_modules/.bin/vite ) &
PIDS+=($!)

# ── Ready ────────────────────────────────────────────────────────
{
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
} || true

# Wait for any service to exit. Poll the job table instead of `wait -n`: Bash
# reports and forgets a job killed by a signal before `wait -n` starts, and
# Bash 5.2 then waits for its peer. `wait PID` still returns the saved status.
# Polling cannot order services that end within the same interval; then the
# first failure in launch order wins, so a success never masks a failure.
status=""
while [ -z "$status" ]; do
  # One command substitution per word: Bash 5.2 fails to run a signal trap
  # that arrives during a substitution followed by another in the same word.
  live_jobs=$(jobs -pr)
  stopped_jobs=$(jobs -ps)
  running=$'\n'"$live_jobs"$'\n'"$stopped_jobs"$'\n'
  for pid in "${PIDS[@]}"; do
    if [[ $running != *$'\n'"$pid"$'\n'* ]]; then
      service_status=0
      wait "$pid" || service_status=$?
      if [ -z "$status" ] || [ "$status" -eq 0 ]; then status=$service_status; fi
    fi
  done
  if [ -z "$status" ]; then sleep 0.2; fi
done
EXIT_REASON="A required development service exited; stopped its peer."
# A required long-running service exiting successfully still ends the dev session.
if [ "$status" -eq 0 ]; then
  status=1
fi
exit "$status"
