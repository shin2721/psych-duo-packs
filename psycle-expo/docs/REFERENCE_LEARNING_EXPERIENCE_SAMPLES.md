# Reference Learning Experience Samples

This file records source-shape samples used to calibrate Psycle's lesson algorithm. It is not a content source file and must not be used to copy wording, examples, chapters, diagnoses, or article structure into lessons.

Canonical product principles and lesson-quality contracts live in [PRINCIPLES.md](./PRINCIPLES.md). Operational content-system contracts live in [CONTENT_SYSTEM_SPEC.md](./CONTENT_SYSTEM_SPEC.md).

## Purpose

Psycle uses D-Lab and Paleo as calibration references for learning-experience structure:

- Paleo calibrates research discovery, skepticism, mechanism chains, and bounded application.
- D-Lab calibrates self-diagnosis, behavior conversion, active recall, simple rules, and long-term practice.
- Psycle converts those structures into short daily lessons that improve one real-life decision or action at a time.

## 50+ Sample Standard

Psycle's D-Lab/Paleo calibration is not considered mature until this file contains **50 or more inspected samples**.

An inspected sample must include enough source reading to extract learning-experience structure. Title-only discovery, search snippets, screenshots without surrounding flow, and topic guesses do not count.

Current status:

- Calibration samples: 93
- Rejection samples: 11
- Total recorded samples: 104
- D-Lab-internal Paleo body-inspected samples: 50 / 50
- D-Lab-internal Paleo remaining title-captured queue recorded here: 2
- D-Lab-internal Paleo title-captured candidates observed across D-Lab pages/screenshots: 72+
- Maturity: `calibrated_v1_candidate`; the 50-sample D-Lab-internal Paleo calibration target is now satisfied, but the generator is still not mature enough for blind app-wide rewrite without playtest and outcome data

Required before calling the lesson algorithm mature:

- At least 50 total inspected samples
- At least 50 D-Lab-internal Paleo / research-explainer samples before generator-wide automation
- At least 15 D-Lab behavior / diagnosis / long-game samples
- At least 8 rejection or weak-source samples
- At least 7 cross-domain comparison samples

Sampling fields to extract for every added sample:

| field | question |
| --- | --- |
| hook | Why does the opening question feel personally relevant? |
| insight_engine | What discovery, reversal, mechanism, or critique changes the user's view? |
| evidence_posture | How does the source handle strength, limits, confounds, and overclaim risk? |
| life_move | What daily action, diagnosis, rule, or decision does the source imply? |
| practice_loop | How could Psycle turn it into recognize / choose / transfer / return / tomorrow? |
| continuity | Why would a user come back to this idea later? |
| reject_reason | If weak, why should Psycle route it away from core lessons? |

## D-Lab Internal Paleo Sampling Queue

This queue records D-Lab internal Paleo articles captured from `daigovideolab.jp/search?channel_owner=paleo`. These entries are **not counted as inspected samples** until their article body has been read and reduced into the extraction fields above.

Status legend:

- `body_inspected`: article body was inspected enough to extract learning-experience structure.
- `title_captured`: visible in D-Lab Paleo search results, but not yet counted as an inspected sample.
- `reject_candidate`: likely not a lesson calibration source unless a transferable learning structure is found.

Current D-Lab-internal Paleo queue:

| status | sampled title / theme | sampling note |
| --- | --- | --- |
| body_inspected | AIを使うと「つまらない人間」になるんじゃない？ 対策編 | Extracted as AI-average-baseline / deliberate-deviation lesson mechanic. |
| body_inspected | 「バズれば幸せ」は本当か？フォロワーが増えるほどクリエイターは壊れるぞ！ | Extracted as audience-pressure / creator-boundary / self-standard lesson mechanic. |
| body_inspected | 「なんかこの人、感じ悪いな……」と思われないための文章表現 | Extracted as confidence-wording / social-impression / role-dependent caveat mechanic. |
| body_inspected | なぜか「嫌なことばかり起きる人」の正体は、ほぼ“解釈のクセ” | Extracted as event-appraisal / emotion-recovery / interpretation-check mechanic. |
| body_inspected | 心理学の教科書、普通にそこそこ間違ってない？ | Extracted as clean-story skepticism / source-diversity / certainty-check mechanic. |
| body_inspected | 人生の質は「細胞エネルギー」で決まる！#7「健康刺激を入れようぜ！」 | Extracted as controlled healthy-stimulus / safe micro-dose practice mechanic. |
| reject_candidate | 【5/11スタート】石臼挽き抹茶の定期便がついに始まります！＆値上げのお願い | Product/sales topic; do not count unless a transferable behavior structure appears. |
| title_captured | 今週の小ネタ：ルックスに自信がある人ほど職場で主張できる、男性の仕事の満足度はお金の価値観に左右される、起業家にはヤバい性格の人が多い | Need roundup triage. |
| body_inspected | 人生の質は「細胞エネルギー」で決まる！#6「ミトコンドリアを刺激するベストな運動メニューとは？」 | Extracted as exercise-dose / mitochondrial-signal / safety-boundary mechanic. |
| body_inspected | 昔を思い出すだけでメンタルが回復する？ノスタルジーをメンタル改善に使おうぜ！ | Extracted as nostalgia-state-shift / rumination-caveat mechanic. |
| body_inspected | 努力してるのに成長しない人の共通点、それは「コーチャビリティ」の無さ#7「最終回：フィードバック実行」 | Extracted as feedback-to-next-trial / implementation-gap mechanic. |
| body_inspected | 地中海食、“細胞の中のタンパク質”をいじって私たちを健康にしていた説 | Extracted as mechanism-novelty / conservative-food-pattern refresh mechanic. |
| body_inspected | 努力してるのに成長しない人の共通点、それは「コーチャビリティ」の無さ#6「フィードバック受容」 | Extracted as defensive-reaction / usable-signal separation mechanic. |
| body_inspected | 少量の酒でも脳はダメージを受けるのか？“ちょい飲み”の長期リスクを見てみよう！ | Extracted as cumulative-risk / frequency-boundary mechanic. |
| body_inspected | アンチエイジングに欠かせない「血糖コントロール」に最適な運動とはなんだ？問題 | Extracted as timing-and-intensity / glucose-control practice mechanic. |
| body_inspected | AI時代に必要なのは「ケンタウロス思考」だ！と主張する、サイエンスの最新論文を読んでみよう！#1「理論編」 | Extracted as human-AI role split / judgment-preservation mechanic. |
| title_captured | 今週の小ネタ：AIに相談すると人は“せっかち”になる？現代人は見た目のコンプレックスが激増する？TikTokで魅力的な人の動画を見ると恋愛関係が悪化する？ | Need roundup triage. |
| reject_candidate | 【予約開始】OptiMakura（オプティマクラ）、第8期の再販が始まりました | Product/restock topic; do not count unless transferable structure appears. |
| reject_candidate | 最高の体調プログラム第12期生を募集してまーす（2026年5月1日から31日限定） | Program announcement; do not count unless practice-duration structure is inspected. |
| body_inspected | 内向人間が「陽キャな環境」で消耗する理由とその対処法を調べたぞ！ | Extracted as person-environment fit / prepare-limit-recover mechanic. |
| body_inspected | 努力してるのに成長しない人の共通点、それは「コーチャビリティ」の無さ#5「フィードバック探索」 | Extracted as active-feedback request / specific-question mechanic. |
| body_inspected | なぜ人はストレスで無駄遣いしてしまうのか？研究が示した3ステップ | Extracted as stress-reward loop / 10-second spending break mechanic. |
| body_inspected | 運動でストレスは減る！でも「メンタルは強くならない」！という研究を読んでみよう | Extracted as outcome-boundary / state-shift versus trait-change mechanic. |
| body_inspected | 「行動力」をガッツリ上げる最新メソッド「1日事前構成法（DPM）」をやってみようぜ！ | Extracted as tomorrow-precommit / trigger-fallback mechanic. |
| body_inspected | 創作とお金はなぜ噛み合わないのか？アーティストの生存戦略から、私たちが生きる道を学ぼう！ | Extracted as creative-tradeoff / money-boundary / survival-system mechanic. |

## Sampled Source Shapes

| family | source shape | observed learning strength | Psycle algorithm extraction |
| --- | --- | --- | --- |
| D-Lab | use-method / knowledge-to-action | Learning is judged by recall, experiment, record, later recall, and transfer rather than number of videos watched. | Every lesson needs recall/reason/application and a tomorrow action. |
| D-Lab | diagnosis / values / curse pattern | Abstract self-change becomes concrete when users can name their pattern and revisit it over time. | Include self-diagnosis early and connect it to later practice, not just a quiz label. |
| D-Lab | simple rules / decision strategy | Under stress, fewer situation-specific rules work better than many abstract ideals. | One lesson leaves one rule; a theme should not present more than three active rules at once. |
| D-Lab | long-game / series | Change is treated as repeated practice across months, not a single insight. | Use mastery, refresh, replay, and tomorrow quests for continuity. |
| Paleo | single-study article | A familiar life question is made interesting by one research mechanism and a concrete result. | Start from a familiar pain, then introduce one research finding and one mechanism. |
| Paleo | critique article | Useful psychology requires checking whether a clean story hides uncertainty, bias, or debate. | Add caveat, claim strength, and overclaim guards before practice. |
| Paleo | roundup / small papers | Not every interesting finding deserves a lesson; some are only candidates. | Triage into research-radar, backlog, refresh, mastery, or new core lesson. |
| Paleo | program / practice | Knowledge matters only if it becomes repeated behavior in food, sleep, movement, stress, or work. | Prefer recurring pain and practical action over novelty alone. |

## Concrete Calibration Samples

These are reference samples inspected or identified for learning-experience structure. They are not lesson source material, and Psycle must not copy wording, examples, chapters, diagnoses, or article order from them.

Use `extracted structure` as algorithm calibration only. If a future task needs a source-specific lesson claim, reopen the source, inspect the primary evidence, and create proper `source_id / claim_id / evidence_grade` records before production use.

| id | family | source shape | sampled title / theme | extracted structure |
| --- | --- | --- | --- | --- |
| dlab_use_knowledge_action_20260505 | D-Lab | use-method | D-Lab use method / turning knowledge into action and habit | Learning quality is recall, experiment, record, later recall, transfer, not watch count. Psycle needs recall/reason/application in the lesson loop. |
| dlab_values_curse_20260117 | D-Lab | diagnosis-values | Growth-blocking "curse" / values pattern | Name the user's recurring pattern, diagnose it lightly, then revisit over time rather than treating insight as completion. |
| dlab_luck_behavior_20260109 | D-Lab | behavior pattern | Making luck through behavior patterns | Turn abstract traits into repeatable approach behaviors and tiny exposure to opportunities. |
| dlab_simple_rules_basic_20260411 | D-Lab | simple-rule | Simple Rules 2.0 basics | Use a small number of situation-specific rules. Under stress, fewer concrete rules beat many ideals. |
| dlab_simple_rules_relationship_20260426 | D-Lab | simple-rule | Simple Rules 2.0 / relationships | A rule becomes useful when tied to a real interaction, actor, and failure condition. Psycle should make the rule usable in one conversation, not as a broad ideal. |
| dlab_simple_rules_sidework_20260419 | D-Lab | simple-rule | Simple Rules 2.0 / side work | Same principle can be replayed in another domain only if the scene and rule boundary change. This supports mastery variants without duplicating lesson copy. |
| dlab_long_game_life_20260325 | D-Lab | long-game | Long Game 2.0 / life strategy | Treat change as a repeated long-horizon system with variants, not a single motivational lesson. |
| dlab_long_game_work_20260326 | D-Lab | long-game | Long Game 2.0 / work, side work, business | Long-term practice needs "what to say no to" and not only "what to add." Psycle should include tradeoff choices that protect the main path. |
| dlab_long_game_relationship_20260328 | D-Lab | long-game | Long Game 2.0 / partnership | Long-game lessons should test recurring micro-behaviors in relationships, not only values statements. |
| dlab_long_game_connection_20260405 | D-Lab | long-game | Long Game 2.0 / connection design | Social capital is built through repeated small contact and recovery, which maps well to tomorrow quests and repeat checks. |
| dlab_parenting_long_game_20260406 | D-Lab | long-game | Long Game 2.0 / self-running child parenting | Long-horizon design should shift from control to scaffolding; Psycle can use this as a model for autonomy-supportive coaching. |
| dlab_ai_dependency_20260508 | D-Lab | modern-risk | AI dependency / cognitive offloading | Useful tools can weaken practice if they replace recall and judgment. Psycle should use AI/gamification as support, not as a substitute for user thinking. |
| dlab_sleep_sri_20260221 | D-Lab | health-rhythm | Sleep regularity / SRI and behavior chain | Health behavior is a rhythm and chain problem, not only a knowledge problem. Psycle should track repeatability and friction, not only completion. |
| dlab_selective_single_20260308 | D-Lab | values-life-design | Selective single / non-dependent life design | A lesson can improve life by clarifying values and dependency boundaries without prescribing one normal life path. |
| dlab_other_blame_front_20260225 | D-Lab | diagnosis-values | Other-blame / protecting life from blame loops | Diagnostic labels should protect action choice, not shame the user. |
| dlab_other_blame_selfcheck_20260228 | D-Lab | diagnosis-values | Other-blame / excuse sensor self-check | A self-check is useful only if it changes the next action. Psycle should carry selected type into later choices and completion. |
| dlab_dan_koe_day_rebuild_20260312 | D-Lab | day-design | One-day life rebuild / updated daily structure | Large life design can be compressed into one day plan when the lesson uses sequence, friction removal, and review. |
| dlab_frenemy_basic_20260410 | D-Lab | relationship-risk | Frenemy detection and response | Strong hooks work when they name a common social pain, but Psycle must convert them into low-risk boundary choices instead of suspicion farming. |
| paleo_stress_shopping_20260501 | Paleo | single-study | Stress shopping / compensatory consumption | Start with familiar pain, show loneliness -> compensatory consumption -> conspicuous consumption -> dependency risk, then choose one break point. |
| paleo_psych_textbook_20260507 | Paleo | critique | Psychology textbook accuracy / oversimplified stories | Clean stories can hide bias or debate. Psycle must teach claim strength and "what would make this overclaim?" |
| paleo_alcohol_brain_20260505 | Paleo | single-study risk | Low-level alcohol and long-term brain risk | Distinguish long-term cumulative risk from immediate effect; convert to frequency reduction rather than all-or-nothing advice. |
| paleo_exercise_stress_20260430 | Paleo | boundary update | Exercise reduces stress but may not build stress toughness | Separate "helps this outcome" from "solves the broader trait"; use boundary updates for refresh lessons. |
| paleo_introvert_environment_20260502 | Paleo | person-environment fit | Introverts in extrovert environments | Turn self-blame into fit diagnosis, preparation, recovery time, and controlled exposure. The caveat is "adaptation can happen, comfort is not guaranteed." |
| paleo_ai_centaur_thinking_20260504 | Paleo | modern-skill | AI era / centaur thinking | The best lesson target is not "use AI more" but "decide what cognition to keep human." This supports Psycle's no-outsourcing-learning rule. |
| paleo_dpm_action_planning_20260430 | Paleo | action-planning | DPM / daily pre-structure method | Planning is useful when it pre-decides the moment of action and fallback. Psycle can turn it into sequence-choice and tomorrow quest design. |
| paleo_coachability_feedback_20260502 | Paleo | growth-skill | Coachability / asking for feedback | Growth lessons should train seeking, receiving, and executing feedback separately; one generic "be open" lesson is too vague. |
| paleo_aq_agility_20260225 | Paleo | book-research synthesis | Agility quotient / adapting under change | Type-based framing can be useful when it helps users pick a compensating behavior; keep evidence posture lower when source is book synthesis. |
| paleo_goal_setting_meta_20221108 | Paleo | meta-analysis | Process goals and feedback | Use meta-analytic material for stronger rules: process goals, short cycles, feedback, and approach framing are better lesson anchors than outcome-only goals. |
| paleo_program_best_condition_20260502 | Paleo | program-practice | Highest condition program / repeated health practice | Knowledge is valuable only when adapted to food, sleep, movement, stress, and repeated tracking. |
| paleo_program_bootcamp_20260204 | Paleo | program-practice | 16-day bootcamp / trial extension | Behavior change needs enough time to see signal over noise. Psycle should not claim a one-lesson life change; it should use streaks to gather repeated trials. |
| paleo_roundup_sns_20260412 | Paleo | roundup | Small papers: SNS, medication, perfectionism | Interesting findings should be triaged; not every paper becomes a lesson. |
| paleo_weekend_roundup_work_20230917 | Paleo | roundup | Bullshit jobs, coaching focus, aroma memory | Roundups are useful as candidate pools and reject training: split each item into actionability, evidence strength, and domain fit before lesson writing. |
| paleo_mediterranean_cell_protein_20260506 | Paleo | mechanism novelty | Mediterranean diet and cell protein / health mechanism | Mechanism novelty can improve explanation, but if no safe daily action is clear, it should refresh an existing health lesson rather than become a new lesson. |
| paleo_protein_meta_20260428 | Paleo | supplement/meta | Protein meta-analysis / training support | Stronger evidence still needs population, dose, and target behavior. Psycle should avoid generic supplement advice without safety and domain review. |
| paleo_probiotics_exercise_20260425 | Paleo | supplement/boundary | Probiotics and exercise performance | A finding can be interesting but low lesson-worthiness if the daily action is narrow, commercial, or hard to verify. |
| paleo_nostalgia_recovery_20260508 | Paleo | emotional-recovery | Nostalgia and mental recovery | Emotional tools work best as specific state-shift practices, but Psycle needs caveats for rumination and individual differences. |
| paleo_interpretation_bias_20260508 | Paleo | cognition-loop | Bad things keep happening / interpretation habit | Strong Psycle fit when it turns repeated pain into loop detection, alternate interpretation, and next-action practice. |
| paleo_barefoot_sleep_20230928 | Paleo | weak-evidence practical trial | Barefoot walking / grounding and sleep | Strong Paleo pattern: odd everyday idea -> small pilot study -> multiple plausible mechanisms -> heavy caveat -> low-risk personal trial. Psycle should learn the caveat-to-safe-experiment move without inflating weak evidence. |
| paleo_nattokinase_supplement_20200908 | Paleo | supplement skepticism | Nattokinase supplement and blood pressure | A user question becomes evidence triage: small studies and modest markers are not enough to recommend a product. Psycle should route supplement topics to human review unless safety and effect size are clear. |
| paleo_paper_digital_reading_meta_20240126 | Paleo | meta-analysis / learning environment | Paper vs digital reading comprehension | Strong hook because it challenges a daily medium choice. Extraction: large meta-analysis -> subgroup/context caveat -> environment design action, not "digital is always bad." |
| paleo_child_fitness_grades_kobe_20210503 | Paleo | conflicting-findings resolution | Child fitness and school grades | Uses conflicting prior results to create curiosity, then narrows the answer by baseline subject difficulty and confound controls. Psycle should use "where the effect appears" as a practice target. |
| paleo_weekend_warrior_exercise_20240413 | Paleo | constraint-friendly behavior | Weekend-only exercise | Starts from a realistic time constraint, compares behavioral patterns, then converts evidence into a permission-giving rule with caveats. Psycle should model "good enough under constraints" lessons from this. |
| paleo_creatine_brain_meta_20230517 | Paleo | supplement/meta with population caveat | Creatine and cognitive function | Combines strong prior domain evidence with a newer brain-function meta-analysis, then limits confidence by small study count, heterogeneity, and population differences. Psycle should separate "promising" from "daily recommendation." |
| dlab_paleo_ai_average_deviation_20260331 | D-Lab internal Paleo | review-to-practice / AI creativity | AI use, average thinking, and deliberate deviation | Hook: AI may make the user ordinary in a way they can feel today. Insight: average output can be used as a baseline to avoid, twist, or reverse rather than as an answer. Evidence posture: review-based, short-term and future-model caveats remain. Life move: average-first, extreme-constraint, ignore-by-default loops. Psycle extraction: show the user an appealing AI answer, make them reject the average, then choose a deliberate deviation and reality check. |
| dlab_paleo_creator_audience_pressure_20260512 | D-Lab internal Paleo | qualitative study / creator mental health | Followers, audience pressure, and creator self-standard | Hook: "more followers = happier" is reversed into success creating a new pressure loop. Insight: large audiences can shift control from creator values to numbers, comments, and platform volatility. Evidence posture: qualitative interviews with successful creators, strong mechanism but not universal causal proof. Life move: reduce feedback exposure, separate critique from identity, distill a personal creation standard. Psycle extraction: train users to classify feedback as signal/noise and save one non-negotiable standard before checking metrics. |
| dlab_paleo_writing_impression_words_20260511 | D-Lab internal Paleo | experiment / communication impression | Wording confidence and perceived warmth or competence | Hook: tiny words in chat can make someone seem unsure, arrogant, or warm. Insight: stronger certainty words do not simply increase competence and some "obvious" framing can reduce warmth or respect. Evidence posture: student sample and online-board style experiment; role and culture caveats matter. Life move: choose wording by relationship role, not by maximum confidence. Psycle extraction: near-miss choices between hedging, overclaiming, and role-fit phrasing. |
| dlab_paleo_interpretation_bias_20260508 | D-Lab internal Paleo | daily diary / appraisal loop | Bad things keep happening and interpretation habit | Hook: "bad things keep happening to me" becomes testable as event frequency vs appraisal. Insight: distress can be amplified by negative appraisal, stronger reaction, and slower recovery even when positive events still occur. Evidence posture: large daily-event analysis, but not a one-cause explanation for all hardship. Life move: pause and ask whether this is fact, interpretation, or lingering mood. Psycle extraction: classify event/appraisal/reaction/recovery, then practice a 10-second interpretation check. |
| dlab_paleo_psych_textbook_skepticism_20260507 | D-Lab internal Paleo | critique / textbook accuracy | Psychology textbooks and clean-story bias | Hook: even textbooks can preserve simplified or outdated stories. Insight: education often favors clear stories over messy scientific disagreement, and deleting disputed topics can hide the correction process. Evidence posture: textbook-content analysis with time comparison; useful for skepticism, not proof that all textbooks are bad. Life move: ask "what debate is missing?" before accepting a neat claim. Psycle extraction: teach users to distinguish fact, hypothesis, debate, and oversimplified story. |
| dlab_paleo_health_stimulus_microdose_20260512 | D-Lab internal Paleo | mechanism-to-practice / health stimulus | Cell energy and controlled healthy stimulus | Hook: comfort can quietly remove useful training signals from daily life. Insight: cold, heat, nature, movement, and microbial contact can be treated as controlled stimuli rather than heroic hardship. Evidence posture: mechanism and synthesis with a clear dose caveat; too much stress becomes damage. Life move: add one safe micro-dose of natural stimulus. Psycle extraction: diagnose the missing stimulus, reject punishment framing, and save one tiny exposure action. |
| dlab_paleo_mitochondria_exercise_dose_20260510 | D-Lab internal Paleo | health mechanism / exercise dose | Mitochondria and exercise menu design | Hook: "exercise is good" becomes too vague once the target is cellular adaptation. Insight: different exercise intensities can signal different adaptations, so type, dose, and recovery matter. Evidence posture: mechanism-heavy health synthesis; high intensity should be spice, not daily punishment. Life move: choose a safe base movement plus a small stronger stimulus. Psycle extraction: make users pick between sustainable base, overdoing, and doing nothing. |
| dlab_paleo_nostalgia_state_shift_20260509 | D-Lab internal Paleo | emotion regulation / memory cue | Nostalgia as a mental recovery cue | Hook: remembering the past can be reframed from indulgence into a state-shift tool. Insight: specific memories may restore mood, meaning, or connection when used deliberately. Evidence posture: research-supported but bounded by rumination and individual differences. Life move: choose a concrete sensory memory cue, then check whether it restores or traps. Psycle extraction: train users to distinguish recovery nostalgia from looping nostalgia. |
| dlab_paleo_coachability_execution_20260508 | D-Lab internal Paleo | growth skill / feedback execution | Coachability and feedback follow-through | Hook: people can accept advice and still fail because the next action never happens. Insight: the growth gap often appears after feedback, in implementation and retry design. Evidence posture: series-level synthesis rather than one magic trait. Life move: convert one piece of feedback into the next test. Psycle extraction: require a next-step choice plus a fallback if the first attempt fails. |
| dlab_paleo_mediterranean_cell_mechanism_20260506 | D-Lab internal Paleo | mechanism novelty / diet pattern | Mediterranean diet and cellular pathway framing | Hook: diet is made more interesting by showing a possible inside-the-cell pathway, not just calorie advice. Insight: food patterns may shift biological processes in ways users cannot feel immediately. Evidence posture: mechanism novelty should not become a miracle-food claim. Life move: refresh food-quality behavior, not chase one supplement or single ingredient. Psycle extraction: route mechanism-rich findings into conservative pattern swaps unless safety and actionability are strong. |
| dlab_paleo_coachability_reception_20260506 | D-Lab internal Paleo | growth skill / feedback reception | Coachability and defensive reaction | Hook: useful feedback often feels like a threat before it feels useful. Insight: the first defensive reaction can block learning before the content is processed. Evidence posture: behavior-series synthesis with context caveats. Life move: separate the pain of hearing feedback from the usable signal. Psycle extraction: ask users to classify feedback as threat, signal, or noise before deciding the next action. |
| dlab_paleo_alcohol_cumulative_risk_20260505 | D-Lab internal Paleo | risk communication / health behavior | Low alcohol and long-term brain risk | Hook: "just a little" becomes interesting when the risk is cumulative rather than immediate. Insight: small repeated exposure can matter at population level even when one instance feels harmless. Evidence posture: risk communication with observational and individual-difference caveats. Life move: reduce frequency or set a default boundary instead of moralizing. Psycle extraction: train next-drink boundary choices with realistic lower-risk alternatives. |
| dlab_paleo_glucose_exercise_timing_20260504 | D-Lab internal Paleo | health timing / movement practice | Blood glucose control and exercise timing | Hook: anti-aging becomes concrete when it turns into what movement to do and when. Insight: timing, intensity, and consistency can change how exercise supports glucose control. Evidence posture: health mechanism with safety and population caveats. Life move: add a practical movement choice around the relevant daily moment. Psycle extraction: offer context-based choices such as short walk, strength work, or recovery-first option. |
| dlab_paleo_centaur_role_split_20260504 | D-Lab internal Paleo | modern skill / AI collaboration | Centaur thinking and human-AI role split | Hook: if AI gets smarter, the question becomes what cognition should remain human. Insight: useful human-AI work needs role allocation, not more blind outsourcing. Evidence posture: current AI research and forecast; uncertainty remains high. Life move: decide what to delegate, what to draft, and what to personally judge. Psycle extraction: make users classify tasks as human judgment, AI draft, or joint critique. |
| dlab_paleo_introvert_environment_fit_20260502 | D-Lab internal Paleo | person-environment fit / recovery | Introverts in extrovert-heavy environments | Hook: "I am weak" is reframed as a fit and energy-design problem. Insight: environment mismatch can drain energy even when the person is capable. Evidence posture: fit and adaptation framing; comfort alone is not the goal. Life move: prepare, limit exposure, and recover deliberately. Psycle extraction: let users choose one environmental repair rather than only naming a personality type. |
| dlab_paleo_coachability_feedback_seek_20260502 | D-Lab internal Paleo | growth skill / feedback seeking | Coachability and asking for feedback | Hook: waiting for feedback makes growth slow and random. Insight: faster learners actively request specific, usable feedback. Evidence posture: series-level synthesis; wording and relationship context matter. Life move: ask one better question instead of asking for general advice. Psycle extraction: near-miss practice between vague, defensive, and specific feedback requests. |
| dlab_paleo_stress_spending_breakpoint_20260501 | D-Lab internal Paleo | behavior loop / money stress | Stress spending and reward-loop breakpoints | Hook: stress shopping is framed as a predictable loop, not weak willpower. Insight: stress, loneliness, and reward seeking can shift buying toward relief rather than need. Evidence posture: mechanism fit with a caveat that not every purchase follows this path. Life move: pause at the cue and choose one break point. Psycle extraction: classify want, relief, or need, then practice a 10-second delay. |
| dlab_paleo_exercise_stress_boundary_20260430 | D-Lab internal Paleo | boundary update / stress coping | Exercise reduces stress but may not build toughness | Hook: a popular solution is sharpened by asking exactly which outcome it improves. Insight: state relief and trait resilience are different jobs. Evidence posture: boundary update that prevents overclaiming. Life move: use movement for immediate state shift while pairing it with another coping skill. Psycle extraction: make users select the right tool for relief, recovery, or long-term resilience. |
| dlab_paleo_dpm_precommit_day_20260430 | D-Lab internal Paleo | action planning / day design | One-day pre-structure method | Hook: action failure is reframed as a day-structure failure rather than laziness. Insight: decisions made before motivation drops can protect the target behavior. Evidence posture: method synthesis; it needs trial and review, not instant transformation claims. Life move: define tomorrow's trigger, slot, and fallback. Psycle extraction: turn intentions into sequence choices with a next-day repeat check. |
| dlab_paleo_art_money_survival_strategy_20260430 | D-Lab internal Paleo | work-life synthesis / creative tradeoff | Creative work, money, and survival strategy | Hook: creativity and money conflict because both values and constraints are real. Insight: survival strategy improves when users distinguish expressive work, commercial work, and support systems. Evidence posture: book-to-life synthesis; not a universal career prescription. Life move: choose one constraint or boundary that protects creative output. Psycle extraction: train tradeoff choices rather than romanticizing passion or optimizing only income. |
| dlab_paleo_protein_network_meta_20260429 | D-Lab internal Paleo | meta-analysis / supplement boundary | Protein type and training support | Hook: a simple gym question becomes messy when different studies disagree. Insight: the better question is not "which protein wins" but what population, dose, training level, and outcome are being compared. Evidence posture: network meta-analysis can rank options, but supplement advice still needs safety and context. Life move: ask the evidence and target-behavior question before recommending. Psycle extraction: train users to separate promising, proven, and not-for-me. |
| dlab_paleo_coachability_persistence_20260429 | D-Lab internal Paleo | growth skill / persistence | Coachability and sticking with awkward change | Hook: advice often feels ineffective because the first attempts get worse before they improve. Insight: persistence after feedback is a skill, not a personality compliment. Evidence posture: series synthesis; do not reduce growth to grit slogans. Life move: set a retry window before deciding the method failed. Psycle extraction: make users choose a retry rule after an uncomfortable first attempt. |
| dlab_paleo_beginner_protein_rct_20260428 | D-Lab internal Paleo | RCT / beginner specificity | Beginner training and protein timing | Hook: "protein works" becomes more useful when the user asks who it works for. Insight: beginner, trained, young, old, and athletic groups can respond differently. Evidence posture: RCT framing is stronger, but sample size, population, and duration limit generalization. Life move: match advice to training stage before acting. Psycle extraction: add population-fit checks before any health or training action. |
| dlab_paleo_roundup_memory_creativity_sns_20260427 | D-Lab internal Paleo | roundup triage / candidate pool | Mindfulness memory, games, creativity, and SNS | Hook: several small findings compete for attention in one entry. Insight: a finding is not lesson-worthy until it has a pain, mechanism, and practice loop. Evidence posture: roundup items need extra triage because depth is uneven. Life move: route each item to ignore, radar, refresh, or lesson. Psycle extraction: use roundups to train candidate selection, not to generate shallow lessons. |
| dlab_paleo_nac_supplement_gate_20260427 | D-Lab internal Paleo | supplement review / safety gate | NAC supplement evidence and dosage | Hook: a popular supplement sounds scientific because it has a plausible mechanism. Insight: mechanism and medical use do not automatically justify everyday self-use. Evidence posture: safety, dosage, contraindications, and target outcome must come before lesson conversion. Life move: ask whether this needs human review instead of a habit quest. Psycle extraction: hard-route supplement content away from automated lessons unless safety gates are met. |
| dlab_paleo_probiotics_performance_meta_20260426 | D-Lab internal Paleo | meta-analysis / narrow action | Probiotics and exercise performance | Hook: the gut-performance link is interesting but easy to oversell. Insight: statistically interesting does not mean broadly useful for a daily lesson. Evidence posture: meta-analysis with population and intervention heterogeneity. Life move: keep it as research radar unless a safe, clear behavior exists. Psycle extraction: score actionability separately from novelty. |
| dlab_paleo_exercise_sleep_dose_meta_20260425 | D-Lab internal Paleo | meta-analysis / behavior dose | Exercise dose for better sleep | Hook: "exercise helps sleep" is familiar, but dose and frequency make it usable. Insight: vague health advice becomes better when it turns into a sustainable weekly prescription. Evidence posture: meta-analysis, but small included samples and timing differences matter. Life move: choose a realistic sleep-support movement dose. Psycle extraction: convert evidence into minimum viable behavior plus repeat check. |
| dlab_paleo_relationship_checkpoints_20260425 | D-Lab internal Paleo | longitudinal research / relationship risk | Relationship success checkpoints | Hook: "will this relationship work?" becomes less vague when it is framed as observable signals. Insight: compatibility can be tested through patterns rather than one emotional moment. Evidence posture: longitudinal framing is useful but not deterministic. Life move: observe one pattern before escalating a conclusion. Psycle extraction: teach low-drama relationship checks instead of suspicion farming. |
| dlab_paleo_fasting_timing_circadian_20260424 | D-Lab internal Paleo | diet timing / circadian mechanism | Fasting timing versus fasting length | Hook: a popular diet method is reversed by asking when, not only how long. Insight: circadian biology can change the meaning of the same eating window. Evidence posture: diet timing evidence needs population and adherence caveats. Life move: try a safer timing tweak before harder restriction. Psycle extraction: distinguish intensity, timing, and sustainability in health lessons. |
| dlab_paleo_weight_stall_tracking_bias_20260424 | D-Lab internal Paleo | question answer / self-monitoring | "I eat little but do not lose weight" | Hook: a frustrating personal question becomes measurable instead of moralized. Insight: perceived intake and actual intake can diverge under normal human memory limits. Evidence posture: uses classic measurement-bias framing; avoid shame. Life move: run a short measurement audit before changing identity stories. Psycle extraction: turn self-blame into a 3-day observation task. |
| dlab_paleo_cell_energy_time_disruption_20260423 | D-Lab internal Paleo | mechanism chain / rhythm | Cell energy and time disruption | Hook: "I do everything right but feel bad" becomes a timing-system problem. Insight: sleep, meals, light, and activity timing can disturb energy regulation even when individual habits look healthy. Evidence posture: mechanism synthesis with broad-health caveats. Life move: stabilize one rhythm anchor. Psycle extraction: practice choosing the highest-leverage timing repair. |
| dlab_paleo_fasting_vs_calorie_rct_20260422 | D-Lab internal Paleo | RCT / diet comparison | Intermittent fasting versus calorie restriction | Hook: a trendy method is tested against a boring baseline. Insight: dramatic stories need direct comparison with simpler alternatives. Evidence posture: RCT is stronger, but adherence and population define the usable range. Life move: choose the easier sustainable constraint, not the trendiest method. Psycle extraction: train users to compare method against baseline before adopting. |
| dlab_paleo_whole_food_supplement_comparison_20260421 | D-Lab internal Paleo | mechanism comparison / food quality | Whole food versus supplement framing | Hook: "natural food is better" sounds obvious but needs mechanism and boundary. Insight: food matrix, protein amount, and context can change the effect of the same nutrient. Evidence posture: useful mechanism, not proof that supplements are useless. Life move: prefer food-pattern repair unless convenience or clinical need changes the case. Psycle extraction: use nuanced either/or choices instead of purity rules. |
| dlab_paleo_coachability_learning_desire_20260421 | D-Lab internal Paleo | growth skill / learning motivation | Coachability and willingness to learn | Hook: getting advice is worthless when the user is not actually ready to test it. Insight: learning desire is visible in how a person treats unfamiliar methods. Evidence posture: series synthesis; avoid blaming the learner. Life move: choose one new method to test with a small scope. Psycle extraction: diagnose closed, curious, and over-eager responses. |
| dlab_paleo_roundup_bias_hikikomori_sns_20260420 | D-Lab internal Paleo | roundup triage / social psychology | Appearance bias, withdrawal, and SNS behavior | Hook: social problems look unrelated until they are grouped as hidden bias and avoidance loops. Insight: roundup structure can reveal candidate patterns but not enough depth for direct lessons. Evidence posture: item-level evidence varies. Life move: select one recurring pain before writing a lesson. Psycle extraction: use roundup items as backlog seeds with separate worthiness scores. |
| dlab_paleo_strength_brain_aging_20260419 | D-Lab internal Paleo | longitudinal exercise / brain aging | Strength training and brain aging | Hook: muscle work becomes more interesting when it is linked to brain aging, not appearance. Insight: resistance training may matter through broader maintenance mechanisms. Evidence posture: longer study design is useful, but exercise safety and baseline ability matter. Life move: choose sustainable strength exposure. Psycle extraction: pair health benefit with safe-entry variants. |
| dlab_paleo_coachability_attention_roleplay_20260419 | D-Lab internal Paleo | growth skill / roleplay practice | Coach reproduction roleplay and attention to instruction | Hook: people can fail because they did not accurately receive the advice. Insight: repeating a coach's instruction exposes misunderstandings before action. Evidence posture: practice-method synthesis. Life move: restate instructions before improvising. Psycle extraction: add "say it back" practice for learning and work lessons. |
| dlab_paleo_supplement_comparison_misframing_20260418 | D-Lab internal Paleo | supplement comparison / question reframing | Creatine versus beetroot juice comparison | Hook: a direct comparison feels useful but may be the wrong question. Insight: different tools can serve different mechanisms, so "which is better?" may hide the real decision. Evidence posture: small cross-over designs require narrow interpretation. Life move: choose by job-to-be-done, not winner-takes-all ranking. Psycle extraction: train users to reframe comparison questions. |
| dlab_paleo_lifting_arousal_strategy_20260418 | D-Lab internal Paleo | experiment / performance cue | Shouting versus quiet focus in lifting | Hook: a small gym habit becomes a controllable arousal strategy. Insight: performance cues depend on context, embarrassment cost, and task demand. Evidence posture: specific exercise/sample boundaries. Life move: test one pre-action cue safely. Psycle extraction: make users select cue, context, and review signal. |
| dlab_paleo_scientific_thinking_quiz_20260417 | D-Lab internal Paleo | science literacy / quiz | Testing popular science claims | Hook: familiar "research says" claims become suspicious in a productive way. Insight: scientific thinking improves when users check context, exaggeration, and replication risk. Evidence posture: skepticism training, not a single content claim. Life move: ask what evidence would change the claim. Psycle extraction: build quiz items around claim strength and hidden caveats. |
| dlab_paleo_muscle_memory_review_20260416 | D-Lab internal Paleo | review / mechanism uncertainty | Muscle memory and retraining | Hook: a common gym belief is partly true but mechanistically uncertain. Insight: phenomenon, mechanism, and practical rule can have different confidence levels. Evidence posture: review with uncertainty; avoid pretending the mechanism is settled. Life move: use prior training as encouragement while rebuilding gradually. Psycle extraction: teach confidence separation inside one claim. |
| dlab_paleo_happiness_belief_malleability_20260416 | D-Lab internal Paleo | belief research / agency | Believing happiness can change | Hook: "I cannot become happier" is reframed as a belief that may affect behavior. Insight: fixed views of happiness can reduce attempts and opportunities for change. Evidence posture: belief-outcome association needs causality caveats. Life move: choose one small controllable mood action. Psycle extraction: train users to identify fixed-belief traps and one testable action. |
| dlab_paleo_ultra_processed_cell_energy_20260415 | D-Lab internal Paleo | mechanism chain / diet risk | Ultra-processed food and cell energy | Hook: familiar junk-food advice becomes sharper when linked to energy regulation. Insight: highly processed food can affect intake, inflammation, and metabolic load together. Evidence posture: broad evidence base but individual foods and dose matter. Life move: replace one repeat UPF cue with a less processed default. Psycle extraction: focus on one recurring food scene, not a total diet sermon. |
| dlab_paleo_caffeine_hypertrophy_boundary_20260415 | D-Lab internal Paleo | performance aid / boundary | Caffeine and muscle growth | Hook: a tool that improves workout feel may not improve the long-term outcome users care about. Insight: acute performance and hypertrophy are different endpoints. Evidence posture: limited-duration training study; do not overgeneralize. Life move: use caffeine for focus if useful, not as a muscle-growth guarantee. Psycle extraction: separate immediate effect from target outcome. |
| dlab_paleo_charisma_microexpression_practice_20260414 | D-Lab internal Paleo | social skill / practice sequence | Charisma and microexpression training | Hook: charisma is reframed from talent to trainable behavior. Insight: social influence can be decomposed into small observable signals. Evidence posture: skill-training synthesis; context and authenticity matter. Life move: practice one expression or listening cue in a real interaction. Psycle extraction: turn social advice into one small rehearsal and one transfer scene. |
| dlab_paleo_science_content_virality_20260413 | D-Lab internal Paleo | communication research / content design | Why accurate science content does or does not spread | Hook: good information failing to spread is a painful creator problem. Insight: accuracy, curiosity, emotion, and format compete in science communication. Evidence posture: content-analysis correlation; virality is not truth. Life move: improve one hook without distorting the claim. Psycle extraction: train "interesting but not overclaimed" framing. |
| dlab_paleo_relationship_ending_strategy_20260413 | D-Lab internal Paleo | relationship skill / exit strategy | Ending relationships with less damage | Hook: the end of a relationship is treated as a skill, not only a failure. Insight: exit patterns can reduce later harm when handled deliberately. Evidence posture: pattern classification; not a universal script. Life move: choose one honest, low-damage exit behavior. Psycle extraction: create safety-aware interpersonal choices with repair and boundary options. |
| dlab_paleo_cell_energy_glucose_control_20260412 | D-Lab internal Paleo | mechanism chain / glucose stability | Blood glucose as a cell-energy foundation | Hook: energy crashes and poor focus become a blood-sugar pattern, not just willpower. Insight: rapid spikes and drops can create downstream energy and oxidative stress problems. Evidence posture: mechanism synthesis; personal monitoring and medical boundaries matter. Life move: choose one glucose-stabilizing meal or movement cue. Psycle extraction: connect body signal recognition to one practical adjustment. |
| dlab_paleo_child_sns_brain_meta_20260411 | D-Lab internal Paleo | meta-analysis / child media risk | SNS, games, and children's brain outcomes | Hook: screen-time debate becomes more nuanced when SNS and games are separated. Insight: categories of digital use may have different risk profiles. Evidence posture: longitudinal meta-analysis is meaningful but causality and family context matter. Life move: distinguish risky scroll loops from bounded play or learning. Psycle extraction: avoid blunt bans; train category-specific media decisions. |
| dlab_paleo_procrastination_emotion_focus_20260411 | D-Lab internal Paleo | emotion regulation / productivity | Procrastination and emotion focus | Hook: "I lack motivation" is reframed as emotional avoidance. Insight: delaying tasks can be a mood-repair attempt that backfires. Evidence posture: behavioral research with context caveats. Life move: regulate the feeling before forcing the task. Psycle extraction: diagnose task emotion, choose a tiny entry, and return tomorrow. |

## Rejection Calibration Samples

These source shapes are useful for training the algorithm to say no or route to `research-radar` / `pain-backlog` / `human_review`.

| id | family | source shape | reject or route reason |
| --- | --- | --- | --- |
| reject_dlab_wine_subscription_20260421 | D-Lab | product/subscription | Interesting to members but not a Psycle lesson source unless it connects to a user pain, evidence posture, and behavior seed. Route to `ignore` for lesson generation. |
| reject_paleo_program_announcement_only | Paleo | program announcement | Operational or sales content is not automatically lesson-worthy. Extract "practice duration" only if it improves the algorithm; do not turn it into content. |
| reject_paleo_mechanism_without_action | Paleo | mechanism novelty | A biological mechanism with no safe daily behavior should become `research-radar` or refresh material, not a new core lesson. |
| reject_paleo_supplement_commercial_risk | Paleo | supplement/product | Supplement topics need safety, dosage, contraindication, and commercial-risk review; default to `human_review` rather than automated lesson generation. |
| reject_dlab_threat_hook_without_repair | D-Lab | strong social-risk hook | Hooks like enemy/frenemy/blame are powerful but can increase suspicion or shame. Accept only if the lesson teaches repair, boundary, or agency. |
| reject_roundup_item_without_transfer | Paleo | roundup item | A small paper with no transfer scene or tomorrow action remains a candidate note, not a lesson. |
| reject_paleo_product_drop_without_learning_job | Paleo | product/restock announcement | Product drops, sales notices, and restock announcements are not learning-experience samples unless they expose a transferable behavior-change structure. Route to ignore for lesson calibration. |
| reject_dlab_paleo_subscription_sales_page | D-Lab | product/subscription | A paid product, restock, or price notice can be important to members but should not become a Psycle lesson unless it exposes a non-commercial behavior principle. |
| reject_dlab_paleo_program_recruitment_page | D-Lab | program recruitment | A program recruitment page may imply duration and practice design, but the sales flow itself is not evidence and should not be copied into lessons. |
| reject_paleo_roundup_topic_without_scene | Paleo | roundup topic | Roundup items with no concrete user scene, action, or return point should stay in `research-radar` until a recurring pain and practice loop are clear. |
| reject_paleo_health_claim_without_safety_review | Paleo | health claim | Health, supplement, diet, and exercise claims must not enter automated lessons without safety caveats, population boundaries, and human review when needed. |

## Coverage Status

Current coverage is enough to define a **calibrated_v1_candidate lesson algorithm** and to rewrite benchmark lessons across a limited set of domains: mental, money, work, study, health, relationships, and AI-assisted learning.

It is also enough to make small generator changes that are checked against benchmark lessons and human review.

It is not enough to call the whole app "solved", to claim D-Lab/Paleo essence has been fully extracted, or to run a blind generator-wide rewrite. The first D-Lab-internal Paleo minimum gate is now satisfied, but before treating the generator as mature, add:

- More D-Lab-internal Paleo samples beyond the 50-sample target when entering new domains or risky content areas.
- At least 10 Psycle playtest notes from real lesson runs, including boredom, confusion, and "article would be better" reactions.
- Transfer / helpful / repeat data from completed lessons.
- More rejection examples from medical, supplement, finance, and relationship-risk topics.
- Domain-specific safety rules for health, money, addiction, and interpersonal conflict.

Until then, generator-wide changes should be labeled `calibrated_v1_candidate`, not final.

## 50-Sample Synthesis

The 50 D-Lab-internal Paleo samples show that the useful reference is not the topic list. The reusable learning experience is this pattern:

1. Start with a felt contradiction, not a school subject.
   - Weak: "Learn about procrastination."
   - Strong: "Why do I delay even when I know it will hurt me later?"
2. Make the user slightly wrong before teaching.
   - The lesson should expose a normal but incomplete belief: willpower, talent, motivation, "more is better", "AI is the answer", "just avoid stress."
3. Give one mechanism that changes the user's view.
   - The newness should come from a causal loop, boundary condition, comparison, hidden cost, or evidence caveat.
4. Treat evidence critique as part of the fun.
   - A lesson is stronger when it says what the finding does not prove, who it may not apply to, and what would be an overclaim.
5. Convert the insight into one daily scene.
   - Do not leave users with "remember this." Leave them with one moment: message before sending, snack after work, feedback after a meeting, AI answer before accepting it.
6. Practice judgment through near misses.
   - The main question type should make plausible wrong answers tempting: overdoing, moralizing, outsourcing, vague planning, trend-chasing, self-blame, or all-or-nothing thinking.
7. Preserve continuity by turning the same mechanism into variants.
   - One mechanism can return across money, work, health, relationships, and AI if the scene changes and the rule boundary is retested.

Hard reject gates from the samples:

- Novelty without a safe daily action stays in `research-radar`.
- Product, supplement, medical, finance, and relationship-risk topics need extra safety review.
- A strong fear hook is rejected unless the lesson also teaches repair, boundary, or agency.
- A roundup item is not a lesson until it has a recurring pain, mechanism, evidence posture, and practice loop.
- A lesson that only explains the article is rejected; Psycle must make the user judge, choose, transfer, and return.

## 50-Sample Second-Pass: Popularity / Meaning Synthesis

The first V2 synthesis extracted lesson mechanics. That was useful, but it underfit why people repeatedly choose D-Lab / Paleo instead of reading a neutral textbook, a generic self-help tip, or a short summary. Across the D-Lab-internal Paleo samples, the repeatable demand is not "more information." It is a compact feeling of:

- "This names a private weakness or confusion I already felt."
- "My normal explanation is incomplete."
- "There is a hidden operating rule behind the behavior."
- "The evidence is interesting, but not sold as fake certainty."
- "I now have one lever that lets me act with less shame and more judgment."
- "If I keep following this series, I will collect more lenses like this."

This is why `dlab_paleo_ai_average_deviation_20260331`, `dlab_paleo_coachability_reception_20260506`, `dlab_paleo_stress_spending_breakpoint_20260501`, `dlab_paleo_scientific_thinking_quiz_20260417`, `dlab_paleo_interpretation_bias_20260508`, and `dlab_paleo_centaur_role_split_20260504` are stronger references than a flat topic summary. They do not merely explain AI, feedback, spending, science literacy, interpretation, or human-AI roles. They make the user suspect a hidden rule in their own judgment, then give a bounded way to test or use that rule.

### Popularity / Meaning Model

Use this model when judging whether Psycle is becoming a meaningful big app rather than a pile of short lessons.

1. **Personal vulnerability hook**
   - The opening touches a small embarrassment, fear, self-suspicion, or recurring confusion.
   - Weak: "Let's learn about compensatory consumption."
   - Strong: "Why do I buy something after being ignored, even when I do not truly want it?"
2. **Status / intelligence threat**
   - The user should feel a precise, recoverable threat: "I may be ordinary, defensive, overconfident, avoidant, or easy to manipulate."
   - This is not shame. It is the energy that makes the lesson matter.
3. **Protective reframing**
   - The lesson reduces moral blame while preserving responsibility.
   - Good D-Lab/Paleo-like content says, "This pattern is understandable, and now you can intervene."
4. **Hidden operating rule**
   - The user leaves with a reusable rule that predicts future mistakes.
   - Examples: "average AI output is a baseline to deviate from", "feedback first feels like threat before signal", "stress buying can be relief-seeking, not desire", "a neat scientific story may be hiding the debate."
5. **Trust-building caveat**
   - The caveat is not legal padding. It is part of why the source feels intelligent.
   - The user should learn claim strength, usable range, and what would be an overclaim.
6. **Agency-restoring move**
   - The final action should be a lever: classify, pause, compare to baseline, ask a better question, choose the safer trial, or preserve human judgment.
   - "Be careful" and "remember this" are not levers.
7. **Series identity**
   - The user returns because each lesson gives another lens in the same judgment OS.
   - A strong Psycle unit should feel like collecting usable lenses for money, work, health, relationships, learning, and AI, not consuming isolated tips.

### Psycle Big-App Implication

Psycle should be a **lens acquisition system**: a product where users repeatedly acquire named judgment lenses, test them in daily life, and slowly update their personal operating system.

The app is not big because it has many topics. It becomes big when the same loop can handle many domains:

`private confusion -> hidden rule -> evidence boundary -> self-diagnosis -> agency lever -> tomorrow test -> later refresh`

This means a lesson can score well structurally and still fail human quality if it does not create personal stakes, a memorable hidden rule, and a reason to return for the next lens.

### MEANING_PARITY_REJECT

Reject or rewrite any candidate lesson, even if it passes mechanical checks, when one of these is true:

- No personal vulnerability hook: the user can understand the topic without feeling it touches their life.
- No status / intelligence threat: nothing is at stake except learning a fact.
- No protective reframing: the lesson either shames the user or removes agency.
- No hidden operating rule: the takeaway is only a slogan, label, or tip.
- No trust-building caveat: evidence limits feel like compliance text instead of intellectual honesty.
- No agency-restoring move: the final action is vague, passive, or not tied to the diagnosis.
- No series identity: after finishing, there is no reason to believe the next Psycle lesson will add another useful lens.

## Resulting Psycle Lesson Algorithm V2

1. Select one recurring life pain and one concrete moment where it appears.
2. Name the user's likely default explanation.
3. Open with an "is that really why?" question that makes the default explanation feel incomplete.
4. Teach one mechanism, reversal, boundary condition, or hidden cost.
5. State the evidence posture: claim strength, limits, confounds, and what not to overclaim.
6. Diagnose the user's current pattern in that scene.
7. Ask a near-miss judgment question where the tempting wrong answer reveals the old pattern.
8. Transfer the same mechanism to a second scene.
9. Give a fallback for when the user fails or the condition is not safe.
10. Save one tomorrow micro-experiment that takes under 60 seconds to start.
11. Use completion, transfer, helpfulness, repeat, and refresh data to decide whether the lesson deserves mastery variants.

## Non-Goals

- Do not require every lesson to cite D-Lab or Paleo.
- Do not summarize D-Lab videos or Paleo articles as lesson content.
- Do not copy wording, examples, tests, chapter order, or personality.
- Do not treat source popularity as lesson-worthiness.
