#!/bin/bash

# Staged Lesson Promotion Script
# Usage: ./promote-staged-lesson.sh [<domain> <basename>]
# Example: ./promote-staged-lesson.sh mental mental_l05
# If no arguments, shows available staged lessons

set -e

# 引数なしの場合、利用可能なレッスンを表示
if [ $# -eq 0 ]; then
    echo "📋 利用可能なstaged lessons:"
    echo "=================================="
    
    found_any=false
    for domain_dir in data/lessons/_staging/*_units; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename "$domain_dir" | sed 's/_units$//')
            lessons=$(find "$domain_dir" -name "*.ja.json" 2>/dev/null | sort)
            
            if [ -n "$lessons" ]; then
                echo ""
                echo "📁 $domain:"
                for lesson_path in $lessons; do
                    basename_full=$(basename "$lesson_path" .ja.json)
                    evidence_path="${lesson_path%.ja.json}.evidence.json"
                    
                    if [ -f "$evidence_path" ]; then
                        # human_approved チェック
                        if command -v jq &> /dev/null; then
                            approved=$(jq -r '.review.human_approved' "$evidence_path" 2>/dev/null || echo "unknown")
                            if [ "$approved" = "true" ]; then
                                echo "  ✅ $basename_full (承認済み)"
                            else
                                echo "  ⏳ $basename_full (未承認: $approved)"
                            fi
                        else
                            echo "  📄 $basename_full (jq未インストール - 承認状態不明)"
                        fi
                    else
                        echo "  ❌ $basename_full (Evidence Card不足)"
                    fi
                    found_any=true
                done
            fi
        fi
    done
    
    if [ "$found_any" = false ]; then
        echo "📭 staged lessons が見つかりません"
        echo ""
        echo "Mode B でレッスンを生成してください:"
        echo "  cd scripts/content-generator && npm run patrol"
    fi
    
    echo ""
    echo "使用方法:"
    echo "  npm run promote:lesson <domain> <basename>"
    echo "  例: npm run promote:lesson mental mental_l05"
    exit 0
fi

if [ $# -ne 2 ]; then
    echo "Usage: $0 <domain> <basename>"
    echo "Example: $0 mental mental_l05"
    echo "Run without arguments to see available lessons"
    exit 1
fi

DOMAIN=$1
BASENAME=$2

STAGING_DIR="data/lessons/_staging/${DOMAIN}_units"
PROD_DIR="data/lessons/${DOMAIN}_units"

LESSON_FILE="${BASENAME}.ja.json"
EVIDENCE_FILE="${BASENAME}.evidence.json"

echo "🚀 レッスン昇格開始: ${DOMAIN}/${BASENAME}"
echo "=================================="

# 1. staging ファイル存在確認
echo "📁 staging ファイル確認中..."

if [ ! -f "${STAGING_DIR}/${LESSON_FILE}" ]; then
    echo "❌ エラー: ${STAGING_DIR}/${LESSON_FILE} が見つかりません"
    exit 1
fi

if [ ! -f "${STAGING_DIR}/${EVIDENCE_FILE}" ]; then
    echo "❌ エラー: ${STAGING_DIR}/${EVIDENCE_FILE} が見つかりません"
    exit 1
fi

echo "✅ 必要ファイル確認完了"

# 2. Evidence Card の human_approved チェック
echo "🔍 承認状態確認中..."

if ! command -v jq &> /dev/null; then
    echo "❌ エラー: jq コマンドが見つかりません"
    echo "インストール: brew install jq"
    exit 1
fi

HUMAN_APPROVED=$(jq -r '.review.human_approved' "${STAGING_DIR}/${EVIDENCE_FILE}")

if [ "$HUMAN_APPROVED" != "true" ]; then
    echo "❌ エラー: human_approved が true ではありません (現在: ${HUMAN_APPROVED})"
    echo "Evidence Card を承認してから再実行してください"
    exit 1
fi

echo "✅ 人間承認確認完了"

# 3. 本番ディレクトリ作成（存在しない場合）
mkdir -p "${PROD_DIR}"

# 4. ファイル移動
echo "📦 本番環境へ移動中..."

cp "${STAGING_DIR}/${LESSON_FILE}" "${PROD_DIR}/"
cp "${STAGING_DIR}/${EVIDENCE_FILE}" "${PROD_DIR}/"

echo "✅ ファイル移動完了"

# 5. staging から削除
echo "🗑️  staging クリーンアップ中..."

rm "${STAGING_DIR}/${LESSON_FILE}"
rm "${STAGING_DIR}/${EVIDENCE_FILE}"

echo "✅ staging クリーンアップ完了"

# 6. インデックス更新
echo "🔄 インデックス更新中..."

npm run gen:units

if [ $? -eq 0 ]; then
    echo "✅ インデックス更新完了"
else
    echo "❌ エラー: インデックス更新に失敗しました"
    exit 1
fi

# 7. 最終バリデーション
echo "🔍 最終バリデーション中..."

npm run validate:lessons

if [ $? -eq 0 ]; then
    echo "✅ バリデーション完了"
else
    echo "❌ エラー: バリデーションに失敗しました"
    exit 1
fi

echo ""
echo "🎉 レッスン昇格完了!"
echo "本番配置: ${PROD_DIR}/${LESSON_FILE}"
echo "Evidence: ${PROD_DIR}/${EVIDENCE_FILE}"
echo ""
echo "次のステップ:"
echo "1. Metro bundler を再起動"
echo "2. アプリでレッスンが表示されることを確認"