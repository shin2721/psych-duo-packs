#!/bin/bash

set -euo pipefail

LOG_FILE="${1:-/tmp/psycle-repair-build-detached.log}"
DERIVED_DATA_PATH="${2:-/tmp/psycle-repair-build3}"
SEED_SOURCE_DERIVED_DATA_PATH="${3:-$DERIVED_DATA_PATH}"
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH

: >"$LOG_FILE"
/opt/homebrew/bin/node /Users/mashitashinji/dev/psych-duo-packs/psycle-expo/scripts/ios/seed-swift-compat-headers.mjs "$DERIVED_DATA_PATH" "$SEED_SOURCE_DERIVED_DATA_PATH" >>"$LOG_FILE" 2>&1

HERMES_XCFRAMEWORK_ROOT="$DERIVED_DATA_PATH/Build/Products/Debug-iphoneos/XCFrameworkIntermediates/hermes-engine"
HERMES_PREBUILT_LINK="$HERMES_XCFRAMEWORK_ROOT/Pre-built"
HERMES_DEVICE_SLICE="/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/ios/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64"

mkdir -p "$HERMES_XCFRAMEWORK_ROOT"
ln -sfn "$HERMES_DEVICE_SLICE" "$HERMES_PREBUILT_LINK"

exec xcodebuild \
  -workspace /Users/mashitashinji/dev/psych-duo-packs/psycle-expo/ios/Psycle.xcworkspace \
  -scheme Psycle \
  -configuration Debug \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  build >>"$LOG_FILE" 2>&1
