# 統合パイプライン 最終レポート

**実行日時**: 2025年（システム日付）
**パイプライン**: 学術ソース収集 → 品質監査 → 作問生成

---

## 📊 1) 収集件数サマリ

### ソース別集計

| ユニット | PubMed | Europe PMC | 総件数 | 抄録有 |
|---------|--------|------------|--------|--------|
| mental  | 50     | 0          | 44     | 44     |
| money   | 50     | 0          | 45     | 45     |
| work    | 50     | 0          | 49     | 49     |
| health  | 50     | 0          | 41     | 41     |
| social  | 50     | 0          | 39     | 39     |
| study   | 50     | 0          | 44     | 44     |
| **合計** | **300** | **0**    | **262** | **262** |

### 主要指標

- **初回取得**: 300件（各ユニット50件 × 6）
- **重複排除後**: 286件（除外14件）
- **ban語フィルタ後**: 262件（除外24件、除外率8.4%）
- **抄録付き**: 262件（100%）
- **年次範囲**: 2015-2025年
- **優先タイプ**: RCT, meta-analysis, systematic review

**⚠️ Europe PMC**: 全ユニットで0件（API制限またはクエリ不一致の可能性）

---

## 🔍 2) 品質監査ハイライト

### 除外理由 Top 5

| 順位 | ban語 | 除外件数 | 除外理由 |
|-----|-------|---------|---------|
| 1   | pediatric | 13件 | 小児対象（成人対象に限定） |
| 2   | infant | 5件 | 乳児対象（成人対象に限定） |
| 3   | children under | 4件 | 児童対象（成人対象に限定） |
| 4   | animal | 3件 | 動物実験（humans限定） |
| 5   | ventilator | 1件 | 集中治療特化（一般介入に限定） |

### フィルタ戦略の改善

**初回実行**（問題あり）:
- 除外率: 88%（287件→35件）
- 主な除外: "rat" 241件、"ICU" 61件
- 問題: 動物実験が大量混入

**改善後**（最終版）:
- 除外率: 8.4%（286件→262件）
- PubMedクエリに追加: `NOT (animals[mh:noexp] OR rats[mh] OR mice[mh])`
- ban語調整: スペース付きで誤検出回避（" rat " など）
- ICUを除外リストから削除（臨床介入研究も有用）

---

## 📝 3) 作問件数表

### ユニット別内訳

| ユニット | 総問題数 | MCQ（4択） | T/F（2択） | 難易度分布 |
|---------|----------|-----------|-----------|-----------|
| mental  | 12       | 8         | 4         | easy:4, med:4, hard:4 |
| money   | 12       | 8         | 4         | easy:4, med:4, hard:4 |
| work    | 10       | 7         | 3         | easy:3, med:4, hard:3 |
| health  | 12       | 8         | 4         | easy:4, med:4, hard:4 |
| social  | 12       | 8         | 4         | easy:4, med:4, hard:4 |
| study   | 12       | 8         | 4         | easy:4, med:4, hard:4 |
| **合計** | **70**   | **47**    | **23**    | **easy:23, med:24, hard:23** |

### 出典タイプ分布

- **meta-analysis**: 約40%（高信頼性）
- **RCT**: 約35%（因果推論可能）
- **systematic review**: 約15%（包括的レビュー）
- **other**: 約10%

### 問題形式の特徴

**MCQ（4択）**:
- 正答: 抄録から抽出した事実
- distractor1: 数値変更（1.4倍）
- distractor2: 方向性反転（increased→decreased）
- distractor3: 汎用誤答（"有意な差は認められなかった"）

**True/False**:
- True: 原文そのまま
- False: 方向性を反転させた命題

**難易度基準**:
- easy: T/F問題、other研究
- med: MCQ、RCT研究
- hard: MCQ、meta-analysis/systematic review

---

## ✅ 4) 目標達成状況

### ユニット別目標達成

| ユニット | 目標（最低） | 実績（抄録有） | 達成率 | 作問数 |
|---------|------------|--------------|--------|--------|
| mental  | 6件        | 44件         | ✅ 733% | 12問   |
| money   | 6件        | 45件         | ✅ 750% | 12問   |
| work    | 6件        | 49件         | ✅ 817% | 10問   |
| health  | 6件        | 41件         | ✅ 683% | 12問   |
| social  | 6件        | 39件         | ✅ 650% | 12問   |
| study   | 6件        | 44件         | ✅ 733% | 12問   |

**🎉 全ユニット目標達成**（最低6件 → 平均43.7件）

---

## 📁 5) 出力ファイル

### データファイル

1. **`data/sources.json`** (262件)
   - 各ソースに `unit`, `pmid`, `doi`, `abstract`, `year`, `study_type`, `include_hits`, `ban_hits` を含む
   - 重複排除・ban語フィルタ適用済み

2. **`data/questions/mental.jsonl`** (12問)
3. **`data/questions/money.jsonl`** (12問)
4. **`data/questions/work.jsonl`** (10問)
5. **`data/questions/health.jsonl`** (12問)
6. **`data/questions/social.jsonl`** (12問)
7. **`data/questions/study.jsonl`** (12問)

### レポートファイル

- **`REPORT_QUALITY.md`**: 品質監査詳細
- **`REPORT_FINAL.md`**: 本ファイル（統合サマリ）

---

## 🔧 6) 技術詳細

### PubMedクエリ例（mentalユニット）

```
("Breathing Exercises"[MeSH] OR "Heart Rate"[MeSH] OR "Biofeedback, Psychology"[MeSH] OR "Cognitive Behavioral Therapy"[MeSH] OR "Mindfulness"[MeSH])
AND (intervention OR training OR therapy)
AND ("humans"[MeSH Terms])
AND (randomized controlled trial[pt] OR systematic[sb] OR meta-analysis[pt])
AND ("2015"[Date - Publication] : "3000"[Date - Publication])
NOT ("Pulmonary Disease, Chronic Obstructive"[MeSH] OR "Asthma"[MeSH] OR "Dermatitis"[MeSH] OR "Tinnitus"[MeSH] OR case reports[pt] OR animals[mh:noexp] OR rats[mh] OR mice[mh])
```

### フィルタリングロジック

1. **重複排除**: DOI → PMID → normalized title
2. **優先度**: year desc → study_type (meta > systematic > RCT > other)
3. **ban語検出**: 空白付きマッチングで誤検出回避
4. **抄録必須**: `abstract.length > 50`

---

## 🚀 7) 次アクション

### 現状評価

✅ **完了項目**:
- 全ユニット262件の高品質ソース確保
- 70問のMCQ/T/F問題生成
- 厳密な品質監査と重複排除

### 今後の改善提案

1. **Europe PMC統合**:
   - 現在0件 → API呼び出し修正が必要
   - OPEN_ACCESS制限を外したが結果0件
   - 代替: Semantic Scholar APIの検討

2. **問題品質向上**:
   - distractor生成の高度化（現在は単純な数値・方向性変換）
   - ケース問題・数当て問題の追加（現在MCQ/T/Fのみ）
   - rationale（根拠）の充実（現在150字制限）

3. **データ拡充**:
   - 手動キュレーション: メタ分析の引用文献抽出
   - 日本語文献の追加（J-STAGE, CiNii）
   - 2015年以前の重要文献の追加

4. **ユニット別最適化**:
   - mentalユニット: emotion regulationの強化
   - moneyユニット: financial decision makingの追加
   - workユニット: remote work関連の追加

---

## 📈 8) 統計サマリ

### 処理効率

- **API呼び出し**: 6ユニット × 2ソース = 12回
- **重複排除**: 14件（4.7%）
- **ban語除外**: 24件（8.4%）
- **最終採択率**: 87.3%（300件 → 262件）
- **作問成功率**: 100%（全ユニット10-12問生成）

### 研究年次分布

- 2025年: 約60%
- 2024年: 約25%
- 2023年以前: 約15%

（最新のエビデンスを優先的に収集）

---

## 🎯 結論

**統合パイプラインは成功裏に完了しました。**

- **262件の高品質学術ソース**を収集
- **70問の出典付きMCQ**を生成
- **全6ユニット**で目標（最低6件）を大幅に上回る成果

データは `data/sources.json` および `data/questions/*.jsonl` に保存済みです。
