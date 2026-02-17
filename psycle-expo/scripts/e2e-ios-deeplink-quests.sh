#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BUNDLE_ID="com.shin27.psycle"
PREFERRED_DEVICE="iPhone 16"
DEEPLINK_URL="psycle:///quests"
DEBUG_APP_PATH="${PROJECT_ROOT}/ios/build/Build/Products/Debug-iphonesimulator/Psycle.app"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd xcrun
require_cmd npm

launch_app() {
  xcrun simctl launch "${UDID}" "${BUNDLE_ID}" >/dev/null 2>&1
}

echo "🔎 Resolving simulator..."
BOOTED_UDID="$(xcrun simctl list devices booted | sed -n 's/.*(\([0-9A-F-]\{36\}\)) (Booted).*/\1/p' | head -n 1)"

if [[ -z "${BOOTED_UDID}" ]]; then
  TARGET_UDID="$(xcrun simctl list devices available | sed -n "s/.*${PREFERRED_DEVICE} (\([0-9A-F-]\{36\}\)) (Shutdown).*/\1/p" | head -n 1)"
  if [[ -z "${TARGET_UDID}" ]]; then
    TARGET_UDID="$(xcrun simctl list devices available | sed -n 's/.*(\([0-9A-F-]\{36\}\)) (Shutdown).*/\1/p' | head -n 1)"
  fi
  if [[ -z "${TARGET_UDID}" ]]; then
    echo "No available iOS simulator found." >&2
    exit 1
  fi

  echo "🚀 Booting simulator ${TARGET_UDID}..."
  xcrun simctl boot "${TARGET_UDID}" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "${TARGET_UDID}" -b
  UDID="${TARGET_UDID}"
else
  UDID="${BOOTED_UDID}"
fi

echo "📱 Using simulator: ${UDID}"

if ! launch_app; then
  echo "⚙️ App is not installed. Building debug app via Detox..."
  (
    cd "${PROJECT_ROOT}"
    npm run e2e:build:ios:debug
  )

  if [[ ! -d "${DEBUG_APP_PATH}" ]]; then
    echo "❌ Build completed but app binary was not found at:" >&2
    echo "   ${DEBUG_APP_PATH}" >&2
    exit 1
  fi

  echo "📦 Installing built app on simulator..."
  xcrun simctl install "${UDID}" "${DEBUG_APP_PATH}"
fi

if ! launch_app; then
  echo "❌ App launch failed after build (${BUNDLE_ID})." >&2
  echo "Check build output with: cd ${PROJECT_ROOT} && npm run e2e:build:ios:debug" >&2
  exit 1
fi

echo "🔗 Opening deep link: ${DEEPLINK_URL}"
xcrun simctl openurl "${UDID}" "${DEEPLINK_URL}"

echo "✅ Deep link dispatched. Verify app opened Quests tab."
