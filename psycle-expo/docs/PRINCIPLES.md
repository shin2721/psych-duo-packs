# Psycle Principles（レッスン作成仕様）

> **🚨 このファイルは Psycle の product principles と lesson-quality contracts の正本です**
> **runtime / package / support / readiness / ops の詳細契約は `docs/CONTENT_SYSTEM_SPEC.md` が正本です**
> **新しいルールを増やす前に、原則・監査・型のどれを変えるのかを分けて判断してください**

---

## 🚦 実装時の使い方

このファイルは長い。作業時は、まずこの順で読む。

1. **Core Operating Principles** で、今回の変更が壊してはいけない上位原則を確認する
2. 変更対象に応じて、該当章だけ読む
   - lesson copy / content: `D-Lab/Paleo Lesson Content Algorithm`, `Paleo-to-Practice Lesson Spine`, `Life-Scene First`, `Evidence Grade`
   - generator / script: `Benchmark preservation rules`, `Content quality audit rules`, `Claim / Source Traceability`
   - runtime / progression: `Path-First Progression`, `Support Dosage`, `Dependency`
   - completion / analytics: `Completion takeaway rules`, `Outcome Metric`
   - localization: `Localization Parity Fail Criteria`
3. runtime / progression / ops の詳細は `CONTENT_SYSTEM_SPEC.md` の該当 contract を読む
4. 仕様が重い時は、下の `Rule Strength` で必須度を判断する

### Quality System Roles

`原則`、`監査`、`型` を混ぜると、Psycle はすぐに「ルールは多いが面白くない」状態になる。役割を分ける。

- **原則**
  - プロダクト判断の少数の不変条件。
  - 失敗が見つかるたびに増やさない。既存原則で説明できるなら、原則ではなく実装・lesson・pilot を直す。
- **監査**
  - 具体的で再発しやすい失敗を落とす regression net。
  - audit pass は「面白い」の証明ではない。`needs_human_review` を消す根拠にもならない。
- **型**
  - raw pilot、opening arc、10-question arc、diagnosis などの作るための足場。
  - 型に従ってつまらないなら、型を守ったまま粘らず、原液か切り口を捨てる。

修正順は常に `raw insight / lesson experience -> runtime playthrough -> audit regression -> docs handoff`。docs や audit を先に増やして、弱い lesson を救ったことにしてはいけない。

### Core Operating Principles

日々の実装では、まずこの12個を守る。

1. **Raw insight first**
   - lesson copy / generator / audit / gamification より先に、単体で刺さる raw insight を作る。原液が弱い topic を10問化して救わない。
2. **Life scene first**
   - lesson は心理学用語ではなく、ユーザーの生活場面から始める。
3. **One lesson, one job**
   - 1 lesson は 1 job / 1 done condition / 1 takeaway action に絞る。
4. **Paleo-to-Practice**
   - 意外な問い、研究の発見、ツッコミ、使える範囲、練習を持つ。診断名・レンズ名・結論は先に出さず、生活場面の違和感と普通の説明をずらしてから渡す。
5. **Evidence before confidence**
   - 根拠が弱い時は、主張を弱め、使える範囲を狭くする。
6. **Claim trace is mandatory**
   - `claim_id / source_id / evidence_grade` を壊した lesson は promote しない。
7. **Practice beats explanation**
   - lesson の成功は「わかった」ではなく、見分けられる / 選べる / 戻れる / 試せる。
8. **Completion must leave one small action**
   - 完了画面には、次の生活場面で10秒だけ試す行動を残す。
9. **Path first, support second**
   - Mastery / Refresh / Return / Replay は本線の代替にしない。
10. **No farming**
   - XP / streak / support だけが伸び、transfer が伸びない設計を禁止する。
11. **Do not let automation lower quality**
   - 自動生成や一括変換で、手直し済みの基準 lesson を劣化させない。
12. **Model the reference, not the source text**
   - パレオ / Dラボ / 論文 / 記事を参考にする時は、本文を要約・移植するのではなく、問いの立て方、証拠の扱い、日常行動への変換、継続導線を抽出する。

### Rule Strength

すべてのルールを同じ重さで扱わない。判断に迷ったらこの強度を使う。

- **MUST**
  - raw insight first for new / rewritten core lessons
  - safety boundary
  - claim/source traceability
  - evidence grade / claim strength
  - dependency integrity
  - completion takeaway alignment
  - benchmark preservation
  - production core / benchmark lesson の concrete scene minimum
  - question-before-lens for new / rewritten core lessons
  - rollback / kill switch for production changes
- **SHOULD**
  - 10問 lesson の体験起伏
  - localization parity review
  - outcome / transfer / repeat measurement
  - support dosage thresholds
- **REVIEW**
  - 自動判定できない面白さ、選択肢の迷い、copy tone
  - 新研究の novelty / hype risk
  - mastery / refresh の実質差分
- **REFERENCE**
  - schema details
  - mode A/B 手順
  - route table / package lifecycle / SLA の詳細
  - 変更対象でない場合は読まなくてよいが、該当領域を触る時は従う

### Document Map

- `PRINCIPLES.md`
  - North Star、reference modeling、lesson-quality contracts、reject rules、human reviewの判断軸。
- `CONTENT_SYSTEM_SPEC.md`
  - seed / claim / blueprint / package / runtime / support / route / readiness / ops の詳細契約。
- `REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md`
  - D-Lab / Paleo calibration corpus。参考元の要約ではなく、Psycle へ変換するためのサンプル台帳。
- `NORTH_STAR_PROGRESS.md`
  - 変更の handoff。何を変え、何を検証し、何が未証明かを残す。

同じルールを複数ファイルに本文として重複させない。必要なら、正本への参照だけ置く。

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

### Psycle North Star

Psycle は、単なる心理学クイズアプリではない。

Psycle の中核思想は、**パレオ的な研究の発見・批評力**、**Dラボ的な日常改善**、**Duolingo 的な継続設計**を噛み合わせ、ユーザーの人生を毎日少しずつ良くすることである。

この思想は、すべての content / product / analytics / gamification 判断の上位原則として扱う。

- **パレオ的 Research Lens**
  - 新しい知見・意外な発見・研究のツッコミどころを扱う
  - ただし、論文や話題性をそのまま lesson にしない
  - study design / sample size / control quality / effect size / confounders / generalizability / replication / hype risk を見て、使える範囲を判断する
  - 新発見は `new_core_lesson` より先に `refresh_existing` / `mastery_variant` / `human_review` を検討する
- **Dラボ的 Life Improvement Lens**
  - lesson は知識消費ではなく、日常の recurring pain を少し軽くするために存在する
  - lesson の成功は「理解した」ではなく、`見分けられる / 選べる / 戻れる / 試せる` で測る
  - `lesson_job` / `done_condition` / `takeaway_action` を持たない lesson は設計未完了として扱う
- **Duolingo 的 Continuity Lens**
  - streak / XP / quest / league / energy は、短期的な中毒ではなく、再訪・復習・transfer を支えるために使う
  - completion だけで lesson quality を判断しない
  - `lesson_outcome_feedback` / `lesson_transfer_check` / `lesson_repeat_check` を見て、helpful / transfer / repeat を評価する
- **Long-Term Product Rule**
  - 新しい機能や lesson は、この3つの lens のどれかだけを強めて他を壊してはいけない
  - 面白い研究でも、日常で使えないなら lesson 化しない
  - 日常改善に見えても、根拠が弱いなら evidence grade と安全な使い方を明示する
  - gamification が learning transfer を邪魔するなら、その演出は弱める

### Reference-Source Modeling Protocol

Psycle は外部の良いコンテンツを「要約して短くする」アプリではない。パレオ記事、Dラボ動画、論文、書籍、Podcast を見る時は、内容そのものではなく **どう学習体験に変換しているか** を抽出する。

必ず次の6点に分解してから lesson / candidate / refresh に落とす。

1. **Reference hook**
   - 何が「それ気になる」「自分にもありそう」と思わせる入口か。
   - タイトル・サムネ・冒頭の煽りをコピーせず、ユーザーの生活場面に置き換える。
2. **Insight engine**
   - どの発見・反転・研究メカニズムが新しい見方を作っているか。
   - ただの豆知識なら lesson 化しない。
3. **Evidence posture**
   - 一次研究、メタ分析、臨床ガイドライン、観察研究、専門家の解釈、体験談を分ける。
   - パレオ的な面白さは「新発見」だけでなく、研究の限界・過剰解釈・使える範囲の切り分けまで含む。
4. **Life-improvement move**
   - Dラボ的に、診断・価値観の見直し・行動パターン・日常ワークのどれへ変換しているか。
   - 知識の理解で止まるものは、Psycle の lesson として未完成。
5. **Practice ladder**
   - Psycle では `見分ける -> 選ぶ -> 別場面へ転用する -> 失敗時に戻る -> 明日10秒試す` へ変換する。
   - Dラボの長い自己診断や解説は、そのまま入れず、1 lesson の load score に合わせて分割する。
6. **Continuity loop**
   - 1回で変わる前提にしない。series / mastery / refresh / replay / tomorrow quest に分け、Duolingo 的な再訪理由を作る。

Reference extraction rules:

- **Dラボ型から抽出するもの**
  - 強いテーマ名、シリーズ化、自己診断、価値観や行動パターンの名前づけ、日常で試すワーク、長期で戻る導線。
  - ただし、動画の章立て・診断文・言い回しをそのまま lesson に入れない。
- **パレオ型から抽出するもの**
  - 意外な研究テーマ、一次研究へのリンク、研究デザインへのツッコミ、実生活で使える狭い範囲、個人的な使い方の提案。
  - ただし、記事の結論をそのまま正解選択肢にしない。
- **Psycle への変換**
  - `reference_hook -> surprising_question`
  - `insight_engine -> research_finding`
  - `evidence_posture -> evidence_grade / critical_caveat`
  - `life_improvement_move -> lesson_job / done_condition`
  - `practice_ladder -> 10-question arc / interaction design`
  - `continuity_loop -> mastery / refresh / repeat / tomorrow quest`

#### Popularity / Meaning Extraction Rule

Dラボ / パレオから抽出するのは lesson 構造だけでは足りない。人気の核は、知識量ではなく **自分の判断の裏側を見抜かれた感覚**、**責められずに現実を変えられる感覚**、**次も別のレンズが手に入る期待** にある。

Psycle は、短い心理学レッスン集ではなく **Judgment OS** である。日常で損している見えない判断パターンを、研究批評・自己診断・小さな実験で見抜き、ユーザーの判断OSを少しずつ更新するアプリとして設計する。

参考元を model する時は、上の6分解に加えて次の7点を必ず見る。

1. **personal vulnerability hook**
   - 小さな恥、怖さ、自己疑念、何度も起きる違和感に触れているか。
   - 入口が一般論なら弱い。`自分のことかも` と感じる生活場面まで落とす。
2. **status / intelligence threat**
   - `自分は普通に流されている / 防御的になっている / だまされやすい / 逃げているかも` という、回復可能な脅威があるか。
   - これは shame ではなく、学ぶ理由を生む緊張である。
3. **protective reframing**
   - ユーザーを責めず、でも責任と選択肢は残しているか。
   - `その反応は人間として起きる。だからここで介入できる` という構造にする。
4. **hidden operating rule**
   - lesson 後に、未来のミスを予測できる一文の rule が残るか。
   - 例: `AIの平均回答は答えではなく、ズラすための基準線`、`有用なfeedbackは最初に脅威として見える`、`ストレス買いは物欲ではなく気分消しの場合がある`。
5. **trust-building caveat**
   - caveat が免責文ではなく、知的信頼を作っているか。
   - パレオ的な面白さは、研究の限界・使える範囲・過剰解釈の線引きまで含む。
6. **agency-restoring move**
   - 最後の行動が lever になっているか。
   - `分類する / 一時停止する / baseline と比べる / 質問を変える / 小さく試す / 人間の判断を残す` のように、診断と直結した操作へ落とす。
7. **series pull**
   - 1本で終わる tip ではなく、次も別の lens が手に入る期待を作っているか。
   - money / work / health / relationships / learning / AI を、同じ Judgment OS の別レンズとして蓄積させる。

Psycle の lesson は、研究を短くしたものではなく、ユーザーが自分の判断パターンを1つ見抜き、明日の場面で試せるレンズを獲得する体験である。

#### Raw Insight Pilot Before Lesson

`RAW_INSIGHT_FIRST_GATE`: core lesson / benchmark lesson / generator template では、raw insight が最上位ゲートである。audit、10問arc、diagnosis、XP、streak、UI は、raw insight を強めるための道具であり、弱い原液を救う根拠にはならない。

これは作問前の **quality gate** であり、原則リストを増やすための章ではない。

Psycle は、面白くない原液を10問化して救おうとしてはならない。

core lesson / benchmark lesson / generator template に進む前に、まず `docs/LESSON_PILOT_RAW.md` のような **raw insight pilot** を作り、単体で読んでも次のどれかを起こせるかを見る。

- `それ自分のことかも` という personal vulnerability
- `その分け方はしていなかった` という hidden operating rule
- `明日その見方を試せそう` という agency lever
- `次も別の lens が欲しい` という series pull

Raw pilot が退屈なら、その topic は lesson 化しない。XP、streak、UI、10問arc、diagnosis、audit で面白さを後付けしてはならない。

Raw pilot から lesson へ進める条件:

- クイズなしでも、1つの読み物として最後まで読ませる力がある
- 研究の見方や caveat が、免責文ではなく知的快感を作っている
- 日常の複数 scene へ転用できる lens がある
- 10秒 action が slogan ではなく、判断のやり方を変える
- 既存記事や動画の要約ではなく、Psycle独自の練習へ変換できる

Raw pilot を落とす条件:

- 面白さがタイトルや比喩だけに依存している
- 10問に分解した瞬間、元の洞察よりつまらなくなる
- 研究の話がなくても成立する薄い自己啓発になっている
- 研究の話だけで、日常の判断が変わらない
- その lens を明日また使う場面が見えない

#### Paleo Question Arc Gate

`QUESTION_BEFORE_LENS_GATE`: core lesson / benchmark lesson / generator template では、Q1 でレンズ名・診断名・結論・最終分類を出してはいけない。

これは opening の regression を落とすための **audit / authoring gate** であり、lesson の面白さを保証しない。通過しても、実プレイで退屈なら rewrite / discard する。

パレオ的な面白さは「答えを先に言う」ことではなく、ユーザーが普通に信じている説明を一度立て、その説明だけでは足りないと気づかせる順番にある。Dラボ的な自己診断も、最初から型を選ばせるとただのラベル貼りになる。診断は hook の後、反転の後に置く。

benchmark core lesson の opening arc はこの順にする。

1. **Q1: concrete mystery / ordinary explanation**
   - 生活場面の違和感から始める。
   - まずユーザーが自然に思う説明を選ばせる。
   - `情報型`、`契約型`、`夜の値札`、`自己回復プレミアム` のような内部レンズ名を出さない。
2. **Q2-Q3: evidence-backed reversal**
   - 普通の説明が完全な間違いではないことを認める。
   - そのうえで、研究的な見方・観察・caveat によって一段ずらす。
3. **After reversal: lens / diagnosis / practice**
   - レンズ名、仮診断、型分類、10秒行動は、hook と反転の後に出す。
   - 診断は `当てる` ためではなく、次の行動を選ぶために使う。

Reject:

- Q1 の選択肢がいきなり型分類になっている。
- Q1 の explanation が lesson の答えを要約している。
- surprising_question が答え込みのタイトルになっている。
- 診断名を出しただけで、ユーザーの普通の説明を壊していない。
- 研究・caveat・使える範囲が、答え合わせの後付けになっている。

#### MEANING_PARITY_REJECT

機械監査を通っていても、次のどれかに当てはまる lesson / candidate は reject / rewrite する。

これは human review の reject list であり、点数化できない違和感を原則に昇格させるための場所ではない。

- personal vulnerability hook がない。topic は理解できるが、自分の生活に刺さらない
- status / intelligence threat がない。事実を知るだけで、判断を変える必然がない
- protective reframing がない。ユーザーを責めるか、逆に責任を消している
- hidden operating rule がない。takeaway が slogan / label / tip で終わる
- trust-building caveat がない。限界説明が compliance 文に見え、知的信頼を作っていない
- agency-restoring move がない。最後の行動が vague / passive / diagnosis と無関係
- series pull がない。次の Psycle lesson に戻る理由が、XP 以外に存在しない
- 記事や動画より短いだけで、Psycle で判断・選択・再挑戦する価値がない

#### REFERENCE_SOURCE_MODEL_REJECT

次のどれかに当てはまる場合、外部参考を使った lesson / candidate は reject / rewrite する。

- 参考元の要約になっていて、Psycle で診断・選択・転用する意味がない
- パレオ的な「新しい発見」はあるが、研究の限界や使える範囲がない
- Dラボ的な「人生改善」はあるが、日常の最小行動に落ちていない
- Duolingo 的な報酬や連続性はあるが、transfer / repeat を支えていない
- 参考元の言い回し、診断、章立て、具体例をコピーしている
- 外部参考の面白さだけで採用し、既存 lesson の refresh / mastery fit を検討していない

### D-Lab/Paleo Lesson Content Algorithm

Psycle の lesson content は、以下の順で決める。これは generator / human authoring / review の共通アルゴリズムである。

#### Calibration, Not Dependency

Dラボとパレオは、Psycle が毎回参照しなければ lesson を作れない外部依存ではない。

目的は、Dラボ/パレオの内容を移植することではなく、以下の **学習体験としての本質** を抽出し、Psycle 単体で再現できる algorithm にすることである。

- **Paleo essence**
  - 身近な違和感から入る
  - 研究の手続きと限界を見る
  - 面白い発見を鵜呑みにせず、claim strength を調整する
  - 実生活で使える範囲を狭く切る
- **D-Lab essence**
  - 知識を聞いて終わらせず、自分の生活に変換する
  - 自己診断、価値観、行動パターン、少数ルールに落とす
  - 想起、理由づけ、明日の実践、記録、再想起で定着させる
  - 長期で少しずつ変わる前提で設計する
- **Psycle essence**
  - 1回の lesson で人生を変えるのではなく、毎日1つだけ判断や行動を良くする
  - 研究の面白さ、日常改善、継続設計を1つの短い練習に圧縮する

Reference sampling は、algorithm / generator / benchmark lesson を変える時の校正作業である。通常の lesson 作成では、この algorithm に従い、`pain seed / research seed / behavior seed / continuity seed` がそろっていればよい。

#### Algorithm Input

lesson の入力は、必ず次の4点を持つ。

1. **Pain seed**
   - ユーザーが繰り返し困る具体場面。
   - 例: `ストレスが強い夜、Amazonで何かを買いたくなる`
2. **Paleo research seed**
   - 意外な研究・メカニズム・論文上の論点。
   - source_id / claim_id / evidence_grade を必ず持つ。
3. **D-Lab behavior seed**
   - 知識を生活改善へ変える型。
   - 診断、行動パターン名、明日の小行動、記録、再想起、シリーズ化のどれかを持つ。
4. **Continuity seed**
   - 今日の1 lesson で終わらせず、明日/再訪/refresh/mastery のどこにつなぐか。

この4点のうち1つでも欠ける場合は、production lesson ではなく `candidate` または `research-radar` に戻す。

#### Source Triage

ネタを見つけたら、いきなり lesson を書かない。まず次の分類をする。

| source shape | Psycle decision |
|--------------|-----------------|
| 面白い研究だが日常行動がない | `research-radar` |
| 日常の痛みは強いが根拠が弱い | `pain-backlog` + `human_review` |
| 既存 lesson の説明や caveat を良くする | `refresh_existing` |
| 同じテーマを別場面で練習できる | `mastery_variant` |
| pain / novelty / evidence / actionability が全部そろう | `new_core_lesson` |

原則として、`new_core_lesson` は最後の選択肢である。Dラボ内パレオ記事のようにネタが多い場所では、まず refresh / mastery / backlog に分ける。

#### Reference Sampling Minimum

Dラボ / パレオを根拠に lesson algorithm、generator、基準 lesson を変える時は、1本だけ見て判断しない。最低限、以下をサンプリングする。

#### REFERENCE_SAMPLE_50_GATE

Psycle をビッグアプリ水準へ引き上げるための lesson algorithm / generator / benchmark lesson 変更では、参考元の本質抽出を **50 inspected samples 以上** で校正する。

この 50 本は、Dラボ内のパレオ系記事も `Paleo` family として数える。ただし、タイトルだけ見たもの、スクリーンショットだけで本文構造を追えていないもの、検索結果だけのものは `inspected sample` に数えない。

Dラボ内パレオは、通常の `Paleo` family の中でも別枠で最低50本を `body_inspected` として数える。検索結果で大量に見つけただけでは maturity を満たさない。audit は `title_captured` と `body_inspected` を分け、50本未満なら lesson algorithm を mature 扱いにしてはならない。

50 本未満の時は、以下を守る。

- algorithm は `calibrated_v1_candidate` や `hypothesis` として扱い、final と呼ばない
- generator-wide rewrite は禁止する
- benchmark lesson は作ってよいが、必ず Simulator playthrough と user critique を通す
- サンプル不足を progress handoff に明記する

50 本の推奨内訳:

- Dラボ通常/動画/シリーズ: 15 本以上
- Dラボ内パレオ/研究解説: 50 本以上
- rejection / weak-source calibration: 8 本以上
- cross-domain comparison: 7 本以上

50 本で見る対象は、内容のコピーではなく、次の構造である。

- hook: 入口の問いがなぜ気になるのか
- insight engine: どの発見・反転・メカニズムで見方が変わるのか
- evidence posture: 根拠の強さ、弱さ、ツッコミ、使える範囲
- life move: 日常改善へ変換する最小動作
- practice loop: 診断、判断、選択、記録、再想起への落とし方
- continuity: シリーズ化、明日の行動、復習、再訪理由
- reject reason: Psycle にしない方がいい理由

**Dラボ minimum sample**

- `use-method`: Dラボの使い方、学習法、行動化、習慣化を扱うもの
- `diagnosis-values`: 自己診断、価値観、呪い、他責、承認、完璧主義などを扱うもの
- `simple-rule`: シンプルルール、意思決定、少数ルール、具体行動への変換を扱うもの
- `long-game`: 長期目標、シリーズ、人生設計、継続戦略を扱うもの

**Paleo minimum sample**

- `single-study`: 1本の研究を生活場面に接続する記事
- `critique`: 教科書・通説・わかりやすい物語への批判を扱う記事
- `roundup`: 小ネタや複数研究を候補として紹介する記事
- `program-practice`: 最高の体調プログラムのように、知識を日々の定着へ変える運用型の内容

最低サンプル数:

- minor lesson refresh: Dラボ1型 + Paleo1型
- new core lesson: Dラボ2型 + Paleo2型
- generator / principle change: Dラボ3型以上 + Paleo3型以上

サンプルが足りない場合は、原則を断定的に変えず `hypothesis` として progress handoff に残す。Dラボやパレオの個別表現はコピーせず、構造だけ抽出する。

#### Five-Part Insight Decision

各 lesson は `insight_layer` を先に決める。

1. **surprising_question**
   - 生活場面の違和感から始める。
   - `なぜ人は...？` だけでは弱い。ユーザーが今日経験する場面に寄せる。
2. **research_finding**
   - 研究の発見を1つだけ選ぶ。
   - 相関 / 介入 / メタ分析 / ガイドラインを混ぜない。
3. **critical_caveat**
   - sample / design / generalizability / overclaim risk のどれかを必ず書く。
4. **usable_scope**
   - 生活で使う範囲を狭くする。
   - `人生を変える` ではなく `この場面の最初の10秒` まで落とす。
5. **practice_prompt**
   - その場で選べる3択または swipe 判断にする。
   - 正解を当てるだけでなく、近いがズレた near-miss を入れる。

#### Required 10-Step Lesson Arc

基準 core lesson は、次の10ステップに変換する。これは「10問に伸ばす」ためではなく、Dラボ的な生活改善とパレオ的な研究批評を、Psycle上で練習に変えるための順序である。

1. **Cold open**
   - 具体場面で始める。心理用語や研究名から始めない。
2. **Self-diagnosis**
   - 今の自分はどの型かを選ばせる。
3. **Curiosity reversal**
   - ユーザーの直感と違う見方を1つ出す。
4. **Mechanism**
   - なぜそうなるかを、研究メカニズムとして1つだけ説明する。
5. **Evidence critique**
   - 研究の限界、相関/因果、サンプル、使えない範囲を確認する。
6. **D-Lab conversion**
   - 知識を「明日使う行動」に変える。
   - 行動、理由、使う場面の3点を短く作る。
7. **Frictioned choice**
   - それっぽいがズレる選択肢を入れ、判断力を鍛える。
8. **Transfer scene**
   - 別の生活場面に移して使えるかを見る。
9. **Fallback**
   - 失敗した時に戻る小さい問い/行動を持たせる。
10. **Tomorrow quest**
   - 明日10秒だけ試す行動を保存する。

#### Question Type Selection

問題形式は、学習目的で選ぶ。

| learning job | default type |
|--------------|--------------|
| 自分の型を選ぶ | `conversation` |
| 誤解を崩す | `swipe_judgment` |
| 研究メカニズムを見分ける | `multiple_choice` |
| caveat / 使える範囲を選ぶ | `multiple_choice` |
| near-miss を見抜く | `multiple_choice` |
| 明日の行動を選ぶ | `conversation` |

`2択 / 3択 / swipe` は十分ではないが、最初の product quality を安定させるため、core lesson ではこの3系統を基本にする。複雑な形式は、転移や順序判断を明確に測れる場合だけ使う。

#### D-Lab Active Learning Rule

Dラボ型の lesson は、見た/読んだ/分かったで終わらせない。

各 lesson は、少なくとも1回、次の3点をユーザーに処理させる。

- **Recall**: 今日の一番の発見を選ぶ
- **Reason**: なぜ効く可能性があるかを選ぶ
- **Application**: 明日どこで使うかを選ぶ

これを `recall -> reason -> application -> repeat` の loop として扱う。completion では `application` を最優先で残す。

#### D-Lab Simple Rule Constraint

Dラボ型の行動変換では、ユーザーに渡すルールを増やしすぎない。

- 1 lesson の持ち帰りルールは **1つ** にする
- mastery / refresh を含めても、同じ theme 内の同時提示ルールは **3つ以内** にする
- ルールは抽象理念ではなく、特定の活動・場面・判断に紐づける
- 他人や参考元の成功ルールをそのままコピーせず、Psycle の target user / life scene に合わせる

`やることが多い` と感じる lesson は、Dラボ的でも Duolingo 的でもない。複数ルールが必要な場合は lesson を分割する。

#### Paleo Evidence Rule

パレオ型の lesson は、研究の面白さだけで合格にしない。

- 観察研究なら「関連があるかも」までにする
- 小規模研究なら claim strength を下げる
- メタ分析でも対象・条件・効果の大きさを確認する
- 研究が面白くても、日常の安全な action が作れなければ lesson 化しない
- 「研究が示した3ステップ」型の記事は、Psycleでは `diagnosis -> loop detection -> break point -> tomorrow action` に変換する

#### Paleo Article Pattern Rule

パレオ記事を参考にする時は、記事の結論ではなく次の構造を抽出する。

1. **Familiar pain**
   - 読者がすぐ分かる生活の違和感。
   - 例: ストレス時の買い物、きれいすぎる心理学ストーリー、運動でストレス耐性まで上がるのか。
2. **Research procedure**
   - 研究が何をどう調べたか。
   - 対象、サンプル、比較、測定、研究デザインを lesson 内で必要な分だけ見せる。
3. **Mechanism chain**
   - A -> B -> C の流れを作る。
   - 例: 孤独 -> 補償的消費 -> 顕示的消費 -> 依存リスク。
4. **Critical twist**
   - 「面白いけど単純化しすぎると危ない」点を必ず入れる。
   - 例: 教科書でも一方的な記述が残る、運動はストレスを減らしても耐性全般を保証しない。
5. **Narrow application**
   - 3つ以内の実践候補に落とす。
   - Psycleではそのうち1つを `tomorrow quest` にし、残りは near-miss / mastery / refresh 候補にする。

Psycle への変換では、パレオ記事の長い説明を `研究手続きの理解クイズ` にしない。研究手続きは、claim strength と caveat を判断するために使い、lesson の中心は生活場面での判断・転用・明日の行動に置く。

#### DLAB_PALEO_ALGORITHM_REJECT

次の lesson は reject / rewrite する。

- pain seed がなく、研究ネタから始まっている
- research_finding が複数あり、1 lesson の job がぼけている
- caveat が generic で、実際に何を言い過ぎてはいけないか分からない
- Dラボ的な行動変換がなく、知識確認クイズで終わる
- Dラボ/パレオのサンプルが1本だけなのに algorithm / generator を断定的に変えている
- 持ち帰りルールが多すぎて、明日どれを使うか分からない
- `recall / reason / application` のどれもユーザーに処理させていない
- tomorrow quest が `意識する` `気をつける` など抽象的
- コメントやユーザー反応の面白さだけで採用している

### Paleo-to-Practice Lesson Spine

今後の lesson は、パレオ的な発見を Dラボ的な日常改善に変換し、Duolingo 的に毎日少しずつ練習できる形にする。

各 lesson は、少なくとも以下の5要素を持つ。

1. **意外な問い**
   - ユーザーが「それ本当？」と思える入口
   - 例: `ストレスで無駄遣いするのは意志が弱いから？`
2. **研究の発見**
   - 研究から得られる新しい見方
   - 例: `ストレスで報酬への反応や注意の向きが変わる可能性がある`
3. **ツッコミ**
   - 研究の限界、過剰解釈、一般化しすぎを止める文
   - 例: `これだけで全員の買い物行動を説明できるわけではない`
4. **使える範囲**
   - 日常で安全に使える狭いスコープ
   - 例: `限定セールを見た瞬間の10秒停止には使える`
5. **練習**
   - その場で判断・選択・転用できる小さい action
   - 例: `今すぐ買う / 後で見る / 必要性を確認、を選ぶ`

この5要素は `insight_layer` として lesson metadata に持たせる。

Reject rules:

- 研究の発見だけで終わり、日常の練習に落ちない lesson は reject
- 行動練習だけで、意外な問いや研究の面白さがない lesson は refresh 対象
- ツッコミがなく、研究を断定的に言い切る lesson は reject
- 使える範囲を書けない lesson は evidence grade を上げてはならない

Interaction rules:

- 問題形式は `2択 / 3択 / スワイプ判断` だけに固定しない
- ただし core lesson の初期実装では、短く続けやすい `conversation / multiple_choice / swipe_judgment` を基本セットにする
- `select_all / sort / matching / scenario branching` は、区別・順序・転用を測る明確な理由がある時だけ使う
- 入力が重い自由記述や長文 reflection は、毎日継続を壊しやすいためデフォルトにしない

10-second action rules:

- lesson 全体には、日常へ持ち帰れる **10秒前後の最小 action** が必要
- すべての question を10秒 action にする必要はない
- 10秒 action は主に Phase 4 / Anchor / completion で扱い、研究発見とツッコミはそれを安全に使うための前段にする
- 10秒でできない action は、`最初の10秒で何を始めるか` まで小さく分解する

Experience quality rules:

- `insight_layer` の5要素を順番に並べただけの lesson は reject
- 各 lesson は、少なくとも3つの具体的な生活シーンを含む
- 選択肢は「誰でも正解が分かる悪い選択肢」だけにしてはならない
- 正解後の explanation は、問題文の言い換えではなく、ユーザーが持ち帰る新しい見方を1つ増やす
- 10問 lesson では、`場面 -> 迷い -> 意外な見方 -> 研究 -> ツッコミ -> 使える範囲 -> 判断練習 -> 10秒行動 -> 失敗時の戻り方 -> 持ち帰り` の起伏を優先する
- 自動生成でこの起伏を作れない場合は、生成結果を production に入れず、人間が基準 lesson として手直しする

Benchmark preservation rules:

- 人間が手直しした基準 lesson は、自動生成 script の一括再生成対象から保護する
- 基準 lesson を更新する時は、`why this is better` と `what principle it verifies` を progress handoff に残す
- 自動生成 script は、基準 lesson を上書きする前に明示的な allowlist / force flag / human review のいずれかを要求する
- 基準 lesson から generator を改善することは許可するが、generator の都合で基準 lesson の体験品質を下げてはならない
- production lesson は `template-generated but technically valid` では足りない。基準 lesson と比べて、生活シーン・選択の迷い・新しい見方・持ち帰り行動が弱い場合は refresh 対象にする

Completion takeaway rules:

- completion / recap / practice card は、lesson の最終 `takeaway_action` または Anchor の持ち帰りを優先する
- 途中 question の `actionable_advice` は、最終 takeaway と矛盾しない時だけ completion に出す
- 最初に見つかった intervention advice を機械的に completion の主メッセージにしてはならない
- completion は `何を学んだか` ではなく、次の生活場面で `何を10秒だけ試すか` を明確にする

Content quality audit rules:

- audit は `insight_layer が存在するか` だけで pass してはならない
- 最低限、以下を機械チェックまたは human review queue で検出する:
  - 具体的な生活シーンが3つ未満
  - 選択肢が露骨な悪手だけ
  - explanation が問題文や選択肢の言い換えだけ
  - 10問 lesson の起伏がなく、同じ構造を並べただけ
  - completion takeaway が lesson metadata / Anchor とズレている
  - base locale と主要 locale の lesson job / scene / claim strength がズレている
- audit が判定できない体験品質は `OK` ではなく `needs_human_review` として扱う

### Lesson Quality Algorithm

Psycle の lesson は、記事や動画の要約ではない。ユーザーが「これならパレオ記事やDラボを見るだけでいい」と感じる lesson は、情報として正しくても product として失敗である。

Lesson authoring / generation / review は、必ず次の順で組み立てる。

1. **Pain first**
   - recurring pain を1つ選ぶ
   - 例: `返信が遅いだけで嫌われた気がする`
2. **Curiosity gap**
   - Q1-Q3 の間に、ユーザーが知らない見方を1つ入れる
   - 例: `焦りは出来事そのものではなく、身体反応の読み方で増幅することがある`
3. **Research mechanism**
   - 研究・理論・観察から、なぜその現象が起きるかを1つだけ説明する
   - `studies show` のような空の根拠表現は禁止
4. **Evidence critique**
   - sample / design / generalizability / overclaim risk のどれかを明示し、使える範囲を狭める
5. **Diagnosis / personalization**
   - ユーザーが自分の型、場面、反応、失敗パターンのどれかを選べるようにする
6. **Frictioned choice**
   - 選択肢は露骨な悪手だけにしない
   - それっぽいがズレている near-miss を少なくとも1つ入れる
7. **Skill ladder**
   - 見分ける -> 選ぶ -> 別場面へ転用する -> 失敗時に戻る、の順で練習する
8. **Transfer anchor**
   - completion までに、明日使う10秒 action を1つ保存する
9. **Continuity hook**
   - XP / streak / quest は「もう一度試したい理由」を支える。中身の薄さを隠すために使わない

#### ARTICLE_PARITY_REJECT

次のどれかに当てはまる lesson は reject / rewrite する。

- 記事を読んだ方が早く、Psycle で選択・診断・転用する意味がない
- Q3 までに、新しい見方・意外な発見・診断のどれも出てこない
- 研究の発見が一般論で、生活場面の判断に変換されていない
- evidence caveat がなく、効果を広く言いすぎている
- choices が `正しい行動` vs `明らかな悪手` だけで迷いがない
- diagnosis を選ばせるだけで、後半の練習や completion に反映されない
- 10秒 action が「気をつける」「意識する」など抽象的で、明日そのまま試せない
- Duolingo 的な continuity が XP 回収だけで、transfer / repeat を支えない

#### Required 10-question arc for benchmark core lessons

基準 core lesson は、原則として10問で次の起伏を持つ。短い lesson でも、この順番の一部を潰してよいだけで、意味は失ってはならない。

1. Life scene cold open + self-diagnosis入口
2. Counter-intuitive discovery
3. Misconception challenge
4. Research mechanism in a concrete scene
5. Caveat / overclaim guard
6. Personal diagnosis or type choice
7. Near-miss judgment with plausible alternatives
8. Transfer to a different life scene
9. Failure recovery / fallback
10. Personalized carry-forward / tomorrow quest

#### Quality score contract

Human review と semantic critic は、最低でも次の8項目を0-2点で採点する。合計12点未満、または `novelty` / `article_advantage` / `transfer` のどれかが0点なら production に入れない。

| key | 0 | 1 | 2 |
|-----|---|---|---|
| `pain_specificity` | 抽象テーマ | 場面はあるが弱い | 誰がいつ困るか見える |
| `novelty` | 既知の助言 | 少し新しい | 見方が反転する |
| `evidence_critique` | 根拠なし | 根拠はあるが限界が薄い | 根拠と限界が両方ある |
| `personalization` | 全員同じ | 途中で選ぶだけ | 後半とcompletionに効く |
| `choice_friction` | 正解が露骨 | 一部だけ迷う | plausible near-miss がある |
| `practice_ladder` | 説明だけ | 1回だけ練習 | 見分ける/選ぶ/転用/戻る |
| `transfer` | lesson内で完結 | 明日使うが曖昧 | 10秒 action が具体的 |
| `article_advantage` | 記事で十分 | 少し interaction がある | 診断・判断・再挑戦が価値を作る |

Machine audit はこの採点を完全代替しない。自動判定できない `面白さ` は pass ではなく `needs_human_review` で止める。

#### North Star Experience Score

`100%` は到達宣言ではなく、毎回の改善で近づける運用目標として扱う。Psycle の基準 lesson は、次の5軸をそれぞれ20点、合計100点でレビューする。

| axis | 20点の状態 |
|------|------------|
| `paleo_discovery` | 意外な問い、研究の発見、限界へのツッコミが lesson 内で自然につながる |
| `dlab_life_change` | 生活場面の痛みが、今日・明日使える小さい行動に変換されている |
| `duolingo_continuity` | 診断、near-miss、転用、fallback、tomorrow quest がテンポよく続く |
| `psycle_reason` | 記事を読むだけでは得にくい、選択・判断・再挑戦の価値がある |
| `retention_without_thinness` | XP / streak / quest が薄い内容のごまかしではなく、transfer / repeat を支える |

基準 core lesson は 85点未満なら production 前に rewrite、90点未満なら `needs_human_review` として扱う。100点を名乗るには、machine audit だけでなく実プレイで「新しい見方」「明日の行動」「もう一度試す理由」が確認できなければならない。

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

## Operational Contract Index

このファイルは Psycle の product principles と lesson-quality contracts の正本である。runtime / package / support / readiness / route / SLA の詳細運用契約は、重複させず CONTENT_SYSTEM_SPEC.md を正本にする。

### Research Critique Lens

新しい研究は lesson 化の前に、最低限 study_design / sample_size / control_quality / effect_size / confounders / generalizability / replication_status / hype_risk / safe_usage_scope を見る。

研究発見は new_mechanism / better_intervention / boundary_update / replication / contradiction / interesting_but_not_actionable のどれかに分類する。interesting_but_not_actionable は面白くても lesson にしない。観察研究や小規模研究は、因果・介入の主張に昇格させない。既存 lesson に fit する発見は、新規 lesson ではなく refresh / mastery を優先する。

### Claim / Source Traceability

Question は必ず claim_id 経由で evidence に接続する。最低限 claim_id / source_id / evidence_grade / expanded_details.claim_type / expanded_details.evidence_type / expanded_details.citation_role を持つ。

禁止:

- source_id を question id から代用する
- source が不明なまま gold / silver を付ける
- loader / adapter が base data の source_id を暗黙に別値へ書き換える
- trace が壊れている lesson を promote する

### Evidence Grade

Evidence Grade は claim strength と表示文の強さを制御するためのもの。Gold / Silver / Bronze の詳細な source tier、staleness、package lifecycle、fallback、rollback は CONTENT_SYSTEM_SPEC.md に置く。

- Gold: メタ分析 / 複数RCT / clinical guideline 相当。強く言えるが、population と scope を明示する。
- Silver: 単一RCT / 大規模調査 / 良質な縦断研究。断定しすぎず、使える場面を狭くする。
- Bronze: pilot / 観察研究 / expert synthesis / raw pilot。仮説・練習モデルとして扱い、断定しない。

### Runtime / Ops Contracts

以下は PRINCIPLES.md に長文重複させない。実装・監査・CIで必要な場合は CONTENT_SYSTEM_SPEC.md を読む。

- Mastery / Replay / Refresh / Return / Adaptive resurfacing
- Support Dosage / Support Success / Failure Threshold
- Theme Dependency / Skill Transfer / Interleaving
- Refresh Eligibility / Theme Retirement / Theme Drift
- Policy Precedence / Override Authority
- Observability / Rollback / Emergency Kill Switch
- Promotion Readiness / Package Lifecycle / Route Table
- Analytics Metric Ownership / Validation Ownership Matrix
- Localization Parity Fail Criteria
- Mode A / Mode B / JSON Schema / Domain routing / staging promotion

### Non-Goals

- PRINCIPLES.md を運用 runbook にしない
- audit pass を human taste pass と呼ばない
- D-Lab / Paleo の名前を lesson 内に出して権威づけしない
- XP / streak / quest で薄い lesson を隠さない

## 仕様変更禁止

- Mode A / Mode B で異なる product principles を作ることは禁止
- 仕様を変える時は、このファイルの product principles と CONTENT_SYSTEM_SPEC.md の operational contracts のどちらを変えたのかを明示する
- North Star 関連の変更は docs/NORTH_STAR_PROGRESS.md に handoff を残す
