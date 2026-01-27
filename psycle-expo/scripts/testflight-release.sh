#!/bin/bash

# TestFlight リリース自動化スクリプト
# 使用方法: bash scripts/testflight-release.sh

set -e

echo "🚀 Psycle TestFlight リリース開始"
echo "=================================="

# 1. 依存関係確認
echo "📦 依存関係インストール中..."
npm i

# 2. EAS CLI確認
if ! command -v eas &> /dev/null; then
    echo "📥 EAS CLI インストール中..."
    npm install -g @expo/eas-cli
fi

# 3. EAS ログイン確認
echo "🔐 EAS ログイン確認..."
if ! eas whoami &> /dev/null; then
    echo "ログインが必要です:"
    eas login
fi

# 4. プリチェック実行指示
echo ""
echo "⚠️  重要: 次のステップを手動で実行してください"
echo "1. DEV環境でプリチェック実行:"
echo "   npx expo start"
echo "2. docs/TESTFLIGHT_PRECHECK.md の全チェック実行"
echo "3. 全項目PASSを確認後、このスクリプトを再実行"
echo ""
read -p "プリチェック完了しましたか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "プリチェック完了後に再実行してください"
    exit 1
fi

# 5. プロダクションビルド
echo "🔨 プロダクションビルド開始..."
eas build --profile production --platform ios

# 6. TestFlightアップロード
echo "📤 TestFlightアップロード開始..."
eas submit --profile production --platform ios

echo ""
echo "✅ TestFlight提出完了！"
echo "App Store Connect で処理状況を確認してください:"
echo "https://appstoreconnect.apple.com"
echo ""
echo "次のステップ:"
echo "1. TestFlightで「テスト準備完了」まで待機（5-15分）"
echo "2. 内部グループにビルドを追加"
echo "3. TestFlightアプリでインストール・動作確認"