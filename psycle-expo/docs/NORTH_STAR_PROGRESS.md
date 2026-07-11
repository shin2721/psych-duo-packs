# Psycle North Star Progress

This file is a handoff snapshot for future threads. It is not the source of product rules.

Rule source:

- `docs/PRINCIPLES.md`
- `docs/CONTENT_SYSTEM_SPEC.md`
- `docs/ENGAGEMENT_PRINCIPLES.md`
- `docs/BIGAPP_ROADMAP.md`

## Current North Star

Psycle should combine:

- Paleo-like research discovery and evidence critique
- D-Lab-like daily life improvement through small usable lessons
- Duolingo-like continuity and gamification that supports transfer, repeat, and long-term learning

The product should not become only a psychology quiz app, only a research digest, or only a gamified habit app.

## Update Protocol

Update this file whenever a task changes any of these areas:

- North Star interpretation
- research / evidence / content-intake flow
- lesson design quality gates
- analytics for helpful / transfer / repeat
- gamification or engagement loops that affect long-term learning

Preferred command:

```bash
npm run progress:north-star:note -- --summary "Short update" --changed "What changed" --verified "What passed" --remaining "What still needs work"
```

Before finishing relevant work, run:

```bash
npm run check:north-star-progress
```

## Current Assessment

As of this snapshot:

- Product philosophy alignment: about 80%
- Implementation foundation: about 65-70%
- Self-improving big-app operating loop: about 40-50%

Interpretation:

- The direction is now coherent.
- The minimum data paths and contracts exist.
- The system is not yet self-improving because real intake, real outcome data, and refresh operations still need to run repeatedly.

## What Is Already In Place

### Research / Evidence

- `Psycle North Star` is defined in `docs/PRINCIPLES.md`.
- `Research Critique Lens` is defined in `docs/PRINCIPLES.md`.
- Research findings should pass through `data/content-intake/research-radar.json`.
- Lesson candidates should pass through `data/content-intake/lesson-candidate-backlog.json`.
- Recurring pains should be captured in `data/content-intake/pain-backlog.json`.
- `npm run content:intake:validate` validates the intake stores.
- `npm run content:intake:add-pain -- <payload.json>` adds pain intake.
- `npm run content:intake:add-research -- <payload.json>` adds research radar items.
- `npm run content:intake:add-candidate -- <payload.json>` adds scored lesson candidates.

### Lesson Design

- Production lesson questions now require `claim_id`.
- `npm run validate:lessons` validates lesson structure.
- Lessons are expected to have `lesson_job`, `done_condition`, and `takeaway_action` through metadata.
- Lesson success should be framed as `recognize / choose / try / return`, not merely `understand`.

### Measurement

- Lesson completion alone must not be treated as lesson quality.
- Minimum quality events are:
  - `lesson_outcome_feedback`
  - `lesson_transfer_check`
  - `lesson_repeat_check`
- These events are wired from lesson completion / lesson flow code.

## What Is Still Missing

- Real recurring pain data needs to be entered into `pain-backlog`.
- Real research findings need to be entered into `research-radar`.
- Lesson candidates need real worthiness scoring, not just empty storage.
- Analytics output needs to be reviewed after real use.
- Evidence grades need stricter distribution; avoid everything drifting toward `silver`.
- Completion screen transfer UI needs final Simulator verification after reaching the completion screen.
- Existing Simulator warning about duplicate React keys should be investigated separately:
  - `Encountered two children with the same key`

## How To Continue In A New Thread

Start with:

1. Read `docs/PRINCIPLES.md`, especially `Psycle North Star` and `Research Critique Lens`.
2. Read this file for current progress.
3. Run `npm run content:intake:validate`.
4. Run `npm run validate:lessons`.
5. Check current git diff before making broad changes.

Useful next work:

- Add 3-5 real `pain-backlog` items from actual user problems.
- Add 3-5 real `research-radar` items and critique them.
- Convert only the strongest items into scored `lesson-candidate-backlog` records.
- Review whether existing lessons need refresh / mastery variants before creating new core lessons.
- Verify `lesson_outcome_feedback`, `lesson_transfer_check`, and `lesson_repeat_check` in Analytics Debug or runtime logs.

## Update Log

### 2026-05-26 - Broaden centaur thinking into normal Codex development

- Changed: Added a concise Codex development loop to AI_MODEL_OPERATING_MODEL and made START_HERE point to the five required project sources in order.
- Verified: `git diff --check` and `npm run check:north-star-progress` passed on 2026-07-11.
- Remaining: This changes operating discipline only; product/runtime quality still requires task-specific verification.

### 2026-05-26 - Clarify Codex-only centaur workflow

- Changed: Updated AI_MODEL_OPERATING_MODEL with Current Codex-Only Mode: source-modeling, raw-pilot, critic, implementation, and runtime/owner-judgment passes must stay separate when Codex is the only active AI operator. Marked ANTIGRAVITY_PLAYBOOK as optional/future, not the current default.
- Verified: `git diff --check` and `npm run check:north-star-progress` passed on 2026-07-11.
- Remaining: This improves operating discipline but does not prove lesson quality until raw pilot and Simulator review.

### 2026-05-16 - Document AI model operating model

- Changed: Added docs/AI_MODEL_OPERATING_MODEL.md and linked it from PRINCIPLES, CONTENT_SYSTEM_SPEC, and START_HERE. The doc defines Claude/Gemini/GPT-Codex role boundaries, update triggers, benchmark-before-switch rules, and the invariant that models can change but Psycle contracts do not.
- Verified: The document is linked from the canonical entry points; `git diff --check` and `npm run check:north-star-progress` passed on 2026-07-11.
- Remaining: Actual lesson quality remains unproven until raw pilot and Simulator review.

### 2026-05-16 - Organized the large Psycle worktree into reviewable buckets.

- Changed: Updated worktree-status-buckets.py so current changes no longer fall into an unowned other bucket. Added workspace_agent_guidance, north_star_quality_system, local_artifacts, and clearer ownership for auth, lesson runtime, and test setup. Updated WORKTREE_CLEANUP, COMMIT_HYGIENE, and REPO_HYGIENE with the current 2026-05-16 cleanup snapshot, commit split order, artifact handling, and the rule that an organized tree must have no other bucket.
- Verified: python3 scripts/worktree-status-buckets.py prints no other bucket; npm run lint:lesson-authoring OK; npm run content:intake:validate OK; npm run content:lesson-quality:audit OK with human-quality warnings preserved; npm run validate:lessons OK; npm run typecheck OK; targeted Jest 8 suites / 32 tests OK; git diff --check OK.
- Remaining: The worktree is organized but still intentionally dirty. Next cleanup step is to stage/review one bucket at a time, starting with workspace_agent_guidance, north_star_quality_system, local_artifacts, and hygiene_tooling before touching UI or generated lesson data. Simulator product-quality replay is still required for screen_shells and generated_data.

### 2026-05-15 - Finished docs cleanup for principles, audits, and authoring templates.

- Changed: Trimmed PRINCIPLES.md from 2400+ lines to about 900 by removing duplicated runtime/ops contracts and replacing them with an Operational Contract Index. Established PRINCIPLES.md as product principles / lesson-quality contracts and CONTENT_SYSTEM_SPEC.md as seed/claim/package/runtime/support/readiness/ops contracts. Updated authoring, content-guideline, operations, generator, reference-sample, and canonical-source checker docs/scripts to use the split instead of saying PRINCIPLES is the only source for everything.
- Verified: npm run content:lesson-quality:audit OK; npm run lint:lesson-authoring OK; targeted lessonPrincipleEnforcement Jest OK; rg confirmed old 'single canonical source for everything' wording is gone except the checker name/output; check:north-star-progress was OK before this note.
- Remaining: Some older docs still reference PRINCIPLES for quality details, which is correct; broader repo hygiene can later rename the checker script if desired, but behavior now enforces the split.

### 2026-05-15 - Clarified principles/audits/templates separation to prevent rule sprawl.

- Changed: PRINCIPLES.md now explicitly separates 原則, 監査, and 型; Question before lens was folded back into Paleo-to-Practice and kept as an opening audit gate instead of a new top-level core principle. The lesson quality audit script now states it is a regression net, not proof of interestingness.
- Verified: npm run content:lesson-quality:audit OK; npm run check:north-star-progress OK.
- Remaining: PRINCIPLES.md is still large and carries older duplicated operational sections; further cleanup should move operational specs to CONTENT_SYSTEM_SPEC.md only after preserving audit markers and references.

### 2026-05-15 - Rewrote study_l01 against the Paleo gap instead of only adding rules.

- Changed: study_l01 now carries the raw pilot's stronger sign-authority metaphor through Q2-Q9: night feelings are information, but buying/sending/adopting is a contract/signature to delay. Choices now emphasize hidden transaction detection, safe caveats, self-diagnosis, and transfer to shopping, LINE, and AI planning.
- Verified: JSON parse OK; npm run content:lesson-quality:audit OK; npm run validate:lessons OK; targeted Jest suites OK. Simulator verified new Q2 and Q3 text live; screenshots: /tmp/psycle-study-l01-sign-authority-q2.png and /tmp/psycle-study-l01-sign-authority-q3.png.
- Remaining: Still not declared Paleo-level product quality. Next owner review should play all 8 runtime questions and judge whether the final screen creates a reason to return, not just whether the opening is stronger.

### 2026-05-15 - Fixed the lesson intro answer leak that the previous question-before-lens change missed.

- Changed: LessonIntroView no longer shows research_finding, critical_caveat, or takeaway_action before the first question; the intro now keeps only the surprising question and usable scene. Added a principle-enforcement test so the leak does not return.
- Verified: Simulator shows study_l01 intro with only 今日の問い, 扱う場面, and start CTA. Screenshot: /tmp/psycle-study-l01-intro-question-only.png. Jest lessonPrincipleEnforcement + lessonMetadataContract passed; content lesson-quality audit passed; git diff --check passed.
- Remaining: The full lesson still needs human playthrough quality judgment; this fixes premature answer disclosure, not the entire content taste problem.

### 2026-05-15 - Runtime confirmed the question-before-lens study_l01 opening is visible in Simulator.

- Changed: No additional code changes after the gate rewrite; this note records live Simulator verification.
- Verified: Simulator shows study_l01 intro with new surprising_question and Q1 concrete mystery: 23:40 scene, ordinary explanation choices, no Q1 diagnostic type labels. Screenshot: /tmp/psycle-study-l01-question-before-lens-q1.png.
- Remaining: Still needs human quality judgment beyond machine gates: whether the new opening is actually interesting enough and whether the full 8-question runtime arc sustains the hook.

### 2026-05-15 - Added a question-before-lens gate after repeated study_l01 quality failures.

- Changed: PRINCIPLES.md now requires QUESTION_BEFORE_LENS_GATE; audit now rejects study_l01 Q1 lens/type leaks; study_l01 opens with concrete mystery and ordinary explanation before the information/contract lens.
- Verified: JSON parse OK; npm run content:lesson-quality:audit OK; npm run validate:lessons OK; targeted lesson metadata/content Jest suites OK.
- Remaining: Machine gates still cannot prove the lesson is interesting; next runtime playthrough must judge whether the opening now creates curiosity before diagnosis.

### 2026-05-14 - study_l01を夜の値札レンズで再構成

- Changed: Raw Pilot 002を追加し、study_l01を夜の感情=情報、夜の行動値札=契約として見分ける10問へ改稿。metadataとlesson-quality audit benchmarkも値札/見積もり表現に合わせた
- Verified: JSON parse OK; npm run validate:lessons OK; npm run content:lesson-quality:audit OK; targeted Jest 14 passed
- Remaining: SimulatorでQ1-Q8/Q10相当まで実プレイし、夜の値札レンズが画面上で退屈になっていないかを人間評価する。machine scoreは引き続きhuman_quality_unproven

### 2026-05-14 - lesson quality gateの優先順位をRaw insight firstへ反転

- Changed: PRINCIPLESのCore Operating PrinciplesにRaw insight firstを追加し、RAW_INSIGHT_FIRST_GATEをRaw Insight Pilot Before Lessonへ明記。lesson-quality auditの必須markerにも追加。
- Verified: npm run content:lesson-quality:audit OK; git diff --check OK
- Remaining: 次のlesson rewriteでは10問化前にraw pilot単体のhuman taste checkを通す。machine scoreは構造ゲートとしてのみ扱う。

### 2026-05-14 - study_l01の実ランタイム8問表示に合わせ、最終アンカーを8問目へ統合

- Changed: Simulator実プレイで10問中8問だけ表示されることを確認。Q8にLINE/AI採用場面と『情報は受け取る。契約は明日に回す』の転移アンカーを統合。
- Verified: JSON parse OK; npm run content:lesson-quality:audit OK; git diff --check OK; SimulatorでQ1-Q7まで新レッスン表示を確認
- Remaining: Q8修正版をSimulatorで再ロードして最終アンカー表示を確認する

### 2026-05-14 - 原液『夜の自分に人生の決定権を渡すな』を study_l01 の実レッスンへ変換

- Changed: study_l01をAI平均案から、夜の感情を情報/契約に分ける10問レッスンへ差し替え。metadataとlesson-quality benchmarkも同レンズに更新。
- Verified: JSON parse OK; npm run content:lesson-quality:audit OK; jest lessonMetadataContract/firstLessonExperienceContent 14 passed; check:north-star-progress OK
- Remaining: Simulatorで実レッスンとして通し、原液の面白さが画面上で残っているかを人間評価する

### 2026-05-14 - Started raw insight pilot workflow before lesson conversion.

- Changed: Added docs/LESSON_PILOT_RAW.md with Pilot 001 '夜の自分に、人生の決定権を渡すな' and added Raw Insight Pilot Before Lesson to PRINCIPLES so boring raw ideas cannot be rescued by 10-question mechanics.
- Verified: Raw pilot written as standalone content; targeted principle update prepared for git diff check.
- Remaining: Human taste check the raw pilot before converting any part into lesson JSON; do not push it into XP/quiz/UI unless the raw piece itself feels worth reading.

### 2026-05-14 - Created one best-shape Psycle lesson around AI average-answer judgment.

- Changed: Rewrote study_l01 as an AI learning judgment lesson: use AI output as an average baseline, keep one human judgment, and practice 'where is this average-like?' for 10 seconds. Updated study metadata and added study_l01 to the lesson-quality audit benchmark set.
- Verified: node JSON parse for study_l01; npm run content:lesson-quality:audit; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts src/__tests__/lessonMetadataContract.test.ts
- Remaining: Runtime preview/playthrough in Simulator for the study course; machine audit still marks human_quality_unproven until real play confirms the lesson feels useful.

### 2026-05-14 - money_l01 was reworked again after the recovery-invoice framing still felt weak.

- Changed: Moved the lesson from a named metaphor to a concrete judgment lens: stress can add a self-repair premium to a product, and the user tests it with 'Would I still want the product tomorrow at noon?' Updated metadata, audit expectations, and first-lesson tests.
- Verified: npm run content:lesson-quality:audit; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts; Simulator preview shows self-repair premium and tomorrow-noon takeaway.
- Remaining: Full 10-question human playthrough is still required; machine score remains human_quality_unproven, and the course preview is only a partial runtime proof.

### 2026-05-14 - money_l01 was rewritten as a Judgment OS lens rather than a minor copy tweak.

- Changed: Reframed the stress-shopping lesson around the 'recovery invoice' lens, updated metadata/takeaway, and aligned first-lesson tests plus lesson-quality audit expectations.
- Verified: npm run content:lesson-quality:audit; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts; npm run check:north-star-progress
- Remaining: Reload dev-client in Simulator and play through money_l01 to judge whether the recovery-invoice lens creates real personal stakes and learning retention, not just passing machine structure.

### 2026-05-14 - D-Lab/Paleo sample synthesis was tightened from lesson mechanics to popularity/meaning extraction.

- Changed: Added second-pass popularity/meaning synthesis, Judgment OS principle, MEANING_PARITY_REJECT, and Meaning Parity audit markers.
- Verified: npm run content:lesson-quality:audit
- Remaining: Rewrite benchmark lessons against the new meaning model and validate in Simulator playthrough; machine scores remain human_quality_unproven until real play confirms personal stakes and reason to return.

### 2026-05-13 - Popularity / Desire版money_l01をSimulatorで通し確認

- Changed: money_l01を『これは物欲？ それとも気分消し？』へ収束する形で実プレイし、introからcompletionまで同じ見抜き軸が画面に出ることを確認した
- Verified: Simulator dev bundle loaded money_l01 with questionCount 10 and reached completion; lesson_complete and lesson_repeat_check logged; static validation bundle remained green
- Remaining: Q6の診断選択はcompletionに個別反映されていないため、次は診断結果をruntimeで保持して完了画面と後半フィードバックへ返す

### 2026-05-13 - money_l01をPopularity / Desire仮説で再試作

- Changed: D-Lab/Paleoの人気要因を見抜いた感・自分の話だ感・明日少し有利になる小技としてPRINCIPLESに追加し、money_l01を『これは物欲？ それとも気分消し？』の一文に収束する10問へ書き直した
- Verified: JSON parse、targeted Jest、validate:lessons、content:lesson-quality:audit、typecheck、check:north-star-progress passed
- Remaining: 次はSimulator実プレイで、頭に残る一文・テンポ・診断の効き・報酬感が前回より上がったかを人間評価する

### 2026-05-13 - money_l01 runtime playthrough now uses the full 10-question benchmark lesson

- Changed: Adjusted lesson runtime pacing so high-target benchmark intro lessons are not shortened by first_session_lesson_size, and preserved authored order when all questions are used
- Verified: Simulator dev bundle loaded money_l01 with questionCount 10 and reached completion; targeted Jest, validate:lessons, content:lesson-quality:audit, typecheck, and check:north-star-progress passed
- Remaining: Reanimated render-time shared value warnings and guest billing UUID sync warning still appear in Metro logs; reward payoff is usable but still not Duolingo-level compelling

### 2026-05-13 - Lesson Algorithm V2でmoney_l01を1本作り直した

- Changed: data/lessons/money_units/money_l01.ja.jsonを10問のストレス買い判断練習として再構成し、lib/lesson-data/lessonMetadata.tsのlesson_job/target_shift/done_conditionもV2に合わせた
- Verified: npm run validate:lessons; npm run content:lesson-quality:audit; npm exec -- jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts が通過
- Remaining: 次はSimulatorでmoney_l01を実プレイし、記事を読むよりPsycleで判断練習する価値があるか、テンポ・面白さ・報酬感を評価する

### 2026-05-12 - 50本サンプルからLesson Algorithm V2を明文化した

- Changed: docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.mdに50-Sample SynthesisとResulting Psycle Lesson Algorithm V2を追加し、audit-reference-calibration.jsで50本がアルゴリズム抽出に変換されていることも監査するようにした
- Verified: npm run content:reference-calibration:audit が93 calibration / 50 D-Lab-internal Paleo / 11 rejection / 104 totalで通過
- Remaining: 次はLesson Algorithm V2でbenchmark lessonを1本書き直し、Simulator実プレイで記事を読むより価値があるか検証する

### 2026-05-12 - D-Lab本体Paleo本文確認サンプルを50/50まで拡張した

- Changed: docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.mdを93 calibration / 50 D-Lab-internal Paleo / 11 rejection / 104 totalに拡張し、docs/PRINCIPLES.mdとaudit-reference-calibration.jsのD-Lab内Paleo必須数を50本へ引き上げた
- Verified: npm run content:reference-calibration:audit が93 calibration / 50 D-Lab-internal Paleo / 11 rejection / 104 totalで通過
- Remaining: 次は50本の抽出からPsycle固有のlesson algorithmを再設計し、1本のbenchmark lessonを記事より価値がある体験として書き直してSimulator実プレイで確認する

### 2026-05-12 - D-Lab本体のPaleo本文確認サンプルを20/20まで増やした

- Changed: docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.mdにD-Lab internal Paleoの本文確認済み15サンプルを追加し、拒否サンプルの数え方も実サンプルだけに修正した
- Verified: D-Lab本体のchannel_owner=paleo検索データから本文フィールドを確認し、npm run content:reference-calibration:audit が63 calibration / 20 D-Lab-internal Paleo / 11 rejection / 74 totalで通過
- Remaining: 次はこの20サンプルからPsycle用lesson algorithmをさらに厳しくし、benchmark lessonを書き直してSimulator実プレイで記事より価値があるか確認する

### 2026-05-12 - Tighten D-Lab-internal Paleo calibration gate

- Changed: Separated D-Lab internal Paleo title-captured items from body-inspected samples, added 5 body-inspected D-Lab Paleo reductions from the live D-Lab Paleo tab, and made the reference calibration audit require 20 body-inspected D-Lab-internal Paleo samples before algorithm maturity.
- Verified: Live Safari/D-Lab inspection confirmed the channel_owner=paleo tab and 8603 Paleo items; npm run content:reference-calibration:audit now fails intentionally at 5/20 D-Lab-internal Paleo body-inspected samples instead of passing on generic/title-heavy coverage.
- Remaining: Inspect at least 15 more D-Lab-internal Paleo article bodies, then rerun the stricter reference calibration audit before treating the lesson algorithm as mature or using it for generator-wide rewrite.

### 2026-05-12 - Raise D-Lab/Paleo calibration to 50+ sample gate

- Changed: Added REFERENCE_SAMPLE_50_GATE, reference calibration audit command, and expanded the calibration inventory to 51 inspected/weak-source samples while keeping the algorithm marked as candidate until D-Lab-internal Paleo coverage is stronger.
- Verified: npm run content:reference-calibration:audit passed with 43 calibration samples, 8 rejection samples, 51 total; npm run content:lesson-quality:audit passed.
- Remaining: Need deeper D-Lab-internal Paleo sampling and then one signature lesson rewrite/playthrough based on the stronger extracted patterns, not a generator-wide rewrite yet.

### 2026-05-12 - Runtime playthrough submitted for mental_l01

- Changed: Completed the missing Simulator/Computer Use proof pass for mental_l01 from intro through completion. Treated runtime feel as the submission target, not only machine audit.
- Verified: Computer Use reached lesson intro, Q1-Q10, and completion screen. The lesson now shows a clear daily question, research finding, caveat, diagnosis, swipe judgment, safe-use boundary, 10-second action, and completion takeaway.
- Remaining: Do not call Psycle 100% yet. Runtime feel is materially improved but still text-heavy after answers; some result cards push the CTA low on screen; reward payoff is useful but not Duolingo-level compelling. Metro logs also showed repeated Reanimated render-time shared value warnings and a dev billing UUID sync warning.

### 2026-05-12 - Lesson quality algorithm submission fixed

- Changed: Submitted the current operating gate: benchmark lessons must pass Lesson Quality Algorithm, Quality Score, North Star Experience Score, and content intake handoff before being treated as acceptable.
- Verified: npm run content:lesson-quality:audit passed with mental_l01 and money_l01 at Quality Score 16/16 and North Star Experience Score 100/100; npm run content:intake:validate passed; npm run check:north-star-progress passed.
- Remaining: This is a machine-gate submission, not a final claim that Psycle is 100% fun. Next proof is Simulator/Computer Use playthrough for novelty, tempo, reward payoff, and repeat desire.

### 2026-05-11 - Computer Use実プレイで見つかったレッスン中のReact副作用警告を修正

- Changed: progressionXpActionsのdaily goal報酬処理で、setDailyXP updater内からaddGemsを呼んでいた構造をやめ、dailyXPの新値と報酬判定をupdater外で計算する形に変更。progressionActions.testでsetDailyXPに関数updaterを渡さないことも確認
- Verified: Computer Useでmoney_l01をintroからQ3まで進め、Q3到達時にProgressionStateProvider中のEconomyStateProvider更新警告を発見。修正後、npm exec -- jest --watchman=false --runInBand src/__tests__/progressionActions.test.ts src/__tests__/firstLessonExperienceContent.test.ts、npm run typecheck、npm run validate:lessons、npm run content:lesson-quality:audit が通過
- Remaining: Computer Useは途中でcgWindowNotFoundが再発したため、修正後のQ3警告消滅は完全な画面再プレイでは未確認。次回はget_app_stateが安定している状態でQ1-Q3を再走するか、Maestroで同じ回帰を補助確認する

### 2026-05-11 - money_l01 intro preview の違和感を追加で修正

- Changed: lib/lesson-data/lessonMetadata.ts の money_l01 critical_caveat から英語の lesson 表現を削除し、画面上の言いすぎ防止を自然な日本語に変更。firstLessonExperienceContent.test.tsで metadata caveat に lesson が漏れないことを追加確認
- Verified: npm run content:lesson-quality:audit、npm exec -- jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts、npm run validate:lessons が通過
- Remaining: Simulatorの直接クリックはComputer Useがタイムアウトしたため、今回は起動画面スクリーンショット確認まで。次は実プレイでQ1-Q10のテンポと報酬感を再評価する

### 2026-05-11 - money_l01を100%目標の改善対象として再調整し、North Star Experience Scoreを品質監査へ追加

- Changed: docs/PRINCIPLES.mdに100点レビュー軸を追加。scripts/audit-lesson-quality-algorithm.jsでmental_l01とmoney_l01のQuality ScoreとNorth Star Experience Scoreを監査。money_l01の visible copy から参照元名を外し、発見・限界・10秒行動のテンポを改善。firstLessonExperienceContent.test.tsに visible copy の参照元名禁止を追加
- Verified: npm run content:lesson-quality:audit が mental_l01/money_l01 とも Quality Score 16/16、North Star Experience Score 100/100 で通過。npm exec -- jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts が10件通過。npm run validate:lessons が問題なし
- Remaining: machine scoreの100/100は到達宣言ではない。次は実機プレイで面白さ、報酬感、説明の重さを確認し、別ドメインのbenchmark lessonにも同じ採点を広げる

### 2026-05-09 - Runtime self-play fixes for money_l01

- Changed: Self-played the rewritten money_l01 in Simulator after a machine restart. Fixed Q8 swipe polarity so the true/usable answer is on the runtime true side, added Jest coverage for that label contract, compacted swipe result UI so the firefly/card answer no longer pushes the continue button off-screen, and moved recentAccuracy derivation out of a nested state updater to remove the answer-time React warning.
- Verified: Simulator: reached money_l01 intro, replayed through Q8; confirmed Q3 compact swipe result shows continue in view; confirmed Q8 now shows left=それは違う and right=それは使える. Commands: npm run validate:lessons; npm run content:paleo:audit; node scripts/audit-lesson-quality-algorithm.js; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts src/__tests__/appStateArchitecture.test.ts; npm run typecheck; npm run check:north-star-progress; git diff --check -- components/question-types/SwipeJudgment.tsx data/lessons/money_units/money_l01.ja.json lib/lesson-data/lessonMetadata.ts lib/app-state/progression.tsx src/__tests__/firstLessonExperienceContent.test.ts docs/NORTH_STAR_PROGRESS.md
- Remaining: Lesson is materially more useful than the previous version, but still not Duolingo-level fun: explanations remain text-heavy and reward/payoff is weak. Before generator-wide rollout, add a stricter lesson pacing rule and test one more benchmark lesson in a different domain.

### 2026-05-09 - Create stress-shopping benchmark money lesson

- Changed: Rewrote money_l01.ja.json as a 10-question stress-shopping benchmark lesson using the calibrated D-Lab/Paleo algorithm: cold open, self-diagnosis, research mechanism chain, evidence caveat, near-miss choice, transfer, fallback, and tomorrow quest. Updated money_l01 runtime metadata so the lesson targets 10 questions and added Jest coverage for the bounded claim and takeaway.
- Verified: npm run validate:lessons; npm run content:paleo:audit; node scripts/audit-lesson-quality-algorithm.js; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts
- Remaining: Play money_l01 in Simulator and judge whether it is actually more interesting than article reading before turning this into generator-wide logic.

### 2026-05-09 - Expand D-Lab/Paleo calibration samples to v1

- Changed: Expanded REFERENCE_LEARNING_EXPERIENCE_SAMPLES from 12 inspected examples to a broader calibration corpus covering D-Lab use-method, simple rules, long-game, modern AI risk, health rhythm, values/diagnosis, and Paleo single-study, critique, boundary update, person-environment fit, action planning, goal setting, program-practice, roundup, and rejection samples.
- Verified: Sample inventory now includes explicit rejection calibration and marks the algorithm as calibrated_v1_candidate rather than final.
- Remaining: Use these samples to rewrite more benchmark lessons, then validate with Psycle playtest notes plus transfer/helpful/repeat data before any blind generator-wide rewrite.

### 2026-05-09 - Add lesson quality algorithm gate

- Changed: PRINCIPLESにARTICLE_PARITY_REJECT/10問arc/quality score contractを追加し、content:lesson-quality:auditでmental_l01のpain/novelty/evidence/diagnosis/choice friction/transfer/article advantageを監査。mental_l01の露骨な悪手選択肢をnear-miss中心に修正。
- Verified: npm run content:lesson-quality:audit, npm run content:paleo:audit, npm run validate:lessons passed
- Remaining: この監査は構造ゲートであり、実際の面白さはSimulator通しプレイとユーザー評価で継続判定する。Dラボ/パレオ参照から複数lessonへ横展開するsemantic criticは次の作業。

### 2026-05-09 - Rewrite mental_l01 as a diagnostic first benchmark lesson

- Changed: mental_l01を一般的なストレス講義から、出来事タイプ・解釈タイプ・身体反応タイプを仮診断し、研究発見・ツッコミ・使える範囲・10秒行動へ流す10問レッスンに更新。metadataのlesson_job/done_condition/insight_layerとfirstLessonExperienceContent testも診断型に合わせた。
- Verified: JSON parse, npm run validate:lessons, npm run content:paleo:audit, npm run typecheck, targeted Jest, git diff --check passed.
- Remaining: Simulatorで1レッスン通しの体感評価はまだ。次は実プレイでテンポ、選択肢の迷い、発見感、報酬感を確認する。

### 2026-05-09 - Make reference sample coverage concrete

- Changed: Expanded `docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md` from abstract source shapes into concrete calibration samples across D-Lab use-method, diagnosis-values, behavior pattern, simple rules, long-game, other-blame, and Paleo single-study, critique, risk, boundary update, roundup, and program-practice samples. Added explicit coverage status: enough for provisional algorithm and benchmark rewrites, not enough for final generator-wide rewrite.
- Verified: Will rerun lesson quality audit, north-star check, and diff whitespace check after this edit.
- Remaining: Add more D-Lab long-game/diagnosis samples, Paleo critique/boundary samples across non-mental domains, and rejected-source examples before calling the generator algorithm final.

### 2026-05-09 - Clarify D-Lab/Paleo as calibration corpus, not per-lesson dependency

- Changed: Added `Calibration, Not Dependency` to PRINCIPLES and created `docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md`. This makes the intent explicit: Psycle does not need to route every lesson through D-Lab or Paleo. D-Lab/Paleo are sampled to extract durable learning-experience structures, then Psycle uses its own algorithm from pain/research/behavior/continuity seeds.
- Verified: Principle marker is wired into `audit-lesson-quality-algorithm.js`; verification commands will be rerun after this edit.
- Remaining: Apply the calibrated algorithm to actual lesson rewrites and keep the sample inventory updated only when changing generator/principles/benchmark lessons.

### 2026-05-09 - Add minimum reference sampling for D-Lab/Paleo-driven algorithm changes

- Changed: Expanded the D-Lab/Paleo algorithm after additional sampling. D-Lab samples now include use-method, internal Paleo article channel, and Simple Rules 2.0. Paleo samples now include single-study, critique, roundup, and program-practice patterns. Added `Reference Sampling Minimum` and `D-Lab Simple Rule Constraint` to PRINCIPLES so future algorithm/generator changes require multiple source shapes rather than one representative article/video.
- Verified: Principle markers are wired into `audit-lesson-quality-algorithm.js`; verification commands will be rerun after this edit.
- Remaining: Build a structured sample inventory file if we continue turning D-Lab/Paleo into a repeatable content pipeline, then apply it to actual lesson rewrites.

### 2026-05-09 - Define the actual D-Lab/Paleo lesson content algorithm

- Changed: Researched D-Lab's internal `パレオ` article channel, public Paleo articles including stress-shopping and psychology-textbook critique examples, and the D-Lab video `いまさら聞けないDラボの使い方〜知識を行動、習慣に変える方法`. Added `D-Lab/Paleo Lesson Content Algorithm` to PRINCIPLES: pain seed, Paleo research seed, D-Lab behavior seed, continuity seed; source triage; five-part insight decision; required 10-step lesson arc; question type selection; active-learning recall/reason/application loop; `Paleo Article Pattern Rule`; and `DLAB_PALEO_ALGORITHM_REJECT`.
- Verified: The principle markers are wired into `audit-lesson-quality-algorithm.js`; verification commands will be rerun after this edit.
- Remaining: Apply this algorithm to rewrite/refresh real lesson inventory beyond `mental_l01`, starting with the money stress-shopping candidate and one D-Lab-style behavior-change lesson.

### 2026-05-09 - Add D-Lab/Paleo reference-source modeling protocol after external research pass

- Changed: Reviewed D-Lab reference pages for `成長を妨げる「12の呪い」〜前編` and `偶然を味方にする「運を作る」行動パターン #1`, plus public Paleo-style article patterns, then added `Reference-Source Modeling Protocol` to PRINCIPLES. The rule now separates reference hook, insight engine, evidence posture, life-improvement move, practice ladder, and continuity loop before any lesson/candidate work. Added `REFERENCE_SOURCE_MODEL_REJECT` and wired the marker into `audit-lesson-quality-algorithm.js`.
- Verified: D-Lab pages were accessible in Safari via Computer Use; `node scripts/audit-lesson-quality-algorithm.js` will be rerun after this edit.
- Remaining: Turn the extracted source-model protocol into concrete candidate/lesson rewrites beyond `mental_l01`, especially one D-Lab-style self-diagnosis lesson and one Paleo-style research-critique refresh.

### 2026-05-08 - mental_l01の体験評価を引き上げるため、開始テーマカード・常時テーマ表示・回答後の発見表示・脚本修正を追加

- Changed: LessonIntroViewで今日の問い/研究の発見/練習を開始前に提示。LessonQuestionStageでテーマstripを表示。QuestionResultViewは回答後に発見/手がかり/見方の修正を先に読ませてから続ける導線へ調整。mental_l01は正解位置の単調さを崩し、研究発見・ツッコミ・10秒練習の説明を強めた。
- Verified: npm run typecheck; npm run validate:lessons; npm run content:paleo:audit; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts src/__tests__/lessonPrincipleEnforcement.test.ts; Simulatorでlesson introとQ1 theme strip/result insightを確認
- Remaining: まだ1レッスン通しの楽しさは要再プレイ評価。course node上でテーマが見える導線と、報酬/発見カード化は次の改善候補。

### 2026-05-08 - 原則を実装で強制するため、mental_l01の保護・source_id trace分離・完了takeaway優先・energy empty bypassを追加

- Changed: scripts/audit-paleo-insight-layer.js と rebuild-ja-lessons-to-spine.js に protected benchmark gate を追加。lesson adapter は source_id を evidence trace として保持し、loadLessons は id/claim_id で所属判定。completion recap は metadata.takeaway_action を優先。energy不足でも lesson は開始し、analytics に empty_bypass を残す。
- Verified: npm run typecheck; npm run validate:lessons; npm run content:paleo:audit; npm run check:north-star-progress; targeted jest lessonFlow/firstLessonExperienceContent/lessonQuestionAdapter/lessonPrincipleEnforcement/lessonMetadataContract/questionRuntime
- Remaining: runtime Simulatorでenergy 0から実際にlesson開始できることは未確認。energyを報酬・ペース配分側にどう見せるかは次のUI調整余地。

### 2026-05-08 - Resolve principle entrypoint ambiguity

- Changed: Moved production core/benchmark concrete-scene minimum into MUST strength and updated consolidation notes to reference Support Dosage Addendum after renaming the duplicate section.
- Verified: Checked headings and fixed the only actionable wording mismatch found in the new entrypoint.
- Remaining: Section numbering still has legacy duplicate numbers; this is a reference cleanup task, not a semantic contradiction.

### 2026-05-08 - Add working entrypoint to Psycle principles

- Changed: Added implementation reading order, Core Operating Principles, Rule Strength levels, and consolidation notes so agents can prioritize the long PRINCIPLES document without weakening safety/evidence rules. Marked the later Support Dosage section as an addendum to the canonical support dosage rules.
- Verified: Docs-only change; will run north-star handoff and diff whitespace checks.
- Remaining: Later cleanup can renumber duplicated sections and move pure operational reference material after confirming no scripts/tests depend on headings.

### 2026-05-08 - Tighten lesson principle gates after benchmark review

- Changed: Added benchmark preservation, completion takeaway precedence, deeper content-quality audit expectations, claim/source traceability, and localization parity requirements to PRINCIPLES.
- Verified: Updated docs/PRINCIPLES.md only; implementation follow-up still required for rebuild protection, source_id adapter behavior, completion recap precedence, and deeper audits.
- Remaining: Implement the new gates in scripts/runtime and apply the benchmark bar to non-mental_l01 lessons.

### 2026-05-08 - Fix conversation survey runtime for benchmark lesson

- Changed: Stopped missing/null recommended_index from becoming correct_index 0 so self-observation questions remain neutral instead of red/green quiz grading.
- Verified: Played mental_l01 through completion in Simulator; Q6 now accepts a non-first self-observation choice without incorrect/recommended feedback.
- Remaining: Apply the same 10-question benchmark quality bar to the rest of the generated lesson inventory.

### 2026-05-08 - Set mental_l01 runtime target to ten questions

- Changed: Raised mental_l01 load score so runtime metadata keeps the hand-authored 10-question benchmark instead of slicing it to 8. Updated metadata contract coverage and fixed duplicate React keys between question renderer and XP animation.
- Verified: npm run validate:lessons; npm run content:paleo:audit; npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts src/__tests__/lessonMetadataContract.test.ts src/__tests__/lessonFlow.test.ts; Simulator reload showed 1 / 10
- Remaining: Continue full Simulator playthrough and then decide whether to update the generator from this benchmark.

### 2026-05-08 - Hand-author mental_l01 as ten-question benchmark lesson

- Changed: Reworked mental_l01.ja.json from generated spine copy into a 10-question scene-driven benchmark lesson with concrete moments, cognitive-appraisal discovery, caveat, usable scope, 10-second action, transfer, and anchor. Added experience-quality rules to PRINCIPLES so future lessons cannot pass by merely listing insight_layer fields.
- Verified: npm run validate:lessons; npm run content:paleo:audit; npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/firstLessonExperienceContent.test.ts src/__tests__/lessonFlow.test.ts
- Remaining: Replay the full lesson in Simulator after reload and use this as the benchmark before updating the generator or other lessons.

### 2026-05-07 - Make swipe judgment use firefly interaction

- Changed: Replaced the rectangular swipe judgment card with a firefly mascot swipe target and added tappable left/right fallback controls so the lesson no longer stalls at swipe questions.
- Verified: npm run typecheck; Simulator reload confirmed Q3 shows the firefly swipe target and answer fallback works; screenshot saved at /private/tmp/psycle-swipe-firefly-result.png; git diff --check -- components/question-types/SwipeJudgment.tsx
- Remaining: Lesson copy still needs a hand-authored pass because the generated spine removed concrete scenario drama and made the first lesson feel uninteresting.

### 2026-05-07 - Codify lesson interaction and 10-second action rules

- Changed: Added explicit PRINCIPLES rules that question formats are not limited to 2-choice, 3-choice, or swipe, while core lessons default to lightweight conversation, multiple_choice, and swipe_judgment. Clarified that each lesson needs a 10-second takeaway action, but not every question must be a 10-second action.
- Verified: npm run content:paleo:audit; git diff --check -- docs/PRINCIPLES.md docs/NORTH_STAR_PROGRESS.md scripts/rebuild-ja-lessons-to-spine.js package.json data/lessons/*_units/*.ja.json
- Remaining: Use richer interaction types only when they measure distinction, ordering, or transfer better than the lightweight set.

### 2026-05-07 - Rebuild Japanese lessons to Paleo-to-Practice spine

- Changed: Rebuilt 16 Japanese lesson files from insight_layer into hook, research, caveat, scope, 10-second practice, transfer, fallback, and anchor steps. Added a repeatable rebuild script so future lessons keep the same lesson spine.
- Verified: npm run content:lessons:rebuild-ja-spine; npm run validate:lessons; npm run content:paleo:audit; npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/lessonFlow.test.ts src/__tests__/lessonOutcomeAnalytics.test.ts
- Remaining: Human-edit the generated Japanese prose for richer examples and extend localization parity beyond ja.

### 2026-05-07 - Remove course insight preview text

- Changed: Removed the visible Course screen '今日の問い' preview card while keeping the Paleo-to-Practice lesson spine in metadata, candidate intake, audits, and completion practice support.
- Verified: npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/CourseWorldHero.test.tsx src/__tests__/courseWorldAdapter.test.ts src/__tests__/courseWorldModel.test.ts; npm run content:paleo:audit
- Remaining: Keep lesson content evaluation focused on the actual question flow and completion practice card, not the Course home surface.

### 2026-05-07 - Adjust insight preview placement after Simulator check

- Changed: Moved the course insight preview out of the top safe-area/Dynamic Island region and anchored it near the bottom of the visual course scene.
- Verified: Simulator screenshot confirmed the course preview card is visible above the tab bar without status/Dynamic Island overlap; npm run typecheck and targeted CourseWorld tests passed after the placement fix.
- Remaining: Completion practice card is covered by code/type tests but still needs a completed-lesson Simulator pass before treating that surface as visually verified.

### 2026-05-07 - Expose Paleo-to-Practice spine lightly in lesson UI

- Changed: Course preview now shows only the surprising question, and lesson completion now shows usable scope plus the practice prompt from insight_layer without surfacing the full five-part research structure.
- Verified: npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/CourseWorldHero.test.tsx src/__tests__/courseWorldAdapter.test.ts src/__tests__/courseWorldModel.test.ts src/__tests__/lessonFlow.test.ts src/__tests__/lessonOutcomeAnalytics.test.ts; npm run content:paleo:audit
- Remaining: Verify the updated course preview and completion card in Simulator, then watch for text density or retention impact before exposing research finding/caveat in normal lesson flow.

### 2026-05-07 - Wire Paleo-to-Practice audit into content-quality CI

- Changed: Added content:paleo:audit to the required content-quality workflow so lesson metadata and candidate intake must keep the five-part insight_layer.
- Verified: npm run content:paleo:audit passed locally before wiring; content-quality workflow now calls the same script.
- Remaining: Keep future lesson UI surfacing separate from this CI rule so the principle stays enforced before visual presentation work.

### 2026-05-07 - Principleize Paleo-to-Practice lesson spine

- Changed: Added Paleo-to-Practice Lesson Spine to PRINCIPLES, insight_layer to lesson blueprint/metadata/candidate intake, generator pass-through, deterministic/evidence gates, and audit coverage.
- Verified: npm run content:paleo:audit; npm run content:intake:validate; npm run content:retention:audit; npm run validate:lessons; npm run typecheck; npx jest --watchman=false --runInBand src/__tests__/contentGenerationDeterministicGate.test.ts src/__tests__/lessonOutcomeAnalytics.test.ts
- Remaining: Surface insight_layer deliberately in user-facing lesson preview/completion UI and use transfer/helpful/repeat data to decide which Paleo-style insights deserve refresh or mastery variants.

### 2026-05-07 - Seed boredom and retention content loop

- Changed: Added 10 recurring pain items, 5 research radar critiques, 7 scored lesson candidates, and a retention content loop audit for cross-domain refresh/mastery planning.
- Verified: npm run content:intake:validate, npm run content:retention:audit, and npm run validate:lessons passed.
- Remaining: Turn strongest candidates into actual refresh/mastery lessons, verify completion transfer UI in Simulator, and review real outcome/transfer/repeat analytics after use.

### 2026-05-07 - Make North Star progress handoff mandatory in CI

- Changed: Added North Star Progress Handoff Check to content-quality CI and strengthened check-north-star-progress to inspect PR/push diffs, not only local working-tree status.
- Verified: npm run check:north-star-progress passed locally and targeted git diff --check passed.
- Remaining: This enforces the handoff when content-quality CI runs; tasks outside this repo or CI bypasses still rely on AGENTS.md discipline.

### 2026-05-07 - Add repeatable North Star progress update automation

- Changed: Added note helper, stale-handoff check, package scripts, and AGENTS instruction for future Psycle North Star work.
- Verified: `npm run check:north-star-progress`, helper dry run, and targeted `git diff --check` passed.
- Remaining: Future threads still need to run the helper after meaningful product, evidence, lesson-quality, analytics, or gamification changes.

### 2026-05-07 - North Star handoff snapshot created

- Changed: Added this progress handoff file and linked it from `../AGENTS.md`.
- Verified: Confirmed `rg` can find the handoff and `git diff --check` passes for the added docs.
- Remaining: The file still needs a repeatable update helper and stale-handoff check.
