# Psycle Quality Constitution v0.1

> **目的**: 最高品質のコンテンツを量産するための原則と検証基準

---

## Core Principles（コア原則 10項目）

### 1. 1レッスン1テーマ
- 10秒でできる対処に収束させる
- 複数テーマを混ぜない
- ユーザーが「今日やる1つ」を持ち帰れる構造

### 1.1. 1レッスン1ジョブ
- 各 lesson は 1 行で job を説明できなければならない
- job を言い換えられない lesson は reject
- Core lane / Refresh lane のどちらに属するかを明示する

### 1.2. Done Condition 必須
- 各 lesson は `done_condition` を持たなければならない
- `理解した` ではなく `見分けられる / 選べる / 戻れる / 試せる` で書く
- `done_condition` が job と実質同じなら reject

### 2. 断定表現
- **詳細**: [docs/PRINCIPLES.md](./PRINCIPLES.md) の禁止表現を参照
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

### 3.1. 問数は lesson の重さで決める
- 10問固定を品質条件にしない
- `認知負荷 / 感情負荷 / 行動転換負荷` の合計で密度を決める
- lesson の仕事に対して冗長なら quality fail 扱い

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

### 9. source trace は registry / trace 必須
- `source_id` は registry または trace 可能な source record に存在しなければならない
- 自動運用では `question -> claim_id -> source_span -> review_date` を辿れないものは FAIL
- source 参照だけがあり、claim trace がないものは production 不可

### 9.1. claim_id は必須
- 全 production question は `claim_id` を持つ
- `question -> claim_id -> source_span` が追えないものは FAIL
- source は存在しても claim trace がないものは production 不可

### 10. 品質ゲート
- **FAIL = 0** 必須
- **WARN** は許容リストのみ（例: mental_l03_007 debunking）

### 10.1. 自動運用ゲート
Codex 自動運用前提では、以下を quality gate に含める:
- stale evidence なし
- Tier A/B 以外を lesson の土台にしていない
- `lesson_job / target_shift / takeaway_action` 重複なし
- one lesson one job
- claim trace 完備
- refresh lane の新規 lesson 自動昇格なし

### 10.2. Distinct Learning Value Gate
以下のいずれかが既存 lesson と重複する場合は reject:
- `lesson_job`
- `target_shift`
- `takeaway_action`

同じテーマでも、job / scene / action が変わらない lesson は production 不可。

### 10.2.1. Minimum Novelty Threshold Gate
- Core 新規 lesson が `scene_only_change` になっていないか
- `lesson_job / target_shift / takeaway_action / counterfactual / intervention_path` のいずれも新しくない場合は FAIL

### 10.2.2. Scope Creep Gate
- lesson が `non_goals` を持つか
- lesson が `must_not_expand_into` を侵していないか
- 反芻 lesson が自己否定全般や不安全般に膨らんでいないか

### 10.3. Signal Safety Gate
- `forgetting / avoidance / relapse / transfer_gap` は行動 signal としてのみ扱う
- signal に `signal_confidence` がない resurfacing は FAIL
- low confidence signal を理由に重い resurfacing を出すのは FAIL
- signal を罰や scarcity に使う設計は FAIL

### 10.4. Path-First Gate
- resurfacing が path / core progression の代替になっていないこと
- support candidate は path を壊さず、path に戻すために使われていること
- path があるのに support を常時最上位表示している場合は FAIL

### 10.5. Support Cooldown Gate
- `same_kind_cooldown`
- `same_theme_cooldown`
- `same_parent_lesson_cooldown`
の少なくとも1つが runtime に存在すること
- 同一 support kind の短期連打は FAIL

### 10.6. Outcome Gate
lesson の良さは構造 pass だけでなく、少なくとも以下で評価できること:
- `completion`
- `comeback_after_abandon`
- `transfer_improvement`
- `felt_helpful`
- `repeat_without_dropoff`

### 10.6.2. Metric Gaming Guard
- `completion` だけ高い軽量 lesson を通していないか
- `felt_helpful` だけを取りにいく甘い copy になっていないか
- `streak / xp` のためだけの surfacing になっていないか
- 単一指標改善と引き換えに `transfer_improvement` や `repeat_without_dropoff` を落としていないか

### 10.6.1. Skill Transfer Gate
- transferable skill が別 theme で再利用される設計になっているか
- `theme completion` だけでなく `skill reuse` が path 上で確認できるか

### 10.7. Anti-Farming Gate
- 短い lesson / easy lesson / 無料 resurfacing だけで progress が稼げないこと
- `Return / Adaptive` が主要 XP 導線になっていないこと
- reward / progress が `learning_value` に応じて正規化されていること

### 10.8. Interleaving Gate
- 同一 theme を過密に surfacing していないこと
- interleaving 可能なのに `A -> A -> A` の単調反復になっていないこと
- 同一 support kind の短期連打だけでなく、同一 theme の短期連打も抑制されていること

### 10.9. Support Dosage Gate
- support に週次総量上限があること
- cooldown を抜けただけで support を出し続けないこと
- `weekly_support_budget` を超えても path を押しのけていないこと

---

## Gold Lesson（基準レッスン）

### 選定: `mental_l03`（焦り対処10秒）

**選定理由:**
- Psycleのコア価値（感情調整 × 10秒介入）を体現
- 3つの介入（ラベリング/リアプレイザル/呼吸法）が完備
- 汎用性が高く、他ドメインへの応用が効く
- Local Critic PASS（vocabulary_warn 1件は is_true:false debunking）

**Gold Lesson 構造（例）:**
```text
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

**注意:** これは 10 問 lesson の例であり、全 lesson の固定条件ではない。軽い lesson は 5〜6 問、中程度は 7〜8 問でもよい。

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
lesson の密度に応じて、以下のサイクルが成立しているか:
1. **理解**: 問題/現象を認識させる
2. **選択**: 対処法を提示・選ばせる
3. **実行**: 具体アクションを決定させる
4. **振り返り**: 自分との相性や戻り方を確認する

### Level 4: 感情安全検査
- 罪悪感を煽っていないか
- 羞恥心を刺激していないか
- 「できない自分」を否定していないか
- 「別のアプローチもある」の安全弁があるか

### Level 5: 根拠UI整合
- `EvidenceBottomSheet` のテンプレ文と `explanation` が矛盾していないか
- `source_id` の `type` と `claim_type` が整合しているか

### Level 6: Claim Trace 整合
- 各設問が参照する `claim_id` が存在するか
- `claim_text` と `question/explanation` が意味的に整合するか
- `source_span` がその主張を支えない場合は FAIL

### Level 7: Lane Fit
- Core lane なのに時事ネタ依存になっていないか
- Refresh lane なのに新 unit を増やそうとしていないか
- `研究を見つけた = 新 lesson` になっていないか

### Level 8: Mastery / Replay / Refresh / Return Fit
- Mastery は同テーマでも `job / target_shift / takeaway_action` の少なくとも1つが新しいか
- Mastery は `scene_change | judgment_change | intervention_change | relapse_context | transfer_context` のいずれかを `novelty_reason` として持つか
- Mastery が core lesson の焼き直しになっていないか
- Replay は同一 lesson の再実行として成立しているか
- Refresh は同じテーマでも `job / target_shift / takeaway_action` の少なくとも1つが新しいか
- Refresh は `explanation_update | intervention_update | boundary_update | safety_update | scene_update | evidence_strength_update` のいずれかを `refresh_value_reason` として持つか
- Return は短い再入場として成立しているか
- Adaptive resurfacing は弱点 / 忘却 / 離脱点のどれに対応しているかを説明できるか
- Adaptive resurfacing は `signal_confidence` を持つか
- 同一 session に複数候補を同時表示していないか
- Return が `3〜5問` を超えていないか
- Refresh が evidence_update / intervention_update / scene_update のどれで存在するか説明できるか
- Replay が auto-surface されていないか
- low confidence signal だけで heavy resurfacing を出していないか
- resurfacing が path を押しのけていないか
- `max_active_mastery_slots` を超えて増殖していないか
- `max_concurrent_refresh_candidates` を超えて backlog を膨らませていないか

### Level 9: Long-Term Supply Audit
- テーマごとに `core_count / mastery_count / return_count / refresh_candidate_count` が監査されているか
- `theme_coverage` が監査されているか
- `duplicate_pressure` が放置されていないか
- `repetition_risk` が高いのに lesson 追加で解決しようとしていないか
- `retire_candidates` が放置されていないか
- `mastery_graduation_state` が監査されているか

### Level 10: Retire / Replace / Merge
- stale evidence で更新不能な lesson が放置されていないか
- refresh で実質置換済みの lesson が active のまま残っていないか
- 重複 lesson を retire / merge せず単純追加していないか

### Level 11: Mastery Graduation / Refresh Threshold / Rollback
- Mastery が `attempt_count` だけで卒業扱いされていないか
- `transfer_improvement / repeat_without_dropoff / scenes_cleared_count` のいずれも見ずに Mastery を出し続けていないか
- wording-only change を Refresh 候補にしていないか
- surfacing / reward 施策に `success_metrics` と `rollback_conditions` があるか

### Level 11.1: Theme Entry / Exit / Continuity / Refresh Priority
- theme が `proof_of_supply` や `dependency_fit` なしに core path へ入っていないか
- exit 条件を満たした theme を惰性で core 拡張していないか
- `replace / merge / retire` した lesson に continuity route があるか
- refresh 候補競合時に `safety > intervention > explanation > scene` の順序を壊していないか

### Level 12: False Mastery / Dependency / Saturation
- completion / accuracy だけで mastery 扱いしていないか
- `transfer_improvement` が弱いのに mastery graduation していないか
- dependency を壊す surfacing / path 並びになっていないか
- saturation 済み theme に新規 lesson を足し続けていないか

### Level 13: Claim Usage / Drift / Ceiling / Counterfactual / Re-entry
- claim の使用範囲が `allowed_usage_scopes` を超えていないか
- theme drift が高いのに同一 theme の拡張を続けていないか
- mastery ceiling 到達後に惰性で mastery を足していないか
- `better_choice` に比較対象があり、counterfactual が fear copy になっていないか
- `Return / Adaptive` が punitive copy / tone / framing になっていないか
- 強い研究同士の conflict を無視して断定していないか
- lesson が `non_goals` を破って scope creep していないか

#### Level 8 FAIL 例

- `mastery_without_new_learning_value`
- `mastery_is_core_rewrite`
- `repeat_lesson_but_longer`
- `refresh_without_new_learning_value`
- `return_teaches_new_concepts`
- `multiple_resurfacing_candidates_visible`
- `adaptive_surface_without_trigger_reason`
- `adaptive_surface_without_signal_confidence`
- `low_confidence_signal_overrides_path`
- `signal_used_as_punishment`
- `refresh_without_value_reason`
- `mastery_without_novelty_reason`
- `support_surface_without_cooldown`
- `mastery_slots_unbounded`
- `refresh_backlog_unbounded`
- `stale_lesson_not_retired`
- `duplicate_lesson_not_merged`
- `return_or_adaptive_used_for_farming`
- `theme_surface_without_interleaving`
- `mastery_without_graduation_rule`
- `refresh_without_real_update`
- `runtime_change_without_rollback`
- `support_budget_ignored`
- `false_mastery_graduated`
- `theme_dependency_broken`
- `theme_extended_after_saturation`
- `claim_usage_scope_violated`
- `theme_drift_ignored`
- `mastery_added_after_ceiling`
- `better_choice_without_counterfactual`
- `return_or_adaptive_feels_punitive`
- `core_lesson_without_real_novelty`
- `lesson_scope_creeped_into_adjacent_theme`
- `evidence_conflict_ignored`
- `skill_not_reused_cross_theme`
- `theme_entered_core_without_entry_criteria`
- `theme_stayed_core_after_exit_condition`
- `lesson_replaced_without_continuity_route`
- `metric_single_optimized_at_cost_of_learning`
- `lower_priority_refresh_beat_safety_refresh`

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
