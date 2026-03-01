# Analytics Growth Dashboard (v1.5)

## 目的

「どこを直せば継続率が上がるか」を毎週同じ基準で判断するためのダッシュボード定義。

- 主要KPI: `D1`, `D7`, `lesson_start -> lesson_complete`, `question_incorrect`, `streak_lost`, `energy_block_rate`, `energy_shop_intent`
- データソース: PostHog `events`（`env = prod`）
- 集計単位: 日次（30日ローリング）

## 前提イベント

- `session_start`
- `lesson_start`
- `lesson_complete`
- `question_incorrect`
- `streak_lost`
- `energy_blocked`
- `shop_open_from_energy`
- `energy_bonus_hit`

## ダッシュボード構成（7カード）

1. **DAU（学習セッション）**
- 種類: Line
- 指標: `uniq(distinct_id)` where `event = session_start`

2. **Lesson Completion Rate（UV）**
- 種類: Number + Trend
- 指標: `lesson_complete_uv / lesson_start_uv`

3. **Incorrect Per Lesson Start**
- 種類: Line
- 指標: `question_incorrect_count / lesson_start_count`

4. **Streak Lost Users（日次）**
- 種類: Stacked bar
- 指標: `uniq(distinct_id)` where `event = streak_lost`, breakdown by `properties.streakType`

5. **Energy Friction（日次）**
- 種類: Line
- 指標: `energy_block_rate`, `energy_shop_intent`

6. **D1 Retention**
- 種類: Retention insight
- 起点: `session_start`
- 再訪: `session_start`
- 期間: Day 1

7. **D7 Retention**
- 種類: Retention insight
- 起点: `session_start`
- 再訪: `session_start`
- 期間: Day 7

## HogQL クエリ定義

### 1) DAU

```sql
SELECT
  toDate(timestamp) AS day,
  uniqIf(distinct_id, event = 'session_start') AS dau
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
```

### 2) Lesson Completion Rate（UV）

```sql
SELECT
  toDate(timestamp) AS day,
  uniqIf(distinct_id, event = 'lesson_start') AS lesson_start_uv,
  uniqIf(distinct_id, event = 'lesson_complete') AS lesson_complete_uv,
  round(lesson_complete_uv / nullIf(lesson_start_uv, 0), 4) AS lesson_completion_rate_uv
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
```

### 3) Incorrect Per Lesson Start

```sql
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'question_incorrect') AS question_incorrect_count,
  countIf(event = 'lesson_start') AS lesson_start_count,
  round(question_incorrect_count / nullIf(lesson_start_count, 0), 3) AS incorrect_per_lesson_start
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
```

### 4) Streak Lost（日次・種別）

```sql
SELECT
  toDate(timestamp) AS day,
  properties.streakType AS streak_type,
  uniq(distinct_id) AS users_lost
FROM events
WHERE event = 'streak_lost'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day, streak_type
ORDER BY day ASC, streak_type ASC
```

### 5) Energy Friction（日次）

```sql
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'lesson_start') AS lesson_start_count,
  countIf(event = 'energy_blocked') AS energy_blocked_count,
  countIf(event = 'shop_open_from_energy') AS shop_open_from_energy_count,
  round(energy_blocked_count / nullIf(lesson_start_count, 0), 4) AS energy_block_rate,
  round(shop_open_from_energy_count / nullIf(energy_blocked_count, 0), 4) AS energy_shop_intent
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
  AND properties.env = 'prod'
GROUP BY day
ORDER BY day ASC
```

### 6) 直近7日サマリー（意思決定用）

```sql
WITH base AS (
  SELECT
    event,
    distinct_id
  FROM events
  WHERE timestamp >= now() - INTERVAL 7 DAY
    AND properties.env = 'prod'
)
SELECT
  uniqIf(distinct_id, event = 'session_start') AS active_users_7d,
  uniqIf(distinct_id, event = 'lesson_start') AS lesson_start_uv_7d,
  uniqIf(distinct_id, event = 'lesson_complete') AS lesson_complete_uv_7d,
  round(lesson_complete_uv_7d / nullIf(lesson_start_uv_7d, 0), 4) AS lesson_completion_rate_uv_7d,
  countIf(event = 'question_incorrect') AS question_incorrect_7d,
  round(question_incorrect_7d / nullIf(lesson_start_uv_7d, 0), 3) AS incorrect_per_start_7d,
  uniqIf(distinct_id, event = 'streak_lost') AS streak_lost_users_7d,
  countIf(event = 'energy_blocked') AS energy_blocked_7d,
  countIf(event = 'shop_open_from_energy') AS shop_open_from_energy_7d,
  round(energy_blocked_7d / nullIf(lesson_start_uv_7d, 0), 4) AS energy_block_rate_7d,
  round(shop_open_from_energy_7d / nullIf(energy_blocked_7d, 0), 4) AS energy_shop_intent_7d
FROM base
```

## 判断ルール（確率的）

- `lesson_completion_rate_uv_7d < 0.60`
  - 優先施策: 問題難易度/設問文改善、誤答時ヒント追加
  - 期待成功確率: `~70%`

- `incorrect_per_start_7d > 2.0`
  - 優先施策: 最初の3問を易化、選択肢ノイズ削減
  - 期待成功確率: `~65%`

- `streak_lost_users_7d / active_users_7d > 0.20`
  - 優先施策: 復帰導線（1問クイック復帰、Freeze訴求最適化）
  - 期待成功確率: `~60%`

- `energy_block_rate_7d > 0.18` or `energy_shop_intent_7d < 0.20`
  - 優先施策: 回復速度/ボーナス確率の緩和、Shop導線の文言改善
  - 期待成功確率: `~60%`

## 週次運用（30分）

1. ダッシュボード7カードを確認（前週比）
2. もっとも悪化した1指標だけを選ぶ
3. 施策を1つ決める（複数同時にやらない）
4. 翌週同じ指標で効果判定

## APIで自動作成する

1. PostHogのPersonal API Keyを発行（scope: `dashboard:read/write`, `insight:read/write`）
2. 環境変数を設定

```bash
export POSTHOG_PERSONAL_API_KEY=phx_xxx
export POSTHOG_PROJECT_ID=12345
export POSTHOG_HOST=https://app.posthog.com
```

3. Dry-runで確認

```bash
npm run analytics:posthog:dashboard:dry
```

4. 作成実行

```bash
npm run analytics:posthog:dashboard
```

5. KPIレポートJSONを生成（監視用）

```bash
npm run analytics:posthog:kpi-report
```

補足:
- 既存ダッシュボードを置き換える場合は `--replace` を付ける
- スクリプト: `scripts/create-posthog-growth-dashboard.mjs`

## v1.20 Reminder Events Addendum

v1.20でローカル通知リマインドの観測イベントを追加。

### 追加イベント

- `notification_permission_result`
  - `status`: `granted | denied`
  - `source`: `settings_toggle | bootstrap`
- `reminder_scheduled`
  - `kind`: `streak_risk | daily_quest_deadline | league_demotion_risk`
  - `scheduledAt`: ISO8601
  - `source`: `sync_daily_reminders`
- `reminder_opened`
  - `kind`: `streak_risk | daily_quest_deadline | league_demotion_risk`
  - `source`: `notification_tap`

### 運用メモ

- v1.20時点では通知はローカル通知（`expo-notifications`）で、サーバープッシュは未導入。
- KPIはまず `reminder_opened / reminder_scheduled` を補助指標として週次確認する。

## v1.21 Energy + Paywall Addendum

### 追加イベント

- `first_day_energy_bonus_granted`
  - `bonusEnergy`: 3
  - `baseCap`: 3
  - `effectiveCap`: 6
  - `expiresAt`: ISO8601
  - `source`: `first_launch`

### 運用メモ

- v1.21ではFreeの通常Energy値は維持（`3 / 60分`）。
- 初日24時間のみボーナス上限を適用し、以後は自動で通常上限に戻る。
- Paywall判定は `lesson_complete_count >= 3` のみに固定。

## v1.32 Double XP Nudge Addendum

### 追加イベント

- `double_xp_nudge_shown`
  - `source`: `lesson_complete`
  - `gems`: 表示時点の所持Gems
  - `dailyRemainingAfterShow`: 表示後の当日残り表示枠
- `double_xp_nudge_clicked`
  - `source`: `lesson_complete`
  - `gems`: クリック時点の所持Gems
- `double_xp_purchased`
  - `source`: `shop_item | lesson_complete_nudge`
  - `costGems`: 20
  - `gemsBefore`, `gemsAfter`
  - `activeUntil`: ISO8601

### 運用メモ

- ナッジ表示面はレッスン完了画面のみ。
- 表示頻度はローカル日付ベースで1日1回。
- `double_xp_nudge_clicked / double_xp_nudge_shown` をCTR、
  `double_xp_purchased(source='lesson_complete_nudge') / double_xp_nudge_clicked` をCVRとして週次監視する。

## v1.34-mini Event Campaign Addendum

### 追加イベント

- `event_shown`
  - `eventId`
  - `source`: `quests_tab`
- `community_goal_shown`
  - `eventId`
  - `targetLessons`
  - `source`: `quests_tab`
- `event_started`
  - `eventId`
  - `source`: `metric_progress`
- `event_quest_rewarded`
  - `eventId`
  - `templateId`
  - `metric`: `lesson_complete | streak5_milestone`
  - `rewardGems`
  - `source`: `metric_progress`
- `event_completed`
  - `eventId`
  - `rewardBadgeId`
  - `source`: `metric_progress`

### 運用メモ

- v1.34-mini は本流クエスト（daily/weekly/monthly）に侵襲せず、イベント状態を独立管理する。
- 現在設定は `event_campaign.enabled=true`。表示可否は `start_at/end_at` の期間判定で自動制御され、緊急停止時は `enabled=false` で即停止できる。
- 共同目標はテキスト表示のみ（実数集計RPCなし）。

## v1.35 Streak + Event Tuning Addendum

### 変更点

- `streak_milestones` を長期帯まで拡張
  - `day=60 => +30 Gems`
  - `day=100 => +50 Gems`
  - `day=365 => +100 Gems`
- `Spring Challenge 2026` の `streak5` クエスト難易度を調整
  - `ev_streak5_10` から `ev_streak5_5` に変更
  - `need: 10 -> 5`（報酬30 Gemsは維持）

### 監視観点

- `streak_milestone_rewarded`
  - `day in {60,100,365}` の発火有無と件数推移
- `event_completed / event_started`
  - 目標レンジ: `0.20 ~ 0.50`
  - 期間中にレンジを大きく下回る場合は次回イベントの難易度再調整を検討

## v1.36 Growth Foundation Addendum

### 追加イベント

- `quest_claimed`
  - `templateId`
  - `type`: `daily | weekly | monthly`
  - `rewardXp`
  - `rewardGems`
  - `source`: `manual_claim`
- `freeze_used`
  - `freezesRemaining`
  - `streak`
  - `source`: `streak_protection`
- `daily_goal_reached`
  - `dailyGoal`
  - `dailyXp`
  - `gemsAwarded`
  - `source`: `xp_gain`
- `league_reward_claimed`
  - `rewardId`
  - `gems`
  - `badgesCount`
  - `weekId`
  - `source`: `league_result_modal`
- `quest_cycle_reset`
  - `dailyReset`
  - `weeklyReset`
  - `monthlyReset`
  - `source`: `cycle_reconcile`
- `plan_select`
  - `source`: `shop_tab`
  - `planId`
- `checkout_start`
  - `source`: `shop_tab`
  - `planId`
  - `billingPeriod`: `monthly | yearly`
  - `trialDays`
- `checkout_failed`
  - `source`: `shop_tab | billing_lib`
  - `planId`（任意）
  - `reason`
  - `status`（任意）
- `plan_changed`
  - `source`: `profile_sync | restore_purchases`
  - `fromPlan`: `free | pro | max`
  - `toPlan`: `free | pro | max`
  - `isUpgrade`
  - `isDowngrade`
  - `activeUntil`
- `experiment_exposed`
  - `experimentId`
  - `variantId`
  - `source`: `lesson_complete_nudge`
- `experiment_converted`
  - `experimentId`
  - `variantId`
  - `source`: `lesson_complete_nudge`
  - `conversion`: `double_xp_purchased`
- `personalization_segment_assigned`
  - `segment`: `new | active | at_risk | power`
  - `lessonsCompleted7d`
  - `daysSinceStudy`
  - `source`: `daily_reassign`
- `friend_challenge_shown`
  - `weekId`
  - `source`: `friends_tab`
- `friend_challenge_completed`
  - `weekId`
  - `opponentId`
  - `rewardGems`
  - `source`: `friends_tab`
- `quest_rerolled`
  - `questId`
  - `type`: `daily | weekly`
  - `oldTemplateId`
  - `newTemplateId`
  - `costGems`
  - `source`: `quests_tab`
- `liveops_event_activated`
  - `eventId`
  - `source`: `event_reconcile`

### 運用メモ

- 実験導線はまず A/A で稼働確認し、variant 間の主要KPI差分が ±2%以内であることをゲートにする。
- 個別最適化セグメントは 24h クールダウンで再判定し、短周期で揺れないようにする。
- 友達チャレンジは表示だけでなく完了率を監視する。目安は `friend_challenge_completed / friend_challenge_shown >= 0.15`。
- クエストリロールは `quest_rerolled` 件数と、`quest_claimed` の type 別分布をセットで監視する（供給/消費バランス確認）。
- LiveOps は設定ベースで有効化されるため、イベント切替時は `liveops_event_activated` 発火を最初に確認する。
- 決済ファネルの完結率は `plan_changed / checkout_start` を基準に監視する。
- `pro_trial_checkout` 実験時は `checkout_start` を `trialDays` で分解して追跡する（0日 vs 7日）。

### A/A運用ゲート（固定）

1. `experiments.enabled=true` かつ対象実験 `double_xp_nudge_lesson_complete.enabled=true` で開始し、`control/variant` の `payload` は同一に固定する（A/A）。
2. 初期ロールアウトは `rollout_percentage=5`。
3. `rollout_percentage` を `5% -> 20% -> 50% -> 100%` で段階展開し、各段階を `24-48h` 観測する。
4. A/A期間は7日確保し、主要KPI差分が `±2%` 以内であることを合格条件にする。
5. `lesson_complete_user_rate_7d` と `paid_plan_changes_per_checkout_7d` に悪化がない場合のみ、本実験（payload差し替え）へ進む。
6. 異常時は `experiments.enabled=false` に戻して同日中にロールバックする。
7. このフェーズでは `personalization.enabled=false`, `liveops.enabled=false` を維持する。

### A/A Baseline記録欄（v1.39.x）

| Date (JST) | rollout % | experiment_exposed | experiment_converted | lesson_complete_user_rate_7d | paid_plan_changes_per_checkout_7d | Judge |
|---|---:|---:|---:|---:|---:|---|
| 2026-03-01 | 5 |  |  |  |  | running (48h window) |
| 2026-03-__ | 20 |  |  |  |  | pending |
| 2026-03-__ | 50 |  |  |  |  | pending |
| 2026-03-__ | 100 |  |  |  |  | pending |

### ProトライアルA/B記録欄（v1.40+）

| Date (JST) | rollout % | experiment_id | checkout_start (trial=0) | checkout_start (trial=7) | plan_changed_rate (trial=0) | plan_changed_rate (trial=7) | D7 Δ | Refund Δ | Judge |
|---|---:|---|---:|---:|---:|---:|---:|---:|---|
| 2026-03-__ | 5 | pro_trial_checkout |  |  |  |  |  |  | pending |
| 2026-03-__ | 20 | pro_trial_checkout |  |  |  |  |  |  | pending |
| 2026-03-__ | 50 | pro_trial_checkout |  |  |  |  |  |  | pending |
