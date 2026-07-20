# Psycle V2 Generalization Raw Pilots

> Status: `accepted_raw_owner_pilot`
> この文書は owner-only debug 実験の原液である。production lesson、generated JSON、XP、streak、quest、course manifest、外部 analytics へは接続しない。

Fresh critic gate (2026-07-20): `Select 3 / Revise 0 / Reject 0`。これは実装開始のcontent gateであり、学習効果や記事版への優位を証明しない。

## Summary

- Experiment: **同じ研究判断 skill を、AI 以外の3領域でも再利用できるか**
- Shared skill: `claim_boundary_transfer_v1`
- Skill definition: 研究の主張を `対象 / 比較 / 結果 / 時間 / 場面` より大きくせず、未見場面で「直接言える / 小さく試せる / まだ不明」を分ける。
- Selected raw pilots:
  1. 歩行と発想 — `発散 ≠ 収束`
  2. インターリーブ学習 — `練習で選ぶ ≠ 初めて理解する`
  3. 誘惑バンドル — `行動頻度 ≠ 作業品質`
- Positive-value hypothesis: ユーザーが研究結果を覚えるだけでなく、異なる3領域で同じ境界操作を使い、翌日に初見の見出しを監査できれば、短い記事や日常 tip より Psycle を使う理由が生まれる。

## Problem

旧 daily-first lesson は、日常 action を先に渡すため一般的な自己啓発 tip になりやすかった。

新 research-first lesson も、意外な研究を読んで正解を当てるだけなら、短い記事にボタンを付けたものにすぎない。AI Day 1 だけが題材として面白かった可能性も残っている。

この pilot は、画面構造の再利用ではなく **判断 skill の領域横断転移** を検証する。

## Users / Context

- Dラボ、パレオ、Duolingo を日常的に使い、内容の薄さへ敏感な owner
- 研究を鵜呑みにせず、それでも生活で使える最小判断へ変えたい人
- 長い講義ではなく、2〜4分で一つの区別を練習したい人

## Non-Negotiables

- 最初の判断まで10秒以内
- 1画面1判断、7画面、必須の自由記述・キーボードなし
- prediction は採点しない
- boundary / retrieval / unseen transfer は、誤答理由を見せて再回答する
- 正解文だけ長い、慎重、留保が多い構造にしない
- 「必ず / 全員 / 完全に」のような極端語だけで誤答を作らない
- 選択肢の正解位置を3 lessonで分散する
- action は研究で効果実証済みの処方ではなく、低リスクな自己観察または小実験として表示する
- source facts、Psycle の解釈、日常 action を同じ主張として混ぜない
- AI Day 1 の保存、見た目、testID、進行を壊さない

## Scope

- 3本の raw pilot と owner-only runtime
- 共通7画面 shell
- topic / user ごとの端末内進捗
- immediate unseen transfer と最初の誤答記録
- 同じ skill を測る delayed review の仕様
- static article / daily-first を比較対象として固定

## Out of Scope

- production course への昇格
- XP、streak、energy、league、課金
- app 内 LLM、自由入力の送信
- lesson generator、production evidence JSON、監査ルール追加
- 「歩行・混合練習・誘惑バンドルが誰にでも効く」という助言
- completion を学習効果とみなすこと

## Shared Seven-Screen Contract

1. `prediction`: 説明前に直感を1タップで保存
2. `evidence`: 対象・比較・結果・時間・場面を同じ viewport で確認
3. `update`: 予想との差を1タップで更新
4. `boundary`: 見出しが最初に越えた境界を選ぶ
5. `retrieval`: 結果と限界を source なしで再構成
6. `transfer`: 未提示の生活場面で、最も境界を守る判断を選ぶ
7. `complete`: 10秒 field test と次 lesson の問いを確認

各 lesson は同じ arc を使うが、学ぶ誤読は変える。topic 専用 UI が必要なら、共通 shell へ無理に入れず candidate を止める。

---

## Pilot 1 — 歩くと、どの「考える」が変わる？

### Pedagogical Goal

`創造性` を一枚岩として扱わず、候補を広げる発散課題と、正解へ絞る収束課題を区別する。

### Raw insight

「歩くと創造的になる」は半分だけ正しい。

4実験では、歩行中または直後に、物の使い道や比喩を複数生む発散課題の成績が上がった。収束課題を測ったのは実験1だけで、その Remote Associates Test では歩行条件の成績が座位条件より低かった。したがって「創造性全般」や「実務の最終判断」へは広げない。

役に立つのは `歩く / 座る` の万能ランキングではない。

> 候補を増やす時間と、条件で一つへ絞る時間を分ける。

### Source facts

- 対象: 主に大学生・成人、小規模な4実験
- 比較: 座位、屋内歩行、屋外歩行、屋外で車椅子移動
- 結果: 発散的アイデア生成は歩行で改善。実験1の収束課題は歩行で改善せず、座位より低かった
- 時間: 歩行中と直後
- 場面: 短い実験課題。長期の仕事成果や意思決定ではない

Primary source: [Oppezzo & Schwartz (2014)](https://doi.org/10.1037/a0036577)

### Seven screens

1. **Prediction**
   - Scene: 新サービスの候補を増やした後、法務条件で1案に絞る。
   - Prompt: `歩行の効果が出そうなのは？`
   - Options: `候補を増やす / 1案へ絞る / どちらも同じ`
2. **Evidence**
   - Result: `歩行で上がったのは、主に発散課題`
   - Caveat: 実験1の収束課題は改善せず、長期成果や実務の選定精度は測っていない。
3. **Update**
   - Options: `予想より限定的 / ほぼ予想通り / 予想より広かった`
4. **Boundary**
   - Headline: `短い発散課題で改善したので、重要な案を選ぶ精度も上がる`
   - Ask: 最初に入れ替わったものは？
   - Options: `参加者の年齢 / 測った結果 / 歩行の場所`
   - Correct: `測った結果`
5. **Retrieval**
   - Prompt: 研究に最も近い組合せは？
   - Options:
     - `短い発散課題は改善 / 実務の選定精度も改善`
     - `短い発散課題は不変 / 実務の選定精度は未測定`
     - `短い発散課題は改善 / 実務の選定精度は未測定`
   - Correct: 3
6. **Unseen transfer**
   - Synthetic study card: `賃貸検索で並べ替え表示を使った群は、使わない群より20分間に確認した物件数が多かった。最終選択の適合度は測っていない。`
   - Headline: `並べ替え表示は、20分間で自分に合う物件を選ぶ正確さも上げた`
   - Ask: 最初に越えた境界は？
   - Options:
     - `対象: 検索利用者 → 不動産業者`
     - `結果: 確認数 → 選択の適合度`
     - `時間: 20分 → 3か月`
   - Correct: 2
7. **Complete / 10秒 action**
   - `いまの作業を「候補を増やす」か「条件で絞る」のどちらかに10秒で分類する。`
   - Optional self-observation: 候補を増やす段階なら、別の機会に歩行中と座位で候補数だけ比べてもよい。
   - Disclaimer: この自己観察は個人への効果を証明せず、選定精度の改善とも扱わない。

### Reject conditions

- `歩けば頭が良くなる` へ一般化する
- 歩行を最終意思決定の推奨へ変える
- 発散課題の点数を実際の成果品質と同一視する

---

## Pilot 2 — 混ぜる練習は、いつ強い？

### Pedagogical Goal

複数種類を含む **練習で方法を見分ける操作** と、新しい解法を **初めて理解する段階** を区別する。成績差の原因まで一つに決めない。

### Raw insight

同じ型を続ける配置と違い、問題が混ざる配置では、問題ごとに使う方法を見分ける必要がある。

54クラスの中学1年生をクラス単位で無作為に分け、同じ数学問題を blocked または interleaved に並べた研究では、4か月後の復習を経た1か月後の未告知テストで、interleaved 群が高得点だった。

ここから言えるのは、全教科を最初からランダムにすれば理解が速い、ではない。

> 既に授業で扱った複数種類を混ぜる練習は候補にできる。ただし、初学への効果や成績差の単一原因としては扱わない。

### Source facts

- 対象: 米国フロリダ州の Honors Advanced Grade 7 Math の生徒787人、54クラス、5校
- 比較: 同じ数学問題を mostly interleaved または mostly blocked に配置
- 結果: 1か月後の未告知・研究者作成テストで61% 対 38%（d = 0.83）
- 時間: 4か月の課題 + 共通review、その1か月後
- 場面: 授業で扱った複数種類の数学問題。事前テストや「各方法を習得済み」という参加基準はなく、新単元の初回説明だけを検証した研究でもない
- 識別限界: 混合配置は問題ごとの方法識別を要求するが、spacing、retrieval、feedback、time などから成績差の原因を単独で分離していない

Primary source: [Rohrer, Dedrick, Hartwig & Cheung (2020)](https://doi.org/10.1037/edu0000367)

Independent standards review: [What Works Clearinghouse study review](https://ies.ed.gov/ncee/wwc/Study/88770)

### Seven screens

1. **Prediction**
   - Scene: 3種類の公式は単独なら使える。1か月後は問題だけ見て公式を選ぶ。
   - Prompt: `練習問題の並べ方は？`
   - Options: `型ごとに固める / 3種類を混ぜる / 順番は無関係`
2. **Evidence**
   - Result: `混ぜた群は、1か月後の未告知テストで高得点`
   - Caveat: 授業で扱った複数種類の数学問題であり、初回理解や全教科の万能則ではない。得点差の単一原因も確定していない。
3. **Update**
   - Options: `予想より混合が強い / ほぼ予想通り / 予想より固めが強い`
4. **Boundary**
   - Source-shaped claim: `授業で扱った複数種類を4か月練習した中1では、混合群が1か月後の未告知・研究者作成テストで高得点だった`
   - Headline: `まだ教わっていない複数の公式を初めて理解する4か月でも、混合群が1か月後の未告知・研究者作成テストで高得点だった`
   - Ask: 最初に入れ替わったものは？
   - Options: `学習段階: 練習 → 初学 / 結果: 得点 → 学習時間 / 対象: 中学生 → 大学生`
   - Correct: `学習段階: 練習 → 初学`
5. **Retrieval**
   - Prompt: 配置から直接必要になった操作と、研究が確定していないものの組合せは？
   - Options:
     - `問題ごとに方法を見分ける / 成績差の単一原因`
     - `公式を初めて理解する / 1か月後の得点差`
     - `同じ型だけを反復する / 問題配置の違い`
   - Correct: 1
6. **Unseen transfer**
   - Synthetic study card: `経験者が4種類の警報対応を、種類別または混合で練習した。1週間後の混合テストでは、混合練習群の得点が高かった。`
   - Headline: `警報対応を初めて教わる初心者でも、混合練習なら1週間後の同じテストで高得点になる`
   - Ask: 最初に越えた境界は？
   - Options:
     - `時間条件`
     - `学習段階`
     - `測定結果`
   - Correct: 2
7. **Complete / 10秒 action**
   - `次に学ぶものを「初学 / 同型の反復 / 方法を選ぶ練習」のどれかに10秒で分類する。`
   - Optional self-observation: 方法を選ぶ練習なら、混合を試す候補として印を付けてもよい。
   - Disclaimer: 数学以外への適用は未検証の自己観察であり、混合を初学へそのまま適用しない。

### Reject conditions

- spacing と interleaving の寄与を完全に分離できたと断定する
- その場の練習成績が低いほど必ず長期学習が良いとする
- 語学・仕事・運動を含む全分野へ効果量を移す

---

## Pilot 3 — ごほうびを足せば、何でも続く？

### Pedagogical Goal

ある介入が増やした **行動頻度** と、その行動の **品質・安全・習慣化** を区別する。

### Raw insight

大学ジムの field experiment では、続きが気になる音声小説を運動中だけ聞けるようにすると、当初の来館が増えた。ただし効果は時間と中断で弱まった。

後続 field experiment は合計6,792人を含むが、その全員を同じ3群RCTとして扱えない。audio を受け取った参加者のうち `bundling の説明あり / audioのみ` を無作為比較した部分は2,334人で、説明の上乗せは modest だった。audiobook を渡すこと自体が使い方を暗示した可能性もある。

これは「嫌な作業に娯楽を流せば、作業品質まで上がる」という研究ではない。

> すぐ楽しいものが主作業を邪魔しにくい時だけ、小さく束ねて頻度を見る。

### Source facts

- 対象: 運動を増やしたい大学ジム利用者226人。後続field experiment全体はexercise program参加者6,792人
- 比較: 2014年はgym限定audio一式、自己制限の推奨、25ドルgift card対照。後続の無作為な追加効果比較はaudio + 説明とaudioのみの2,334人
- 結果: 当初のgym check-in・週のvisit回数が増加。運動時間、強度、フォーム、作業品質は測っていない
- 時間: 最初の研究は効果が時間とThanksgiving後に減衰。後続は介入中から最大17週後まで追跡
- 場面: audiobook と exercise の組合せ

Primary sources:

- [Milkman, Minson & Volpp (2014)](https://doi.org/10.1287/mnsc.2013.1784)
- [Kirgios et al. (2020)](https://doi.org/10.1016/j.obhdp.2020.09.003)

### Seven screens

1. **Prediction**
   - Scene: `人気audio入り端末をgymでだけ使える一式`を受け取る群と、25ドルgift cardを受け取る対照群。
   - Prompt: `当初のgym来館は？`
   - Options: `一式群が少ない / ほぼ同じ / 一式群が多い`
2. **Evidence**
   - Result: `gym限定audio一式群の当初の来館はgift-card対照より多かった`
   - Caveat: 効果は弱まり、exercise以外の作業品質や安全は測っていない。
3. **Update**
   - Options: `予想より増えた / ほぼ予想通り / 予想より減った`
4. **Boundary**
   - Headline: `gym限定audio一式群はgift-card対照より、運動フォームの正確さも高かった`
   - Ask: 最初に入れ替わったものは？
   - Options: `大学施設 → 自宅 / 来館頻度 → 動作品質 / 7週間 → 1週間`
   - Correct: `来館頻度 → 動作品質`
5. **Retrieval**
   - Prompt: 研究で直接数えたものと、まだ不明なものの組合せは？
   - Options:
     - `運動時間と強度 / 来館頻度への効果`
     - `gymへの訪問回数 / 運動フォームへの効果`
     - `作業の完成精度 / 開始回数への効果`
   - Correct: 2
6. **Unseen transfer**
   - Synthetic study card: `通知つき開始ボタンを使った群は、使わない群より2週間の課題開始回数が多かった。完了精度とエラーは測っていない。`
   - Headline: `通知つき開始ボタンは、2週間の課題完成精度も高めた`
   - Ask: 最初に越えた境界は？
   - Options:
     - `比較: ボタンなし → 専門家の指導`
     - `時間: 2週間 → 6か月`
     - `結果: 開始回数 → 完成精度`
   - Correct: 3
7. **Complete / 10秒 action**
   - `一回だけ試す候補に、別々の欄で「開始した？」「邪魔・ミスは出た？」と書く。`
   - Disclaimer: exercise以外では効果実証ではなく仮説の自己観察。運転、危険作業、精度が重要な作業では試さない。

### Reject conditions

- `51% more` を期間全体の絶対来館率や永続効果として表示する
- free audiobook と説明の寄与を同一視する
- 高注意・危険作業へ娯楽を組み合わせる

---

## Candidate Comparison

### Selected for this pilot

- **歩行と発想**: 低リスクで、`発散 / 収束` の結果境界を直感的に操作できる。
- **インターリーブ**: 大規模な教室RCTがあり、未知のskill-selection場面へ転用しやすい。
- **誘惑バンドル**: 行動頻度と品質の混同、効果減衰、介入成分の切り分けを扱える。

### Deferred

- **36問と親密感**: `親密感 / 継続関係 / 恋愛成立` の境界は良いが、古い単一研究を第一波の柱にしない。
- **liking gap**: 日常価値は高いが、field action が研究で直接検証された介入と混ざりやすい。
- **budget depreciation / defaults**: 面白いが、金融行動の推奨と誤読される安全負荷が高い。

### Rejected for the first pilot

- **retrieval practice vs concept map**: 有名な2011年研究だけで単純な学習法ランキングを作ると、後続の時間統制に関する反論を落とす。
- **caffeine timing**: dose・対象・非有意差の教材価値はあるが、健康助言の安全レビューと表示負荷が初回pilotには大きい。
- **口頭brainstorm**: 歩行テーマと同じ創造性領域へ寄るため、領域横断性が弱まる。

## Baselines

比較対象は内容を弱く作らない。同じsource factsと同じunseen transfer probeを使う。

### A — Research-first interactive

`prediction -> evidence -> update -> boundary -> retrieval -> unseen transfer -> action`

Positive hypothesis: 自分の予想と研究境界を操作することで、記事より正確な主張と転用が残る。

### B — Daily-first interactive

`life scene -> 10秒rule -> guided example -> short evidence note -> unseen transfer -> action`

Positive hypothesis: すぐ使える感覚と速度は強いが、研究の境界再構成はAより弱い可能性がある。

### C — Static article

`life scene -> research summary -> caveat -> action`

Positive hypothesis: 最も速く安く情報を伝えられる。AがCを超えないなら、Psycle interactionを増やす理由はない。

第一実装はAの3topicだけに限定する。Aがowner tasteとimmediate transferを通った後、同じtopicのB/Cとdelayed probeを実装する。弱いAへ比較UIを足して救わない。

## Decision Rules

### Adopt a raw pilot

- UIなしでも raw insight に「その分け方はしていなかった」がある
- 5境界を一次資料から埋められる
- topic固有名詞を外した未見sceneでも skill を使える
- 10秒 action が小さく、安全で、研究主張と分離されている
- 次lessonへ進む理由がXP以外にある

### Reject a raw pilot

- 最長・最慎重な選択肢が正解だと推測できる
- 元研究の名詞を置換しただけの transfer
- caveat暗記で解け、境界操作が要らない
- sourceを隠すと面白さが消える
- actionが `意識する / 気をつける` で終わる
- topic専用screenを作らないと成立しない
- articleを読む以上の判断・再挑戦価値がない

## Success Metrics

### Hypothesis

3topicで同じ `claim_boundary_transfer_v1` を練習すると、ownerはtopicの事実ではなく5境界を使って未見主張を監査できる。

### Primary Metric

- 24〜72時間後、研究固有語を消した未見3sceneのうち2つ以上で、最初に越えた境界を特定する。

### Secondary Metrics

- 3lesson中2本以上で `記事よりPsycleでやる意味がある` が4/5以上
- 3lesson中2本以上で `もう1本やりたい` が4/5以上
- 3日以内に10秒 actionを1回以上自発的に使う
- first interaction 10秒以内、各lesson 2〜4分

### Guardrails

- 正解位置・文の長さ・留保語だけで50%以上解けない
- mandatory scroll / keyboardなし
- 誤答のままcompletionへ進めない
- AI Day 1、legacy progression、XP、streakの保存を変えない
- 1 accepted lessonのsource review + raw authoring + critiqueが1日を超え続けるなら、供給モデルを再設計する

### Population

- 初回はowner 1人。需要や一般ユーザー学習の証明には使わない。

### Trigger

- ownerが3topicを実プレイし、最低24時間後の共通probeへ回答した時点で比較する。

### Rollout Plan

1. owner-only A variant
2. owner taste gate
3. B/C comparison + delayed probe
4. 3〜5人の小規模pilot
5. transfer差が出た場合のみproduction候補化

### Stop Rule

- 3本中2本が記事同等以下
- immediate transferで2本以上が失敗
- delayed unseen transferがtopic知識の再認に退化
- 専用screen・長文・自由記述を増やさないと成立しない
- source reviewを省略しないと供給できない

## Test / Verification Plan

1. source factsを一次資料と公的reviewで再確認
2. fresh criticが正解を知らずに、選択肢パターン・複数正解・過剰主張を監査
3. definition validator と pure flow test
4. topic / user別の保存、retry、reset test
5. Simulatorで3topicを最後まで実プレイ
6. first viewport、tap target、固定CTA、feedback、completionを画面確認
7. 24〜72時間後に共通unseen probe
8. Aが通った場合だけB/Cを追加

## Evidence / Source Impact

- 現段階ではこのraw docとowner-only definitionにsource URLを保持する。
- production evidence JSON、curated source registry、claim registryは変更しない。
- production昇格時はclaim/source trace、evidence grade、staleness ownerを別bucketで追加する。

## Validation Gates

- content gate: raw insight + fresh critic
- implementation gate: definition / storage / flow tests
- runtime gate: Simulator correct path + wrong-answer retry + topic resume
- product gate: owner taste + delayed unseen transfer
- scale gate: accepted lesson production costとA/B/C比較

## Rollback Conditions

- owner pilot flagを`0`にすると全V2 routeを閉じられること
- 新sessionはlegacy AI keyとproduction progressionを上書きしないこと
- topic定義をregistryから外せば、他topicの保存を残して非表示にできること

## Assumptions

- owner tasteはlegibilityと個人的価値の証拠であり、市場需要の証明ではない。
- immediate正答はdelayed transferの証明ではない。
- 共通shellが動いても、良質なlesson供給が安くなるとは限らない。
- 最終採用とproduction昇格はownerが決める。
