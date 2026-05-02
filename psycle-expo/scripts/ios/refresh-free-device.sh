#!/bin/bash

set -euo pipefail

REPO_ROOT="/Users/mashitashinji/dev/psych-duo-packs/psycle-expo"
GENERIC_DERIVED_DATA_PATH="${PSYCLE_IOS_GENERIC_DERIVED_DATA_PATH:-/tmp/psycle-ios-generic-cache}"
DEVICE_DERIVED_DATA_PATH="${PSYCLE_IOS_DEVICE_DERIVED_DATA_PATH:-/tmp/psycle-ios-device-cache}"
GENERIC_LOG_FILE="${PSYCLE_IOS_GENERIC_LOG_FILE:-/tmp/psycle-ios-generic-cache.log}"
DEVICE_LOG_FILE="${PSYCLE_IOS_DEVICE_LOG_FILE:-/tmp/psycle-ios-device-cache.log}"
DEVICE_TARGET="${PSYCLE_IOS_DEVICE_TARGET:-platform=iOS,name=iPhone}"
DEVICECTL_DEVICE="${PSYCLE_IOS_DEVICECTL_DEVICE:-iPhone}"
APP_PATH="$DEVICE_DERIVED_DATA_PATH/Build/Products/Debug-iphoneos/Psycle.app"

cd "$REPO_ROOT"

node scripts/ios/apply-native-repair.mjs

if [ ! -d "$GENERIC_DERIVED_DATA_PATH/Build/Products/Debug-iphoneos" ]; then
  echo "warming generic iOS cache..."
else
  echo "reusing generic iOS cache at $GENERIC_DERIVED_DATA_PATH"
fi

bash scripts/ios/run-repair-build-detached.sh \
  "$GENERIC_LOG_FILE" \
  "$GENERIC_DERIVED_DATA_PATH" \
  "$GENERIC_DERIVED_DATA_PATH"

echo "building signed device app for $DEVICE_TARGET..."
bash scripts/ios/run-device-repair-build-detached.sh \
  "$DEVICE_LOG_FILE" \
  "$DEVICE_DERIVED_DATA_PATH" \
  "$GENERIC_DERIVED_DATA_PATH" \
  "$DEVICE_TARGET"

if [ ! -d "$APP_PATH" ]; then
  echo "Expected app missing at $APP_PATH" >&2
  exit 1
fi

echo "installing to $DEVICECTL_DEVICE..."
xcrun devicectl device install app --device "$DEVICECTL_DEVICE" "$APP_PATH"

BUNDLE_ID="$(
  /usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_PATH/Info.plist"
)"

echo "launching $BUNDLE_ID on $DEVICECTL_DEVICE..."
xcrun devicectl device process launch \
  --device "$DEVICECTL_DEVICE" \
  --terminate-existing \
  "$BUNDLE_ID"

echo
echo "latest device profile expiry:"
bash scripts/ios/print-provision-expiry.sh "$APP_PATH"
