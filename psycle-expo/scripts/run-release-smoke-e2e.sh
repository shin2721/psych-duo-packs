#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_BINARY="ios/build-release/Build/Products/Release-iphonesimulator/Psycle.app"
if [[ ! -d "$APP_BINARY" ]]; then
  echo "Release app binary not found: $APP_BINARY" >&2
  echo "Run: npm run e2e:ios:psycle:smoke:build" >&2
  exit 1
fi

npm exec detox reset-lock-file

echo "Running Release smoke: analytics.v1_3.e2e.ts"
npm exec detox -- test \
  --configuration ios.sim.release.psycle \
  --loglevel info \
  --jest-report-specs \
  e2e/analytics.v1_3.e2e.ts

npm exec detox reset-lock-file

echo "Running Release smoke: ui.full_touch.e2e.ts"
npm exec detox -- test \
  --configuration ios.sim.release.psycle \
  --loglevel info \
  --jest-report-specs \
  e2e/ui.full_touch.e2e.ts
