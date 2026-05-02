#!/usr/bin/env bash
set -euo pipefail

export PSYCLE_SIMULATOR_NAME="${PSYCLE_SIMULATOR_NAME:-Psycle Clean iPhone 17 Pro-Detox}"
if [ -z "${PSYCLE_SIMULATOR_UDID:-}" ]; then
  PSYCLE_SIMULATOR_UDID="$(
    xcrun simctl list devices available |
      awk -v name="$PSYCLE_SIMULATOR_NAME" '
        index($0, name " (") {
          match($0, /\(([A-F0-9-]{36})\)/)
          if (RSTART > 0) {
            print substr($0, RSTART + 1, 36)
            exit
          }
        }
      '
  )"
fi
export PSYCLE_SIMULATOR_UDID="${PSYCLE_SIMULATOR_UDID:-136DAFE4-586A-4227-8AFB-D9F33F68D32A}"
export PSYCLE_BUNDLE_ID="${PSYCLE_BUNDLE_ID:-com.shin27.psycle}"
