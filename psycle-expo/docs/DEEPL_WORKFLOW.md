# DeepL統合ワークフロー

## 概要

論文から抽出した英語キーワードを自動的に日本語に翻訳し、PSYCH_TERMSデータベースを拡充するワークフローです。

## ワークフロー全体像

```
論文 (824本)
    ↓
① キーワード抽出 (正規表現)
    ↓
英語キーワード (therapies, disorders, concepts)
    ↓
② DeepL API翻訳
    ↓
日本語キーワード
    ↓
③ Claude説明文生成 (15文字以内)
    ↓
完成データ (ja, en, desc/symptom/effect)
    ↓
④ ユーザーレビュー
    ↓
⑤ PSYCH_TERMSにマージ
```

## セットアップ

### 1. DeepL API キー取得

1. [DeepL API](https://www.deepl.com/pro-api) にアクセス
2. アカウント作成（無料プラン: 500,000文字/月）
3. APIキーを取得

### 2. 必要なパッケージのインストール

```bash
npm install deepl-node
```

### 3. 環境変数設定

```bash
# DeepL API キー（必須）
export DEEPL_API_KEY="your-deepl-api-key-here"

# Anthropic API キー（オプション：説明文生成用）
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

**注意**: `ANTHROPIC_API_KEY` が設定されていない場合、説明文生成はスキップされます（翻訳のみ実行）。

## 使い方

### 基本的な使い方

```bash
# 論文から自動抽出 → DeepL翻訳 → Claude説明文生成
node scripts/expand_with_deepl.mjs
```

### 出力ファイル

- `data/psych_terms_from_papers.json` - 論文ベースで生成されたPSYCH_TERMS候補

### ステップ詳細

#### ステップ1: キーワード抽出

`data/sources.json` から以下のパターンでキーワードを抽出:

- **therapies**: 治療法・介入法（例: cognitive behavioral therapy, mindfulness-based therapy）
- **disorders**: 精神障害（例: generalized anxiety disorder, major depressive disorder）
- **concepts**: 心理学的概念（例: cognitive reappraisal, emotion regulation）

#### ステップ2: DeepL翻訳

抽出された英語キーワードをDeepL APIで日本語に翻訳:

```javascript
// 例
"cognitive behavioral therapy" → "認知行動療法"
"generalized anxiety disorder" → "全般性不安症"
"emotion regulation" → "感情調整"
```

#### ステップ3: Claude説明文生成

各キーワードに対して15文字以内の説明を生成:

```javascript
// 例
{ ja: "認知行動療法", en: "cognitive behavioral therapy", desc: "考え方と行動を変える" }
{ ja: "全般性不安症", en: "generalized anxiety disorder", symptom: "あらゆることへの不安" }
{ ja: "感情調整", en: "emotion regulation", effect: "気持ちをうまく扱う" }
```

## 従来方式との比較

### 方式A: 完全手動（従来）

- ✅ 高品質（人間がレビュー）
- ❌ 時間がかかる（1項目5分 × 90項目 = 7.5時間）
- ❌ スケールしない

### 方式B: Claude全自動（expand_psych_terms_with_claude.mjs）

- ✅ 速い（10分程度）
- ⚠️ エビデンス不明（Claudeの知識のみ）
- ⚠️ 論文との整合性不明

### 方式C: DeepL統合（expand_with_deepl.mjs）【推奨】

- ✅ 論文ベース（エビデンスあり）
- ✅ 翻訳は機械的（品質安定）
- ✅ スケーラブル
- ⚠️ 最終レビューは必要

## コスト見積もり

### DeepL API

- **無料枠**: 500,000文字/月
- **使用量**: 100-150キーワード × 平均50文字 = 約5,000-7,500文字
- **月間処理可能数**: 約66回分
- **コスト**: 無料枠内で十分

### Claude API（説明文生成）

- **使用量**: 90項目 × 100トークン = 9,000トークン
- **コスト**: $0.003/1Kトークン × 9 = 約$0.027（約3円）
- **月間処理可能回数**: ほぼ無制限

## データ品質チェック

生成されたデータは以下の点を確認してください:

1. **翻訳の正確性**: DeepL翻訳が自然な日本語か
2. **説明文の妥当性**: 15文字以内で適切に説明されているか
3. **重複チェック**: 既存のPSYCH_TERMSと重複していないか
4. **専門用語の適切性**: 一般ユーザーに分かりやすいか

## 既存データとのマージ

### 1. 生成されたファイルを確認

```bash
cat data/psych_terms_from_papers.json
```

### 2. 既存のClaude生成データと比較

```bash
cat data/psych_terms_candidates.json
```

### 3. 重複削除とマージ

- 両ファイルを比較
- 論文ベース（`psych_terms_from_papers.json`）を優先
- 重複削除
- 品質チェック

### 4. scripts/auto_generate_problems.mjs に統合

`PSYCH_TERMS` オブジェクト（lines 13-67）に追加:

```javascript
const PSYCH_TERMS = {
  therapies: [
    // 既存15個
    { ja: '認知行動療法', en: 'CBT', desc: '考え方と行動を変える' },
    // ...

    // 新規追加（論文ベース）
    { ja: 'ゲシュタルト療法', en: 'Gestalt Therapy', desc: '今の気づきに焦点' },
    // ...
  ],
  disorders: [
    // 既存14個 + 新規16個 = 30個
  ],
  concepts: [
    // 既存18個 + 新規22個 = 40個
  ]
};
```

## トラブルシューティング

### DeepL API エラー

```
❌ DEEPL_API_KEY が設定されていません
```

→ 環境変数を設定: `export DEEPL_API_KEY="your-key"`

### 翻訳品質が低い

DeepLは一般的に高品質ですが、専門用語の翻訳が不自然な場合:

1. 英語キーワードを確認（抽出パターンが適切か）
2. 手動で修正
3. `psych_terms_from_papers.json` を編集

### Claude説明文が長すぎる

15文字を超える場合:

1. `expand_with_deepl.mjs` のプロンプトを調整
2. `.substring(0, 15)` で自動トリミング
3. 手動で `psych_terms_from_papers.json` を編集

## 次のフェーズ

PSYCH_TERMS拡充が完了したら、次は **REAL_LIFE_SITUATIONS** の拡充:

- 現状: 60項目（10項目/unit × 6 units）
- 目標: 180項目（30項目/unit × 6 units）
- 必要: 120新規シナリオ

これは論文からの自動抽出が困難なため、手動作成またはClaude生成が必要です。

## 参考リンク

- [DeepL API Documentation](https://developers.deepl.com/docs)
- [deepl-node GitHub](https://github.com/DeepLcom/deepl-node)
- [DeepL API Free Tier](https://www.deepl.com/pro-api)
