#!/usr/bin/env bash
set -euo pipefail

# Let the Convex CLI load .env.local without parsing commented credentials.
case "${1:-}" in
  --prod|--production)
    : "${CONVEX_PROD_URL:?Set CONVEX_PROD_URL}"
    : "${CONVEX_PROD_ADMIN_KEY:?Set CONVEX_PROD_ADMIN_KEY}"
    export CONVEX_SELF_HOSTED_URL="$CONVEX_PROD_URL"
    export CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_PROD_ADMIN_KEY"
    ;;
  '') ;;
  *) echo 'Usage: scripts/push-convex.sh [--prod]' >&2; exit 1 ;;
esac
exec npx convex deploy --yes --typecheck enable
