# Analytics Growth Dashboard (v1.13)

## 目的
- 継続率と課金転換に効くKPIを、毎日同じ定義で確認する。
- ダッシュボード更新と日次レポートをスクリプトで再現可能にする。

## v1.13での方針
- PostHog APIの制約に合わせ、`InsightVizNode + Trends/Retention` を使用する。
- 比率指標は関連イベント系列を作り、レポート側で算出する。
- 行動系は日記投稿 (`action_journal_submitted`) を主導線に統一する。
- Primary KPI を次の4つに固定する。
  - `D7継続率`
  - `サブスク転換率 (plan_changed / checkout_start)`
  - `レッスン完了ユーザー率 (lesson_complete UV / session_start UV)`
  - `日記投稿ユーザー率 (action_journal_submitted UV / session_start UV)`

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

## 生成されるカード（v1.13）
1. `DAU (session_start UV)`
2. `Lesson Start vs Complete (UV)`
3. `Lesson Complete Users vs DAU (UV)`
4. `Intervention Funnel (daily)`
5. `Recovery Mission (daily)`
6. `Streak Guard (daily)`
7. `League Boundary (daily)`
8. `Action Journal (daily)`
9. `Completed Sessions (daily)`
10. `Incorrect vs Lesson Start (daily)`
11. `Streak Lost Users (daily)`
12. `Energy Friction (daily)`
13. `D1 Retention (session_start)`
14. `D7 Retention (session_start)`
15. `Checkout Starts (daily)`
16. `Paid Plan Changes (daily)`

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
  - Lesson Complete User Rate 7d
  - Journal Post User Rate 7d
- 補助指標:
  - Lesson Completion Rate (UV)
  - Action Journal submitted total / UV
  - Journal Not Tried Share
  - Recovery Mission Claim Rate
  - Streak Guard Click/Save Rate
  - League Boundary Click Rate
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
  - `intervention_shown`
  - `energy_blocked`
  - `shop_open_from_energy`
  - `energy_bonus_hit`
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
- v1.13で追加/更新:
  - `action_journal_opened`
  - `action_journal_submitted`
  - `recovery_mission_shown` (`studyStreak` プロパティ)
  - `recovery_mission_claimed` (`studyStreakAfter` プロパティ)
  - `streak_guard_shown` (`studyStreak` プロパティ)
  - `streak_guard_clicked` (`studyStreak` プロパティ)
  - `streak_guard_saved` (`studyStreakAfter` プロパティ)
  - `league_boundary_shown`
  - `league_boundary_clicked`
- 停止:
  - `intervention_attempted`
  - `intervention_executed`

## 運用メモ
- `npm run analytics:posthog:dashboard` は既存 insight を再利用しつつ query を更新する。
- 既存データが少ない間は `n/a` や `0` が出るのは正常。
- 日次運用は「1指標だけに1施策」で回す。
