# Psycle 問題自動生成システム

## 概要

Duolingo風の楽しい心理学問題を**完全無料**で大量生成するシステムです。
Claude APIなどの外部APIは一切使用せず、論文のタイトル/抄録データのみから問題を自動生成します。

## 特徴

- ✅ **完全無料**: 外部APIやクラウドサービス不要
- ✅ **15種類以上の問題形式**: シナリオ、どっちクイズ、○×、セラピスト役、研究批評など
- ✅ **Duolingo風**: カジュアルで楽しく学べる問題構成
- ✅ **難易度調整**: Easy 40% / Medium 40% / Hard 20%
- ✅ **バリエーション豊富**: 心理学用語データベース(60+項目)とシナリオテンプレート(30+パターン)
- ✅ **論文ベース**: 645本の査読済み論文から生成

## 生成された問題数

- **総レッスン数**: 36レッスン
- **総問題数**: 540問 (36レッスン × 15問)
- **ユニット別**: mental, work, study, health, social, money 各6レッスン

## 使い方

### 1. 単一問題生成

```bash
node scripts/auto_generate_problems.mjs question [type]
```

**例**:
```bash
# シナリオクイズを生成
node scripts/auto_generate_problems.mjs question scenario

# バイアス検出問題を生成
node scripts/auto_generate_problems.mjs question bias

# ランダムな問題を生成
node scripts/auto_generate_problems.mjs question
```

### 2. レッスン生成

```bash
node scripts/auto_generate_problems.mjs lesson [unit] [size]
```

**例**:
```bash
# mentalユニットの15問レッスンを生成
node scripts/auto_generate_problems.mjs lesson mental 15

# workユニットの20問レッスンを生成
node scripts/auto_generate_problems.mjs lesson work 20
```

### 3. ノード生成(ファイル出力)

```bash
node scripts/auto_generate_problems.mjs node [unit] [node_num]
```

**例**:
```bash
# mentalユニットの1番目のレッスンファイルを生成
node scripts/auto_generate_problems.mjs node mental 1

# workユニットの3番目のレッスンファイルを生成
node scripts/auto_generate_problems.mjs node work 3
```

出力先: `data/lessons_variety/{unit}_l{num}.json`

### 4. 全ユニット一括生成

```bash
node scripts/auto_generate_problems.mjs all
```

- 6ユニット × 6レッスン = 36レッスンファイルを生成
- 各レッスン15問 = 合計540問

## 問題タイプ一覧

### Easy問題 (40%)

1. **scenario**: シナリオクイズ
   - 例: 「締め切りに追われている時。どう対処する?」

2. **whichone**: どっちクイズ
   - 例: 「うつ病に効果的なのはどっち? CBT vs マインドフルネス」

3. **emotion**: 感情クイズ
   - 例: 「不安を感じた時、効果的な対処法は?」

4. **cloze**: 穴埋め問題
   - 例: 「[1]は[2]に効果がある」

### Medium問題 (40%)

5. **therapist**: セラピスト役
   - 例: 「クライアント『仕事が辛いんです…』あなたの対応は?」

6. **concept**: コンセプト応用
   - 例: 「朝起きるのがつらい。レジリエンスならどうする?」

7. **match**: 治療マッチング
   - 例: 「PTSDに最も適した治療法は?」

8. **bias**: バイアス検出
   - 例: 「成功者の本ばかり読んで失敗例は無視。これは何バイアス?」

9. **battle**: 研究バトル
   - 例: 「どちらの研究が信頼できる? A vs B」

### Hard問題 (20%)

10. **critique**: 研究批評
    - 例: 「この研究の限界は?」

11. **data**: データ解釈
    - 例: 「CBTで60%が改善。これは何を意味する?」

12. **limit**: 限界発見
    - 例: 「横断研究なので因果は不明 vs サンプルが偏っている可能性」

13. **ethics**: 倫理ジレンマ
    - 例: 「クライアントが危険な行動を計画している。どうする?」

14. **truefalse**: ○×クイズ(難)
    - 例: 「マインドフルネスは誰にでも効く万能な方法だ」

15. **rank**: ランキング
    - 例: 「効果の大きさ順に並べ替えよう」

## データ構造

### 心理学用語データベース (PSYCH_TERMS)

- **therapies**: 15種類(CBT, マインドフルネス, DBT, IPT, 曝露療法など)
- **disorders**: 14種類(うつ病, 不安症, PTSD, OCD, バーンアウトなど)
- **concepts**: 18種類(感情調整, レジリエンス, メタ認知など)

### シナリオテンプレート (SCENARIOS)

- work_stress: 5パターン
- student: 5パターン
- daily_life: 5パターン
- relationships: 5パターン
- health: 5パターン
- money: 5パターン

## 技術仕様

### ProblemGeneratorクラス

```javascript
class ProblemGenerator {
  constructor(sources)        // 645本の論文データを読み込み

  // 問題生成メソッド
  generateScenario()          // シナリオクイズ
  generateWhichOne()          // どっちクイズ
  generateTrueFalse()         // ○×クイズ
  generateEmotionQuiz()       // 感情クイズ
  generateTherapistRole()     // セラピスト役
  generateResearchCritique()  // 研究批評
  generateConceptApplication() // コンセプト応用
  generateDataInterpretation() // データ解釈
  generateEthicalDilemma()    // 倫理ジレンマ
  generateResearchBattle()    // 研究バトル
  generateLimitationFinder()  // 限界発見
  generateBiasDetection()     // バイアス検出
  generateTreatmentMatching() // 治療マッチング
  generateCloze()             // 穴埋め
  generateRank()              // ランキング

  // メインAPI
  generate_question(type?)    // 1問生成
  generate_lesson(unit, size) // レッスン生成
  generate_node(unit, num)    // ノード生成(ファイル出力)
}
```

### ユーティリティ関数

- `extractKeywords(text)`: テキストから心理学用語を抽出
- `inferContext(paper)`: 論文からユニット/キーワードを推定
- `getDifficulty()`: 難易度をランダム選択(40/40/20の比率)
- `randomChoice(arr)`: 配列からランダム選択
- `randomSample(arr, n)`: 配列からn個ランダムサンプリング

## 出力フォーマット

```json
{
  "id": "scenario_1761382512749_397l8132q",
  "type": "mcq3",
  "stem": "パートナーと喧嘩した。どう解決する？",
  "choices": [
    "動機づけ面接を試してみる",
    "何もせずに我慢する",
    "誰かに愚痴る"
  ],
  "answer_index": 0,
  "info": "研究より: 動機づけ面接が効果的",
  "difficulty": "easy",
  "source_id": "ED606573"
}
```

## バックアップ

既存のレッスンデータは自動的に `data/lessons_backup/` にバックアップされます。

```bash
# バックアップディレクトリを確認
ls data/lessons_backup/
```

## メンテナンス

### 用語を追加する

`scripts/auto_generate_problems.mjs` の `PSYCH_TERMS` オブジェクトを編集:

```javascript
const PSYCH_TERMS = {
  therapies: [
    { ja: '新しい療法', en: 'NewTherapy', desc: '説明文' },
    // ...
  ],
  // ...
};
```

### シナリオを追加する

`SCENARIOS` オブジェクトに新しいカテゴリやパターンを追加:

```javascript
const SCENARIOS = {
  new_category: [
    { setup: '状況説明', question: '質問' },
    // ...
  ],
  // ...
};
```

### 問題タイプを追加する

1. `ProblemGenerator` クラスに新しい生成メソッドを追加
2. `generate_question()` の `generators` オブジェクトに登録

```javascript
generateNewType() {
  return {
    id: `newtype_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'newtype',
    stem: '問題文',
    choices: ['選択肢1', '選択肢2'],
    answer_index: 0,
    info: '補足情報',
    difficulty: 'medium',
  };
}
```

## トラブルシューティング

### 問題が生成されない

- 論文データが不足している可能性があります
- `data/sources.json` を確認し、抄録(abstract)があるか確認してください

### 同じような問題ばかり生成される

- ランダム性は確保されていますが、用語/シナリオデータベースを拡充することで多様性が向上します

### 特定のユニットだけ再生成したい

```bash
# mentalユニットの全6レッスンを再生成
for i in {1..6}; do
  node scripts/auto_generate_problems.mjs node mental $i
done
```

## ライセンス

このスクリプトはPsycleプロジェクトの一部です。
