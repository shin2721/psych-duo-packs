#!/bin/zsh
set -euo pipefail

# 変数設定
REPO="/Users/mashitashinji/dev/psych-duo-packs"
REMOTE_URL="https://github.com/shin2721/psych-duo-packs.git"

echo "🚀 DevOps セットアップ開始"
echo "================================"

# 1) Xcode ライセンス承認（必要な場合）
echo "== Xcode ライセンス確認 =="
if command -v xcodebuild >/dev/null; then 
    sudo xcodebuild -license accept 2>/dev/null || true
    echo "✓ Xcode ライセンス処理完了"
else
    echo "→ Xcode未インストール（スキップ）"
fi

# 2) GitHub CLI 設定ディレクトリ作成
echo -e "\n== GitHub CLI 設定ディレクトリ =="
mkdir -p "$HOME/.config/gh" && chmod 700 "$HOME/.config/gh" || true
echo "✓ ~/.config/gh 準備完了"

# 3) リポジトリに移動
echo -e "\n== リポジトリディレクトリ =="
cd "$REPO"
echo "✓ 移動完了: $REPO"

# 4) Git 状態確認
echo -e "\n== Git 状態 =="
git status -sb || true
echo ""
git branch -vv || true
echo ""
git remote -v || true

# 5) gh 認証状態
echo -e "\n== gh 認証 =="
if gh auth status 2>/dev/null; then
    echo "✓ GitHub CLI認証済み"
else
    echo "⚠️  未ログイン → 実行: gh auth login -w"
fi

# 6) origin をHTTPSに統一
echo -e "\n== origin をHTTPSに統一 =="
if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
    echo "✓ origin URL更新: $REMOTE_URL"
else
    git remote add origin "$REMOTE_URL"
    echo "✓ origin 追加: $REMOTE_URL"
fi

# 7) ブランチを main に統一
echo -e "\n== ブランチを main に統一 =="
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "main" ]; then 
    git branch -M main
    echo "✓ ブランチ名変更: $CURRENT → main"
else
    echo "✓ 既に main ブランチ"
fi

# 8) Pages用ファイル確認
echo -e "\n== Pages用ファイル確認 =="
if ls public/index.html >/dev/null 2>&1; then
    echo "✓ public/index.html 存在"
    ls -la public/index.html
elif ls index.html >/dev/null 2>&1; then
    echo "✓ index.html 存在"
    ls -la index.html
else
    echo "<!doctype html><title>OK</title>OK" > public/index.html
    echo "✓ public/index.html 作成"
fi

if ls .nojekyll >/dev/null 2>&1; then
    echo "✓ .nojekyll 存在"
else
    touch .nojekyll
    echo "✓ .nojekyll 作成"
fi

# 9) 変更があればコミット
echo -e "\n== 変更があればコミット =="
if [[ -n "$(git status --porcelain)" ]]; then
    git add -A || true
    git commit -m "chore: init pages files" || true
    echo "✓ コミット完了"
else
    echo "→ 変更なし（スキップ）"
fi

# 10) push
echo -e "\n== push =="
if git push -u origin main 2>/dev/null; then
    echo "✓ Push成功"
else
    echo "⚠️  Push失敗（認証が必要かもしれません）"
fi

# 11) 要約
echo -e "\n================================"
echo "📊 要約"
echo "================================"
echo "HEAD: $(git log -1 --oneline || echo '不明')"
echo "Remote: $(git remote -v | sed -n '1p' || echo '未設定')"
echo "gh: $(gh auth status 2>&1 | head -n 1 || echo '未認証')"
echo ""
echo "📌 次のステップ:"
if ! gh auth status 2>/dev/null; then
    echo "  1. 認証: gh auth login -w"
    echo "  2. 再push: git push -u origin main"
fi
echo "  3. GitHub Pages: Settings>Pages で Source=main/(root) を確認"
echo "  4. URL: https://shin2721.github.io/psych-duo-packs/"
echo ""
echo "✅ セットアップスクリプト完了"
