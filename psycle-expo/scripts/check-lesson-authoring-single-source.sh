#!/bin/bash

# Lesson Authoring Canonical Source Checker
# 品質判断と運用契約の正本分離を強制するチェックスクリプト

set -e

echo "🔍 レッスン作成仕様の正本分離チェック開始..."
echo "================================================"

# 正本ファイル
CANONICAL_QUALITY_SOURCE="docs/PRINCIPLES.md"
CANONICAL_OPS_SOURCE="docs/CONTENT_SYSTEM_SPEC.md"

# チェック対象キーワード（ルール本文を示すキーワード）
RULE_KEYWORDS=(
    "5-Phase.*Structure.*固定"
    "Phase.*4.*How.*必須"
    "10問.*per.*lesson"
    "Evidence.*Grade.*テンプレート"
    "Evidence Card.*レッスン.*必須"
    "human_approved.*本番.*必要"
    "正解.*不正解.*という.*禁止"
    "文字数制限.*Explanation.*行"
    "断定.*表現.*禁止"
    "bronze.*効果.*断定"
    "staging.*配置.*Mode.*B.*必須"
    "本番.*直入れ.*Mode.*B.*禁止"
    "承認.*ゲート.*人間.*必要"
    "監査.*承認.*本番.*配置"
)

# 除外パターン
EXCLUDE_PATTERNS=(
    "data/lessons/**/*.json"           # JSONデータファイル
    "data/lessons/**/*.evidence.json"  # Evidence Cardファイル
    "node_modules/**"                  # node_modules
    ".git/**"                          # gitディレクトリ
    "*.log"                           # ログファイル
    "scripts/check-lesson-authoring-single-source.sh"  # このスクリプト自体
)

# 除外パターンをgrepオプションに変換
EXCLUDE_ARGS="--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=data/lessons --exclude=*.log"

# エラーカウンター
ERROR_COUNT=0
VIOLATIONS=()

echo "📋 チェック対象キーワード: ${#RULE_KEYWORDS[@]}個"
echo "🚫 除外パターン: ${#EXCLUDE_PATTERNS[@]}個"
echo ""

# 各キーワードをチェック
for keyword in "${RULE_KEYWORDS[@]}"; do
    echo "🔎 チェック中: '$keyword'"
    
    # 正本以外でキーワードを検索
    if command -v rg >/dev/null 2>&1; then
        # ripgrepが利用可能な場合
        MATCHES=$(rg -l "$keyword" --type-not=json --glob="!$CANONICAL_QUALITY_SOURCE" --glob="!$CANONICAL_OPS_SOURCE" --glob="!data/lessons/**" --glob="!node_modules/**" --glob="!.git/**" data/lessons 2>/dev/null || true)
    else
        # grepを使用 (正本と自分自身は除外)
        MATCHES=$(grep -r -l -E "$keyword" . $EXCLUDE_ARGS --exclude="$(basename "$CANONICAL_QUALITY_SOURCE")" --exclude="$(basename "$CANONICAL_OPS_SOURCE")" --exclude="$(basename "$0")" 2>/dev/null | grep -v "^\./$CANONICAL_QUALITY_SOURCE$" | grep -v "^\./$CANONICAL_OPS_SOURCE$" || true)
    fi
    
    if [ -n "$MATCHES" ]; then
        echo "❌ 違反発見: '$keyword'"
        echo "   違反ファイル:"
        echo "$MATCHES" | while read -r file; do
            echo "     - $file"
            # 違反箇所の行番号も表示
            if command -v rg >/dev/null 2>&1; then
                rg -n "$keyword" "$file" 2>/dev/null | head -3 | sed 's/^/       /'
            else
                grep -n -E "$keyword" "$file" 2>/dev/null | head -3 | sed 's/^/       /'
            fi
        done
        echo ""
        VIOLATIONS+=("$keyword: $MATCHES")
        ((ERROR_COUNT++))
    else
        echo "✅ OK"
    fi
done

echo ""
echo "📊 チェック結果"
echo "=============="

if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ 正本分離チェック: 成功"
    echo "   品質判断は ${CANONICAL_QUALITY_SOURCE}, 運用契約は ${CANONICAL_OPS_SOURCE} に分離されています"
    echo ""
    echo "🎉 仕様分裂なし - 正本分離が維持されています！"
    exit 0
else
    echo "❌ 正本分離チェック: 失敗"
    echo "   $ERROR_COUNT 個のルールキーワードが正本以外で発見されました"
    echo ""
    echo "🚨 違反一覧:"
    for violation in "${VIOLATIONS[@]}"; do
        echo "   - $violation"
    done
    echo ""
    echo "💡 修正方法:"
    echo "   1. 違反ファイルからルール本文を削除"
    echo "   2. 品質判断なら '$CANONICAL_QUALITY_SOURCE を参照'、運用契約なら '$CANONICAL_OPS_SOURCE を参照' のリンクを追加"
    echo "   3. 実行手順・コマンドのみ残す"
    echo ""
    exit 1
fi
