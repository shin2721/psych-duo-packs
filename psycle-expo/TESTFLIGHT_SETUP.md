# TestFlight 提出手順書

> **目的**: PsycleをTestFlightに最短・確実に提出する  
> **前提**: Analytics v1.3実装済み、必要な修正適用済み

---

## 🚀 実行手順

### 1. 依存関係インストール
```bash
npm i
```

### 2. DEV環境でプリチェック実行
```bash
npx expo start
# または
npm run ios
```

**実行内容**: [docs/TESTFLIGHT_PRECHECK.md](docs/TESTFLIGHT_PRECHECK.md) のチェック1-5を全て実行

**確認項目**:
- ✅ DEV環境でAnalytics正常動作
- ✅ 初回起動(app_open=1)再現
- ✅ 2回目起動(app_open=0)確認  
- ✅ レッスン完了イベント確認
- ✅ Release環境でDebug完全無効化

### 3. EAS準備
```bash
# EAS CLI インストール（未インストールの場合）
npm install -g @expo/eas-cli

# EAS ログイン
eas login
```

### 4. プロダクションビルド
```bash
eas build --profile production --platform ios
```

**実行結果例**:
```
✔ Build complete!
URL: https://expo.dev/accounts/[account]/projects/psycle/builds/[build-id]
```

### 5. TestFlightアップロード
```bash
eas submit --profile production --platform ios
```

**実行結果例**:
```
✔ Submitted to App Store Connect
Build will be available in TestFlight shortly
```

---

## 📱 App Store Connect 設定（初回のみ）

### App作成
1. [App Store Connect](https://appstoreconnect.apple.com) ログイン
2. 「マイApp」→「+」→「新規App」
3. 設定:
   - **プラットフォーム**: iOS
   - **名前**: Psycle  
   - **主言語**: 日本語
   - **バンドルID**: com.shin27.psycle
   - **SKU**: psycle-ios

### TestFlight内部テスト設定
1. 作成したアプリ → 「TestFlight」タブ
2. 「内部テスト」→「+」→「内部グループを作成」
3. グループ名: "Internal Testing"
4. テスター追加: 自分のApple IDを追加

---

## ✅ 最終確認

### TestFlight処理待ち
App Store Connect → TestFlight で「テスト準備完了」まで待機（5-15分）

### 内部テスト開始
1. 内部グループ → 「ビルドを追加」
2. 最新ビルド選択 → 「テストを開始」

### TestFlightアプリで確認
1. TestFlightアプリでPsycleインストール
2. アプリ起動 → 設定で「設定」5回タップ
3. Debug画面が開かないことを確認（Release版確認）

---

## 🎯 完了判定

**✅ TestFlight提出成功**:
- プリチェック全項目PASS
- ビルド・アップロード成功
- TestFlightでRelease版正常動作

**❌ 失敗時の対処**:
- プリチェック失敗 → [docs/TESTFLIGHT_PRECHECK.md](docs/TESTFLIGHT_PRECHECK.md) のトラブルシューティング参照
- ビルド失敗 → `eas build --clear-cache` でリトライ
- アップロード失敗 → `eas credentials` で証明書確認

---

**推定所要時間**: 30分（初回は1-2時間）