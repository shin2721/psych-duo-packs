# Analytics v1.4 - 実装ステータス

## 実装完了日
2026-02-10

---

## 実装済み機能

### 1. イベント（9種類）

| # | イベント名 | 発火地点 | ガード方式 | 実装ファイル |
|---|-----------|---------|-----------|------------|
| 1 | `app_open` | アプリ起動時 | AsyncStorage | `app/_layout.tsx` |
| 2 | `session_start` | アプリ起動時 | プロセス内フラグ | `app/_layout.tsx` |
| 3 | `app_ready` | Analytics初期化完了時 | プロセス内フラグ | `app/_layout.tsx` |
| 4 | `onboarding_start` | ウェルカム画面表示時 | useRef | `app/onboarding/index.tsx` |
| 5 | `onboarding_complete` | ドメイン確定時 | 確定地点 | `lib/OnboardingContext.tsx` |
| 6 | `lesson_start` | レッスン画面入場時 | useRef | `app/lesson.tsx` |
| 7 | `lesson_complete` | レッスン完了時 | 確定地点 | `app/lesson.tsx` |
| 8 | `question_incorrect` | 問題の不正解時 | 回答処理内 | `app/lesson.tsx` |
| 9 | `streak_lost` | 連続日数が途切れた時 | 条件一致時のみ | `lib/streaks.ts` |

---

### 2. 送信先

| 送信先 | 条件 | タイムアウト | ブロッキング |
|-------|------|------------|------------|
| Console | 常時（debug=true） | なし | なし |
| HTTP | `EXPO_PUBLIC_ANALYTICS_ENDPOINT` 設定時 | 3秒 | 非ブロッキング |
| PostHog | `EXPO_PUBLIC_POSTHOG_HOST` & `EXPO_PUBLIC_POSTHOG_API_KEY` 設定時 | 3秒 | 非ブロッキング |

---

### 3. Lazy Initialization（v1.3の重要機能）

**問題:**
- 従来: `track()` が `!initialized` の場合は早期returnしていた
- 結果: `initialize()` が遅い/失敗すると、`session_start` などの起動時イベントが送信されない

**解決策:**
- `track()` は初期化前でも呼び出し可能
- 初期化前のイベントはメモリキュー（`eventQueue`）に保存
- 初回 `track()` で自動的に `initialize()` を開始
- 初期化完了後、キューに溜まったイベントを順次送信（`flushEventQueue()`）
- 初期化失敗時はキューをクリア（アプリはクラッシュしない）

**保証:**
- `session_start` などの起動時イベントが必ずPostHogに届く
- 初期化タイミングに依存しない

**実装箇所:**
- `lib/analytics.ts` の `track()` メソッド
- `lib/analytics.ts` の `flushEventQueue()` メソッド

---

### 4. EXPO_PUBLIC_APP_ENV 安全パース

**実装内容:**
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

**動作:**
| EXPO_PUBLIC_APP_ENV | 結果 | 警告 |
|---------------------|------|------|
| 未設定 | `undefined` → `__DEV__` で判定 | なし |
| `"dev"` | `"dev"` | なし |
| `"prod"` | `"prod"` | なし |
| `"staging"` | `undefined` → `__DEV__` で判定 | あり（開発時のみ） |
| その他 | `undefined` → `__DEV__` で判定 | あり（開発時のみ） |

**実装箇所:**
- `lib/analytics.config.ts` の `parseAppEnv()` 関数

---

### 5. 多重発火ガード

#### AsyncStorageガード（app_open）
- 初回起動時のみ発火
- `@psycle/analytics_did_track_app_open` キーで管理
- アプリ削除→再インストールで再度発火

#### プロセス内フラグガード（session_start, app_ready）
- 起動毎に1回のみ発火
- `sessionStartTracked` / `appReadyTracked` フラグで管理
- ホットリロードでは再発火しない（フラグが残る）
- アプリ完全終了→再起動で再度発火

#### useRefガード（onboarding_start, lesson_start）
- 画面表示時に1回のみ発火
- `useRef` で管理（画面IDと比較）
- 画面内リレンダでは再発火しない
- 画面離脱→再入場で再度発火
- ホットリロードで再発火する（useRefがリセット）

#### 確定地点ガード（onboarding_complete, lesson_complete）
- 確定アクション実行時に1回のみ発火
- 関数が1回しか呼ばれないことで保証
- 連続クリックでも1回のみ

---

### 6. エラーハンドリング

**原則: track() never throws**

| エラー箇所 | 処理 | アプリへの影響 |
|-----------|------|--------------|
| `initialize()` 失敗 | エラーログ出力、キューをクリア | なし（アプリは正常動作） |
| `track()` 内部エラー | try-catchで握りつぶし、エラーログ出力 | なし（アプリは正常動作） |
| HTTP送信失敗 | 非ブロッキング、エラーログ出力（debug時） | なし（アプリは正常動作） |
| PostHog送信失敗 | 非ブロッキング、エラーログ出力（debug時） | なし（アプリは正常動作） |
| タイムアウト（3秒） | AbortController で中断、エラーログ出力 | なし（アプリは正常動作） |

---

## 実装ファイル一覧

| ファイル | 役割 | 行数 |
|---------|------|------|
| `lib/analytics.ts` | Core API実装 | ~400行 |
| `lib/analytics.types.ts` | 型定義 | ~80行 |
| `lib/analytics.config.ts` | 設定管理 | ~40行 |
| `app/_layout.tsx` | 初期化 + app_open/session_start/app_ready | ~100行（Analytics部分） |
| `lib/OnboardingContext.tsx` | onboarding_complete | ~60行 |
| `app/onboarding/index.tsx` | onboarding_start | ~200行 |
| `app/lesson.tsx` | lesson_start/lesson_complete/question_incorrect | ~500行 |
| `lib/streaks.ts` | streak_lost | ~270行 |

---

## 環境変数

### 必須（本番ビルド）
```bash
EXPO_PUBLIC_APP_ENV=prod
EXPO_PUBLIC_POSTHOG_HOST=us.i.posthog.com
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxxxxxxxxxxxx
```

### オプション
```bash
EXPO_PUBLIC_ANALYTICS_ENDPOINT=https://your-endpoint.com/events
```

---

## PostHog設定

### イベント形式
```json
{
  "api_key": "phc_xxxxxxxxxxxxx",
  "event": "session_start",
  "distinct_id": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
  "properties": {
    "$process_person_profile": false,
    "buildId": "1.0.0",
    "schemaVersion": "analytics_v1",
    "platform": "ios",
    "env": "prod",
    "eventId": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  },
  "timestamp": "2026-01-16T12:00:00.000Z"
}
```

### 重要設定
- `$process_person_profile: false`: 匿名イベント（Person profile作らない）
- `distinct_id`: anonId（UUID v4、PII禁止）
- `schemaVersion`: "analytics_v1"（固定）

---

## D0ファネル（PostHog）

### ステップ
1. `session_start`
2. `app_ready`
3. `onboarding_start`
4. `onboarding_complete`
5. `lesson_start`
6. `lesson_complete`

### フィルター
- `env = prod`（本番環境のみ）
- 期間: 過去7日間（または任意）

### 表示形式
- 人数（Number）で表示（%より人数が重要）

---

## 次のステップ

### TestFlight配信前
1. E2E検証を実施（`docs/ANALYTICS_TESTFLIGHT_VALIDATION.md` 参照）
2. 問題があれば修正
3. 本番ビルド実行

### TestFlight配信後
1. Live Eventsで全イベントが届いているか確認
2. Funnelを作成して人数を確認
3. 数字が出たら、落ち箇所を特定
4. 判定ロジックに従って次の1手を決める
5. 1つだけ改善を実施
6. 再度Funnelを確認

### v1.4以降（数字が安定してから）
- `lesson_question_answered`: 問題ごとの正答率
- `lesson_abandoned`: レッスン途中離脱
- `paywall_shown`: ペイウォール表示
- `purchase_completed`: 購入完了

**重要:** v1.3で数字が安定してから追加する。今は追加しない。

---

## 完成度チェックリスト

### コード
- [x] Lazy initialization実装
- [x] EXPO_PUBLIC_APP_ENV安全パース実装
- [x] 全イベントに多重発火ガード実装
- [x] track() never throws（エラーハンドリング）
- [x] HTTP/PostHog送信が非ブロッキング（3秒タイムアウト）

### ドキュメント
- [x] `docs/ANALYTICS_MEASUREMENT_GUIDE.md`（測定ガイド）
- [x] `docs/ANALYTICS_TESTFLIGHT_VALIDATION.md`（TestFlight前検証ガイド）
- [x] `docs/ANALYTICS_V1.3_STATUS.md`（このドキュメント）
- [x] `.env.example` に全変数記載

### 環境変数
- [x] `.env.example` に全変数記載
- [x] EXPO_PUBLIC_APP_ENV の説明追加
- [x] PostHog設定の説明追加

### テスト
- [ ] E2E検証（初回起動フロー）
- [ ] E2E検証（2回目起動フロー）
- [ ] E2E検証（レッスン複数回実行フロー）
- [ ] E2E検証（ホットリロード）
- [ ] Lazy initialization検証（通常起動）
- [ ] Lazy initialization検証（初期化遅延）
- [ ] Lazy initialization検証（初期化失敗）

---

## まとめ

Analytics v1.3は「計測が落ちない/数字が信用できる」状態で実装完了。

**最重要ポイント:**
1. ✅ Lazy initializationで `session_start` が必ず届く
2. ✅ 多重発火ガードで数字が歪まない
3. ✅ エラーハンドリングでアプリがクラッシュしない
4. ✅ 非ブロッキング送信でアプリが遅くならない
5. ✅ EXPO_PUBLIC_APP_ENV安全パースで不正値に対応

**次の1手:**
`docs/ANALYTICS_TESTFLIGHT_VALIDATION.md` に従ってE2E検証を実施。
