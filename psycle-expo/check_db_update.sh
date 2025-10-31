#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="nudmnbmasmtacoluyvqo"
SB_URL="https://${PROJECT_REF}.supabase.co"
SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZG1uYm1hc210YWNvbHV5dnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY4MjQwMywiZXhwIjoyMDc2MjU4NDAzfQ.b2lYiAg0ntPhBjzlusGOKLGHuD2KMu0bmCcKZclppm8"
EMAIL="test+psycle@example.com"

echo "▶ profiles テーブルをポーリング中（最大60秒）..."
echo

ATTEMPTS=20
SLEEP=3
OK=0

for i in $(seq 1 $ATTEMPTS); do
  RES="$(curl -sG "$SB_URL/rest/v1/profiles" \
    -H "apikey: $SB_KEY" \
    -H "Authorization: Bearer $SB_KEY" \
    --data-urlencode "select=id,email,plan,active_until,updated_at" \
    --data-urlencode "email=eq.$EMAIL" \
    --data-urlencode "limit=1")"
  
  PLAN="$(echo "$RES" | jq -r '.[0].plan // empty')"
  UNTIL="$(echo "$RES" | jq -r '.[0].active_until // empty')"
  
  if [[ "$PLAN" == "pro" || "$PLAN" == "max" ]] && [[ -n "$UNTIL" && "$UNTIL" != "null" ]]; then
    echo "✅ データベース反映を確認！"
    echo
    echo "$RES" | jq '.[0]'
    OK=1
    break
  fi
  
  printf "⏳ 待機中 (%s/%s) - plan=%s, active_until=%s\r" "$i" "$ATTEMPTS" "${PLAN:--}" "${UNTIL:--}"
  sleep "$SLEEP"
done

echo
echo

if [[ $OK -eq 0 ]]; then
  echo "⚠️ まだ反映が確認できませんでした。"
  echo "取得データ:"
  echo "$RES" | jq .
  echo
  echo "確認事項:"
  echo "  1. Stripe Dashboard で決済が成功しているか"
  echo "  2. Webhook が正しく設定されているか"
  echo "  3. Functions ログを確認: supabase functions logs --project-ref $PROJECT_REF -f stripe-webhook"
  exit 1
fi

echo "🎉 成功！Webhook が正常に動作し、データベースが更新されました。"
