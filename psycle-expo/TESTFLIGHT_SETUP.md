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
npm run typecheck
npm run test:billing:smoke
npm run test:settings-notifications:smoke
npm run e2e:build:ios:release
npm run e2e:ios:release -- --testPathPattern='ui.full_touch.e2e.ts'
```

**実行内容**: release simulator gate を固定順で通す

**確認項目**:
- ✅ app typecheck 正常
- ✅ billing / settings 通知まわりの targeted Jest 正常
- ✅ iOS release simulator build 正常
- ✅ `ui.full_touch.e2e.ts` 正常
- ✅ watchman recrawl / `ts-jest isolatedModules` deprecation が出ない

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
2. `course / quests / leaderboard / friends / shop / profile / settings` を開き、下端コンテンツが崩れないことを確認
3. lesson を 1 周し、question/result/completion の CTA が home indicator に埋もれないことを確認
4. `leaderboard` の `league / global / friends` と `friends` の `friends / requests / search` を素早く切り替え、stale 表示が混ざらないことを確認
5. `restore purchases` と `manage billing` を 1 回ずつ試し、blocking `alert()` ではなく status row + toast で完結することを確認
6. 購入導線が踏める場合は、失敗時も toast のみで完結することを確認
7. Release版として、設定で「設定」を5回タップしても debug 画面が開かないことを確認

### 結果の残し方
- 問題なし: `TestFlight smoke passed`
- 問題あり: 画面名 / 前提 / 再現手順 / 期待結果 / 実結果 を残す

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
