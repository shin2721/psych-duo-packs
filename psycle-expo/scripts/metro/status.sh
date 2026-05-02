#!/bin/bash

set -euo pipefail

LABEL="com.psycle.expo-dev.8082"

echo "launchctl:"
launchctl print "gui/$(id -u)/$LABEL" | sed -n '1,80p'

echo
echo "listen 8082:"
lsof -nP -iTCP:8082 -sTCP:LISTEN || true

echo
echo "listen 8081:"
lsof -nP -iTCP:8081 -sTCP:LISTEN || true

echo
echo "tail log:"
tail -n 40 /tmp/psycle-expo.log 2>/dev/null || true

echo
echo "tail err:"
tail -n 40 /tmp/psycle-expo.err 2>/dev/null || true
