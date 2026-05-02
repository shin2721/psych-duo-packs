#!/bin/bash

set -euo pipefail

APP_PATH="${1:-/tmp/psycle-ios-device-cache/Build/Products/Debug-iphoneos/Psycle.app}"
PROFILE_PATH="$APP_PATH/embedded.mobileprovision"

if [ ! -f "$PROFILE_PATH" ]; then
  echo "No embedded.mobileprovision at: $PROFILE_PATH" >&2
  exit 1
fi

EXPIRATION_RAW="$(security cms -D -i "$PROFILE_PATH" | plutil -extract ExpirationDate raw -o - -)"
PROFILE_NAME="$(security cms -D -i "$PROFILE_PATH" | plutil -extract Name raw -o - -)"
TEAM_NAME="$(security cms -D -i "$PROFILE_PATH" | plutil -extract TeamName raw -o - -)"

EXPIRATION_EPOCH="$(python3 - <<'PY' "$EXPIRATION_RAW"
from datetime import datetime
import sys

value = sys.argv[1]
print(int(datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").timestamp()))
PY
)"
NOW_EPOCH="$(date -u +%s)"
SECONDS_LEFT="$((EXPIRATION_EPOCH - NOW_EPOCH))"
DAYS_LEFT="$(python3 - <<'PY' "$SECONDS_LEFT"
import sys

seconds = int(sys.argv[1])
print(f"{seconds / 86400:.2f}")
PY
)"

echo "profile=$PROFILE_NAME"
echo "team=$TEAM_NAME"
echo "expires_utc=$EXPIRATION_RAW"
echo "seconds_left=$SECONDS_LEFT"
echo "days_left=$DAYS_LEFT"
