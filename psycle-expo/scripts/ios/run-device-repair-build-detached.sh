#!/bin/bash

set -euo pipefail

LOG_FILE="${1:-/tmp/psycle-device-build-detached.log}"
DERIVED_DATA_PATH="${2:-/tmp/psycle-device-build1}"
SEED_SOURCE_DERIVED_DATA_PATH="${3:-$DERIVED_DATA_PATH}"
DESTINATION_SPEC="${4:-${DEVICE_DESTINATION:-${DEVICE_UDID:-}}}"
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH

if [ -z "$DESTINATION_SPEC" ]; then
  echo "Missing device destination. Pass arg4, DEVICE_DESTINATION, or DEVICE_UDID." >&2
  exit 2
fi

if [[ "$DESTINATION_SPEC" == *"="* ]]; then
  XCODE_DESTINATION="$DESTINATION_SPEC"
else
  XCODE_DESTINATION="id=$DESTINATION_SPEC"
fi

: >"$LOG_FILE"
rm -rf "$DERIVED_DATA_PATH/ModuleCache.noindex" \
  "$DERIVED_DATA_PATH/Build/Intermediates.noindex/PrecompiledHeaders"
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
  -destination "$XCODE_DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -allowProvisioningUpdates \
  build >>"$LOG_FILE" 2>&1
