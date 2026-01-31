# TestFlight リリースチェックリスト

> **目標**: iOS TestFlightに出せる状態まで最短で導く  
> **前提**: Analytics v1.3実装済み、DEVのみDebug導線あり

---

## 📋 Phase 1: 事前準備・設定確認

### ✅ Step 1-1: EAS CLI セットアップ
```bash
npm install -g @expo/eas-cli
eas login
```
**結果を貼ってください**: ログイン成功メッセージ

### ✅ Step 1-2: Apple Developer アカウント確認
```bash
eas device:list
```
**結果を貼ってください**: デバイス一覧 or "No devices found"

### ✅ Step 1-3: プロジェクト設定確認
```bash
cat app.json | grep -E "(name|version|bundleIdentifier)"
```
**確認項目**:
- [ ] `name`: "Psycle" ✅
- [ ] `version`: "1.0.0" ✅  
- [ ] `bundleIdentifier`: "com.shin27.psycle" ✅

### ✅ Step 1-4: 必須アセット確認
```bash
ls -la assets/ | grep -E "(icon|splash)"
```
**確認項目**:
- [ ] `icon.png` 存在 ✅
- [ ] `splash.png` 存在 ✅

---

## 📋 Phase 2: Apple Developer Console 設定

### ✅ Step 2-1: App Store Connect でアプリ作成
1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「マイApp」→「+」→「新規App」
3. 設定値:
   - **プラットフォーム**: iOS
   - **名前**: Psycle
   - **主言語**: 日本語
   - **バンドルID**: com.shin27.psycle
   - **SKU**: psycle-ios (任意)

**結果を貼ってください**: 作成完了画面のスクリーンショット

### ✅ Step 2-2: TestFlight 内部テスト設定
1. 作成したアプリ → 「TestFlight」タブ
2. 「内部テスト」→「+」→「内部グループを作成」
3. グループ名: "Internal Testing"
4. テスター追加: 自分のApple IDを追加

**結果を貼ってください**: 内部グループ作成完了画面

---

## 📋 Phase 3: ビルド設定最適化

### ✅ Step 3-1: EAS設定確認・更新
```bash
cat eas.json
```

**必要な修正** (以下をeas.jsonに追加):
```json
{
  "cli": {
    "version": ">= 12.5.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### ✅ Step 3-2: app.json TestFlight対応確認
現在の設定で問題ないことを確認:
```bash
cat app.json | grep -A 10 -B 5 "ios"
```

**確認項目**:
- [ ] `bundleIdentifier`: "com.shin27.psycle" ✅
- [ ] `supportsTablet`: true ✅

---

## 📋 Phase 4: プライバシー・コンプライアンス確認

### ✅ Step 4-1: プライバシー設定確認
```bash
cat ios/psycleexpo/PrivacyInfo.xcprivacy | grep -A 5 "NSPrivacyTracking"
```

**確認項目**:
- [ ] `NSPrivacyTracking`: false ✅
- [ ] `NSPrivacyCollectedDataTypes`: 空配列 ✅

### ✅ Step 4-2: Export Compliance 設定
app.jsonに以下を追加する必要があります:

```json
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

**実行コマンド**:
```bash
# app.jsonのiosセクションを更新
```

---

## 📋 Phase 5: Analytics Debug 無効化確認

### ✅ Step 5-1: DEV環境でDebug機能確認
```bash
npm run ios
```

1. アプリ起動後、設定画面へ
2. 「設定」文字を5回タップ
3. Analytics Debug画面が開くことを確認

**結果を貼ってください**: Debug画面のスクリーンショット

### ✅ Step 5-2: Release環境でDebug無効化確認
```bash
npx expo run:ios --configuration Release
```

1. アプリ起動後、設定画面へ  
2. 「設定」文字を5回タップ
3. 何も起こらないことを確認

**確認項目**:
- [ ] バイブレーションなし
- [ ] 画面遷移なし
- [ ] Debug画面が開かない

---

## 📋 Phase 6: TestFlight ビルド・アップロード

### ✅ Step 6-1: プロダクションビルド作成
```bash
eas build --profile production --platform ios
```

**結果を貼ってください**: ビルド完了URL

### ✅ Step 6-2: TestFlight 自動アップロード
```bash
eas submit --profile production --platform ios
```

**結果を貼ってください**: アップロード完了メッセージ

---

## 📋 Phase 7: TestFlight 最終確認

### ✅ Step 7-1: TestFlight でビルド確認
1. App Store Connect → TestFlight
2. 最新ビルドが「処理中」→「テスト準備完了」になるまで待機（5-15分）

**結果を貼ってください**: 「テスト準備完了」状態のスクリーンショット

### ✅ Step 7-2: 内部テスト開始
1. 内部グループ → 「ビルドを追加」
2. 最新ビルドを選択 → 「次へ」
3. テスト情報入力 → 「テストを開始」

**結果を貼ってください**: テスト開始完了画面

### ✅ Step 7-3: TestFlight アプリでインストール確認
1. TestFlight アプリを開く
2. Psycle が表示されることを確認
3. 「インストール」→ アプリ起動確認

**結果を貼ってください**: TestFlightアプリでのPsycle表示画面

---

## 📋 Phase 8: 最終動作確認 (5分)

[docs/TESTFLIGHT_PRECHECK.md](./TESTFLIGHT_PRECHECK.md) に従って実行:

### ✅ Step 8-1: Analytics 動作確認 (DEV)
```bash
npm run ios
```
- [ ] Debug画面でPASS確認
- [ ] 全イベントカウント正常

### ✅ Step 8-2: Release版でDebug無効化確認
TestFlightからインストールしたアプリで:
- [ ] 設定5タップで反応なし
- [ ] Debug画面が開かない

**結果を貼ってください**: "全チェック完了" + 問題があれば詳細

---

## 🚨 よくある詰まりポイント

### Bundle ID 不一致
**症状**: "Bundle identifier doesn't match"
**解決**: 
```bash
# app.jsonとApple Developer Consoleで一致確認
grep bundleIdentifier app.json
```

### ビルド番号重複
**症状**: "Build number already exists"  
**解決**: eas.jsonで`"autoIncrement": true`設定済み ✅

### 署名エラー
**症状**: "Provisioning profile doesn't match"
**解決**:
```bash
eas credentials
```

### Export Compliance
**症状**: TestFlightで"Export Compliance Missing"
**解決**: app.jsonに`"usesNonExemptEncryption": false`追加

### プライバシー警告
**症状**: "Privacy practices not described"
**解決**: PrivacyInfo.xcprivacy設定済み ✅

### アイコン・スプラッシュエラー  
**症状**: "Invalid icon/splash"
**解決**: assets/確認済み ✅

---

## ✅ 完了判定

### TestFlight リリース成功
- [ ] Phase 1-8 全ステップ完了
- [ ] TestFlightでアプリインストール可能
- [ ] Analytics正常動作 (DEV)
- [ ] Debug機能無効化 (Release)

### 次のステップ
- 外部テスター招待
- App Store 審査準備
- プロダクション配信

---

**推定所要時間**: 初回 2-3時間、2回目以降 30分