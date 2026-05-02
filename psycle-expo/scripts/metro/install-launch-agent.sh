#!/bin/bash

set -euo pipefail

LABEL="com.psycle.expo-dev.8082"
LEGACY_LABEL="com.psycle.expo-dev"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LEGACY_PLIST_PATH="$HOME/Library/LaunchAgents/$LEGACY_LABEL.plist"
SCRIPT_PATH="/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/scripts/metro/run-launch-agent.sh"
LOG_PATH="/tmp/psycle-expo.log"
ERR_PATH="/tmp/psycle-expo.err"

mkdir -p "$HOME/Library/LaunchAgents"

cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$SCRIPT_PATH</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/mashitashinji/dev/psych-duo-packs/psycle-expo</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HOME</key>
    <string>/Users/mashitashinji</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_PATH</string>
  <key>StandardErrorPath</key>
  <string>$ERR_PATH</string>
</dict>
</plist>
PLIST

chmod 644 "$PLIST_PATH"

launchctl bootout "gui/$(id -u)/$LEGACY_LABEL" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$LEGACY_PLIST_PATH" >/dev/null 2>&1 || true

launchctl bootout "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true

if ! launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1; then
  launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || {
    echo "Failed to bootstrap $LABEL" >&2
    exit 1
  }
fi

launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "$PLIST_PATH"
