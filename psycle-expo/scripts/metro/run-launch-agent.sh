#!/bin/bash

set -euo pipefail

REPO_ROOT="/Users/mashitashinji/dev/psych-duo-packs/psycle-expo"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="/Users/mashitashinji"

cd "$REPO_ROOT"

exec /opt/homebrew/bin/node scripts/metro/supervisor.mjs
