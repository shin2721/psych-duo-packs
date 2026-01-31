# Analytics v1.3 - TestFlight前検証ガイド

## 目的
TestFlight配信前に「計測が落ちない/数字が信用できる」状態を確認する。

---

## 1. 実装状況サマリー

### 実装済みイベント（7種類）

| イベント名 | 発火地点 | 多重発火ガード | 発火タイミング |
|-----------|---------|--------------|--------------|
| `app_open` | `app/_layout.tsx` | AsyncStorage | 初回起動時のみ |
| `session_start` | `app/_layout.tsx` | プロセス内フラグ | 起動毎に1回 |
| `app_ready` | `app/_layout.tsx` | プロセス内フラグ | Analytics初期化完了後に1回 |
| `onboarding_start` | `app/onboarding/index.tsx` | useRef | ウェルカム画面表示時に1回 |
| `onboarding_complete` | `lib/OnboardingContext.tsx` | 確定地点 | ドメイン確定時に1回 |
| `lesson_start` | `app/lessons/[id].tsx` | useRef | レッスン画面入場時に1回 |
| `lesson_complete` | `app/lessons/[id].tsx` | 確定地点 | レッスン完了時に1回 |

### 送信先
- **Console出力**: 常時（debug=trueの場合）
- **HTTP送信**: `EXPO_PUBLIC_ANALYTICS_ENDPOINT` 設定時のみ
- **PostHog送信**: `EXPO_PUBLIC_POSTHOG_HOST` & `EXPO_PUBLIC_POSTHOG_API_KEY` 設定時のみ

### Lazy Initialization（v1.3の重要機能）
- `track()` は初期化前でも呼び出し可能
- 初期化前のイベントはメモリキューに保存
- 初回 `track()` で自動的に `initialize()` を開始
- 初期化完了後、キューに溜まったイベントを順次送信
- **保証**: `session_start` などの起動時イベントが必ずPostHogに届く

---

## 2. 多重発火ガード検証マトリクス

### AsyncStorageガード（app_open）
| シナリオ | 期待動作 | 検証方法 |
|---------|---------|---------|
| 初回起動 | `app_open` が1回発火 | Live Eventsで確認 |
| 2回目起動 | `app_open` が発火しない | Live Eventsで確認 |
| アプリ削除→再インストール | `app_open` が再度発火 | Live Eventsで確認 |

### プロセス内フラグガード（session_start, app_ready）
| シナリオ | 期待動作 | 検証方法 |
|---------|---------|---------|
| 起動時 | `session_start` が1回、`app_ready` が1回 | Live Eventsで確認 |
| ホットリロード（開発時） | 再発火しない（フラグが残る） | Console出力で確認 |
| アプリ完全終了→再起動 | 再度1回ずつ発火 | Live Eventsで確認 |

### useRefガード（onboarding_start, lesson_start）
| シナリオ | 期待動作 | 検証方法 |
|---------|---------|---------|
| 画面初回表示 | 1回発火 | Live Eventsで確認 |
| 画面内リレンダ | 発火しない | Console出力で確認 |
| 画面離脱→再入場 | 再度1回発火（新しいuseRef） | Live Eventsで確認 |
| ホットリロード | 再発火する（useRefがリセット） | Console出力で確認 |

### 確定地点ガード（onboarding_complete, lesson_complete）
| シナリオ | 期待動作 | 検証方法 |
|---------|---------|---------|
| 確定アクション実行 | 1回発火 | Live Eventsで確認 |
| 連続クリック | 1回のみ（関数が1回しか呼ばれない） | Console出力で確認 |

---

## 3. EXPO_PUBLIC_APP_ENV パース検証

### 実装内容（lib/analytics.config.ts）
```typescript
function parseAppEnv(): 'dev' | 'prod' | undefined {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  
  if (!raw) return undefined;
  if (raw === 'dev' || raw === 'prod') return raw;
  
  // 不正値の場合は警告を出してundefinedにフォールバック
  if (__DEV__) {
    console.warn(`[Analytics] Invalid EXPO_PUBLIC_APP_ENV: "${raw}". Expected "dev" or "prod". Falling back to __DEV__ detection.`);
  }
  
  return undefined;
}
```

### 検証マトリクス
| EXPO_PUBLIC_APP_ENV | 期待される env | 検証方法 |
|---------------------|---------------|---------|
| 未設定 | `__DEV__ ? 'dev' : 'prod'` | Console出力で確認 |
| `"dev"` | `"dev"` | Console出力で確認 |
| `"prod"` | `"prod"` | Console出力で確認 |
| `"staging"` | `__DEV__ ? 'dev' : 'prod'` + 警告 | Console出力で確認 |
| `"invalid"` | `__DEV__ ? 'dev' : 'prod'` + 警告 | Console出力で確認 |

---

## 4. E2E検証手順（実機確認用チェックリスト）

### 🎯 検証の目的
実機で「起動→オンボ→初回レッスン完了→再起動」を実行し、各イベントが1回ずつ発火することを確認する。

---

### 📱 事前準備

1. **PostHog Live Eventsを開く**
   - PostHogダッシュボード → Events → Live Events
   - フィルター: `env = dev`（開発ビルドの場合）
   - 画面を開いたまま、アプリ操作と並行して確認

2. **Console出力を確認できる状態にする**
   - Xcode（iOS）またはAndroid Studio（Android）でログを表示
   - または `npx react-native log-ios` / `npx react-native log-android`

3. **アプリを削除してクリーンインストール**
   - AsyncStorageをクリアするため、アプリを完全削除
   - 再インストール

---

### ✅ E2E確認チェックリスト

#### **ステップ1: 初回起動**

**操作:**
1. アプリを起動

**期待されるイベント:**
- [ ] `session_start` が1回発火
- [ ] `app_ready` が1回発火
- [ ] `app_open` が1回発火

**注意**: イベントの発火順序は保証されません。特に `app_open` はAsyncStorage読み込みのため前後する可能性があります。

**確認方法:**
- PostHog Live Eventsで上記3イベントが表示される
- Console出力で以下のようなログが表示される（順序は前後する可能性あり）:
  ```
  [Analytics] Event queued (not initialized yet): session_start
  [Analytics] Event queued (not initialized yet): app_open
  [Analytics] Initialized { anonId: "...", enabled: true }
  [Analytics] Flushing 2 queued events
  [Analytics] session_start { ... }
  [Analytics] app_open { ... }
  [Analytics] app_ready { ... }
  ```

**確認ポイント（優先度順）:**
- [ ] **各イベントが1回ずつ発火している**（最重要）
- [ ] **`anonId` が `'unknown'` ではない**（UUID v4形式）
- [ ] **`anonId` が全イベントで同一**
- [ ] `eventId` と `timestamp` が各イベントで異なる
- [ ] イベントの順序は参考程度（保証されない）

---

#### **ステップ2: オンボーディング開始**

**操作:**
1. ウェルカム画面が表示される

**期待されるイベント:**
- [ ] `onboarding_start` が1回発火

**確認方法:**
- PostHog Live Eventsで `onboarding_start` が表示される
- Console出力で以下が表示される:
  ```
  [Analytics] onboarding_start { ... }
  ```

**確認ポイント:**
- [ ] `onboarding_start` が1回のみ発火している
- [ ] 画面内でスクロールしても再発火しない

---

#### **ステップ3: オンボーディング完了**

**操作:**
1. 興味を選択
2. 「続ける」ボタンをタップ
3. ドメイン選択を完了

**期待されるイベント:**
- [ ] `onboarding_complete` が1回発火

**確認方法:**
- PostHog Live Eventsで `onboarding_complete` が表示される
- Console出力で以下が表示される:
  ```
  [Analytics] onboarding_complete { ... }
  ```

**確認ポイント:**
- [ ] `onboarding_complete` が1回のみ発火している
- [ ] ボタンを連続タップしても1回のみ

---

#### **ステップ4: 初回レッスン開始**

**操作:**
1. レッスンを1つ選択
2. レッスン画面が表示される

**期待されるイベント:**
- [ ] `lesson_start` が1回発火

**確認方法:**
- PostHog Live Eventsで `lesson_start` が表示される
- Console出力で以下が表示される:
  ```
  [Analytics] lesson_start { lessonId: "...", genreId: "..." }
  ```

**確認ポイント:**
- [ ] `lesson_start` が1回のみ発火している
- [ ] `lessonId` と `genreId` が正しく記録されている
- [ ] 画面内でスクロールしても再発火しない

---

#### **ステップ5: 初回レッスン完了**

**操作:**
1. レッスンの全問題に回答
2. 結果画面で「完了」ボタンをタップ

**期待されるイベント:**
- [ ] `lesson_complete` が1回発火

**確認方法:**
- PostHog Live Eventsで `lesson_complete` が表示される
- Console出力で以下が表示される:
  ```
  [Analytics] lesson_complete { lessonId: "...", genreId: "..." }
  ```

**確認ポイント:**
- [ ] `lesson_complete` が1回のみ発火している
- [ ] `lessonId` と `genreId` が `lesson_start` と一致している

---

#### **ステップ6: アプリ完全終了**

**操作:**
1. アプリをバックグラウンドに移動
2. アプリスイッチャーから完全終了

**期待されるイベント:**
- なし（終了時にイベントは発火しない）

---

#### **ステップ7: 2回目起動**

**操作:**
1. アプリを再起動

**期待されるイベント:**
- [ ] `session_start` が1回発火
- [ ] `app_ready` が1回発火
- [ ] `app_open` は発火しない（重要！）

**確認方法:**
- PostHog Live Eventsで `session_start` と `app_ready` のみ表示される
- `app_open` は表示されない
- Console出力で以下のようなログが表示される:
  ```
  [Analytics] Event queued (not initialized yet): session_start
  [Analytics] app_open already tracked, skipping
  [Analytics] Initialized { anonId: "...", enabled: true }
  [Analytics] Flushing 1 queued events
  [Analytics] session_start { ... }
  [Analytics] app_ready { ... }
  ```

**確認ポイント（優先度順）:**
- [ ] **`session_start` と `app_ready` が1回ずつ発火している**（最重要）
- [ ] **`app_open` が発火していない**（AsyncStorageガードが機能）
- [ ] **`anonId` が初回起動時と同じ**
- [ ] イベントの順序は参考程度（保証されない）

---

### 📊 PostHog Live Events確認ポイント

**初回起動フロー完了後、Live Eventsで以下を確認:**

| イベント | 発火回数 | anonId | eventId | timestamp |
|---------|---------|--------|---------|-----------|
| `session_start` | 1回 | 同じ | 異なる | 異なる |
| `app_ready` | 1回 | 同じ | 異なる | 異なる |
| `app_open` | 1回 | 同じ | 異なる | 異なる |
| `onboarding_start` | 1回 | 同じ | 異なる | 異なる |
| `onboarding_complete` | 1回 | 同じ | 異なる | 異なる |
| `lesson_start` | 1回 | 同じ | 異なる | 異なる |
| `lesson_complete` | 1回 | 同じ | 異なる | 異なる |

**2回目起動後、Live Eventsで以下を確認:**

| イベント | 発火回数 | anonId | 備考 |
|---------|---------|--------|------|
| `session_start` | 1回 | 同じ | 2回目のsession_start |
| `app_ready` | 1回 | 同じ | 2回目のapp_ready |
| `app_open` | 0回 | - | 発火しない（正常） |

---

### 🚨 よくある問題と対処法

#### **問題1: `anonId` が `'unknown'` になっている**

**原因:**
- Lazy initializationのキューが正しく動作していない
- `buildEvent()` が初期化前に呼ばれている

**対処法:**
1. `lib/analytics.ts` の `QueuedEvent` 型が正しく定義されているか確認
2. `flushEventQueue()` で `buildEvent()` に `overrides` を渡しているか確認
3. Console出力で「Flushing X queued events」が表示されているか確認

---

#### **問題2: イベントが多重発火している**

**原因:**
- ガード機構が正しく動作していない
- ホットリロードでフラグがリセットされている

**対処法:**
1. Console出力で「already tracked」メッセージが表示されているか確認
2. アプリを完全終了→再起動して再確認
3. 開発ビルドではなく本番ビルドで確認

---

#### **問題3: `app_open` が2回目起動でも発火する**

**原因:**
- AsyncStorageガードが正しく動作していない
- AsyncStorageがクリアされている

**対処法:**
1. Console出力で「app_open already tracked, skipping」が表示されているか確認
2. AsyncStorageの読み書きが正常に動作しているか確認
3. アプリを削除せずに再起動して確認

---

#### **問題4: PostHogにイベントが届かない**

**原因:**
- PostHog設定が正しくない
- ネットワーク接続が不安定

**対処法:**
1. `.env` の `EXPO_PUBLIC_POSTHOG_HOST` と `EXPO_PUBLIC_POSTHOG_API_KEY` を確認
2. Console出力で「PostHog event sent successfully」が表示されているか確認
3. ネットワーク接続を確認
4. PostHogのプロジェクトが正しく選択されているか確認

---

### ✅ E2E確認完了の判定基準

以下の全てが満たされていれば、E2E確認完了:

**最優先（必須）:**
- [ ] **初回起動で7イベントが1回ずつ発火**（順序は問わない）
- [ ] **2回目起動で `session_start` と `app_ready` のみ発火**（`app_open` は発火しない）
- [ ] **全イベントの `anonId` が同じ**（UUID v4形式）
- [ ] **全イベントの `anonId` が `'unknown'` ではない**

**重要（確認推奨）:**
- [ ] 全イベントの `eventId` と `timestamp` が異なる
- [ ] PostHog Live Eventsで全イベントが確認できる
- [ ] Console出力でエラーが出ていない

**参考（順序は保証されない）:**
- イベントの発火順序は実装の詳細に依存し、保証されません
- 特に `app_open` はAsyncStorage読み込みのため前後する可能性があります

---

## 5. PostHog Funnel作成手順（E2E確認後）

### 5.1 D0ファネル（初回起動→レッスン完了）

**PostHog Insights → Funnels → New Funnel**

**ステップ設定:**
1. `session_start`
2. `app_ready`
3. `onboarding_start`
4. `onboarding_complete`
5. `lesson_start`
6. `lesson_complete`

**フィルター:**
- `env = prod`（本番環境のみ）
- 期間: 過去7日間（または任意）

**表示形式:**
- 人数（Number）で表示（%より人数が重要）

**期待される貼り付けフォーマット:**
```
期間：2026-01-16〜2026-01-23（env=prod）
session_start: 100
app_ready: 98
onboarding_start: 95
onboarding_complete: 80
lesson_start: 70
lesson_complete: 60
```

---

### 5.2 判定ロジック（落ち箇所の特定）

| 落ち箇所 | 疑わしい原因 | 次の1手 |
|---------|------------|---------|
| `session_start` → `app_ready` が低い（<90%） | クラッシュ/初期化失敗 | Sentry導入、起動ログ確認 |
| `app_ready` → `onboarding_start` が低い（<90%） | ルーティング失敗/画面遷移バグ | ルーティングログ確認 |
| `onboarding_start` → `onboarding_complete` が低い（<70%） | オンボーディングUX改善 | 興味選択の簡略化、スキップボタン追加 |
| `onboarding_complete` → `lesson_start` が低い（<80%） | レッスン導線が弱い | レッスン推奨UI追加、チュートリアル改善 |
| `lesson_start` → `lesson_complete` が低い（<60%） | レッスン難易度/長さ | 問題数削減、難易度調整 |

**重要原則:**
- 同時に2つ以上の改善を行わない
- 1つ改善したら再度ファネルを確認
- 人数が少ない（<100）場合は%がブレるので注意

---

## 6. Lazy Initialization検証**フィルター:**
- `env = prod`（本番環境のみ）
- 期間: 過去7日間（または任意）

**表示形式:**
- 人数（Number）で表示（%より人数が重要）

**期待される貼り付けフォーマット:**
```
期間：2026-01-16〜2026-01-23（env=prod）
session_start: 100
app_ready: 98
onboarding_start: 95
onboarding_complete: 80
lesson_start: 70
lesson_complete: 60
```

---

### 5.2 判定ロジック（落ち箇所の特定）

| 落ち箇所 | 疑わしい原因 | 次の1手 |
|---------|------------|---------|
| `session_start` → `app_ready` が低い（<90%） | クラッシュ/初期化失敗 | Sentry導入、起動ログ確認 |
| `app_ready` → `onboarding_start` が低い（<90%） | ルーティング失敗/画面遷移バグ | ルーティングログ確認 |
| `onboarding_start` → `onboarding_complete` が低い（<70%） | オンボーディングUX改善 | 興味選択の簡略化、スキップボタン追加 |
| `onboarding_complete` → `lesson_start` が低い（<80%） | レッスン導線が弱い | レッスン推奨UI追加、チュートリアル改善 |
| `lesson_start` → `lesson_complete` が低い（<60%） | レッスン難易度/長さ | 問題数削減、難易度調整 |

**重要原則:**
- 同時に2つ以上の改善を行わない
- 1つ改善したら再度ファネルを確認
- 人数が少ない（<100）場合は%がブレるので注意

---

## 6. Lazy Initialization検証

### 6.1 検証目的
`session_start` が `initialize()` の完了を待たずにPostHogに届くことを確認する。

### 6.2 検証手順

**シナリオ1: 通常起動（初期化が速い場合）**
1. アプリを起動
2. Console出力を確認
3. PostHog Live Events を確認

**期待される出力:**
```
[Analytics] Event queued (not initialized yet): session_start
[Analytics] Initialized { anonId: "...", enabled: true }
[Analytics] Flushing 1 queued events
[Analytics] session_start { ... }
```

**確認ポイント:**
- [ ] `session_start` がキューに入る
- [ ] 初期化完了後にキューがフラッシュされる
- [ ] PostHogに `session_start` が届く

---

**シナリオ2: 初期化が遅い場合（AsyncStorage遅延をシミュレート）**

テストコード（一時的に追加）:
```typescript
// lib/analytics.ts の getOrCreateAnonId() に追加
private static async getOrCreateAnonId(): Promise<string> {
  // テスト用: 3秒遅延
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_ANON_ID);
    // ... 以下同じ
  }
}
```

**検証手順:**
1. 上記コードを追加
2. アプリを起動
3. Console出力を確認
4. PostHog Live Events を確認

**期待される出力:**
```
[Analytics] Event queued (not initialized yet): session_start
[Analytics] Event queued (not initialized yet): app_open
（3秒後）
[Analytics] Initialized { anonId: "...", enabled: true }
[Analytics] Flushing 2 queued events
[Analytics] session_start { ... }
[Analytics] app_open { ... }
[Analytics] app_ready { ... }
```

**確認ポイント:**
- [ ] 初期化前に `session_start` と `app_open` がキューに入る
- [ ] `app_ready` は初期化完了後に通常送信される（キューされない）
- [ ] 初期化完了後にキューがフラッシュされる
- [ ] PostHogに全イベントが届く

---

**シナリオ3: 初期化失敗の場合**

テストコード（一時的に追加）:
```typescript
// lib/analytics.ts の initialize() に追加
static async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
  if (this.initialized || this.initializing) return;
  this.initializing = true;

  try {
    // テスト用: 強制的にエラーを投げる
    throw new Error('Test: Initialization failed');
    
    // ... 以下同じ
  }
}
```

**検証手順:**
1. 上記コードを追加
2. アプリを起動
3. Console出力を確認
4. PostHog Live Events を確認

**期待される出力:**
```
[Analytics] Event queued (not initialized yet): session_start
[Analytics] Initialization failed: Error: Test: Initialization failed
```

**確認ポイント:**
- [ ] 初期化失敗時にエラーログが出る
- [ ] キューがクリアされる（イベントは送信されない）
- [ ] アプリがクラッシュしない（重要！）

---

## 7. 最終チェックリスト

### 7.1 コード確認
- [ ] `lib/analytics.ts` に lazy initialization が実装されている
- [ ] `lib/analytics.ts` に `QueuedEvent` 型が定義されている
- [ ] `lib/analytics.ts` の `flushEventQueue()` で `anonId` 汚染を防いでいる
- [ ] `lib/analytics.config.ts` に `parseAppEnv()` が実装されている
- [ ] 全イベントに多重発火ガードが実装されている
- [ ] `track()` が例外を握りつぶす（try-catch）
- [ ] HTTP/PostHog送信が非ブロッキング（3秒タイムアウト）

### 7.2 環境変数確認
- [ ] `.env.example` に全変数が記載されている
- [ ] `EXPO_PUBLIC_APP_ENV=prod` が設定されている（本番ビルド）
- [ ] `EXPO_PUBLIC_POSTHOG_HOST` が設定されている
- [ ] `EXPO_PUBLIC_POSTHOG_API_KEY` が設定されている

### 7.3 E2E確認
- [ ] 初回起動フローで7イベントが正しく発火
- [ ] 2回目起動で `app_open` が発火しない
- [ ] 全イベントの `anonId` が `'unknown'` ではない
- [ ] レッスン複数回実行で各イベントが正しく発火
- [ ] ホットリロードで `session_start` / `app_ready` が再発火しない

### 7.4 PostHog確認
- [ ] Live Eventsで全イベントが見える
- [ ] Funnelが作成できる
- [ ] `env=prod` でフィルタできる
- [ ] 人数が正しくカウントされている

### 7.5 Lazy Initialization確認
- [ ] 通常起動でキューがフラッシュされる
- [ ] 初期化遅延時でもイベントが届く
- [ ] 初期化失敗時でもアプリがクラッシュしない

---

## 8. トラブルシューティング

### 8.1 イベントがPostHogに届かない

**確認項目:**
1. `EXPO_PUBLIC_POSTHOG_HOST` が正しく設定されているか
2. `EXPO_PUBLIC_POSTHOG_API_KEY` が正しく設定されているか
3. Console出力で「PostHog event sent successfully」が出ているか
4. ネットワーク接続が正常か
5. PostHogのプロジェクトが正しく選択されているか

**デバッグ方法:**
```typescript
// lib/analytics.config.ts に追加
export const analyticsConfig: AnalyticsConfig = {
  enabled: true,
  debug: true, // 常にtrueにしてログを確認
  // ...
};
```

---

### 8.2 イベントが多重発火する

**確認項目:**
1. `session_start` / `app_ready`: プロセス内フラグが正しく機能しているか
2. `onboarding_start` / `lesson_start`: useRefが正しく機能しているか
3. `app_open`: AsyncStorageが正しく機能しているか

**デバッグ方法:**
```typescript
// Console出力で「already tracked」メッセージを確認
[Analytics] session_start already tracked in this session, skipping
[Analytics] app_ready already tracked in this session, skipping
[Analytics] app_open already tracked, skipping
```

---

### 8.3 EXPO_PUBLIC_APP_ENV が反映されない

**確認項目:**
1. `.env` ファイルが正しく配置されているか
2. `EXPO_PUBLIC_` プレフィックスが付いているか
3. アプリを再ビルドしたか（環境変数変更後は再ビルド必須）

**デバッグ方法:**
```typescript
// lib/analytics.config.ts に追加
console.log('EXPO_PUBLIC_APP_ENV:', process.env.EXPO_PUBLIC_APP_ENV);
console.log('Parsed appEnv:', parseAppEnv());
```

---

## 9. TestFlight配信前の最終確認

### 9.1 本番ビルド設定
```bash
# .env に以下を設定
EXPO_PUBLIC_APP_ENV=prod
EXPO_PUBLIC_POSTHOG_HOST=us.i.posthog.com
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxxxxxxxxxxxx
```

### 9.2 ビルド実行
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 9.3 TestFlight配信後の確認
1. TestFlightからアプリをインストール
2. 初回起動フローを実行
3. PostHog Live Eventsで全イベントが届いているか確認
4. Funnelを作成して人数を確認
5. 数字が出たら、落ち箇所を特定して次の1手を決める

---

## 10. 次のステップ

### 10.1 数字が出たら
1. Funnelで落ち箇所を特定
2. 判定ロジックに従って次の1手を決める
3. 1つだけ改善を実施
4. 再度Funnelを確認
5. 効果を測定してから次の改善へ

### 10.2 追加イベントの検討（v1.4以降）
- `lesson_question_answered`: 問題ごとの正答率
- `lesson_abandoned`: レッスン途中離脱
- `paywall_shown`: ペイウォール表示
- `purchase_completed`: 購入完了

**重要:** v1.3で数字が安定してから追加する。今は追加しない。

---

## まとめ

このドキュメントに従って検証を実施すれば、「計測が落ちない/数字が信用できる」状態でTestFlight配信できる。

**最重要ポイント:**
1. Lazy initializationで `session_start` が必ず届く
2. 多重発火ガードで数字が歪まない
3. E2E検証で実際の動作を確認
4. PostHog Funnelで落ち箇所を特定
5. 1つずつ改善して効果を測定

**次の1手:**
1. このドキュメントに従ってE2E検証を実施
2. 問題があれば修正
3. TestFlight配信
4. 数字が出たら落ち箇所を特定
5. 次の改善を1つだけ実施
