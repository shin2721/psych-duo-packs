#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./tools/generate_cross_review_prompt.sh <mode> [<range>] [--skip-sync]

Modes:
  codex_impl_by_claude
  claude_impl_by_codex
  codex_plan_by_claude
  claude_plan_by_codex

Examples:
  ./tools/generate_cross_review_prompt.sh codex_impl_by_claude HEAD~1..HEAD
  ./tools/generate_cross_review_prompt.sh claude_impl_by_codex 0526e84..HEAD
  ./tools/generate_cross_review_prompt.sh codex_plan_by_claude
  ./tools/generate_cross_review_prompt.sh claude_plan_by_codex --skip-sync
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

MODE="$1"
shift

RANGE="HEAD~1..HEAD"
SKIP_SYNC=0

for arg in "$@"; do
  case "$arg" in
    --skip-sync)
      SKIP_SYNC=1
      ;;
    *)
      RANGE="$arg"
      ;;
  esac
done

case "$MODE" in
  codex_impl_by_claude|claude_impl_by_codex|codex_plan_by_claude|claude_plan_by_codex)
    ;;
  *)
    echo "error: unsupported mode '$MODE'"
    usage
    exit 1
    ;;
esac

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "error: this command must be run inside a git repository"
  exit 1
fi

cd "$REPO_ROOT"

if [[ "$SKIP_SYNC" -eq 0 ]]; then
  if [[ -x "./tools/sync_psycle_latest.sh" ]]; then
    ./tools/sync_psycle_latest.sh >/dev/null
  else
    echo "error: ./tools/sync_psycle_latest.sh not found or not executable"
    exit 1
  fi
fi

CURRENT_BRANCH="$(git branch --show-current)"
LOCAL_HEAD="$(git rev-parse --short HEAD)"
REMOTE_HEAD="$(git rev-parse --short origin/main 2>/dev/null || echo "unknown")"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "error: current branch must be main (now: $CURRENT_BRANCH)"
  exit 1
fi

if [[ "$MODE" == *"_impl_"* ]]; then
  CHANGED_FILES="$(git diff --name-only "$RANGE" || true)"
  if [[ -z "$CHANGED_FILES" ]]; then
    FILE_LINES="- (差分なし)"
  else
    FILE_LINES="$(printf '%s\n' "$CHANGED_FILES" | sed 's/^/- /')"
  fi
fi

print_header() {
  cat <<EOF
リポジトリ: $REPO_ROOT
ブランチ: $CURRENT_BRANCH
HEAD: $LOCAL_HEAD
origin/main: $REMOTE_HEAD
EOF
}

emit_impl_prompt() {
  local reviewer="$1"
  local author="$2"
  cat <<EOF
あなたは $reviewer です。以下の $author 実装を「確率的レビュー」で評価してください。

$(print_header)
レビュー範囲: $RANGE
変更ファイル:
$FILE_LINES

出力要件:
1. 結論（このままマージ可否）
2. 重大度順の指摘（Critical/High/Medium/Low）
3. 各指摘の「発生確率」と「影響度」の根拠
4. いますぐ直すべき上位3件（理由つき）
5. 追加テスト観点（最小）

制約:
- 「未確認」を事実として断定しない
- 確率は必ず根拠（コード箇所/データフロー/再現条件）を添える
- 最後に「今回レビューの信頼度(%)」を出す
EOF
}

emit_plan_prompt() {
  local reviewer="$1"
  local planner="$2"
  cat <<EOF
あなたは $reviewer です。以下の $planner 案を「実装前の確率的レビュー」で評価してください。

$(print_header)

出力要件:
1. 採用可否（Go / Conditional Go / No Go）
2. 失敗確率が高いポイント上位5件
3. 指標悪化リスク（Retention / Monetization / Complexity）
4. 最小実装順（P0→P1）
5. 仕様を壊さず成功確率を上げる修正案

制約:
- 主観だけで数値を置かない（仮説なら仮説と明示）
- 既存実装との整合を優先
- 最後に「この案の成功確率レンジ」を提示

レビュー対象案（ここに貼る）:
--- PLAN START ---
[ここに案を貼る]
--- PLAN END ---
EOF
}

echo "===== COPY FROM HERE ====="
case "$MODE" in
  codex_impl_by_claude)
    emit_impl_prompt "Claude" "Codex"
    ;;
  claude_impl_by_codex)
    emit_impl_prompt "Codex" "Claude"
    ;;
  codex_plan_by_claude)
    emit_plan_prompt "Claude" "Codex"
    ;;
  claude_plan_by_codex)
    emit_plan_prompt "Codex" "Claude"
    ;;
esac
echo "===== COPY UNTIL HERE ====="
