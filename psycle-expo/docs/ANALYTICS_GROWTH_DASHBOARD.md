# Analytics Growth Dashboard (v1.4)

## 目的

「どこを直せば継続率が上がるか」を毎週同じ基準で判断するためのダッシュボード定義。

- 主要KPI: `D1`, `D7`, `lesson_start -> lesson_complete`, `question_incorrect`, `streak_lost`
- データソース: PostHog `events`（`env = prod`）
- 集計単位: 日次（30日ローリング）

## 前提イベント

- `session_start`
- `lesson_start`
- `lesson_complete`
- `question_incorrect`
- `streak_lost`

## ダッシュボード構成（6カード）

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

5. **D1 Retention**
- 種類: Retention insight
- 起点: `session_start`
- 再訪: `session_start`
- 期間: Day 1

6. **D7 Retention**
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

### 5) 直近7日サマリー（意思決定用）

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
  uniqIf(distinct_id, event = 'streak_lost') AS streak_lost_users_7d
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

## 週次運用（30分）

1. ダッシュボード6カードを確認（前週比）
2. もっとも悪化した1指標だけを選ぶ
3. 施策を1つ決める（複数同時にやらない）
4. 翌週同じ指標で効果判定
