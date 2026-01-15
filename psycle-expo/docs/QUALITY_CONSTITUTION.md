# Psycle Quality Constitution v0.1

> **目的**: 最高品質のコンテンツを量産するための原則と検証基準

---

## Core Principles（コア原則 10項目）

### 1. 1レッスン1テーマ
- 10秒でできる対処に収束させる
- 複数テーマを混ぜない
- ユーザーが「今日やる1つ」を持ち帰れる構造

### 2. 断定禁止
- **NG**: 必ず/絶対/最も/これが正解/~べき
- **例外**: debunking設問（is_true:false）のみ許容
- **OK**: 傾向がある/可能性がある/報告されている

### 3. 介入は4点セット必須
claim_type: intervention の設問には以下が必須:
```json
{
  "try_this": "具体的な10秒アクション",
  "tiny_metric": { "before_prompt", "after_prompt", "success_rule", "stop_rule" },
  "comparator": { "baseline", "cost" },
  "fallback": { "when", "next" }
}
```

### 4. 観察/理論は因果断定しない
- `observation`: 関連が報告されている（因果ではない）
- `theory`: 仮説/枠組みとして提案されている（検証途上あり）

### 5. best_for / limitations 必須
- 刺さる人・刺さらない人を明示
- 「万人向け」は原則NG

### 6. explanation は短く
- 2〜3文以内
- 長い説明は `expanded_details` へ移動

### 7. 選択肢は現実的
- ふざけた誤答禁止
- 「現実に選ばれうる」選択肢のみ

### 8. 停止条件を常に用意
- 悪化/不快 → 即撤退OK
- `stop_rule` で明示

### 9. source_id は registry 必須
- `curated_sources.json` に存在するIDのみ
- Local Critic で FAIL 検証

### 10. 品質ゲート
- **FAIL = 0** 必須
- **WARN** は許容リストのみ（例: mental_l03_007 debunking）

---

## Gold Lesson（基準レッスン）

### 選定: `mental_l03`（焦り対処10秒）

**選定理由:**
- Psycleのコア価値（感情調整 × 10秒介入）を体現
- 3つの介入（ラベリング/リアプレイザル/呼吸法）が完備
- 汎用性が高く、他ドメインへの応用が効く
- Local Critic PASS（vocabulary_warn 1件は is_true:false debunking）

**Gold Lesson 構造:**
```
Q1: 導入（共感獲得）      - swipe  
Q2: 介入A紹介             - mcq + try_this  
Q3: 理論補強              - swipe  
Q4: 介入B紹介             - mcq + try_this  
Q5: 個人差確認            - conversation  
Q6: 介入C紹介             - mcq + try_this  
Q7: 限界説明              - swipe (debunking)  
Q8: 選択促し              - mcq  
Q9: アクション決定        - conversation + try_this  
Q10: フィット確認         - conversation  
```

---

## Gold Lesson Rubric（採点基準）

### 文字数レンジ（目安）

| フィールド | 最小 | 最大 | 備考 |
|-----------|------|------|------|
| `question` | 35字 | 90字 | 状況描写含む場合は120字まで許容 |
| `explanation` | 60字 | 140字 | 超える場合はexpanded_detailsへ |
| `actionable_advice` | 20字 | 60字 | 💡含む、即実行可能な1文 |
| `try_this` | 15字 | 50字 | 10秒で完了する具体アクション |
| `citation_role` | 10字 | 40字 | 出典がこの主張をどう支持するか |

### 介入設問（intervention）必須フィールド

```json
{
  "try_this": "必須：10秒で完了する具体アクション",
  "tiny_metric": {
    "before_prompt": "必須：実施前の状態確認（0-10 or 高/中/低）",
    "after_prompt": "必須：実施後の状態確認",
    "success_rule": "必須：成功判定基準",
    "stop_rule": "必須：撤退条件"
  },
  "comparator": {
    "baseline": "必須：何もしない場合との比較",
    "cost": "必須：時間/負荷の明示"
  },
  "fallback": {
    "when": "必須：この介入が合わない条件",
    "next": "必須：代替アクション"
  }
}
```

### Tone禁止→言い換え表（10例）

| ❌ 禁止（断定） | ✅ 言い換え（hedging） |
|---------------|----------------------|
| 必ず効果がある | 効果が報告されている傾向がある |
| 絶対に改善する | 改善の可能性が示唆されている |
| 最も効果的 | 効果が報告されている方法の一つ |
| これが正解 | 有効とされる選択肢の一つ |
| 〜すべき | 〜すると良い傾向がある |
| 科学的に証明 | 研究で支持されている |
| 全員に効く | 多くの人で効果が見られた |
| 間違いなく | 可能性が高い |
| 完全に | 大きく/かなり |
| 〜はダメ | 〜は逆効果になることがある |

### 「10秒」の定義

10秒で完了できる行動カテゴリ:

| カテゴリ | 例 |
|---------|-----|
| **言語化** | 「焦ってるな」と心の中で呟く |
| **呼吸** | 4秒吸って4秒吐く × 1回 |
| **身体** | 顎の力を抜く / 肩を落とす |
| **認知** | 「断っているのは依頼で相手じゃない」と思い出す |
| **フレーズ** | 「今は決められない」と言う |
| **確認** | 「本当に今必要？」と自問する |

**10秒ルール:**
1. タイマー不要で完了できる
2. 特別な道具・環境を必要としない
3. 中断しても安全（途中でやめてOK）
4. 合わなければ即撤退できる

---

## Quality Critic（品質チェック層）

> Local Critic（構造チェック）の上位層。Gold Lessonレベルを保証。

### Level 1: 重複検査
- 同じ主張が複数設問で繰り返されていないか
- 同じ例え/メタファーが再利用されていないか
- 同じ結論フレーズの使い回しがないか

### Level 2: ペーシング検査
- easy → medium → hard の自然な流れ
- 介入は3問目以降に集中（1-2問目は導入）
- 最終2問は振り返り/選択系

### Level 3: 学習効果検査
10問で以下のサイクルが成立しているか:
1. **理解**: 問題/現象を認識させる（Q1-2）
2. **選択**: 対処法を提示・選ばせる（Q3-6）
3. **実行**: 具体アクションを決定させる（Q7-9）
4. **振り返り**: 自分との相性を確認（Q10）

### Level 4: 感情安全検査
- 罪悪感を煽っていないか
- 羞恥心を刺激していないか
- 「できない自分」を否定していないか
- 「別のアプローチもある」の安全弁があるか

### Level 5: 根拠UI整合
- `EvidenceBottomSheet` のテンプレ文と `explanation` が矛盾していないか
- `source_id` の `type` と `claim_type` が整合しているか

---

## 許容 WARN リスト

| Question ID | WARN Type | 理由 |
|-------------|-----------|------|
| mental_l03_007 | vocabulary_warn | is_true:false debunking（「必ず」を否定） |

---

## Release Gate コマンド

```bash
npm run verify:curated
```

**Pass条件:**
1. Local Critic: FAIL = 0
2. WARN は許容リストのみ
3. 全 source_id が registry に存在
4. （将来）Quality Critic PASS

---

## バージョン履歴

| Version | Date | 変更内容 |
|---------|------|----------|
| v0.1 | 2026-01-06 | 初版作成。Core Principles 10項目、Gold Lesson選定、Quality Critic設計 |
