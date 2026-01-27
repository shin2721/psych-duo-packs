# TestFlight プリチェック (Analytics v1.3)

> **所要時間**: 約10分  
> **対象**: TestFlight 提出前の最終確認  
> **前提**: Analytics v1.3実装済み、DEV限定Debug導線あり

---

## 🔧 事前準備

### 必要なコマンド環境
```bash
# 依存関係インストール
npm i

# EAS CLI確認（未インストールなら）
npm install -g @expo/eas-cli
eas login
```

---

## ✅ チェック1: DEV環境でAnalytics動作確認

### Step 1-1: DEVビルド起動
```bash
npx expo start
# または
npm run ios
```

### Step 1-2: Debug画面アクセス
1. アプリ起動後、画面下の「プロフィール」タブをタップ
2. 右上の歯車アイコンをタップ → 設定画面
3. **「設定」の文字を5回素早くタップ**（2秒以内）
4. バイブレーション → Analytics Debug画面が開く

### Step 1-3: 初期状態の確認
| 項目 | 期待値 | 実際の値 | PASS/FAIL |
|------|--------|----------|-----------|
| ステータス | ✅ PASS | _______ | ☐ |
| anonId | UUID表示（`unknown`以外） | _______ | ☐ |
| session_start | 1 | _______ | ☐ |
| app_ready | 1 | _______ | ☐ |
| app_open | 1（初回起動なら） | _______ | ☐ |

**⚠️ 重要**: anonIdが`unknown`の場合は初期化失敗。Metroターミナルでエラーログを確認

---

## ✅ チェック2: 初回起動(app_open)の再現テスト

### Step 2-1: Reset実行
1. Analytics Debug画面で「Reset」ボタンをタップ
2. 確認ダイアログで「Reset」をタップ
3. 「Reset Complete」アラートを確認

### Step 2-2: アプリ完全終了
**iOSシミュレーター**:
1. `Cmd + Shift + H` でホーム画面
2. アプリアイコンを上にスワイプして完全終了

**実機**:
1. ホームボタン2回押し（またはスワイプアップ停止）
2. アプリを上にスワイプして完全終了

### Step 2-3: アプリ再起動
1. アプリアイコンをタップして再起動
2. 設定画面 → 「設定」5回タップ → Debug画面

### Step 2-4: 初回起動確認
| 項目 | 期待値 | 実際の値 | PASS/FAIL |
|------|--------|----------|-----------|
| app_open | 1（Resetで初回扱い） | _______ | ☐ |
| session_start | 1 | _______ | ☐ |
| app_ready | 1 | _______ | ☐ |

**⚠️ 重要**: app_openが0の場合、AsyncStorageクリア失敗。シミュレーター完全リセット推奨

---

## ✅ チェック3: 2回目起動(app_open=0)の確認

### Step 3-1: Resetなしでアプリ完全終了
1. **Resetボタンは押さない**
2. アプリを完全終了（上記Step 2-2と同じ手順）

### Step 3-2: アプリ再起動
1. アプリアイコンをタップして再起動
2. 設定画面 → 「設定」5回タップ → Debug画面

### Step 3-3: 2回目起動確認
| 項目 | 期待値 | 実際の値 | PASS/FAIL |
|------|--------|----------|-----------|
| app_open | 0（2回目なので増えない） | _______ | ☐ |
| session_start | 1 | _______ | ☐ |
| app_ready | 1 | _______ | ☐ |

**⚠️ 重要**: app_openが1になった場合、初回判定ロジック不具合

---

## ✅ チェック4: レッスン完了イベント確認

### Step 4-1: レッスン実行
1. Debug画面を閉じる（戻るボタン）
2. 画面下の「コース」タブをタップ
3. 任意のレッスンを選択して最後まで完了
4. 「完了」ボタンをタップしてレッスン終了

### Step 4-2: レッスンイベント確認
1. 設定画面 → 「設定」5回タップ → Debug画面
2. イベントカウントを確認

| 項目 | 期待値 | 実際の値 | PASS/FAIL |
|------|--------|----------|-----------|
| lesson_start | 1 | _______ | ☐ |
| lesson_complete | 1 | _______ | ☐ |

**⚠️ 重要**: lesson_startが0の場合、レッスン開始イベント未発火

---

## ✅ チェック5: Release環境でDebug無効化確認

### Step 5-1: Releaseビルド作成
```bash
# ローカルReleaseビルド（確認用）
npx expo run:ios --configuration Release
```

### Step 5-2: 設定画面でDebug導線確認
1. アプリ起動後、設定画面を開く
2. 画面を目視確認

| 項目 | 期待値 | 実際の状態 | PASS/FAIL |
|------|--------|------------|-----------|
| 「デバッグ」セクション | 表示されない | _______ | ☐ |
| Analytics Debug項目 | 表示されない | _______ | ☐ |

### Step 5-3: 5タップ無効化確認
1. 「設定」の文字を5回素早くタップ
2. 反応を確認

| 項目 | 期待値 | 実際の状態 | PASS/FAIL |
|------|--------|------------|-----------|
| バイブレーション | なし | _______ | ☐ |
| 画面遷移 | なし（Debug画面は開かない） | _______ | ☐ |

**⚠️ 重要**: Releaseでバイブや画面遷移があった場合、`__DEV__`ガード不具合

---

## 🚀 TestFlight提出手順

### Step 6-1: プロダクションビルド
```bash
eas build --profile production --platform ios
```

**実行結果**: ビルド完了URL（例: https://expo.dev/accounts/[account]/projects/psycle/builds/[build-id]）

### Step 6-2: App Store Connect設定（初回のみ）
1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「マイApp」→「+」→「新規App」
3. 設定値:
   - **プラットフォーム**: iOS
   - **名前**: Psycle
   - **主言語**: 日本語
   - **バンドルID**: com.shin27.psycle
   - **SKU**: psycle-ios

### Step 6-3: TestFlight内部テスト設定（初回のみ）
1. 作成したアプリ → 「TestFlight」タブ
2. 「内部テスト」→「+」→「内部グループを作成」
3. グループ名: "Internal Testing"
4. テスター追加: 自分のApple IDを追加

### Step 6-4: TestFlightアップロード
```bash
eas submit --profile production --platform ios
```

**実行結果**: アップロード完了メッセージ

### Step 6-5: TestFlight確認
1. App Store Connect → TestFlight
2. 最新ビルドが「処理中」→「テスト準備完了」になるまで待機（5-15分）
3. 内部グループ → 「ビルドを追加」→ 最新ビルド選択 → 「テストを開始」

### Step 6-6: TestFlightアプリで最終確認
1. TestFlightアプリでPsycleをインストール
2. アプリ起動 → 設定画面で「設定」5回タップ
3. Debug画面が開かないことを確認（Release版動作確認）

---

## 📊 判定基準

### ✅ TestFlight提出OK
- チェック1-5: 全項目PASS
- ビルド・アップロード成功
- TestFlightでRelease版正常動作

### ❌ ブロッカー
- **anonId が `unknown`**: 初期化失敗 → Metroログ確認
- **app_open が Reset後も 0**: AsyncStorageクリア失敗 → シミュレーター完全リセット
- **Releaseでデバッグ表示**: `__DEV__`ガード漏れ → コード確認
- **lesson_start/complete が 0**: イベント発火失敗 → 実装確認

---

## 🔧 トラブルシューティング

### anonId が unknown
**原因**: `Analytics.initialize()` 失敗  
**対処**: Metroターミナルでエラーログ確認、ネットワーク接続確認

### app_open が増えない
**原因**: `trackAppOpen()` 未実行  
**対処**: `app/_layout.tsx` の実装確認

### Reset後も初回判定にならない
**原因**: AsyncStorageクリア失敗  
**対処**: シミュレーター「Device → Erase All Content and Settings」

### Releaseビルドでデバッグ表示
**原因**: `__DEV__` ガード漏れ  
**対処**: `app/settings/index.tsx` の条件分岐確認

### EAS build失敗
**原因**: 証明書・プロファイル問題  
**対処**: `eas credentials` で証明書再生成

---

## 📝 実行コマンド一覧

```bash
# 1. 依存関係インストール
npm i

# 2. DEV環境確認
npx expo start
# または
npm run ios

# 3. Release環境確認
npx expo run:ios --configuration Release

# 4. EAS準備
npm install -g @expo/eas-cli
eas login

# 5. プロダクションビルド
eas build --profile production --platform ios

# 6. TestFlightアップロード
eas submit --profile production --platform ios
```

---

## 📋 チェックリスト完了確認

- [ ] チェック1: DEV環境 Analytics 正常動作
- [ ] チェック2: 初回起動 app_open=1 再現
- [ ] チェック3: 2回目起動 app_open=0 確認
- [ ] チェック4: レッスン完了イベント確認
- [ ] チェック5: Release環境 Debug完全無効化
- [ ] TestFlight提出・確認完了

**全項目PASS時**: TestFlightリリース準備完了 ✅
