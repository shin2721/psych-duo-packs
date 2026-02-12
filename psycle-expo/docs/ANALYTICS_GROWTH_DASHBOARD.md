# Analytics Growth Dashboard (v1.12)

## 目的
- 継続率と課金転換に効くKPIを、毎日同じ定義で確認する。
- ダッシュボード更新と日次レポートをスクリプトで再現可能にする。

## v1.12での方針
- PostHog APIの制約に合わせ、`InsightVizNode + Trends/Retention` を使用。
- `HogQLQuery` を insight source に直接入れる方式は使わない。
- 比率指標は「関連イベントの系列」を作り、レポート側で算出する。
- Primary KPI を次の3つに固定する。
  - `D7継続率`
  - `サブスク転換率 (plan_changed / checkout_start)`
  - `実行ユーザー率 (intervention_executed UV / session_start UV)`

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

## 生成されるカード（v1.12）
1. `DAU (session_start UV)`
2. `Executed Users vs DAU (UV)`
3. `Intervention Funnel (daily)`
4. `Recovery Mission (daily)`
5. `Streak Guard (daily)`
6. `League Boundary (daily)`
7. `Lesson Start vs Complete (UV)`
8. `Completed Sessions (daily)`
9. `Incorrect vs Lesson Start (daily)`
10. `Streak Lost Users (daily)`
11. `Energy Friction (daily)`
12. `D1 Retention (session_start)`
13. `D7 Retention (session_start)`
14. `Checkout Starts (daily)`
15. `Paid Plan Changes (daily)`

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
- Primary KPI:
  - D7 Retention 7d
  - Paid Plan Conversion 7d
  - Executed User Rate 7d
- 補助指標:
  - Completed Sessions / Day 7d
  - DAU
  - Lesson Completion Rate (UV)
  - Intervention Attempt Rate (attempted / shown)
  - Intervention Execute Rate (executed / attempted)
  - Recovery Mission Claim Rate (recovery_mission_claimed / recovery_mission_shown)
  - Streak Guard Click Rate (streak_guard_clicked / streak_guard_shown)
  - Streak Guard Save Rate (streak_guard_saved / streak_guard_shown)
  - League Boundary Click Rate (league_boundary_clicked / league_boundary_shown)
  - Incorrect per Lesson Start
  - Energy Block Rate
  - Energy Shop Intent
  - D1 Retention
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
- v1.12で追加:
  - `intervention_shown`
  - `intervention_attempted`
  - `intervention_executed`
  - `recovery_mission_shown`
  - `recovery_mission_claimed`
  - `streak_guard_shown`
  - `streak_guard_clicked`
  - `streak_guard_saved`
  - `league_boundary_shown`
  - `league_boundary_clicked`
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
