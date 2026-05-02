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

### ✅ Step 3-3: Production config から dev-client / dev-only ATS を除外
TestFlight提出版のExpo configでは、production env が `prod` になり、開発用の `expo-dev-client` と `exp.direct` / local networking 例外が入らないことを確認:

```bash
npm run check:launch-env
EAS_BUILD_PROFILE=production npm exec -- expo config --type public --json
```

**確認項目**:
- [ ] `EXPO_PUBLIC_APP_ENV`: `prod`
- [ ] `EXPO_PUBLIC_E2E_ANALYTICS_DEBUG` が production で有効化されていない
- [ ] `EXPO_PUBLIC_IOS_EXTERNAL_CHECKOUT_ENABLED` が production で有効化されていない
- [ ] Supabase URL / anon key / Functions URL が placeholder ではない
- [ ] app.json / Xcode project / native-agent の Bundle ID が `com.shin27.psycle` に揃っている
- [ ] `plugins` に `expo-dev-client` が含まれない
- [ ] `ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking` が含まれない
- [ ] `ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains.exp.direct` が含まれない
- [ ] `ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads`: false
- [ ] icon / splash / adaptive icon の参照先ファイルが存在する
- [ ] PrivacyInfo.xcprivacy が `NSPrivacyTracking=false` と、email / user ID / product interaction / purchase history の収集実態を宣言している
- [ ] `usesNonExemptEncryption=false`
- [ ] 通知許可が opt-in (`notifications.default_enabled=false`)
- [ ] iOS production では App Store billing 実装前の外部 Checkout を出さない

---

## 📋 Phase 4: プライバシー・コンプライアンス確認

### ✅ Step 4-1: プライバシー設定確認
```bash
cat ios/Psycle/PrivacyInfo.xcprivacy | grep -A 5 "NSPrivacyTracking"
```

**確認項目**:
- [ ] `NSPrivacyTracking`: false ✅
- [ ] `NSPrivacyCollectedDataTypes`: email / user ID / product interaction / purchase history を宣言
- [ ] analytics 用の収集目的は `NSPrivacyCollectedDataTypePurposeAnalytics` を含む

### ✅ Step 4-2: Export Compliance 設定
app.jsonのiOS設定に以下が入っていることを確認:

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
node -e "const cfg=require('./app.json').expo.ios.config; if (cfg.usesNonExemptEncryption !== false) process.exit(1)"
```

---

## 📋 Phase 5: Analytics Debug 無効化確認

### ✅ Step 5-0: ローカルRelease smoke gate
```bash
npm run e2e:ios:psycle:smoke:build
```

**確認項目**:
- [ ] `analytics.v1_3.e2e.ts` PASS
- [ ] `ui.full_touch.e2e.ts` PASS
- [ ] `artifacts/analytics_e2e_report.txt` の Overall Result が PASS

**注意**: この smoke は `EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1` 付きのローカルRelease確認です。TestFlight提出版のDebug無効化は Step 5-2 / Step 8-2 で別確認します。

### ✅ Step 5-1: DEV環境でDebug機能確認
```bash
npm run ios
```

1. アプリ起動後、設定画面へ
2. 「設定」文字を5回タップ
3. Analytics Debug画面が開くことを確認

**結果を貼ってください**: Debug画面のスクリーンショット

### ✅ Step 5-1b: 通知許可は opt-in のみ
```bash
node -e "const cfg=require('./config/gamification.json'); if (cfg.notifications.default_enabled !== false) process.exit(1)"
```

**確認項目**:
- [ ] 初回起動直後に通知許可ダイアログが出ない
- [ ] 設定の通知トグルをONにした時だけ通知許可ダイアログが出る

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
- [ ] `psycle://debug/analytics` などの `/debug/*` deep link が Home / Auth / Onboarding のいずれかへ逃げる

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
- [ ] `/debug/*` deep link でDebug画面へ入れない

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
