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
- Implementation foundation: about 75-80%
- Self-improving big-app operating loop: about 40-50%

Interpretation:

- The direction is now coherent.
- Mental Course v1 now has a versioned curriculum path and durable learner-skill state.
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

### Curriculum / Progression

- Learning Core V2 formally uses `Course -> Unit -> Skill -> Lesson`.
- Mental Course v1 has a versioned pilot manifest with 3 units, 3 transferable skills, and 6 existing core lessons.
- The clock course reads manifest order instead of inferring curriculum from filenames.
- Learner skill state is persisted separately from lesson completion as `unseen / introduced / usable / transferable / stable / refresh_due`.
- Existing completion history is reconciled into the current curriculum without erasing old completion records.
- A tested next-action selector enforces prerequisite order, keeps Core primary, caps ordinary support at 2 of 7 actions, and lets required safety refresh override the cap.
- Course completion remains complete instead of silently resetting the clock to lesson 1.

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
- Mental Course v1 is a progression foundation, not proof that its six lesson experiences are strong enough.
- Health, money, social, study, and work still use legacy course order until each receives an approved manifest.
- Required safety refresh has a selector contract but still needs a production severity signal from evidence operations.
- Real transfer and repeat data is still needed to calibrate skill-stage thresholds and support dosage.
- Simulator lesson completion and same-device restart continuity are verified; physical-device hardware verification remains open.
- Completed-lesson continuity is local per user; remote cross-device completion sync remains open.

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

### 2026-08-18 - Card two states direction only; the asymmetric certainty rating is gone

- Changed: Removed the certainty claim about ball sports and PE from card two, which hedged the increase while asserting the decrease on thinner evidence; study counts remain in the details sheet
- Verified: tsc clean; 757 tests green; validate 0 errors; Simulator playthrough of the card two reveal
- Remaining: Owner tasting of the whole episode; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-18 - Removed a forward reference from card two and moved effect sizes to the details sheet with a legend

- Changed: Card two no longer sizes jogging against meditation (first mentioned on card three); the screen stops at direction and certainty; the details sheet carries the point estimates with the 0.2/0.5/0.8 legend and the study counts per activity; checklist item two requires a comparison the reader has already met and allows stopping at direction when no honest yardstick exists
- Verified: Cold-read of card two in isolation: every premise is on-screen; tsc clean; 757 tests green; validate 0 errors; Simulator playthrough of the card two reveal
- Remaining: Card two calls the ball-sports difference certain while it rests on 7 and 13 studies - the count is in the details sheet but not on screen, worth an owner decision; owner tasting of the whole episode; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-18 - Verdicts stated plainly, effect sizes given a reader's yardstick, exact figures moved to the details sheet

- Changed: Card two sizes jogging against the meditation effect in the same study instead of a renamed statistical scale; card four says the effect shrank to a third and landed just short of nothing; blurred/left-hanging/supporting-cast metaphors removed; details sheets now carry the point estimates and interval widths; checklist item two fixes the four verdict forms and bans metaphor for verdicts
- Verified: tsc clean; 757 tests green; validate 0 errors; Simulator playthrough of card two reveal and its details sheet showing the 0.71 estimate with its interval
- Remaining: Owner tasting; review deliberately not built - bet cards are excluded from retry and only whole-lesson replay exists; the jogging-versus-aerobic split stays out of the lesson as unverified speculation, worth revisiting if research explains it; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-18 - Rewrote the anger cards to be readable one screen at a time, and widened the standalone rule to enforce it

- Changed: Card two names what jogging increased and drops the insider note about the authors' theory; card three's caveat says one limitation plainly instead of three in shorthand; card four restates the sample in place and no longer reads as advice against deep breathing; a winning bet's number is now green; validator applies the standalone-screen check to reveal and caveat, not just the question; checklist gains the cold-read rule and covers insider detail
- Verified: tsc clean; 756 tests green; validate 0 errors; Simulator confirms the green hit and the corrected card one
- Remaining: Owner tasting of the corrected l07; no spaced review exists for episode cards by design - bet cards are excluded from the in-lesson retry round and only whole-lesson replay exists, so decide whether a re-judgment format is worth building before external users; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-18 - Moved the episode writing rules out of conversation and into gates both agents hit

- Changed: validate-lessons now enforces the mechanical rules on every bet card in every unit (no statistical notation, caveat present and bounded, source line, no back-references); QUALITY_CONSTITUTION gains a 10-item writing checklist for the judgment calls; cross-review prompt gains an explicit card-coherence check; l01 and l03 brought to the same skeleton; l07 closer corrected - running is a split verdict, not something to drop
- Verified: tsc clean; 756 tests green; validate 0 errors after l01/l03 were brought into compliance (the new gate caught them, as intended); Simulator playthrough of l07 card 1
- Remaining: Owner tasting of the corrected l07; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-17 - Rewrote both episodes for a reader: no statistical notation, sources on screen, assertions tracking evidence

- Changed: Statistical symbols purged from card copy (effect sizes as words with figures in parentheses); source_label field added and rendered under the caveat in the dimmest type; l07 openers rewritten to say only what the app can honestly say; card three names the practice instead of the category; l02 plain-language pass
- Verified: tsc clean; 757 tests green; validate 0 errors; Simulator playthrough of l07 card 1 showing the new opener, reveal and source line
- Remaining: Owner tasting of the rewritten episodes; l01 and l03 still on the old copy rules; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-13 - Applied Codex's science corrections to lesson two and shipped episode two on anger

- Changed: Ledger: He 2025 claims now name the continuous-outcome subset and its very low certainty; Bourke 2026 registered (it supports rather than refutes the in-bed boundary); anger meta-analysis registered. Lesson two: four attribution fixes. New mental_l07 runs the same arc with no numeric slider, admitted to the course as position four
- Verified: Two-agent web verification of both Codex science claims; tsc clean; 756 tests green; validate 0 errors; Simulator playthrough of l07 card 1 showing the skeleton holds without a slider
- Remaining: Owner tasting of episode two - does the arc survive without the slider; l01 and l03 still on the old skeleton; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-13 - Framed questions, made the measured value the hero, and made every bet stand alone

- Changed: All prompts share one bordered card with a minimum height so controls stop drifting; bet reveals show the value in a large gold 実際は box on hits and misses alike and the prose stops restating it; card four rewritten to carry its own premise and low anchor; card two states the belief standalone; Cochrane annotated as 医療エビデンス評価の総本山
- Verified: tsc clean; 746 tests green; validate 0 errors; Simulator check of cards 1-3 including the reveal
- Remaining: Owner verdict; whether l01 and l03 copy should be reshaped to setup-plus-ask; standalone rule should become a generator constraint before more lessons are written

### 2026-08-12 - Added a reading hierarchy to question and reveal typography

- Changed: Prompt splits setup from the ask (muted small vs bold), reveals render paragraph blocks with a stepped-up lead conclusion; caveat block unchanged
- Verified: tsc clean; 745 tests green; Simulator check of card 1 shows the hierarchy on both the question screen and the reveal
- Remaining: Owner verdict on readability and pacing; whether to restyle l01/l03 copy to the same setup-plus-ask shape; question format changes deliberately deferred until typography is judged

### 2026-08-12 - Cut lesson two to one beat per screen and gave reveals a fixed skeleton

- Changed: Added a caveat field rendered as a subordinate block under a rule, so limits stay visible without competing with the finding; recompressed all five l02 cards to hook+question setups and answer+two-block reveals; pinned the skeleton with length bounds in tests
- Verified: tsc clean; 745 tests green; validate 0 errors; Simulator playthrough shows setups fitting without scroll and the caveat rendering as a muted subordinate block on both slider and choice cards
- Remaining: Owner tasting of the tightened l02; whether the same skeleton should be applied to l01 and l03; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim; Flynn and Lake PMID typo

### 2026-08-10 - Shipped the first reading-with-bets episode into the app as lesson two

- Changed: Registered six web-verified screen-sleep sources; rebuilt mental_l02 from raw pilot 008 as 5 beats (slider bet on total screen effect, bedtime reversal, blue-light absence-of-evidence, in-bed slider bet, tonight's one change); raised the reveal length limit for bet cards so the prose survives conversion; renamed the unit and skill to mental_screen_and_sleep
- Verified: Cochrane citation corrected after finding the pilot overstated it (17 RCTs total but only 6 / 148 participants on sleep, verdict is uncertainty not no-effect); tsc clean; 744 tests green; validate 0 errors; Simulator playthrough of cards 1-3 with the long reveals rendering as readable prose
- Remaining: Owner tasting of the rebuilt l02; l03 GRE card still judged boring; transfer_successes measurement bug; Jamieson_2012 ledger claim allows a performance gain it never measured; Flynn and Lake PMID typo

### 2026-08-08 - Rebuilt lesson two around verified worry-accuracy numbers after the beat-only rebuild died in tasting

- Changed: Registered LaFreniere & Newman 2020/2016 and Borkovec 1999 (with Cornell-85% misattribution note) in the ledger; l02 now bets on the 8.6%/91.4% realized-worry rate with caveats after reveals; extracted rule: every card needs a verified surprising fact, bet mechanics alone cannot carry a lesson
- Verified: 3-agent web verification against primary sources; tsc clean; 744 tests green; validate 0 errors; Simulator playthrough of cards 1-3 incl. slider bet 40 vs actual 9 with gold neutral miss
- Remaining: Owner tasting of rebuilt l02; l03 boring verdict on its GRE card still unaddressed; transfer_successes measurement bug; Jamieson_2012 ledger claim fix; Flynn & Lake PMID typo

### 2026-08-06 - Rewrote lesson two as a bet-first arc built on a self-demonstrated recall trap

- Changed: mental_l02 rebuilt: card1 shows the exact message ungraded, card2 bets on what the screen actually said (answer key is the previous card, not a study), card3 selects by falsifiability, card4 keeps the criterion out of the choices, card5 makes self-initiated checking a wrong answer-check; raw pilot 006 and its reject conditions recorded first
- Verified: tsc clean; 174 suites / 745 tests green; validate:lessons 0 errors; full 6-card Simulator playthrough incl. deliberate miss on card2 showing gold neutral treatment and the three-branch reveal
- Remaining: Owner tasting of the rebuilt l02 and of staging l03; Jamieson_2012 ledger claim still allows a performance gain it never measured; Flynn & Lake PMID typo; bet misses still feed skill pacing as ordinary errors

### 2026-08-06 - CourseWorldのリング選択をL1/L2の再生対象へ接続し、学習画面をリングとテーマだけに整理

- Changed: リング回転は選択、中央タップは選択中レッスンの起動に分離。完了済みL1の再プレイ、現行L2起動、locked拒否、表示済み分析の抑止、リング専用presentation、素早いdragの誤起動防止と2ノード時の感度改善を追加
- Verified: Jest 174 suites / 741 tests、TypeScript、diff-checkがPASS。Simulatorでminimal表示、L1/L2の選択と各1/5画面の起動を確認。VoiceOverの前/次/起動アクションも確認
- Remaining: 物理iPhone上の指スワイプの気持ちよさは未計測。約47pxの横移動で2ノードを切替える設定を実機で味見する

### 2026-08-06 - 旧mental_l02が新パイロットより先に選ばれる通常導線を修復

- Changed: mental curriculumをv1.1 pilotとしてl01→l03の2本に限定し、l03を表示上Lesson 2にした。manifest外の旧Core・support・Mistakes Hub・Mastery候補を通常導線から除外した
- Verified: typecheck成功、validate:lessonsは0 errors/35 warnings、Jest 173 suites/735 tests成功。Simulator cold launch後、時計にLesson 2・5問を表示し、通常CTAからmental_l03 1/5を起動。旧mental_l02文言は当該導線に不在
- Remaining: mental_l03は日本語staging pilotのまま。owner taste、human science、clinical safety、既存l03完了者のreplay policy、英語semantic parity、practice/transfer在庫は未承認・未計測

### 2026-08-06 - 開発Simulatorの時計導線をエネルギー残量から分離

- Changed: dev-clientでは通常のコース導線もレッスン開始時にエネルギーを消費しない。chargeEnergy=1指定時だけ遮断挙動を検証し、リリース版は従来どおり消費
- Verified: Energy 0のPsycle Clean Simulatorで時計のレッスン2を押し、警告なしで1/6が開くことを直接確認。Jest 8件とTypeScript型検査に合格
- Remaining: 本番ビルドのエネルギー制約は変更なし。課金・回復のリリースE2Eは別途必要

### 2026-08-06 - レッスン起動時のエネルギー不足を質問欠落と分離

- Changed: energy_blockedを独立状態にし、専用表示と戻る／ショップ導線を追加。開発プレビューはエネルギー非消費。初日ボーナスは設定値まで実残量を付与
- Verified: mental_l03をEnergy 0で通常起動し、質問欠落表示が出ないことをSimulatorで確認。preview=1で1/5を起動。Jest 27件とTypeScript型検査に合格
- Remaining: 実機配布版では通常のエネルギー制約を維持。ユーザー供給・継続価値は未測定

### 2026-08-06 - Removed remaining Japanese mental_l03 legacy-spec references after the in-place staging replacement.

- Changed: Synchronized the raw pilot safety text, Gold Lesson example, verification target, and same-ID continuity record with the five-screen body-signal and outcome-forecast revision.
- Verified: 18 continuity and lesson-contract tests, typecheck, validate:lessons with 0 errors and 35 existing warnings, authoring lint, and diff check.
- Remaining: Non-Japanese legacy translations remain quarantined from the JA-only staging scope until reviewed translation; production still needs source trace, clinical and science sign-off, curriculum alignment, and delayed unseen transfer measurement.

### 2026-08-06 - Replaced the old Japanese mental_l03 with the owner-approved five-screen body-signal and outcome-forecast staging pilot.

- Changed: Added a pre-play hook separate from the final takeaway; bounded Jamieson 2010 claims; moved the emergency boundary before practice with FDMA-aligned 119 and #7119 copy; made bet misses visually neutral.
- Verified: 39 targeted Jest tests, typecheck, validate:lessons with 0 errors and 35 pre-existing warnings, independent UX and science-safety staging review, and a dedicated Simulator five-screen playthrough.
- Remaining: Owner real-device taste approval; production human science and clinical safety sign-off; safety claim trace, continuity and manifest alignment, locale work, and a delayed unseen probe.

### 2026-08-05 - Verify Unit 0 science and draft the Unit 1 raw pilot

- Changed: Replaced five Unit 0 placeholder/overstated claims with primary-source-bounded cards; kept evidence staging; retired three placeholders; fixed crowded number-bet labels and stopped same-session retries for Discovery bets; drafted Pilot 005 as a mental_l03 replacement candidate.
- Verified: Primary-source audits; five-card Simulator playthrough; compact number-bet legend; content package audit; validate-lessons 0 errors/35 warnings; focused Jest and typecheck.
- Remaining: Owner taste approval for Pilot 005 before JSON; safety review and Brooks 2014 registration before production; transfer-success correctness and job-aware variant Review before Personal Review Ranker.

### 2026-07-31 - Bet-card UI polish verified in Simulator: drag-required slider, gold neutral misses, first-bet hit tally on completion

- Changed: NumberBet drag-required (kills card5 auto-hit + card1 anchor); bet misses gold/neutral across slider, swipe, choice; swipe double-text removed; VoiceOver adjustable slider; completion recap shows first-round hits only (review corrections excluded)
- Verified: tsc clean; 170 suites / 709 tests green; full lesson playthrough on Simulator incl. review round: untouched slider blocks lock, misses show gold, recap shows 4/5 after review fixes
- Remaining: Science fixes for cards 1-5 (register real sources, rewrite card1 to questionnaire paradigm); bet-history persistence; Unit 1 (pre-performance nerves) staging build; guess==answer pin label overlap cosmetic

### 2026-07-30 - Codexレビュー反映の第一弾: 偽production状態の隔離と仮出典の昇格ゲート

- Changed: mental_l01.evidence.jsonを旧CBT内容から予想カード版へ書き直し(state=staging, human_approved=false, 未検証3出典をpending_verification明記)。validate-lessonsにunverified_placeholder×productionの機械ゲート追加。見出しを「あなたの直感 vs 心理学」へ
- Verified: ゲート実証(production化で遮断・stagingで通過)。validate:lessonsエラー0/170スイート709テスト緑/両監査OK/Simulator devでl02(staging)が正常に開くことを確認
- Remaining: 設計v1.1の続き: メカニクス修正(カード5許容値・スライダー触るまで賭け不可・罰音除去)→科学修正+台帳正式登録→最小永続化→ユニット1(1困りごと×1技能)実装→遅延probe

### 2026-07-29 - レッスン1を予想カード5枚に置換し、5版目で初めてオーナー実プレイを通過

- Changed: number_bet型を新設(スライダーで賭け→実数と自分の予想を同軸表示)。bet_cardフラグで誤答時も解説を常時展開し続けるボタンを解説の下へ。mental_l01を5枚の予想カード(頼み事承諾率/パワーポーズ再現/リアプレイザル/ポジティブ空想/実行意図)に差し替え。未検証3出典をPsycle_Unverified_*として台帳へ仮登録し本番昇格を禁止
- Verified: Simulator実プレイ(オーナー、2026-07-29)で好感触。tsc/validate:lessonsエラー0/170スイート709テスト緑/両監査OK
- Remaining: 未検証3出典の原典確認と昇格判断。en版mental_l01が旧10問のまま。外した問題が翌日別場面で戻る仕組みと直感スコア表示は未実装。5枚目と完了画面の実機確認

### 2026-07-28 - Restore reliable swipe-judgment progression

- Changed: Swipe judgments now claim only horizontal intent, pause parent scrolling during a drag, handle release/termination safely, and provide equal-width 48pt left/right tap alternatives.
- Verified: Typecheck, 12 dedicated swipe tests, and the full 709-test suite pass. Simulator confirmed both tap paths produce feedback, Continue advances to 2/10, and a vertical drag does not answer.
- Remaining: Confirm horizontal drag and fast flick on the physical iPhone; owner taste review of lesson content remains separate.

### 2026-07-28 - Prototype life-applied assumption-gap lesson one

- Changed: Added an isolated dev-only five-screen pilot that turns one fact-versus-inference lens into a provisional reading, a user-selected life scene, premise removal, same-scene recheck, and an optional session-only follow-up. Production lesson JSON, XP, progression, persistence, analytics, and shared runtime remain untouched.
- Verified: Typecheck passed; 168 Jest suites and 697 tests passed; direct dev-client playthrough completed on iPhone 17 Pro and narrow iPhone 17e; independent surface review accepted the provisional interaction, result reading order, and safe-area behavior.
- Remaining: The owner still needs to judge whether the lesson is interesting, clear, educational, and worth repeating. Do not promote it into production or add persistence until that taste gate passes.
- Next: Play the dev-only pilot; if it passes the human taste gate, specify the smallest production promotion and next-day record experiment.

### 2026-07-27 - Remove production blockers without hiding review debt

- Changed: Unfroze fixed lesson audits, restricted authoring to runtime-reachable question types, demoted overdue themes to production_limited without changing review dates, made worktree and native repair tooling checkout-relative, repaired detached React framework seeding, and aligned completion recap with the authored takeaway.
- Verified: validate:lessons passed with 0 errors and 36 warnings; 167 Jest suites and 691 tests passed; typecheck and three content audits passed; mental_l01 runtime access allowed; generic repaired iOS build succeeded.
- Remaining: Owner taste review still rejects the current L1; actual evidence review is required before restoring production_default; Tier B refresh queue has no consumer; Simulator playthrough of a new raw pilot remains separate work.
- Next: Write and play one raw lesson pilot before generated JSON or further audit changes.

### 2026-07-16 - mental_l02を、採点可能な予言を作る単一のstagingレッスンとして再構成

- Changed: 日本語限定の6ステップauthored sequence、dev-client限定staging読込、誤答時の固有訂正ヒントを追加
- Verified: 専用iOS SimulatorでQ2誤答、Q3-Q6、Q2復習正答、完了まで実プレイしlesson_completeを確認
- Remaining: 人間オーナーの味覚承認、翌日想起と再訪理由の測定、production昇格判断、必要なら英語版同等化

### 2026-07-14 - Learning Core V2 の時計コース往復を実機相当環境で検証

- Changed: 時計の進捗分母をロード済み全レッスンではなく manifest 採用レッスンだけで数え、Mental v1 を 1/9 ではなく 1/6 として表示するよう修正。
- Verified: iOS 26.5 Simulator と Detox native agent で Mental L1 を正答完了し、時計が 2/6・1完了・4残り・レッスン2 CTA へ進むこと、アプリ再起動後も状態が保持されること、Learning Core analytics metadata が送られることを確認。typecheck と Jest 161 suites / 661 tests も成功。
- Remaining: Mental の各レッスン自体の学習価値と転移はユーザーテスト未証明。他コースの manifest 化、production の safety severity signal、物理端末確認も未完了。

### 2026-07-14 - Build Learning Core V2 foundation for the clock course

- Changed: Defined and implemented a versioned Mental Course manifest, durable per-skill learner state, legacy completion reconciliation, prerequisite-aware next-action selection, honest course completion, and curriculum-aware analytics.
- Verified: Typecheck passed; 160 Jest suites and 659 tests passed in the isolated worktree. The only full-suite failure was the ignored native PrivacyInfo.xcprivacy file absent from the secondary worktree, to be rechecked after integration in the main workspace.
- Remaining: Mental lesson quality and real transfer outcomes remain unproven; other courses still use legacy order; evidence operations still need to provide a production safety-refresh severity signal; physical-device verification remains open.

### 2026-07-11 - Restore trustworthy clock-course continuity across restart

- Changed: Aligned active clock lesson promises with runtime content, kept answer feedback and completion flow usable, fixed review remount and runtime warnings, restored development guest and completed-lesson continuity, persisted same-day goal progress, and gated course telemetry until hydration.
- Verified: 158 Jest suites / 639 tests, typecheck, launch-readiness, lesson validation, and direct iPhone 17 Pro Simulator onboarding-to-lesson-completion-to-relaunch; same guest resumed at lesson 2 with streak 1 and 27/10 XP.
- Remaining: Physical iPhone 15 is unavailable, so device hardware verification remains open. Remote cross-device completion sync and real-user transfer/repeat evidence remain separate work; network-only billing and league fallbacks were not validated offline.

### 2026-07-11 - Separate Psycle question and research identities

- Changed: Question IDs now drive lesson grouping, review, mistake sessions, and adaptive selection; source_id remains the research-source identity; answerless conversations stay neutral instead of receiving a synthetic correct answer.
- Verified: Typecheck and all 156 Jest suites / 626 tests passed. Lesson validation, Paleo insight audit, and launch-readiness checks passed.
- Remaining: Human Simulator playthrough remains blocked by unavailable iOS runtimes. Evidence-package semantic alignment, durable progression, transfer events, and billing authorization remain separate follow-up buckets.

### 2026-07-11 - Align Psycle project map with the active clock course

- Changed: Removed retired vertical Trail and course prototypes, replaced the generated 100-node scaffold with real loaded lesson inventory, and documented the active course and lesson surfaces.
- Verified: Typecheck passed; focused course, clock, debug-route, architecture, and inventory tests passed.
- Remaining: Simulator verification is blocked until an iOS runtime is available. Learning identity, persistence, evidence alignment, and transfer measurement remain separate V2 work.

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
