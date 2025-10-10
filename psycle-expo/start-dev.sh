#!/bin/bash

# === kill & cache clear ===
lsof -ti:8084,8085,8086 2>/dev/null | xargs kill -9 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true
rm -rf "$TMPDIR/metro-"* "$TMPDIR/haste-map-"* 2>/dev/null || true

# === Expo Go(シミュレータ)入れておく ※入っていれば成功ログだけ出る ===
EXPO_NO_INTERACTIVE=1 npx expo client:install:ios || true

# === LANでdevサーバ起動（8086固定）===
EXPO_NO_INTERACTIVE=1 npx expo start --lan --port 8086 -c &
DEV_PID=$!
sleep 8

# === iOS Simulator を起動 & Deep Link 送信 ===
xcrun simctl boot "iPhone 16 Plus" 2>/dev/null || true
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
xcrun simctl openurl booted "exp://$LAN_IP:8086"

# 15秒待って未接続ならトンネルに切替（ネットワーク制限対策）
sleep 15
if ! curl -fs "http://localhost:8086" >/dev/null 2>&1; then
  kill $DEV_PID 2>/dev/null || true
  EXPO_NO_INTERACTIVE=1 npx expo start --tunnel --port 8086 -c
fi

echo "DevTools: http://localhost:8086  (ブラウザで開けます)"
