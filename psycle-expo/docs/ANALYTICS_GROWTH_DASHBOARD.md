# Analytics Growth Dashboard (v1.19)

## 目的
- 継続率と課金転換に効くKPIを、毎日同じ定義で確認する。
- ダッシュボード更新と日次レポートをスクリプトで再現可能にする。

## v1.19での方針
- PostHog APIの制約に合わせ、`InsightVizNode + Trends/Retention` を使用する。
- 比率指標は関連イベント系列を作り、レポート側で算出する。
- 行動系は日記投稿 (`action_journal_submitted`) を主導線に統一する。
- Streak可視化、Journal候補品質、Streak Guard時間帯最適化、League Sprintに加えて、Quest/XP Boostの習慣化ループを評価する。
- Quest報酬は `auto-claim` を標準運用にし、manual claim は後方互換APIのみ維持する。
- `日次2/3カード` は v1.19 では未投入。
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

毎回 `export` したくない場合は、1回だけ以下を実行してローカル保存できます（`.env.posthog.local` に保存、gitignore対象）。
```bash
npm run analytics:posthog:setup
```

## 生成されるカード（v1.19）
1. `DAU (session_start UV)`
2. `Lesson Start vs Complete (UV)`
3. `Lesson Complete Users vs DAU (UV)`
4. `Intervention Funnel (daily)`
5. `Recovery Mission (daily)`
6. `Streak Guard (daily)`
7. `Streak Visibility (daily)`
8. `Streak Guard by Daypart (daily)`
9. `League Boundary (daily)`
10. `League Sprint (daily)`
11. `Action Journal (daily)`
12. `Action Journal Quality (daily)`
13. `Quest Progress (daily)`
14. `Quest Auto Claim (daily)`
15. `XP Boost (daily)`
16. `Completed Sessions (daily)`
17. `Incorrect vs Lesson Start (daily)`
18. `Streak Lost Users (daily)`
19. `Energy Friction (daily)`
20. `D1 Retention (session_start)`
21. `D7 Retention (session_start)`
22. `Checkout Starts (daily)`
23. `Paid Plan Changes (daily)`

## 実行コマンド
```bash
# 初回のみ: PostHog資格情報をローカル保存
npm run analytics:posthog:setup

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
  - Journal Top2 Pick Share
  - Recovery Mission Claim Rate
  - Daily Quest 3/3 Rate
  - Quest Auto-Claim Share
  - XP Boost Activation Rate
  - XP Boost Ticket Queue Rate
  - XP Boost Bonus XP / User
  - Streak Visibility Click Rate
  - Streak Guard Click/Save Rate
  - Streak Guard Evening Save Rate
  - League Boundary Click Rate
  - League Sprint Click Rate
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
- v1.14-v1.19で追加/更新:
  - `streak_visibility_shown`
  - `streak_visibility_clicked`
  - `action_journal_opened`
  - `action_journal_submitted` (`tryPosition` プロパティ追加)
  - `recovery_mission_shown` (`studyStreak` プロパティ)
  - `recovery_mission_claimed` (`studyStreakAfter` プロパティ)
  - `streak_guard_shown` (`studyStreak`, `daypart`, `copyVariant` プロパティ)
  - `streak_guard_clicked` (`studyStreak`, `daypart`, `copyVariant` プロパティ)
  - `streak_guard_saved` (`studyStreakAfter`, `daypart`, `copyVariant` プロパティ)
  - `league_boundary_shown`
  - `league_boundary_clicked`
  - `league_sprint_shown`
  - `league_sprint_clicked`
  - `quest_board_opened`
  - `quest_reward_claimed` (`claimMode`, `source` プロパティ追加)
  - `quest_bundle_completed` (`claimMode`, `source` プロパティ追加)
  - `xp_boost_ticket_granted` (`claimMode`, `source` プロパティ追加)
  - `quest_auto_claim_applied`
  - `xp_boost_ticket_queued`
  - `xp_boost_ticket_grant_blocked`
  - `xp_boost_started`
  - `xp_boost_applied`
  - `xp_boost_expired`
- 停止:
  - `intervention_attempted`
  - `intervention_executed`

## 運用メモ
- `npm run analytics:posthog:dashboard` は既存 insight を再利用しつつ query を更新する。
- 既存データが少ない間は `n/a` や `0` が出るのは正常。
- 日次運用は「1指標だけに1施策」で回す。
