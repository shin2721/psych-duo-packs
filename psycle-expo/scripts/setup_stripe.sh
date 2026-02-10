#!/bin/bash
# === Psycle Stripe 初期設定（TEST）===

set -euo pipefail

command -v stripe >/dev/null || { echo "❌ stripe CLIが見つかりません。まず 'stripe login' を実行してください。"; exit 1; }
command -v jq >/dev/null     || { echo "❌ jq が見つかりません。'brew install jq' を実行してください。"; exit 1; }

echo "▶︎ Pro 商品を作成…"
PROD_PRO=$(stripe products create \
  --name "Psycle Pro (Monthly)" \
  --description "Unlimited energy + MistakesHub" \
  -d "metadata[plan]=pro" | jq -r .id)

echo "▶︎ Pro 価格を作成…"
PRICE_PRO=$(stripe prices create \
  --product "$PROD_PRO" \
  --currency jpy \
  --unit-amount 1980 \
  -d "recurring[interval]=month" | jq -r .id)

echo "▶︎ Max 商品を作成…"
PROD_MAX=$(stripe products create \
  --name "Psycle Max (Monthly)" \
  --description "Everything in Pro + advanced review features" \
  -d "metadata[plan]=max" | jq -r .id)

echo "▶︎ Max 価格を作成…"
PRICE_MAX=$(stripe prices create \
  --product "$PROD_MAX" \
  --currency jpy \
  --unit-amount 2990 \
  -d "recurring[interval]=month" | jq -r .id)

echo "▶︎ entitlements.json を更新…"
FILE="config/entitlements.json"
TMP=$(mktemp)

# 既存ファイルに stripe_price_id を追記/更新（無い場合は雛形を生成）
if [ -f "$FILE" ]; then
  jq --arg pro "$PRICE_PRO" --arg max "$PRICE_MAX" '
    .plans.pro  = (.plans.pro  // {}) + {stripe_price_id:$pro}  |
    .plans.max  = (.plans.max  // {}) + {stripe_price_id:$max}  |
    .plans.free = (.plans.free // {})
  ' "$FILE" > "$TMP"
else
  jq -n --arg pro "$PRICE_PRO" --arg max "$PRICE_MAX" '
    {
      plans: {
        free:{plan:"free",features:["lite_questions","daily_energy_5"]},
        pro:{plan:"pro",stripe_price_id:$pro,features:["unlimited_energy","lite+pro_questions","mistakes_hub"]},
        max:{plan:"max",stripe_price_id:$max,features:["everything_in_pro","advanced_review"]}
      }
    }
  ' > "$TMP"
fi
mv "$TMP" "$FILE"

echo "✅ 完了"
echo "   PROD_PRO=$PROD_PRO"
echo "   PRICE_PRO=$PRICE_PRO"
echo "   PROD_MAX=$PROD_MAX"
echo "   PRICE_MAX=$PRICE_MAX"

echo "▶︎ 動作確認用のCheckout（テスト）URLを作成します…"
SESSION_PRO=$(stripe checkout sessions create \
  --mode subscription \
  -d "line_items[0][price]=$PRICE_PRO" \
  -d "line_items[0][quantity]=1" \
  -d "success_url=https://example.com/success?plan=pro" \
  -d "cancel_url=https://example.com/cancel" | jq -r .url)

SESSION_MAX=$(stripe checkout sessions create \
  --mode subscription \
  -d "line_items[0][price]=$PRICE_MAX" \
  -d "line_items[0][quantity]=1" \
  -d "success_url=https://example.com/success?plan=max" \
  -d "cancel_url=https://example.com/cancel" | jq -r .url)

echo "🔗 Pro(テスト) Checkout URL: $SESSION_PRO"
echo "🔗 Max(テスト) Checkout URL: $SESSION_MAX"

echo "（任意）gitに反映するなら:"
echo "  git add $FILE && git commit -m 'chore: add stripe price ids (test)'"
