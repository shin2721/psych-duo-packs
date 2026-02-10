# Analytics 計測ガイド（最終版 v1.4）

## 実装済みイベント（9イベント）

| イベント | いつ発火するか | 多重発火防止 | properties |
|---------|--------------|------------|------------|
| `app_open` | アプリ初回起動時のみ | AsyncStorageガード | なし |
| `session_start` | アプリ起動時（毎回） | プロセス内フラグ | なし |
| `app_ready` | Analytics初期化成功時 | プロセス内フラグ | なし |
| `onboarding_start` | ウェルカム画面表示時 | useRefガード | なし |
| `onboarding_complete` | completeOnboarding()成功時 | ドメイン確定地点（1回のみ） | なし |
| `lesson_start` | レッスン画面入場時 | useRefガード | `lessonId`, `genreId` |
| `lesson_complete` | レッスン完了ボタンタップ時 | ドメイン確定地点（1回のみ） | `lessonId`, `genreId` |
| `question_incorrect` | 問題の不正解時 | 回答処理内（回答ごと） | `lessonId`, `genreId`, `questionId`, `questionType`, `questionIndex`, `isReviewRound` |
| `streak_lost` | 連続日数が途切れた時 | streak更新時（条件一致時のみ） | `streakType`, `previousStreak`, `gapDays`, `freezesRemaining`, `freezesNeeded` |

運用ダッシュボード定義: `docs/ANALYTICS_GROWTH_DASHBOARD.md`

### app_ready の定義

**app_ready = Analyticsがトラック可能になった瞬間**

- anonId読めて、config読めて、trackが動く状態
- Supabase接続完了は含めない（範囲がデカいほどノイズる）
- initialize()成功後のみ発火（finallyでは発火しない）

---

## 多重発火防止の実装

### 1. app_ready（プロセス内フラグ）

```typescript
// lib/analytics.ts
private static appReadyTracked = false;

static trackAppReady(): void {
  if (this.appReadyTracked) return;
  this.track('app_ready');
  this.appReadyTracked = true;
}
```

### 2. session_start（プロセス内フラグ）

```typescript
// lib/analytics.ts
private static sessionStartTracked = false;

static trackSessionStart(): void {
  if (this.sessionStartTracked) return;
  this.track('session_start');
  this.sessionStartTracked = true;
}
```

### 3. onboarding_start（useRefガード）

```typescript
// app/onboarding/index.tsx
const hasTrackedStartRef = useRef(false);
useEffect(() => {
  if (!hasTrackedStartRef.current) {
    hasTrackedStartRef.current = true;
    Analytics.track('onboarding_start');
  }
}, []);
```

### 4. lesson_start（useRefガード）

```typescript
// app/lesson.tsx
const lessonStartTrackedRef = useRef<string | null>(null);
if (lessonStartTrackedRef.current !== params.file) {
  lessonStartTrackedRef.current = params.file;
  const genreId = params.file.match(/^([a-z]+)_/)?.[1] || "unknown";
  Analytics.track("lesson_start", { lessonId: params.file, genreId });
}
```

---

## PostHog Live Events 確認手順（最優先）

### A. 回数確認（ここが最重要）

**同じ起動で確認すべき回数**:

```
session_start: 1回
app_ready: 1回
onboarding_start: 0 or 1回（オンボを踏んだ時だけ）
lesson_start: 0 or 1回（そのレッスンに入った回数だけ）
```

**2回起動して確認**:

```
【1回目起動】
✓ session_start: 1回
✓ app_ready: 1回
✓ app_open: 1回（初回のみ）
✓ onboarding_start: 1回（ウェルカム画面表示時）
✓ onboarding_complete: 1回（ドメイン確定時）
✓ lesson_start: 1回（レッスン画面入場時）
✓ lesson_complete: 1回（レッスン完了時）

【2回目起動】
✓ session_start: 1回
✓ app_ready: 1回
（app_openは出ない - 初回のみ）
```

**ここが崩れてたら、ファネル作っても無意味**

---

### B. 初回起動フロー

### B. 初回起動フロー

```
アプリ起動
  ↓
✓ session_start（起動）- 1回
✓ app_ready（初期化成功）- 1回
✓ app_open（初回のみ）- 1回
  ↓
ウェルカム画面表示
  ↓
✓ onboarding_start（オンボ入口）- 1回
  ↓
「はじめる」タップ → 興味選択画面
  ↓
ドメイン選択 → 「続ける」タップ
  ↓
✓ onboarding_complete（ドメイン確定）- 1回
  ↓
レッスン画面に遷移
  ↓
✓ lesson_start（画面入場）- 1回
  ↓
質問に回答 → 全問完了 → 「完了」タップ
  ↓
✓ lesson_complete（レッスン完了）- 1回
```

### C. 2回目起動フロー

```
アプリ起動
  ↓
✓ session_start（起動）- 1回
✓ app_ready（初期化成功）- 1回
（app_openは出ない - 初回のみ）
```

### D. 確認すべき共通プロパティ

- `$process_person_profile: false`（匿名イベント）
- `distinct_id`: anonId（UUID形式）
- `buildId`, `schemaVersion`, `platform`, `env`, `eventId`

---

## PostHog Funnel 作成手順

### 1. Funnelを開く
- PostHog → Product analytics → Funnels → New insight

### 2. ステップ設定

```
Step 1: session_start
Step 2: app_ready
Step 3: onboarding_start
Step 4: onboarding_complete
Step 5: lesson_start
Step 6: lesson_complete
```

### 3. フィルター設定

- **Conversion window**: 1 day（D0ファネル）
- **Filter by**: `env = prod`（本番のみ）

### 4. 保存

- 名前: "D0 Funnel: Session → Onboarding → First Lesson (v1.3)"

---

## 改善判定ロジック（落ち箇所ベース）

### D0ファネル構造

```
session_start (100%)
    ↓
app_ready（初期化完了）
    ↓
onboarding_start（ウェルカム画面到達）
    ↓
onboarding_complete（ドメイン確定）
    ↓
lesson_start（レッスン画面入場）
    ↓
lesson_complete（レッスン完了）
```

### 落ち箇所の特定と施策

#### 1. session_start → app_ready が低い（< 95%）

**問題**: 初期化が完了していない（クラッシュ/ハング）

**調査**:
- Sentry導入してクラッシュログを確認
- 起動時のConsoleログを確認
- AsyncStorage/Supabase接続の失敗を調査

**施策**:
- クラッシュ修正（最優先）
- 初期化タイムアウトを追加
- フォールバック処理を追加

**価値提案強化はこの段階では打たない**

---

#### 2. app_ready → onboarding_start が低い（< 95%）

**問題**: 初期化完了後、ウェルカム画面に到達していない（ルーティング/画面遷移の問題）

**調査**:
- RootLayoutNavのルーティングロジックを確認
- hasSeenOnboarding判定を確認
- 画面遷移のログを確認

**施策**:
- ルーティングロジックを修正
- ローディング画面を追加
- 画面遷移のエラーハンドリングを追加

---

#### 3. onboarding_start → onboarding_complete が低い（< 60%）

**問題**: ウェルカム画面 or 興味選択で離脱

**調査**:
- ウェルカム画面の滞在時間を確認（PostHogのSession Recording）
- 興味選択画面の到達率を確認（将来的に onboarding_step_interests_view を追加）

**施策**:
- ウェルカム画面の価値提案を強化（3行で「何ができるか」を説明）
- 興味選択を簡略化（選択肢を減らす、デフォルト選択を追加）
- スキップボタンを追加
- 「1分で完了」のような時間表示を追加

---

#### 4. onboarding_complete → lesson_start が低い（< 70%）

**問題**: オンボ完了後にレッスンに到達しない（導線の問題）

**調査**:
- オンボ完了後の画面遷移を確認
- ホーム画面の導線を確認

**施策**:
- オンボ完了後、自動的に初回レッスンに遷移
- 「最初のレッスンを始める」ボタンを追加
- ホーム画面に「おすすめレッスン」を表示

---

#### 5. lesson_start → lesson_complete が低い（< 40%）

**問題**: レッスン開始後に完了しない（コンテンツ/UI/難易度の問題）

**調査**:
- 平均回答数を確認（何問目で離脱しているか）
- 正答率を確認（難易度が高すぎないか）
- レッスン時間を確認（長すぎないか）

**施策**:
- 初回レッスンを短縮（10問→5問）
- 難易度を下げる（easy問題を増やす）
- 進捗表示を追加（「あと3問」）
- 途中離脱時に「続きから」機能を追加
- 質問のローディング時間を短縮

---

## 数字の貼り方（標準フォーマット）

```
【D0ファネル結果】
期間：YYYY-MM-DD〜YYYY-MM-DD（env=prod）

session_start: N人
app_ready: N人
onboarding_start: N人
onboarding_complete: N人
lesson_start: N人
lesson_complete: N人

【最も落ちている箇所】
Step X → Step Y: N人 → M人（-XX%、XXpt落ち）

【質問】
この落ち箇所を改善する具体的な施策は？
```

**重要**: %より人数が大事。少数だと%はブレる。

---

## 改善の進め方（確率的に当たりを増やす）

### ルール

1. **同時に2つ以上いじらない**
   - 1つの施策を実装 → 計測 → 判定 → 次の施策
   - 複数同時だと、どれが効いたか分からない

2. **最も落ち幅が大きい箇所から改善する**
   - 例: Step2→3が40%落ち、Step4→5が30%落ち → Step2→3を優先

3. **人数が少ない場合は期間を延ばす**
   - session_start < 100人 → 1週間待つ
   - session_start < 30人 → 2週間待つ

4. **改善後は1週間待って再計測**
   - 即座に効果が出るとは限らない
   - 最低でも50人のデータを集める

---

## 次のアクション（固定）

### A. Live Eventsで「回数」を見る（最優先）

**同じ起動で確認**:
- session_start: 1回
- app_ready: 1回
- onboarding_start: 0 or 1回（オンボを踏んだ時だけ）
- lesson_start: 0 or 1回（そのレッスンに入った回数だけ）

**2回起動して確認**:
- 1回目：session_start + app_ready（+必要ならオンボ/レッスン）
- 2回目：session_start + app_ready（app_openは出ない）

**ここが崩れてたら、ファネル作っても無意味**

---

### B. Funnel（6ステップ）を作る（env=prod）

```
session_start
  ↓
app_ready
  ↓
onboarding_start
  ↓
onboarding_complete
  ↓
lesson_start
  ↓
lesson_complete
```

---

### C. 人数で貼る（標準フォーマット）

```
【D0ファネル結果】
期間：YYYY-MM-DD〜YYYY-MM-DD（env=prod）

session_start: N人
app_ready: N人
onboarding_start: N人
onboarding_complete: N人
lesson_start: N人
lesson_complete: N人

【最も落ちている箇所】
Step X → Step Y: N人 → M人（-XX%、XXpt落ち）
```

**重要**: %より人数が大事。少数だと%はブレる。

---

## 実装完了チェックリスト

- [x] 7イベント実装完了
- [x] onboarding_complete の説明を修正（ドメイン確定地点）
- [x] app_ready 追加（初期化完了）
- [x] session_start → app_ready → onboarding_start に分解
- [x] 発火タイミングが明確（入口 vs 確定地点）
- [x] PII禁止（lessonId, genreIdのみ）
- [x] useEffectでの多重発火防止（ref guard使用）
- [x] 既存の config/送信ロジック維持

---

## トラブルシューティング

### イベントがPostHogに出ない

1. `.env` の `EXPO_PUBLIC_POSTHOG_HOST` と `EXPO_PUBLIC_POSTHOG_API_KEY` を確認
2. `lib/analytics.config.ts` で正しく読み込まれているか確認
3. Console に `[Analytics] PostHog event sent successfully` が出ているか確認
4. PostHogのProject Settingsで正しいAPIキーを使っているか確認

### イベントが重複して出る

1. ref guardが正しく動作しているか確認
2. useEffectの依存配列を確認
3. 画面遷移時に複数回マウントされていないか確認

### 数字がブレる

1. 期間を延ばす（最低1週間）
2. 人数を増やす（最低50人）
3. env=prod フィルターを確認（dev環境を除外）

---

## まとめ

- **7イベント**で「落ち箇所の特定」ができる
- **app_ready**で起動安定性を分離できる
- **人数ベース**で判定する（%はブレる）
- **1つずつ改善**する（同時に2つ以上いじらない）
- **期待値で選ぶ**（最も落ち幅が大きい箇所から）

これで完成度を確率的に最大化できます。
