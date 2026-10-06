#!/usr/bin/env bash
# One-shot self-hosted deployment without changing local frontend configuration.
set -euo pipefail
exec node "$(dirname "${BASH_SOURCE[0]}")/push-convex.mjs" "$@"
