#!/bin/zsh
set -euo pipefail

REPO="/Users/mashitashinji/dev/psych-duo-packs"
REPO_URL="https://github.com/shin2721/psych-duo-packs.git"

cd "$REPO"

echo "🚀 GitHub Push実行"
echo "======================================"

echo "== 認証状態確認 =="
if gh auth status >/dev/null 2>&1; then
  echo "✅ GitHub CLI認証済み"
  gh auth status
else
  echo "❌ 未認証です。先に以下を実行してください:"
  echo "   $ gh auth login -w"
  exit 1
fi

echo -e "\n== origin確認 =="
git remote -v | head -2

echo -e "\n== push実行 =="
git push -u origin main

echo -e "\n======================================"
echo "📊 完了要約"
echo "======================================"
echo "HEAD: $(git log -1 --oneline)"
echo "Remote: $(git remote -v | sed -n '1p')"
echo ""
echo "🌐 GitHub Pages URL:"
echo "   https://shin2721.github.io/psych-duo-packs/"
echo ""
echo "📝 次のステップ:"
echo "1. 上記URLを開いて確認"
echo "2. もし404なら:"
echo "   - https://github.com/shin2721/psych-duo-packs/settings/pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: main / (root)"
echo "   - Save"
echo ""
echo "✅ Push完了！"
