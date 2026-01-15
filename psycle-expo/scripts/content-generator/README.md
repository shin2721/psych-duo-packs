# Psycle Content Generator

Psycleレッスンコンテンツを自動生成するためのパイプラインです。

## セットアップ

```bash
cd scripts/content-generator
npm install
cp .env.example .env
# .env を編集して OPENAI_API_KEY を設定
```

## 使い方

### 基本的な使い方

```bash
# 特定のSeedから1問生成
npm run generate -- --seed=seed_001 --type=multiple_choice

# ドメイン指定で複数生成
npm run generate -- --domain=social --count=3

# 難易度指定
npm run generate -- --seed=seed_001 --difficulty=hard
```

### 利用可能なオプション

| オプション | 説明 | 例 |
|------------|------|-----|
| `--seed=` | 特定のSeed IDを指定 | `--seed=seed_001` |
| `--domain=` | ドメインで絞り込み | `--domain=social` |
| `--type=` | 問題タイプを指定 | `--type=swipe_judgment` |
| `--difficulty=` | 難易度を指定 | `--difficulty=easy` |
| `--count=` | 生成数を指定 | `--count=5` |

### 問題タイプ一覧

- `multiple_choice` - 4択問題
- `swipe_judgment` - スワイプ判定
- `select_all` - 複数選択
- `fill_blank_tap` - 穴埋め
- `sort_order` - 並べ替え
- `conversation` - 会話シミュレーション
- `matching` - マッチング
- `quick_reflex` - 瞬発力
- `consequence_scenario` - 結果予測

## ディレクトリ構成

```
scripts/content-generator/
├── seeds/                    # ネタ帳（心理学原理）
│   └── psychology_seeds.json
├── prompts/                  # プロンプト定義
│   └── firefly_persona.md
├── src/                      # ソースコード
│   ├── types.ts              # 型定義
│   ├── generator.ts          # 生成ロジック
│   ├── critic.ts             # 評価ロジック
│   └── pipeline.ts           # メインパイプライン
├── output/                   # 生成結果
├── package.json
└── tsconfig.json
```

## パイプラインの流れ

1. **Seed選択**: `psychology_seeds.json` からネタを選択
2. **Generate**: OpenAI APIで問題を生成
3. **Critic**: 生成された問題を5つの観点で評価
4. **Retry**: 不合格なら最大3回リトライ
5. **Output**: 合格した問題を `output/` に保存

## データソース戦略 (Sourcing Strategy)

高品質なコンテンツを維持するため、以下の3ステップでネタ（Seed）を選定します。

1.  **Discovery (発見)**: 
    - **学術的まとめサイト（Academic Aggregators）**：
        - **The Decision Lab**: 心理学バイアスの網羅的データベース。初手はここから。
        - **ScienceDaily / EurekAlert!**: パレオ氏もチェックする最新の研究プレスリリースサイト。「心理学」「脳科学」カテゴリを巡回する。
        - **Google Alerts**: 特定のキーワード（"Behavioral Economics", "Cognitive Bias"）で新着論文を通知させる。
2.  **Verification (一次情報確認)**:
    - 必ず以下の**信頼できる一次情報源（Trusted Primary Sources）**まで遡って確認する。

    
    ### 📚 推奨データベース & ジャーナル
    
    **A. パレオな男（鈴木祐氏）が愛用するデータベース**
    - **PubMed / MEDLINE**: 医学・生命科学の基本データベース。
    - **Cochrane Library**: システマティックレビューの最高峰。エビデンスレベルが高い。
    - **Google Scholar**: 幅広い分野の論文検索用。

    **B. 行動科学・心理学の主要ジャーナル（Psycle推奨）**
    - **Nature Human Behaviour**: 行動科学のトップジャーナル。
    - **Psychological Science**: インパクトがあり、直感に反する研究が多い。
    - **Journal of Personality and Social Psychology (JPSP)**: 社会心理学のゴールドスタンダード。
    - **PNAS**: 米国科学アカデミー紀要。広範な科学トピックを扱う。
    - **PLOS ONE**: オープンアクセスで多様な研究を収録。

3.  **Seed Creation (種作成)**:
    - 元論文の知見に基づいて `psychology_seeds.json` に登録する。

## 評価基準（Critic）

| 項目 | 説明 |
|------|------|
| Schema Validity | JSONスキーマに準拠しているか |
| Firefly Voice | キャラクターらしい口調か |
| Cultural Safety | 日本文化で違和感がないか |
| Common Sense | 常識と矛盾していないか |
| Aha Factor | 驚き・学びがあるか |

合格条件: 合計35点以上（50点満点）、各項目5点以上
