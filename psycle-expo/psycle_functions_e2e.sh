#!/usr/bin/env bash
set -euo pipefail

# ---- Config（必要なら上書き可）----
PROJECT_REF="${PROJECT_REF:-nudmnbmasmtacoluyvqo}"
FUNC_BASE="https://${PROJECT_REF}.functions.supabase.co"
CREATE_URL="${CREATE_URL:-$FUNC_BASE/create-checkout-session}"
WEBHOOK_URL="${WEBHOOK_URL:-$FUNC_BASE/stripe-webhook}"

need(){ command -v "$1" >/dev/null || { echo "❌ '$1' が必要です（brew install $1）"; exit 1; }; }
need curl; need jq

echo "▶ Checkout を作成します（Functions: $CREATE_URL）"
# --- 入力（安全のためここで聞く）---
read -r -p "PRICE_ID (price_…): " PRICE_ID
read -r -p "ユーザーEmail (決済に使う): " EMAIL
read -r -p "ユーザーID（任意。空でOK）: " UID || true

[ -n "$PRICE_ID" ] || { echo "❌ PRICE_ID が空"; exit 1; }
[ -n "$EMAIL" ] || { echo "❌ Email が空"; exit 1; }

# --- Checkout Session 作成 ---
echo "▶ セッション作成中…"
RESP="$(curl -s -X POST "$CREATE_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"priceId\":\"$PRICE_ID\",\"userId\":\"$UID\",\"email\":\"$EMAIL\"}")" || true
URL="$(echo "$RESP" | jq -r '.url // empty')"

if [[ -z "$URL" || "$URL" == "null" ]]; then
  echo "❌ URLが取得できませんでした。レスポンス:"
  echo "$RESP" | jq .
  echo "※ Functionsのログ / STRIPE_SECRET_KEY / PRICE_ID を確認してください。"
  exit 1
fi

echo "🔗 Checkout URL: $URL"
# macOS / Linux で自動オープン
if command -v open >/dev/null; then open "$URL"; elif command -v xdg-open >/dev/null; then xdg-open "$URL"; fi

echo
read -r -p "👉 ブラウザでテスト決済を完了したら Enter（テストカード: 4242 4242 4242 4242 / 12/34 / 123）" _

# --- 反映確認（Supabase REST をポーリング）---
read -r -p "Supabase URL（例: https://$PROJECT_REF.supabase.co）: " SB_URL
read -r -s -p "service_role か Secret（表示されません）: " SB_KEY; echo

[ -n "$SB_URL" ] || { echo "❌ SB_URL が空"; exit 1; }
[ -n "$SB_KEY" ] || { echo "❌ SB_KEY が空"; exit 1; }

echo "▶ profiles をポーリングして反映を確認（最大 90秒）…"
ATTEMPTS=30
SLEEP=3
OK=0
for i in $(seq 1 $ATTEMPTS); do
  RES="$(curl -sG "$SB_URL/rest/v1/profiles" \
    -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" \
    --data-urlencode "select=id,email,plan,active_until,updated_at" \
    --data-urlencode "email=eq.$EMAIL" \
    --data-urlencode "limit=1")"
  PLAN="$(echo "$RES" | jq -r '.[0].plan // empty')"
  UNTIL="$(echo "$RES" | jq -r '.[0].active_until // empty')"
  if [[ "$PLAN" == "pro" || "$PLAN" == "max" ]] && [[ -n "$UNTIL" && "$UNTIL" != "null" ]]; then
    echo "✅ 反映OK: plan=$PLAN, active_until=$UNTIL"
    echo "$RES" | jq
    OK=1
    break
  fi
  printf "…待機中(%s/%s) plan=%s active_until=%s\r" "$i" "$ATTEMPTS" "${PLAN:--}" "${UNTIL:--}"
  sleep "$SLEEP"
done
echo

if [[ $OK -eq 0 ]]; then
  echo "⚠️ まだ反映が確認できませんでした。Webhook を確認してください："
  echo "   Stripe Webhooks → Endpoint: $WEBHOOK_URL"
  echo "   Supabase Secrets に STRIPE_WEBHOOK_SECRET が入っているか確認"
  echo "   Functions ログ: supabase functions logs --project-ref $PROJECT_REF -f stripe-webhook"
  echo "   取得レスポンス:"
  echo "$RES" | jq .
  exit 2
fi

echo "🎉 完了。これで Supabase Functions 経由の契約フローが動作しています。"
