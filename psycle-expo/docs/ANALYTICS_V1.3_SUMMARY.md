# Analytics v1.3 - クイックサマリー

## 🎯 完成度
**TestFlight配信可能レベル**（計測が落ちない/数字が信用できる）

---

## 📊 実装済みイベント（7種類）

```
起動フロー:
  session_start → app_ready → app_open（初回のみ）

オンボーディングフロー:
  onboarding_start → onboarding_complete

レッスンフロー:
  lesson_start → lesson_complete
```

---

## 🔑 重要機能

### 1. Lazy Initialization（v1.3の最重要機能）
- `track()` は初期化前でも呼び出し可能
- 初期化前のイベントはメモリキューに保存
- 初期化完了後、キューをフラッシュ
- **保証**: `session_start` が必ずPostHogに届く

### 2. 多重発火ガード
- `app_open`: AsyncStorage（初回起動のみ）
- `session_start` / `app_ready`: プロセス内フラグ（起動毎に1回）
- `onboarding_start` / `lesson_start`: useRef（画面表示時に1回）
- `onboarding_complete` / `lesson_complete`: 確定地点（アクション実行時に1回）

### 3. エラーハンドリング
- **原則**: `track()` never throws
- 全エラーをtry-catchで握りつぶし
- アプリは絶対にクラッシュしない

### 4. 非ブロッキング送信
- HTTP/PostHog送信は非ブロッキング
- 3秒タイムアウト
- アプリが遅くならない

---

## 📁 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/analytics.ts` | Core API実装（Lazy init含む） |
| `lib/analytics.types.ts` | 型定義 |
| `lib/analytics.config.ts` | 設定管理（EXPO_PUBLIC_APP_ENV安全パース） |
| `app/_layout.tsx` | 初期化 + 起動イベント |
| `lib/OnboardingContext.tsx` | onboarding_complete |
| `app/onboarding/index.tsx` | onboarding_start |
| `app/lessons/[id].tsx` | lesson_start/lesson_complete |

---

## 🔧 環境変数（本番ビルド）

```bash
# .env
EXPO_PUBLIC_APP_ENV=prod
EXPO_PUBLIC_POSTHOG_HOST=us.i.posthog.com
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxxxxxxxxxxxx
```

---

## 📈 PostHog D0ファネル

```
ステップ:
  1. session_start
  2. app_ready
  3. onboarding_start
  4. onboarding_complete
  5. lesson_start
  6. lesson_complete

フィルター:
  - env = prod
  - 期間: 過去7日間

表示: 人数（Number）
```

---

## ✅ 次のステップ

### TestFlight配信前
1. **E2E検証を実施**（`docs/ANALYTICS_TESTFLIGHT_VALIDATION.md` 参照）
   - 初回起動フロー
   - 2回目起動フロー
   - レッスン複数回実行フロー
   - Lazy initialization検証
2. 問題があれば修正
3. 本番ビルド実行

### TestFlight配信後
1. PostHog Live Eventsで全イベント確認
2. Funnelを作成して人数を確認
3. 数字が出たら、落ち箇所を特定
4. 次の1手を決める（1つだけ改善）
5. 再度Funnelを確認

---

## 📚 ドキュメント

| ドキュメント | 内容 |
|------------|------|
| `ANALYTICS_V1.3_STATUS.md` | 実装ステータス詳細 |
| `ANALYTICS_TESTFLIGHT_VALIDATION.md` | TestFlight前検証ガイド（E2E手順） |
| `ANALYTICS_MEASUREMENT_GUIDE.md` | 測定ガイド（PostHog操作含む） |
| `ANALYTICS_V1.3_SUMMARY.md` | このドキュメント（クイックサマリー） |

---

## 🚨 重要な制約

### やること
- ✅ E2E検証を実施
- ✅ 本番ビルドで `EXPO_PUBLIC_APP_ENV=prod` を設定
- ✅ PostHog Live Eventsで全イベント確認
- ✅ Funnelで落ち箇所を特定
- ✅ 1つずつ改善して効果を測定

### やらないこと
- ❌ 同時に2つ以上の改善を行わない
- ❌ v1.3で新しいイベントを追加しない（数字が安定してから）
- ❌ 初期化失敗時にアプリをクラッシュさせない
- ❌ 送信失敗時にリトライしない（v1では不要）

---

## 🎉 完成度の保証

### コード
- ✅ Lazy initialization実装
- ✅ 多重発火ガード実装
- ✅ エラーハンドリング実装
- ✅ 非ブロッキング送信実装
- ✅ EXPO_PUBLIC_APP_ENV安全パース実装

### ドキュメント
- ✅ 実装ステータス
- ✅ TestFlight前検証ガイド
- ✅ 測定ガイド
- ✅ クイックサマリー

### 環境変数
- ✅ `.env.example` に全変数記載
- ✅ 説明とコメント追加

---

## 💡 トラブルシューティング

### イベントがPostHogに届かない
1. Console出力で「PostHog event sent successfully」を確認
2. `EXPO_PUBLIC_POSTHOG_HOST` / `EXPO_PUBLIC_POSTHOG_API_KEY` を確認
3. ネットワーク接続を確認

### イベントが多重発火する
1. Console出力で「already tracked」メッセージを確認
2. ガード機構が正しく動作しているか確認

### EXPO_PUBLIC_APP_ENV が反映されない
1. `.env` ファイルが正しく配置されているか確認
2. `EXPO_PUBLIC_` プレフィックスが付いているか確認
3. アプリを再ビルド（環境変数変更後は必須）

---

## 🔥 最重要ポイント

1. **Lazy initialization**: `session_start` が必ず届く
2. **多重発火ガード**: 数字が歪まない
3. **エラーハンドリング**: アプリがクラッシュしない
4. **非ブロッキング送信**: アプリが遅くならない
5. **E2E検証**: 実際の動作を確認

---

## 📞 次の1手

```bash
# 1. E2E検証を実施
open docs/ANALYTICS_TESTFLIGHT_VALIDATION.md

# 2. 本番ビルド
eas build --platform ios --profile production

# 3. TestFlight配信後、PostHogで確認
# Live Events → Funnels → 落ち箇所特定 → 次の1手
```

---

**完成度: TestFlight配信可能レベル ✅**
