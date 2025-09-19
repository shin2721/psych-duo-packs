#!/bin/zsh
set -euo pipefail

REPO="/Users/mashitashinji/dev/psych-duo-packs"
REPO_URL="https://github.com/shin2721/psych-duo-packs.git"

echo "🔐 GitHub CLI 認証とpush実行スクリプト"
echo "======================================"

cd "$REPO"

echo -e "\n== ステップ1: GitHub CLI認証 =="
echo "以下の手順で認証を行います:"
echo ""
echo "1. このスクリプトを実行後、以下のコマンドを手動で実行:"
echo "   $ gh auth login -w"
echo ""
echo "2. 表示される質問に答える:"
echo "   - What account do you want to log into? → GitHub.com"
echo "   - What is your preferred protocol for Git operations? → HTTPS"
echo "   - Authenticate Git with your GitHub credentials? → Yes"
echo "   - How would you like to authenticate GitHub CLI? → Login with a web browser"
echo ""
echo "3. 表示される8文字のコード（例: XXXX-XXXX）をコピー"
echo "4. Enterを押してブラウザを開く"
echo "5. GitHubにログインし、コードを入力"
echo "6. 認証を許可"
echo ""
echo "認証完了後、以下のコマンドでpushを実行:"
echo "$ ./push_to_github.sh"
echo ""
echo "======================================"
