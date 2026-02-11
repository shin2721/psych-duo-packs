# Analytics Growth Dashboard (v1.6)

## 目的
- 継続率と課金転換に効くKPIを、毎日同じ定義で確認する。
- ダッシュボード更新と日次レポートをスクリプトで再現可能にする。

## v1.6での方針
- PostHog APIの制約に合わせ、`InsightVizNode + Trends/Retention` を使用。
- `HogQLQuery` を insight source に直接入れる方式は使わない。
- 比率指標は「関連イベントの系列」を作り、レポート側で算出する。

## 必須スコープ
- `dashboard:read`
- `dashboard:write`
- `insight:read`
- `insight:write`

## 必須環境変数
```bash
export POSTHOG_PERSONAL_API_KEY=phx_xxx
export POSTHOG_PROJECT_ID=12345
export POSTHOG_HOST=https://us.posthog.com
```

## 生成されるカード（v1.6）
1. `DAU (session_start UV)`
2. `Lesson Start vs Complete (UV)`
3. `Incorrect vs Lesson Start (daily)`
4. `Streak Lost Users (daily)`
5. `Energy Friction (daily)`
6. `D1 Retention (session_start)`
7. `D7 Retention (session_start)`
8. `Checkout Starts (daily)`
9. `Paid Plan Changes (daily)`

## 実行コマンド
```bash
# 変更内容確認
npm run analytics:posthog:dashboard:dry

# ダッシュボード作成/更新
npm run analytics:posthog:dashboard

# KPI日次レポート生成（Insight結果から7d比較を算出）
npm run analytics:posthog:kpi-report
```

## KPIレポートの出力内容
- 基準日（昨日）
- 直近7日 vs 前7日
- 指標:
  - DAU
  - Lesson Completion Rate (UV)
  - Incorrect per Lesson Start
  - Energy Block Rate
  - Energy Shop Intent
  - D1 Retention
  - D7 Retention
  - Checkout Starts
  - Paid Plan Changes
- 20%以上悪化した指標のアラート
- 優先度付きの推奨アクション3件

## 関連イベント
- 既存:
  - `session_start`
  - `lesson_start`
  - `lesson_complete`
  - `energy_blocked`
  - `shop_open_from_energy`
  - `energy_bonus_hit`
- v1.6で追加:
  - `question_incorrect`
  - `streak_lost`
  - `streak_saved_with_freeze`
  - `checkout_start`
  - `checkout_opened`
  - `checkout_failed`
  - `restore_start`
  - `restore_result`
  - `plan_select`
  - `plan_changed`

## 運用メモ
- `npm run analytics:posthog:dashboard` は既存 insight を再利用しつつ query を更新する。
- 既存データが少ない間は `n/a` や `0` が出るのは正常。
- 日次運用は「1指標だけに1施策」で回す。
