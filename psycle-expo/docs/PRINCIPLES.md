# Psycle Principles（レッスン作成仕様）

> **🚨 このファイルがレッスン作成仕様の唯一の正本です**  
> **ルール本文は、このファイル以外に書くことを禁止します**  
> **他のファイルで独自ルールを追加・変更することは許可しません**

---

## 📋 基本構造

### Quick Reference Index

- `生成 / content generation`
  - lesson job / novelty / refresh / mastery / evidence / claim trace
- `runtime`
  - support surfacing / fallback precedence / dependency integrity / lifecycle
- `analytics`
  - contract versioning / continuity / threshold / rollback
- `ops`
  - readiness / promotion / deprecation SLA / kill switch / migration
- `localization`
  - semantic parity / tone guard / localization owner

この index は読み始めの導線であり、本文のルールを置き換えない。

### Term Glossary

- `theme`
  - recurring pain を束ねる上位まとまり。runtime / manifest / analytics の単位。
- `unit`
  - 実装上は theme とほぼ同義で扱う lesson 群のまとまり。
- `lesson`
  - 1 job / 1 done condition を持つ最小学習単位。
- `variant`
  - 同じ theme 内で job や scene を変えた派生 lesson。特に mastery / refresh で使う。
- `package`
  - lesson + evidence + continuity + manifest link + analytics / readiness metadata の運用単位。
- `continuity`
  - replace / merge / retire 時に旧 lesson から新 lesson へ履歴・route をつなぐ契約。
- `aftercare`
  - continuity 後に legacy candidate cleanup や analytics 監視を行う期間とルール。
- `fallback`
  - lesson / support / package が通れない時に user を安全に戻す route。
- `support`
  - main path の代替ではなく、return / adaptive / refresh / replay / mastery の補助導線。
- `readiness`
  - package を staging から production へ上げるための運用状態。

### Curriculum Lanes

- **Core Lane**: recurring pain（繰り返し起きる困りごと）から組む本体カリキュラム
- **Mastery Lane**: 同じテーマを別 scene / 別判断 / 別現実応用で深める変奏レーン
- **Refresh Lane**: 新しい研究・知見で既存 lesson / unit を更新する補助レーン
- **新しい研究を見つけた = 新 lesson を作る** ではない
- 新規 lesson 化より先に「既存 lesson の説明・介入・Evidence Grade を改善できるか」を確認する

### レッスン構成
- **5-Phase Structure** 必須
- **1 lesson = 1 job**（10秒で言える学習目的）
- **1 lesson = 1 done condition**（終わった時に何ができれば十分かを1行で言える）
- **時間目安**: 2-3分で完了
- **問数**: lesson の重さに応じて可変

### Lesson Done Condition

各 lesson は、job と別に **done condition** を持たなければならない。

- `この lesson が終わった後、ユーザーが何をできるようになれば十分か`
- `理解した` ではなく `見分けられる / 選べる / 戻れる / 試せる` で書く
- done condition を1行で書けない lesson は設計未完了として扱う

例:
- `反芻と整理を見分けられる`
- `次に取る小さい行動を1つ選べる`
- `失敗した時に戻る問いを1つ持てる`

### 問数ルール（固定しない）

- 軽い lesson: **5-6問**
- 中程度 lesson: **7-8問**
- 重い lesson: **9-10問**
- **問数より lesson の仕事を優先**する
- 10問固定を前提に内容を引き伸ばすことを禁止する

### Lesson Load Score

各 lesson は以下の3軸を **1-3点** で採点する:

- **認知負荷**: 比較・抽象化・証拠整理がどれだけ必要か
- **感情負荷**: 恥・不安・後悔・防衛反応をどれだけ触るか
- **行動転換負荷**: 理解ではなく選択変更まで求めるか

合計点で問数レンジを決める:

| 合計 | 推奨問数 |
|------|---------|
| 3-4 | 5-6問 |
| 5-6 | 7-8問 |
| 7-9 | 9-10問 |

### Unit Emotional Arc

unit は lesson の寄せ集めではなく、感情の波を持つ。

- **入りやすい**: 自責を増やさず、すぐ始められる
- **少し深くなる**: 観察・理解・切り分けを増やす
- **行動に移る**: 選び方を少し変える
- **軽く閉じる**: 再発しても戻れる感覚で終える

unit 設計では、重い lesson を連打してはならない。

### Phase構成

| Phase | 目的 | 必須 |
|-------|------|------|
| 1. Hook | 共感を引く | |
| 2. What | 現象を認識させる | |
| 3. Why | 原理を理解させる | |
| 4. How | 実践シミュレーション | **必須** |
| 5. Anchor | 振り返り・定着 | |

**注意**:
- 5 phase の骨格は固定する
- 各 phase の厚みは lesson の重さに応じて変えてよい
- phase を満たすためだけの冗長問題を追加してはならない

### Phase 4 ルール（Better Choice）

**Phase 4（How）では「正解/不正解」を使わない。**

| 禁止 | 推奨 |
|------|------|
| 「正解！」「不正解」 | 「Better Choice」「Recommended」 |
| 「○」「×」 | 「いい選択だね」「こっちの方が後悔が少ないかも」 |
| 赤/緑のジャッジ色 | ニュートラルな表現 |

---

## 🎯 コンテンツ原則

### 1. Life-Scene First

**問題の主語は「心理学原理」ではなく「ユーザーの生活シーン」**

| 禁止（原理ベース） | 推奨（シーンベース） |
|--------------------|---------------------|
| 「返報性の原理とは...」 | 「断れない飲み会に誘われた時...」 |
| 「サンクコスト効果について」 | 「もう見たくない映画、途中で出る？」 |
| 「損失回避バイアスを説明せよ」 | 「今の彼氏/彼女、別れるのが怖い？」 |

### 1.1. Distinct Learning Value

同じテーマを扱うこと自体は許容する。禁止するのは **同じ学習価値の重複** である。

以下のいずれかが既存 lesson と重複する場合は reject する:
- `lesson_job`
- `target_shift`
- `takeaway_action`

同じテーマを続ける時は、少なくとも以下のいずれかを変える:
- `scene`
- `job`
- `持ち帰る行動`
- `phase の重心`

### 1.1.1. Minimum Novelty Threshold

新規 Core lesson でも、`scene だけ違う` では不十分である。

少なくとも以下のいずれかが新しくなければならない:
- `lesson_job`
- `target_shift`
- `takeaway_action`
- `counterfactual`
- `intervention path`

見た目だけ違って学習価値が同じ lesson は reject する。

### 1.1.2. Scope Creep Guard

1 lesson の途中で、隣接テーマまで広げてはならない。

- `lesson_job` に加えて `non_goals` を持つ
- 反芻 lesson が自己否定全般や不安全般まで膨らまないようにする
- 論点が広がった場合は、同一 lesson 内で救済せず split 候補に送る

### 1.5. Lesson-Worthiness Scoring

ネタは「面白い」ではなく「lesson にする価値」で採用する。

各 candidate は以下を **1-3点** で採点する:
- **pain**: 実生活の困りごとが明確か
- **recurrence**: 一回ネタではなく繰り返し起きるか
- **actionability**: lesson 後に選び方が変わるか
- **evidence_strength**: 十分な根拠が集まるか
- **novelty**: 既存 lesson と重複しすぎていないか

判定:
- **12以上**: lesson 候補
- **9-11**: backlog
- **8以下**: 破棄

### 1.6. Mastery / Replay / Refresh / Return

Psycle は `新 lesson を増やし続ける` ことで尽きなさを作らない。

- **Mastery**: 同じテーマを別 scene / 別判断 / 別応用で深める lesson
- **Replay**: 同じ lesson をもう一度やる
- **Refresh**: 同じテーマを別の問い・別の scene で再学習する
- **Return**: 崩れた時に戻る短い再入場 lesson
- **Adaptive resurfacing**: 忘却・弱点・離脱点に応じて resurfacing する

新しい研究を見つけた時は、まず `Refresh` または既存 lesson 更新を検討する。

#### Signal Confidence

`forgetting / avoidance / relapse / transfer_gap` は、心理状態の断定ではなく **行動ログから推定する signal** として扱う。

- **low confidence**: 軽い resurfacing 候補化にのみ使う
- **medium confidence**: path を塞がない範囲で優先度調整に使う
- **high confidence**: `Return / Adaptive / Refresh / Replay` の順序決定に使ってよい

弱い signal だけで重い resurfacing を押し込んではならない。

#### Non-Punitive Signal Rule

state signal は **罰** に使ってはならない。

禁止:
- signal を理由に energy cost を増やす
- signal を理由に paywall を深くする
- signal を理由に streak を剥奪する
- signal を理由に reward を減らす

許可:
- `Return / Adaptive / Refresh / Replay` の選定補助
- 軽い再入場の優先提示
- path に戻す最短導線の提示

#### Runtime Invariants

- **Mastery** は `core unit 完了後` にのみ候補化する。未完了 unit の代替にしない。
- **Mastery** は `同一テーマ` に属しつつ、既存 core lesson と `job / target_shift / takeaway_action` の少なくとも1つが異なること。
- **Mastery** は `同テーマを別価値で返す` ためのものであり、同じ結論の焼き直しにしてはならない。
- **Mastery** は `scene_change | judgment_change | intervention_change | transfer_context | relapse_context` のいずれか1つを **novelty reason** として明示できなければならない。
- **Mastery** は `実在する mastery lesson inventory` がある時だけ候補化する。存在しない `lesson_id` を runtime で仮置きしない。
- **Mastery** は runtime で `theme_id` ごとの inventory から供給し、`retired variant` を再活性化しない。
- **Mastery** は progression の唯一の本線にしない。core progression を塞がない。
- **Replay** は `user-initiated` のみ。自動で core progression に差し込まない。
- **Replay** は `同一 lesson_id` を再実行する。新規 lesson 扱いにしない。
- **Refresh** は `同一テーマ` に属しつつ、既存 lesson と `job / target_shift / takeaway_action` の少なくとも1つが異なること。
- **Refresh** は `core lesson 完了後` にのみ候補化する。未完了 lesson の代替にしない。
- **Refresh** は `explanation_update | intervention_update | boundary_update | safety_update | scene_update | evidence_strength_update` のいずれか1つを **refresh value reason** として明示できなければならない。
- **Refresh** は `実質更新` がある時だけ候補化する。wording-only / cosmetic-only の差分を Refresh 扱いしない。
- **Refresh** は `既存 lesson 差し替え` と `新規 refresh variant` を混同しない。どちらかを明示できない候補は reject する。
- **Return** は `短い再入場` であり、core lesson の完全代替にしない。
- **Return** は `3〜5問` を上限とし、`落ち着く / 思い出す / 再開する` 以外の仕事を持たない。
- **Adaptive resurfacing** は `弱点 / 忘却 / 離脱点` のいずれか1つに対応していることを明示できなければならない。
- 同一 session で `Replay / Refresh / Return` を複数同時に押し出さない。提示は常に **1つ** に絞る。
- **Mastery** はテーマごとに `active mastery slots` の上限を持つ。上限超過時は追加ではなく `統合 / 置換 / retire` を優先する。
- **Refresh** はテーマごとに `concurrent refresh candidates` の上限を持つ。 backlog を無限に積まない。

#### Path-First Progression

- 基本の本線は常に **path / core progression** である
- resurfacing は path を壊すためではなく、**path に戻すため** に存在する
- `Return / Adaptive / Refresh / Replay` は、core progression より常に強く出してはならない
- resurfacing が path の代替になり始めたら設計失敗として扱う
- 同一 kind / 同一 theme / 同一 parent lesson の resurfacing には cooldown を設ける
- cooldown 中は別 kind が必要条件を満たさない限り再 surfacing しない

#### Runtime Trigger Rules

- **Mastery**
  - `core unit 完了後`
  - かつ `inventory に未retireの mastery variant が存在する`
  - かつ `scene / judgment / relapse / transfer` のいずれかで学習価値を増やせる時のみ候補化する
  - 主目的は `知っている -> 使える` への変換であり、新テーマ導入に使わない
- **Replay**
  - user が完了済み lesson を明示的に再実行した時のみ開始する
  - 主目的は復習であり、`進行の代替` にしない
- **Refresh**
  - 既存 lesson を完了済み
  - かつ evidence 更新, scene 追加, intervention 更新のいずれかがある
  - かつ core lesson と学習価値が重複しない
  - かつ `replace existing lesson` か `add refresh variant` のどちらかを決められる
- **Return**
  - lesson 中断が連続2回以上
  - もしくは完了前離脱後に一定時間再開なし
  - もしくは同テーマで迷いが続く明確な弱点シグナルがある
- **Adaptive resurfacing**
  - `weakness_score + forgetting_score + abandonment_score` の合計が閾値以上の時のみ候補化する
  - resurfacing 候補は `core > return > refresh > replay` の順でなく、**最小介入で戻せるものを優先** する

#### Reject Rules

- `また同じ内容` にしか見えない Mastery / Replay / Refresh / Return は作らない
- Mastery を `Core の薄い言い換え` に使わない
- Mastery を `新 unit を作れない時の水増し` に使わない
- Refresh を `新研究が出たから新 lesson` の逃げ道に使わない
- Return に新しい知識や重い intervention を詰め込まない
- Adaptive resurfacing を連続表示して user を追い立てない
- low confidence signal だけで重い resurfacing を出さない
- signal を punish / scarcity / shame の材料に使わない

#### Retire Rule

lesson は足し続けるだけではなく、下げる条件を持たなければならない。

retire 候補:
- stale evidence で更新不能
- `job / target_shift / takeaway_action` が新しい lesson と重複
- repetition risk が高い
- refresh によって実質置換済み

retire は削除だけを意味しない。`archive / replace / merge` を含む。

#### Lesson Replacement Continuity

`replace / merge / retire` は content の都合だけで行ってはならない。

最低限:
- 旧 lesson の完了履歴が孤立しない
- 旧 lesson の support / resurfacing が後継 lesson に自然接続する
- 「消えたから最初からやり直し」にならない
- 旧 lesson をやったユーザーにも `next best step` が明示される
- `replaced_by_lesson_id | merged_into_lesson_id` を持つ
- `support_redirect_rule` を持つ
- `analytics continuity` を壊さない

content 更新より、学習連続性を優先する。

#### Replacement Aftercare

置換した瞬間に終わりではない。旧 lesson に紐づく state を安全に畳む後始末が必要である。

最低限:
- 旧 lesson 由来の support candidate を stale のまま再 surfacing しない
- 途中ユーザーには `restart | continue_to_replacement | return_then_rejoin` のどれで送るかを決める
- 旧 mastery / refresh variant が残っている場合は cleanup rule を持つ
- aftercare 期間中は `legacy lesson` と `replacement lesson` の analytics を並行監視する

置換後の aftercare rule が書けない content 変更は promote しない。

#### Continuity Mode Decision Rule

`net_new / replace / merge / retire` は名前ではなく、既存ユーザー履歴への影響で決める。

- `net_new`
  - predecessor lesson を持たない
  - 既存完了履歴の移管を要求しない
  - support / analytics continuity を要求しない
- `replace`
  - 学習仕事は近く、主導線を新 lesson に引き継ぐ
  - 完了履歴 / support redirect / analytics continuity を引き継ぐ
- `merge`
  - 複数 lesson の仕事を 1 lesson / 1 package に統合する
  - 複数 predecessor と重い history migration を持つ
- `retire`
  - 後継 lesson を必須としない終了
  - runtime route が `null` になり得るので cleanup と fallback route を必須にする

以下を言えない変更は promote しない:
- `履歴を引き継ぐ必要があるか`
- `support redirect が必要か`
- `複数 predecessor か`
- `runtime route を残すか消すか`

### 1.7. Long-Term Supply Audit

`理論上尽きない` ではなく、`実在庫として尽きない` ことを監査する。

各テーマごとに定期的に以下を確認する:
- `Core` の本数
- `Mastery` の本数
- `Return` の本数
- `Refresh` 候補の本数
- `theme coverage`
- 重複圧 (`job / target_shift / takeaway_action`)
- `また同じ内容` に見える repetition risk

theme coverage は少なくとも以下を含む:
- `core_coverage`
- `mastery_coverage`
- `return_coverage`
- `refresh_readiness`

供給監査で `Mastery / Refresh` の新しさが弱い場合は、lesson を足すのではなく設計を修正する。
強いテーマだけが太り、弱いテーマが放置される状態を許可しない。

#### Theme Entry / Exit Criterion

theme は明確な入口条件と出口条件を持つ。

**entry 条件**
- `recurring pain` が明確
- dependency が満たせる
- `Core / Mastery / Return / Refresh` の最低供給見込みがある
- 既存 theme に吸収されない固有の learning value がある

**exit 条件**
- core coverage が十分
- marginal core value が低い
- saturation または repetition risk が高い
- 以後は `Mastery / Refresh` 中心で維持した方がよい

theme を core path に入れたら惰性で残し続けない。

### 1.8. Outcome Metric

良い lesson は `作れた lesson` ではなく、**user state を前に進めた lesson** である。

最低限追うべき outcome:
- `completion`
- `comeback_after_abandon`
- `transfer_improvement`
- `felt_helpful`
- `repeat_without_dropoff`

content の評価は、構造 pass だけで完了とみなしてはならない。

#### Metric Gaming Guard

単一指標の最適化を禁止する。

禁止:
- `completion` だけを上げるために lesson を薄くする
- `felt_helpful` だけを取りにいく甘い copy に寄せる
- `XP / streak / comeback` だけを稼ぐ support を優先する

判断は少なくとも以下の束で行う:
- `completion`
- `felt_helpful`
- `transfer_improvement`
- `repeat_without_dropoff`
- `comeback_after_abandon`

### 1.9. Anti-Farming Principle

短い lesson / easy lesson / 無料 resurfacing だけを回して最適化される構造を許可しない。

- `XP / reward / progress` は lesson の短さではなく **learning value** で正規化する
- `Return / Adaptive` は救済であって、主要な稼ぎ導線にしてはならない
- 同一 theme / 同一 kind の短い lesson 反復だけで progression が進みすぎる設計は reject する

### 1.10. Mastery Graduation Rule

Mastery は無限に回すものではなく、**卒業条件** を持つ。

卒業条件の例:
- 複数 scene で安定して通る
- `transfer_improvement` が見える
- `repeat_without_dropoff` を満たす

`何回やったか` だけで Mastery 完了を判定してはならない。

runtime 上は最低限、以下を保持する:
- `active_variant_ids`
- `retired_variant_ids`
- `scene_ids_cleared`
- `graduation_state`
- `mastery_ceiling_state`

各 mastery variant 完了時は最低限:
- 当該 variant を `retire` する
- `attempt_count` を進める
- `scene_ids_cleared` を更新する
- `repeat_without_dropoff / repetition_risk` を再評価する

`graduated` または `ceiling_reached` になった theme は、未処理の active variant を惰性で残さない。

### 1.10.1. False Mastery Rule

`完了した` と `使える` は別である。

- completion が高くても `transfer_improvement` が弱いなら mastery 扱いしない
- accuracy が高くても現実 scene で崩れるなら mastery 扱いしない
- `わかったつもり` を graduation に含めない

### 1.10.2. Mastery Ceiling Rule

Mastery は無限に足せば強くなるものではない。

- `new_learning_value_delta` が低い
- `transfer_gain_slope` が鈍い
- `repetition_risk` が高い

場合は、追加より `Refresh / merge / next theme` を優先する。

`尽きないように見せるための水増し mastery` を禁止する。

### 1.10.3. Mastery Supply Contract

Mastery は `理論上ある` ではなく、**実在する lesson 在庫** によって供給されなければならない。

- Core lesson の file / id は `*_lNN` を使う
- Mastery lesson の file / id は `*_mNN` を使う
- runtime は `theme_id` から利用可能な `*_mNN` を列挙して slot に流す
- inventory に存在しない mastery lesson は surfacing しない
- retired 済み `*_mNN` は同一 theme 内で自動再活性化しない

### 1.10.3.1. Mastery Lesson Authoring Contract

Mastery lesson は `Core の焼き直し` ではなく、`戻り方・見分け方・移し方` を少し前進させる変奏でなければならない。

最低限:
- question id は `{theme}_mNN_NNN` を使う
- `novelty_reason` を 1 つ持つ
- `done condition` は `再発ゼロ` ではなく `早く気づける / 戻る一手を選べる / 別 scene に移せる` で書く
- lesson 内に少なくとも 1 つは `transfer` か `re-entry` を問う prompt を入れる
- same conclusion を wording だけ変えて繰り返す構成を禁止する

禁止:
- Core lesson の scene だけを差し替えて再出荷する
- `完全に起きなくなる` を mastery の success condition にする
- inventory を埋めるためだけの薄い mastery を作る

### 1.10.4. Support Analytics Invariant

support / mastery surfacing は runtime だけでなく analytics でも一貫していなければならない。

- surfaced 時は最低限 `shown` を記録する
- 起動時は最低限 `started` を記録する
- `Mastery` は `support` として surfaced されても、`core progression` の置換として集計しない
- analytics がない support rule は、仕様として未完了扱いにする

### 1.10.5. Support Dosage Rule

support は `親切` であって `本線の代替` ではない。

- `weekly budget` を持ち、同一 user に短期間で出しすぎない
- `same kind / same theme / same lesson` には cooldown を持つ
- weak signal では軽い support に留め、重い resurfacing を連打しない
- support の表示最適化で core path completion を落としてはならない

failure 条件:
- support だけで progress farming が起きる
- same theme の support 連打で path が見えなくなる
- short support completion だけが KPI を押し上げる

### 1.10.6. Support Success / Failure Threshold

support は `なんとなく効いていそう` では足りない。success / failure の閾値を先に持つ。

最低限:
- `path_start_guardrail`
- `path_completion_guardrail`
- `support_repeat_cap`
- `support_only_progress_cap`
- `support_start_rate_floor`

を明示し、未設定のまま運用しない。

判定原則:
- support surfacing を増やして `path start / completion` が guardrail を割ったら failure
- same-theme support repeat が cap を超えたら overdose
- support 起動率が floor を割るのに表示だけ増えるならノイズ
- short support 完了だけ伸びて transfer / comeback が伸びないなら farming 疑い

threshold は観測用ではなく action を引くために使う。

- `path_start_guardrail` を割る
  - support surfacing を即減らす
  - current theme の support priority を 1 段下げる
- `path_completion_guardrail` を割る
  - support weekly budget を tighten する
  - `return` 以外の resurfacing を一時抑制する
- `same_theme_support_repeat_rate` が cap 超過
  - same-theme cooldown を延長する
  - low-confidence candidate を suppress する
- `support_only_progress_share` が cap 超過
  - support 起点の reward / progression を見直す
  - path-first CTA を強制する
- `support_started / support_shown` が floor 未満
  - noisy support kind を backlog に戻す
  - trigger 条件か copy を見直す

failure が出ても action が決まっていない policy は未完成と扱う。

### 1.11. Theme Dependency Rule

theme は独立ラベルではなく、**前提と出口** を持つ progression 単位である。

- 各 theme は `dependency_themes` を持てる
- dependency 未充足の theme を core path へ早出ししない
- dependency 未充足の `Mastery / Refresh` を先に surfacing しない
- `A theme の理解がないと B theme の価値が薄い` 場合は、B を先に深掘りしない

theme を増やす前に、dependency が runtime で守れるかを確認する。

### 1.11. Interleaving Rule

同じテーマを連打しすぎない。

- path 上で同一 theme を過密に並べない
- resurfacing でも `same_theme_cooldown` と別に、**他 theme を挟む余地** を持つ
- `A -> A -> A` の単調反復より、`A -> B -> A` のように混ぜることを優先する

### 1.11.1. Theme Dependency Map

path 順序は感覚で決めず、theme 間の依存関係を持つ。

- 各 theme は `prerequisite themes / prerequisite skills` を持つ
- dependency を満たしていない theme を path 上で先行させない
- surfacing でも dependency を壊す提示をしない

### 1.11.2. Skill Transfer Rule

ある theme で得た skill は、別 theme に持ち越せるものとして設計する。

例:
- `ラベルをつける`
- `証拠を見る`
- `小さい行動を選ぶ`

は単発 lesson の知識ではなく、cross-theme で再利用される skill として扱う。

path 全体は、theme の列ではなく transferable skill の積み上げとしても監査する。

### 1.11.3. Dependency Metadata Schema

dependency rule は文章だけでなく、runtime / generator が読む canonical schema を持つ。

canonical source:
- `data/themes/{theme_id}.meta.json`

最低限:
- `theme_id`
- `prerequisite_themes`
- `prerequisite_skills`
- `unlock_conditions`
- `dependency_bypass_rules`
- `replacement_aftercare_defaults`

dependency 情報を lesson 個別 file に分散させない。theme 単位の single source of truth を持つ。

### 1.11.3.1. Dependency Enum Contract

`unlock_conditions` と `dependency_bypass_rules` は自由記述にしない。allowed enum から選ぶ。

最低限の許可値:
- `unlock_conditions`
  - `core_path_available`
  - `prerequisites_completed`
  - `theme_manifest_active`
  - `inventory_available`
  - `manual_release_window_open`
- `dependency_bypass_rules`
  - `none`
  - `human_reviewed_migration`
  - `safety_hotfix`
  - `kill_switch_recovery`
  - `experiment_override`

enum 外の値を production manifest に入れてはならない。

### 1.11.4. Theme Manifest Required Fields

theme manifest は dependency だけでなく、運用状態も持つ。

最低限:
- `owner`
- `last_reviewed_at`
- `review_cycle_days`
- `rollout_stage`
- `saturation_state`
- `theme_status = active | deprecated | archived`

theme が production に存在するのに、owner・last reviewed at・review cycle が不明な状態を許可しない。

### 1.11.5. Theme Manifest Versioning

theme manifest は固定 schema ではなく、変更に耐える versioning を持つ。

最低限:
- `schema_version`
- `migration_rule`
- `backward_compat_window`

schema_version なしの manifest を production に置かない。
破壊的変更は silent 読み替えで吸収せず、migration を明示する。
最低限の migration playbook:
- migrate 順は `theme manifest -> continuity metadata -> content_package -> runtime loader/validator`
- 新 version を読む loader が先に入る前に production data を切り替えない
- `backward_compat_window` 経過後は旧 version を reject し、warn-only で残さない
- `migration-required` は staging で fail-close、production_default では promote 不可とする
- rollback 時は data と loader の version pair を同時に戻す

### 1.12. Refresh Eligibility Threshold

新研究が出ただけでは Refresh にしない。

以下のいずれかで **実質的な改善** がある時のみ Refresh 候補にする:
- explanation が変わる
- intervention が変わる
- safety boundary が変わる
- scene の理解が広がる
- evidence strength が実際に上がる

小さい言い換えや cosmetic update は Refresh にしない。

#### Refresh Conflict Priority

Refresh 候補が複数ある時は、以下の順で優先する。

1. `safety_update`
2. `intervention_update`
3. `explanation_update`
4. `scene_update`

下位候補を先に通す時は、上位候補を後回しにする明確な理由が必要。

### 1.12.1. Theme Retirement by Saturation

theme は無限に太らせない。

以下を満たす時は、新規追加停止を優先する:
- coverage は十分
- refresh 価値は低い
- repetition risk は高い

この状態では `新規追加` より `merge / replace / retire` を優先する。

### 1.12.2. Theme Drift Detector

同一 theme の中で lesson が広がりすぎ、別テーマ化していないかを監視する。

- もとの recurring pain から主題がずれていないか
- `lesson_job / target_shift / takeaway_action` が別テーマ寄りになっていないか
- 本来 split すべき lesson が同一 theme に押し込まれていないか

drift がある場合は、`split / merge / retire` を優先する。

### 1.12.3. Override Authority

原則が強いほど、例外を誰が開けるかも固定する。

override を許可するのは最低限:
- `refresh priority` を逆転させる時
- `dependency bypass` を入れる時
- `theme saturation` でも追加を通す時

override には必ず:
- `reason`
- `owner`
- `timebox`
- `rollback condition`

を持たせる。理由 없는恒久 override は許可しない。

### 1.12.3.1. Localization Parity Fail Criteria

localization は copy 翻訳ではなく意味一致を要求する。

以下は fail:
- `claim strength` が base locale より強くなる、または弱くなり actionable meaning が変わる
- `shame / threat / blame` tone が任意 locale にだけ混入する
- `better choice` wording が命令調や断罪調に変質する
- safety boundary, contraindication, fallback wording の欠落または意味反転

pass 条件:
- `semantic_parity_rule` を満たす
- `localization_owner` が parity basis を説明できる
- locale 間で lesson outcome と support route が変わらない

### 1.12.4. Policy Precedence

原則同士が衝突した時は、優先順位を固定する。

上から順に優先:
1. `safety boundary`
2. `evidence / claim traceability`
3. `continuity / aftercare`
4. `dependency integrity`
5. `kill switch / rollback`
6. `path-first progression`
7. `support rescue / dosage optimization`
8. `experiment preference`

例:
- `support rescue` が有効でも `dependency` を壊して先出ししない
- `refresh` 価値が高くても `continuity` が未完成なら promote しない
- `experiment` 中でも `kill switch` 条件を上書きしない

### 1.13. Observability / Rollback

新しい surfacing / reward / lesson 設計を入れる時は、最初から
- 何が改善したか
- 何が悪化したら戻すか
を持つ。

`計測できない改善` と `戻せない変更` は原則として避ける。

### 1.13.1. Promotion Readiness Gate

`staging -> production` は品質 pass だけで通してはならない。

最低限:
- `quality gate pass`
- `dependency valid`
- `continuity complete`
- `analytics wired`
- `rollback defined`

を満たしたものだけを promote する。

どれか1つでも欠けるなら、`動く` ではなく `未昇格` として扱う。

### 1.13.2. Experiment Boundary

experiment は原則を全部壊してよい免罪符ではない。

実験でも破ってはならないもの:
- safety boundary
- claim traceability
- analytics continuity
- dependency を壊す恒久 path

実験で一時的に緩めてよいもの:
- surfacing 順序
- dosage threshold
- copy
- rollout scope

実験には必ず:
- `hypothesis`
- `success metric`
- `failure condition`
- `rollback date`

を持たせる。

### 1.13.3. Deprecation SLA

deprecated / replaced lesson は永遠に互換維持しない。

最低限:
- `deprecation_start_at`
- `compatibility_window_days`
- `cleanup_due_at`
- `migration_complete_condition`

を持ち、期限内に cleanup されなければ backlog ではなく failure として扱う。

### 1.13.4. Emergency Kill Switch

異常時は議論より先に止められなければならない。

最低限 stop できる単位:
- `theme`
- `support kind`
- `refresh lane`
- `promotion pipeline`

kill switch には必ず:
- `trigger_condition`
- `owner`
- `restore_condition`
- `fallback_user_route`

を持たせる。

### 1.13.4.1. Kill Switch Granularity

kill switch は `全部止める` だけでは弱い。局所停止できる粒度を固定する。

最低限:
- `theme`
- `support kind`
- `refresh lane`
- `analytics event family`
- `promotion pipeline`

原則:
- support の copy / CTA 問題は `support kind` 単位で止められる
- refresh contamination は `refresh lane` 単位で止められる
- analytics contract 異常は lesson 本体を壊さず `event family` だけ止められる
- pipeline 異常は新規 promote を止めても既存 production route は維持する

`最小停止単位がないから theme 全停止する` をデフォルトにしない。

### 1.13.5. Analytics Metric Ownership

metric はあるだけでは足りない。誰が見るかも固定する。

最低限:
- `metric_owner`
- `review_cadence`
- `change_authority`
- `threshold_change_log`

owner 不在の guardrail は、原則上 `未管理` として扱う。

### 1.13.5.1. Readiness Authority

`content_package.readiness` は単なる boolean ではなく、更新権限を持つ契約である。

- `quality_gate_pass`
  - primary owner: `content_ops`
  - auto source: deterministic gate / validator
  - final true 化: approved source のみ
- `dependency_valid`
  - primary owner: `runtime`
  - auto source: manifest / dependency validator
  - manual override: approved bypass のみ
- `continuity_complete`
  - primary owner: `content_ops`
  - auto source: continuity schema / aftercare validator
  - final true 化: predecessor / redirect / analytics continuity が揃った時のみ
- `analytics_wired`
  - primary owner: `analytics`
  - auto source: event contract / naming check
  - final true 化: shown-started-completed continuity が確認できた時のみ
- `rollback_defined`
  - primary owner: `content_ops`
  - auto source: rollback metadata 存在チェック
  - final true 化: rollback route と owner が揃った時のみ

`誰が true にしたか` を追えない readiness flag は production readiness と見なさない。

### 1.13.5.2. Review Authority Matrix

変更種別ごとに required assurance を固定する。

high-assurance autonomous decision 必須:
- `safety_update`
- `dependency_bypass`
- `replace / merge` continuity migration
- `threshold` 変更
- `kill switch restore`

approved source のみで auto-true を許可してよいもの:
- `quality_gate_pass`
- `dependency_valid`
- `analytics_wired`
- `rollback_defined`

reject rule:
- high-assurance 変更なのに `approved_source / review_reason / reviewed_at / rollback_trigger_if_reverted` がない decision を有効と扱わない
- threshold change は `before / after / reason / rollback trigger` がない限り無効

### 1.13.5.2.1. Autonomous Evidence Scaffold Defaults

自動 scaffold が出す初期値は、production path で使うなら最初から運用契約に沿っていなければならない。

最低限:
- `status=active`
- `review.auto_approved=true`
- `review.approval_mode=autonomous`
- `review.reviewer=system`
- `promotion.eligible=true`
- `content_package.owner_id=content_ops`
- `content_package.state=production`、staging path では `staging`
- `rollback_class=soft`
- `analytics_contract_id` と `analytics_contract_version` を初期値として持つ

scaffold が `draft / approval missing / readiness false` のまま production package を作ることを許可しない。

### 1.13.5.3. Localization Authority

`localized_copy_ready` は翻訳有無ではなく、意味一致の承認である。

最低限:
- `localization_owner`
- `approval_locale_set`
- `semantic_parity_rule`
- `tone_guard`

fail 条件:
- `ja / en / fr` で claim の強さがズレる
- shame を抑えていた locale が別 locale で責め口調になる
- `better choice` が locale ごとに命令 / 脅しに変質する

copy の自然さより、`意味と安全性の一致` を優先する。

### 1.13.6. Validation Ownership Matrix

validation は `誰かが見るだろう` にしてはならない。責務を先に固定する。

最低限:
- `generator` は blueprint / novelty / claim usage boundary を検証する
- `runtime` は dependency / surfacing / cooldown / dosage を検証する
- `analytics` は shown-started-completed continuity と guardrail を検証する
- `content ops` は promotion / deprecation / SLA / manifest hygiene を検証する

同じ検証を複数層が持ってよいが、**primary owner** が不明な状態は許可しない。

### 1.14. Support Dosage Rule

support は正しくても **出しすぎるとノイズ** になる。

- `Return / Adaptive / Replay / Refresh / Mastery` には週単位の総量上限を持つ
- cooldown が切れていても、support 総量が過多なら path を優先する
- support は `必要だから出す` のであり、常時提示するものではない

### 1.14.1. Re-entry Dignity Rule

`Return / Adaptive` は補修ではあるが、失敗者向けの罰ゲームに見せてはならない。

- 遅れた感
- 劣っている感
- やり直しさせられている感

を copy / reward / UI で作らない。

再入場は `自然な次の一歩` として扱う。

### 2. Evidence Grade

信頼性に応じて固定テンプレを使う。**一字一句変えない。**

### 2.2. Claim Usage Boundary

同じ claim でも、使ってよい範囲は固定しない。

- `fact`
- `explanation`
- `intervention`

は別物として扱う。

強い claim でも介入にそのまま飛ばしてよいとは限らない。弱い evidence は `explanation` や `try_this` の補助に留め、断定的 intervention に使わない。

### 2.3. Counterfactual Coverage

`Better Choice` を教える lesson は、比較対象も持つ。

- 何もしない場合
- 別の選び方をした場合
- 放置した場合に起きやすいこと

を脅しではなく比較対象として扱う。

これにより、`なぜその選択が better か` を説明できるようにする。

### 2.4. Evidence Conflict Rule

強い研究同士で結論が割れている時は、無理に一枚岩の答えにしない。

- 不確実性を明示する
- intervention は弱める
- 断定的な fact tone を避ける
- `Refresh` 候補か `conflict_review` 候補に送る

`片方だけ採用して強く言い切る` を原則禁止にする。

#### 🥇 Gold（メタ分析/複数RCT）
> 複数の研究結果をまとめた分析で、
> 一貫した傾向が確認されています。
> 個人差はありますが、現時点で最も信頼度が高い知見です。

#### 🥈 Silver（単一RCT/大規模調査）
> この知見は、
> ・最初は実践や臨床の現場で使われ
> ・その後、同様の効果が何度も確認され
> ・今も心理支援の現場で使われています。

#### 🥉 Bronze（パイロット/観察研究）
> 初期段階の研究で示唆されています。
> 今後さらなる検証が必要ですが、
> 試してみる価値はありそうです。

**Evidence Grade は「レッスン完了画面」のみで表示する。**

### 2.1. Claim-First Evidence

Evidence は **source 単位** ではなく **claim 単位** で扱う。

各 claim に最低限必要な項目:
- `claim_id`
- `claim_text`
- `source_id`
- `source_type`
- `evidence_grade`
- `source_span` または `direct_quote_span`
- `review_date`
- `allowed_usage`

各問題は、使っている主張を `claim_id` で追跡できなければならない。

#### Evidence Grade 定義詳細

**🥇 Gold Grade 基準:**
- メタ分析（複数研究の統合分析）
- システマティックレビュー
- 複数のRCT（ランダム化比較試験）で一貫した結果
- Cochrane Review等の高品質レビュー

**🥈 Silver Grade 基準:**
- 単一のRCT（ランダム化比較試験）
- 大規模観察研究（n>1000）
- 査読済み学術論文
- 複数の小規模研究で一貫した結果

**🥉 Bronze Grade 基準:**
- パイロット研究
- 小規模観察研究
- 予備的研究結果
- 理論的枠組みに基づく仮説

**⚠️ 重要:** `source_type` が "book" または "classic" の場合、`evidence_grade` は通常 Silver 以下が適切です。書籍や古典的研究でGoldを付与する場合は特別な理由が必要です。

#### Source Tier（自動運用前提）

- **Tier A**: systematic review / meta-analysis / umbrella review / guideline
- **Tier B**: preregistered RCT / replication / strong longitudinal
- **Tier C**: observational / cross-sectional / single small study
- **Tier D**: narrative summary / heuristic / commentary

自動運用では以下を原則とする:
- **Tier A/B のみ**を lesson の土台に使う
- **Tier C/D** は補助・仮説・試す視点としてのみ使う
- 因果主張は Tier A/B なしで断定しない

#### 追跡可能性（Citation Trackability）

**全Evidence Cardは以下のいずれか1つ以上の追跡可能な引用情報が必須:**
- **DOI** (Digital Object Identifier)
- **PMID** (PubMed ID)  
- **ISBN** (書籍の場合)
- **公式URL** (政府機関・学術機関の公式サイト)

**例:**
- 学術論文: DOI または PMID
- 書籍: ISBN
- 政府レポート: 公式URL
- 古典的研究: DOI（再版論文）または ISBN（書籍版）

#### Safety Harbor（安全な表現）

**ユーザー表示面でも以下の安全な表現を使用:**
- 「〜の可能性がある」
- 「〜が報告されている」  
- 「〜に役立つかもしれない」
- 「〜という傾向が見られる」
- 「個人差があります」

#### Evidence Tier ごとの口調

- **Tier A/B**
  - 事実寄りの説明をしてよい
  - ただし `必ず / 確実に / 絶対に` は禁止
  - `〜という傾向がある / 〜が支持されている` を使う
- **Tier C/D**
  - 事実断定に使ってはならない
  - `〜かもしれない / こう見る視点がある / 試す価値はある` に落とす
  - lesson の土台ではなく補助・refresh・heuristic として扱う

**医療・治療に関する表現は一切使用禁止。**

### 2.2. Evidence Drift

科学知見は変わることを前提とする。

- 各 claim は `review_date` を持つ
- 強い断定を伴う claim ほど短い見直し周期を持つ
- stale な claim は production で使ってはならない

### 2.2.1. Stale Evidence SLA

stale evidence は抽象警告ではなく、期限と処置を持つ。

最低限:
- Tier A/B claim は `review SLA days` を持つ
- SLA 超過時は `auto_hide | auto_demote | refresh_queue` のどれに送るか決める
- 強い intervention claim ほど短い SLA を持つ

期限切れ evidence を `あとで直す` で production に残さない。

stale evidence は `古い` で終わらせず、運用先を固定する。

- `auto_hide`
  - safety / medical / legal に近く、古いまま表示すると危険
- `auto_demote`
  - lesson 本体からは外すが、補助・heuristic としては残せる
- `refresh_queue`
  - learning value は高く、更新すれば再利用価値がある

最低限:
- stale 判定 tier を持つ
- `review_sla_days` 超過時の route を 1 つに決める
- route 先の owner を持つ
- `refresh_queue` に送るなら `refresh_value_reason` 候補も持つ

### 2.2.1.1. Stale Evidence Severity Tiers

stale evidence は一律扱いにしない。claim の強さで tier を分ける。

最低限:
- `Tier A`
  - safety / intervention / behavioral prescription
  - stale 時は原則 `auto_hide`
  - 最短 review cycle を持つ
- `Tier B`
  - mechanism / explanation / bounded recommendation
  - stale 時は `auto_demote` か `refresh_queue`
  - 中間 review cycle を持つ
- `Tier C`
  - framing / reflection / low-risk explainer
  - stale 時は `refresh_queue` を基本にする
  - 最長 review cycle を持つ

高リスク claim を低リスク explainer と同じ stale policy で扱わない。

### 2.2.2. Content Package Contract

production に上げる最小単位は lesson JSON 単体ではなく package である。

package に最低限含むもの:
- `lesson`
- `evidence`
- `theme_manifest_link`
- `continuity metadata`
- `analytics wiring`

この束が揃わないものは content ではなく未完成 asset として扱う。

### 2.2.2.1. Package Completeness Rule

`package がある` だけでは足りない。production package は運用完全体でなければならない。

最低限:
- `localized_copy_ready`
- `analytics_contract_named`
- `rollback_route_present`
- `owner_assigned`
- `readiness_authority_complete`

reject rule:
- locale 1つだけ意味がズレる package を complete とみなさない
- analytics event 名が未固定の package を promote しない
- owner 不在の package を staging から出さない
- rollback route が theme top に丸投げなだけの package を complete とみなさない

### 2.2.2.1.1. Analytics Contract Versioning

analytics contract は id だけでなく versioning を持つ。

最低限:
- `analytics_contract_id`
- `analytics_contract_version`
- `analytics_schema_lineage`
- `analytics_backward_compat_until`

旧 package が旧 contract を使う時でも、互換期限なしで放置しない。
version を上げる時は dual-emit 期間と `analytics_backward_compat_until` をセットで持ち、互換期限を過ぎた旧 contract を production default のまま残さない。
最低限の migration playbook:
- `vN -> vN+1` は `dual_emit_start_at` を持つ
- `production_default` package は dual-emit 期間中のみ `vN` と `vN+1` を並行 emit してよい
- `production_limited / staging` は新 contract のみでよい
- `analytics_backward_compat_until` 到達後は `vN` emit を止め、旧 contract しか持たない package を default surfacing に残さない
- 移行失敗時は fail-open ではなく `production_limited` か `staging` に落とす

### 2.2.2.1.2. Package Dependency Graph

theme dependency に加えて package dependency も持てる。

最低限:
- `package_dependencies.requires_package_ids`
- `package_dependencies.dependency_rule`
- `package_dependencies.invalidation_rule`

`refresh / mastery` package が依存元 package を失った時に、dependency graph なしで production に残してはならない。
runtime は surfacing / direct launch の両方で依存先 package の lifecycle を再評価し、依存先が `production` でない、または runtime access を失っている package を `dependency_unmet` として suppress する。
dependency 喪失後の aftercare:
- 依存先 package が `killed` なら依存元 package も `hard rollback` 候補にする
- 依存先 package が `deprecated / retired` なら依存元 package は `refresh_queue` か `deprecated` に送る
- 依存先 package が stale / review overdue / dependency unmet なら依存元 package は `production_default` から外し `production_limited` か `refresh_queue` に送る
- dependency を失った package を support candidate のまま残さない

### 2.2.2.2. Package Lifecycle States

package は file の集合ではなく state machine として扱う。

最低限:
- `draft`
- `staging`
- `production`
- `deprecated`
- `killed`

遷移原則:
- `draft -> staging`
  - package shape と dependency が揃っている
- `staging -> production`
  - readiness と completeness が揃っている
- `production -> deprecated`
  - continuity / aftercare / cleanup plan がある
- `production -> killed`
  - safety, analytics, evidence, or ops incident で即時停止

state を飛ばして promote / retire しない。
metadata 必須条件を state ごとに変える。

### 2.2.2.3. Rollback Action Classes

rollback は 1 種類ではない。戻し方の class を固定する。

最低限:
- `soft_rollback`
  - surfacing を止めるが asset は保持する
- `hard_rollback`
  - route と candidate を production から外す
- `analytics_only_rollback`
  - lesson 本体は維持し、event emission だけ止める

原則:
- copy / CTA / dosage 異常はまず `soft_rollback`
- safety / evidence contamination は `hard_rollback`
- event naming / duplication / threshold bug は `analytics_only_rollback`

rollback route は class なしで定義しない。

### 2.2.2.4. Cross-File Consistency Rules

`theme manifest / content package / continuity / evidence` は別 file でも、同じ state を指さなければならない。

最低限:
- `theme_status=deprecated` の theme に、新規 `package.state=production` を増やさない
- `theme_status=archived` の theme に `staging / production` package を残さない
- `package.state=killed` の lesson に active support をぶら下げない
- `continuity_mode=retire` の package を `production default` 扱いしない
- `severity_tier=A` で stale の package を `production` に残さない
- `review_cycle_days` 超過かつ `rollout_stage=production_default` の theme に support を出さない

単体 file だけ valid でも、相互矛盾があれば invalid と扱う。

### 2.2.2.4.1. Support / Package Coupling

support runtime は package lifecycle を無視してはならない。

最低限:
- `package.state != production` の lesson を support candidate にしない
- `theme_status != active` の theme を support candidate にしない
- `prerequisite_themes` 未充足の theme を support candidate にしない
- `severity_tier=A` かつ stale package を support candidate にしない
- `review_cycle_days` 超過かつ `rollout_stage=production_default` の theme を support candidate にしない

### 2.2.2.4.2. Support Lifecycle State

support は単発 event ではなく lifecycle state を持つ。

最低限:
- `shown`
- `started`
- `completed`
- `suppressed`
- `killed`

同じ candidate を `shown` のまま重複生成せず、`shown -> started` を state 遷移として扱う。
`shown|started` の support が runtime guard で invalid になった場合は `killed` に遷移し、`course_support_killed` を emit して stale support を残さない。

### 2.2.2.4.3. Support / Package State Mapping

support lifecycle と package state は別フィールドで持ちつつ、解釈は 1 枚で揃える。

最低限:
- `package.state=production` かつ theme active かつ dependency valid の時だけ `shown -> started -> completed` を許可する
- `shown|started` の途中で package / theme / dependency が invalid になったら `killed` に送る
- stale / review overdue / dosage / cooldown で止める時は `suppressed` に送る
- `deprecated` package は新規 `shown` を許可しない
- `killed` package は新規 `shown` を許可せず、既存 `shown|started` も `killed` に遷移させる

`suppressed` は一時停止、`killed` は runtime access の喪失として扱う。

### 2.2.2.5. Autonomous Ops SLA Matrix

人手介入なし運用では、期限超過時の自動 route を先に固定する。

最低限:
- `next_review_due_at` 超過
  - `Tier A`: `auto_hide`
  - `Tier B`: `auto_demote` or `refresh_queue`
  - `Tier C`: `refresh_queue`
- `cleanup_due_at` 超過
  - `deprecated` package は `hard_rollback` 候補に送る
- `review_cycle_days` 超過
  - theme manifest は `production_limited` へ降格候補にする
- `compatibility_window_days` 超過
  - legacy continuity route を failure backlog ではなく cleanup queue に送る

SLA を超えても state が変わらない運用を許可しない。
alert/action table の最低限:
- `Tier A stale` または `package_killed` は `kill switch` か `hard rollback`
- `review_cycle_days` 超過の `production_default` は `production_limited`
- `dependency_unmet` が継続する package は `refresh_queue`、閾値超過で `deprecated`
- `analytics threshold breach` は `analytics_only_rollback` か `production_limited`

### 2.2.2.5.1. Runtime Fallback Precedence

fallback reason が複数同時に成立する時は、runtime が優先順位を固定して扱う。

最低限:
- `package.state=killed`
- `continuity_mode=retire`
- `theme_status != active` または dependency unmet
- `severity_tier=A` かつ stale
- `package.state != production`
- `review_cycle_days` 超過の `production_default`

下位の理由で上位理由を上書きしない。
route 決定の原則:
- `package_killed` は `hard rollback` か emergency fallback route を優先する
- `continuity_retired` は continuity metadata の `fallback_user_route` を優先する
- `dependency_unmet` は launch せず `refresh_queue / return_then_rejoin / theme top` の順で許可 route を選ぶ
- `theme_not_active` は theme top か replacement route に戻す
- `tier_a_stale / package_not_production / theme_review_overdue` は silent continue を許可せず `production_limited` 扱いの route に落とす

### 2.2.2.5.2. Route Table Summary

`fallback / rollback / refresh_queue` は別々の命名で増殖させず、同じ route table を参照して使う。

最低限:
- `package_killed` は `hard rollback` を第一候補、失敗時のみ emergency fallback route
- `continuity_retired` は continuity metadata の `fallback_user_route`
- `dependency_unmet` は `refresh_queue -> return_then_rejoin -> theme top`
- `theme_not_active` は `replacement route -> theme top`
- `tier_a_stale / package_not_production / theme_review_overdue` は `production_limited -> refresh_queue`

runtime / analytics / ops で別名 route を作らない。

### 2.3. Failure / Fallback

Psycle の lesson は、`できなかった時にどう戻るか` を必ず持つ。

- `失敗 = 観察の材料` に変換する
- 自責を増やす wording を禁止する
- intervention lesson には `fallback` を必須にする
- `試して合わなかった時の次の一歩` を残さずに終えてはならない

## 品質レポート管理

**生成レポートポリシー:**
- `docs/_reports/` は機械生成物のため git 管理対象外
- レポートは CI artifact として保存・参照する
- ローカル開発では `npm run content:preflight` で最新レポート生成
- レポート内容の永続化が必要な場合のみ手動コミット

**対象レポート:**
- `lesson_inventory.md` - レッスン棚卸し
- `bronze_assertion_warnings.md` - Bronze断定表現警告
- `evidence_grade_inflation.md` - Evidence Grade インフレ警告
- `citation_trackability.md` - 引用追跡可能性
- `evidence_specificity.md` - Evidence薄さ警告
- `claim_alignment.md` - Claim整合性警告

## Non-Goals

この仕様が `やらないこと` も固定する。

- `scene だけ変えた lesson` を新規 learning value とみなさない
- `support` を core progression の代替 main path にしない
- `warn-only` のまま `production_default` を維持しない
- cosmetic update を `refresh` とみなさない
- continuity / aftercare 未完了の replace / merge を promote しない
- dependency を壊したまま launch / surfacing を続けない
- locale ごとの tone 差分を「翻訳ゆれ」として見逃さない
- `verification_staleness.md` - Evidence鮮度警告（D-pack）
- `citation_format.md` - 引用形式エラー（D-pack）
- `needs_review.md` - 要再監査ステータス（D-pack）

## Evidence 鮮度管理（D-pack）

**自動劣化検知システム:**
- `last_verified` フィールドによる期限管理
- 365日超過: WARNING（再検証推奨）
- 730日超過: FAIL（要再検証）
- 科学は変わることを前提とした自動監視

**引用形式検証:**
- DOI: `10.` で始まる形式必須
- PMID: 数値のみ必須
- ISBN: ISBN-10/13形式必須
- URL: `http://` または `https://` 必須
- 全引用情報が空欄の場合は警告

**ステータス管理:**
- `status: active` - 現在有効で使用中
- `status: draft` - 作業中、未承認
- `status: needs_review` - 人間による再監査が必要
- `status: deprecated` - 無効、使用禁止
- `needs_review` ステータスは preflight で警告表示

### 3. 禁止表現（Vocabulary Hygiene）

#### FAIL（公開禁止）

| 表現 | 理由 |
|-----|------|
| 治る/治療できる/治療法 | 医療行為に該当 |
| 必ず/確実に/絶対/100% | 効果を保証 |
| 〜と証明された/科学的に確定 | 科学プロセスの誤解 |
| 人生が変わる/劇的に改善 | 誇大広告 |

#### WARN（要レビュー）

| 表現 | 推奨置換 |
|-----|---------|
| 高い効果 | 効果が報告されている |
| 多くの研究 | 複数の研究 |
| 一般に〜される | 〜と言われることがある |
| 効果的 | 役立つ可能性がある |

### 4. 文字数制限

- **Explanation**: 2-3行以内
- **問題文**: 具体的なディテールを2つ以上含む
- **選択肢**: 簡潔に

### 5. Evidence Card必須

**全レッスンにEvidence Cardが必要**
- ファイル名: `{lesson_name}.evidence.json`
- 本番配置条件は `approved gate` とする
- Codex 自動運用では、以下の自動 gate を全通過させる:
  - claim trace 完備
  - stale evidence なし
  - `lesson_job / target_shift / takeaway_action` 重複なし
  - one lesson one job
  - refresh lane の新規 lesson 自動昇格なし

### 6. 追跡可能性（Citation Trackability）

**監査に耐える引用の追跡可能性を確保**
- **追跡可能** = DOI or PMID or ISBN or 公式URL のいずれか1つ必須
- **book/classic** source_typeは DOI/PMID が無いケースがあるため ISBN/URL でOK
- **peer_reviewed** source_typeは DOI/PMID を優先、無ければ公式URL
- **systematic/meta** source_typeは DOI必須（例外なし）

---

## 🔄 運用モード

### Mode A 手順（人間が作る）

```bash
# 1. 上記仕様に従ってレッスン作成
# 2. data/lessons/{domain}_units/ に直接配置
# 3. インデックス更新とバリデーション
npm run gen:units
```

**ファイル配置:**
- **本番**: `data/lessons/{domain}_units/{domain}_l{nn}.ja.json`
- **Evidence Card**: `data/lessons/{domain}_units/{domain}_l{nn}.evidence.json`

### Mode B 手順（自動生成）

```bash
# 1. 自動生成（staging配置）
cd scripts/content-generator
npm run patrol

# 2. バリデーション
npm run validate:lessons

# 3. 承認
#    - 自動運用: approved source と自動 gate を全通過

# 4. 昇格
npm run promote:lesson {domain} {basename}
```

**ファイル配置:**
- **staging**: `data/lessons/_staging/{domain}_units/{domain}_l{nn}.ja.json`
- **Evidence Card**: `data/lessons/_staging/{domain}_units/{domain}_l{nn}.evidence.json`

---

## ⚠️ 重要な制約

- **Mode B生成物は本番直入れ禁止** → 必ず staging 経由
- **Evidence Card必須** → レッスンJSONと同名の `.evidence.json` 必須
- **自動運用では claim trace 必須** → `question -> claim_id -> source_span` を追えないものは reject
- **staging配置必須** → Mode B は必ず staging に出力
- **承認ゲート** → approved source または自動 gate 全通過なしに本番配置不可
- **品質チェック必須** → Evidence/品質変更後は `npm run content:preflight` を必ず通す
- **CI必須** → CIが落ちる変更はレビュー前に修正

---

## 📊 Quality Gate（必須）

以下の条件を **1つでも満たさない場合、その問題セットは保存してはならない。**

| # | 失格条件 |
|---|----------|
| 1 | Life-Scene First が守られていない |
| 2 | Phase 4（How）が存在しない |
| 3 | 「正解／不正解」で行動を断定している |
| 4 | 科学的根拠の強度を誤解させる表現がある |
| 5 | `question -> claim_id -> source_span` を追えない |
| 6 | 1 lesson 1 job が崩れている |
| 7 | 説教・一般論・教科書的説明になっている |
| 8 | `lesson_job / target_shift / takeaway_action` が既存 lesson と重複する |
| 6 | Explanation が「別の視点・次に使える問い」ではなく「正解の断定」になっている |

### Fail Fast 原則

> **原則違反が1つでも検出された場合、当該コンテンツは「未完成」として扱い、出力・公開・推薦を行わない。**

**1つでも違反 → 修正必須。保存禁止。**

---

## 🔧 技術仕様

### JSON Schema
```json
{
  "id": "string",
  "type": "swipe_judgment | multiple_choice | select_all | sort_order | conversation",
  "question": "string",
  "domain": "string",
  "difficulty": "easy | medium | hard",
  "xp": "number",
  "explanation": "string (2-3行以内)",
  "actionable_advice": "string | null"
}
```

### Domain（必須）
| Domain | 保存先 |
|--------|--------|
| social | `social_units/` |
| mental | `mental_units/` |
| money | `money_units/` |
| health | `health_units/` |
| study | `study_units/` |
| work | `work_units/` |

**domain未定義 → 保存禁止（Fail Fast）**

---

## 🚨 仕様変更禁止

**このファイルが唯一の正本です。他の場所でルール本文を追加・変更することは禁止します。**

- 疑問があればこのファイルを更新
- 他ドキュメントでの独自ルール追加禁止
- Mode A/B で異なる仕様を作ることは禁止
