#!/usr/bin/env bash
set -euo pipefail

# 設定値
PROJECT_REF="nudmnbmasmtacoluyvqo"
FUNC_BASE="https://${PROJECT_REF}.functions.supabase.co"
CREATE_URL="$FUNC_BASE/create-checkout-session"
PRICE_ID="price_1SJ82EJDXOz4c0ISSpJmO8sx"
EMAIL="test+psycle@example.com"
USER_ID=""

echo "▶ Checkout Session を作成中..."
echo "  Price: $PRICE_ID (Pro)"
echo "  Email: $EMAIL"

RESP="$(curl -s -X POST "$CREATE_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"priceId\":\"$PRICE_ID\",\"userId\":\"$USER_ID\",\"email\":\"$EMAIL\"}")"

echo
echo "📋 レスポンス:"
echo "$RESP" | jq .

URL="$(echo "$RESP" | jq -r '.url // empty')"

if [[ -z "$URL" || "$URL" == "null" ]]; then
  echo
  echo "❌ Checkout URLが取得できませんでした"
  exit 1
fi

echo
echo "✅ Checkout URL が作成されました:"
echo "🔗 $URL"
echo
echo "ブラウザで開きます..."
open "$URL"

echo
echo "👉 次のステップ:"
echo "   1. ブラウザで Stripe Checkout ページが開きます"
echo "   2. テストカード情報を入力:"
echo "      カード番号: 4242 4242 4242 4242"
echo "      有効期限: 12/34"
echo "      CVC: 123"
echo "      郵便番号: 任意の5桁"
echo "   3. 決済を完了"
echo "   4. 完了したらこのターミナルに戻ってください"
echo
