# Psycle Engagement Principles

> Product engagement contract for habit, reward, pacing, delight, social pressure, and monetization.
> This document does not replace content quality rules. It governs why users come back and how motivation systems must behave.

## Summary

Psycle already has strong content and operational principles. The remaining product-design gap is engagement: daily return loops, reward economy, pacing, delight, social motivation, and monetization boundaries.

Existing docs cover important pieces:
- `XP_UNIT_SPEC.md`: XP and study-centered progression
- `ENERGY_EXPERIMENT_GATES.md`: energy experiment guardrails
- `LEAGUE_OPS.md`: league operations and league metrics
- `DATA_COLLECTION_PLAYBOOK.md`: first-week measurement cadence

Those docs are valid but local. This file is the top-level engagement contract that decides how those parts work together.

## Problem

Good lessons are not enough. A Duolingo-level learning app needs users to:
- open the app without having to rethink why
- finish a short session quickly
- feel progress without farming empty progress
- recover from missed days without shame
- see challenge without feeling trapped
- encounter monetization without losing trust

The risk is building high-quality content that users respect but do not return to daily.

## Users / Context

Primary user context:
- Mobile users with short, fragmented attention windows
- Users who may arrive with stress, avoidance, rumination, or low motivation
- Users who need small wins, not heavy productivity pressure
- Users who can be harmed by shame-heavy streak, league, or energy mechanics

Product context:
- Psycle is a learning product, not a casino loop
- Engagement mechanics exist to increase learning continuity
- Rewards must never become the main learning objective

## Non-Negotiables

- Study behavior is the primary source of XP and progression.
- Support, review, return, and mastery must not replace the core learning path.
- No mechanic may punish mental-health-related lapses with shame copy or irreversible loss.
- Rewards must be deterministic or auditable enough to prevent double grants and progress farming.
- Monetization must not block the first successful learning session.
- Social pressure must remain bounded; it can invite effort, but it must not humiliate low activity.
- Difficulty and pacing must adapt toward completion quality, not maximum time spent.

## Scope

This document governs:
- Habit loop
- Daily goal and comeback behavior
- XP, gems, quests, badges, streaks, and leagues
- Energy and paywall pressure
- Difficulty and pacing
- Delight and identity moments
- Social pressure
- Engagement analytics

## Out of Scope

- Lesson evidence standards
- Claim trace and content package readiness
- Native build and release mechanics
- Exact visual design of course world, quests, or leaderboard
- Pricing strategy beyond learning-experience boundaries

## Decision Rules

### 1. Habit Loop

The daily loop must be:
- `open -> see next action -> finish one short learning unit -> receive meaningful closure -> know what comes next`

Reject:
- A home/course screen where the next useful action is unclear
- Daily goals that require long sessions by default
- Comeback copy that frames absence as failure
- Streak repair that feels like a penalty first and support second

Required behavior:
- First session should route toward a fast lesson completion.
- Returning users should see one primary action before secondary systems.
- Missed-day recovery should offer a low-friction path back into learning.

### 2. Motivation Economy

XP, gems, quests, streaks, badges, league rank, and energy must form one economy.

Primary rule:
- Reward study continuity, not button pressing or support farming.

Reject:
- XP from self-reported action buttons
- Quest loops that are easier than lesson completion but grant comparable value
- League incentives that reward low-quality repetition
- Badge spam that competes with the lesson completion moment
- Reward copy that celebrates quantity while ignoring learning quality

Required behavior:
- XP remains connected to lesson completion and question behavior.
- Quests reinforce the next useful study action.
- Streak and league rewards must not make support paths more profitable than learning paths.

### 3. Difficulty And Pacing

Pacing should protect completion quality.

Inputs:
- question accuracy
- abandonment
- lesson completion time
- repeated support resurfacing
- mastery graduation state
- return/suppression/killed support events

Reject:
- Increasing difficulty after a user returns from lapse
- Repeating the same theme until it feels like filler
- Treating high completion alone as mastery
- Making hard lessons longer by default

Required behavior:
- If completion drops, reduce friction before adding rewards.
- If accuracy is high and completion is stable, introduce mastery or harder variants.
- If abandonment rises, prefer return or shorter re-entry before more challenge.

### 4. Delight And Identity

Delight should make progress feel alive without obscuring the task.

Acceptable:
- concise completion animation
- course world progress moments
- badge or streak milestone when earned
- small identity signals tied to learning style or theme progress

Reject:
- animations that delay the next useful action
- generic celebratory noise after every tap
- decorative systems that do not explain progress
- identity labels that shame weak performance

Required behavior:
- Delight moments should mark real learning milestones.
- The user should still understand what to do next after the celebration.

### 5. Social Pressure

Social mechanics should create momentum, not humiliation.

Acceptable:
- leagues based on weekly XP
- friend challenges with opt-in participation
- progress sharing after meaningful completion
- bounded comparison against similar activity levels

Reject:
- public shaming for zero XP
- social prompts after failed or abandoned sessions
- league matching that repeatedly places low-activity users into impossible groups
- social pressure that overrides recovery or return flows

Required behavior:
- League health must be judged by activity distribution, not only top-rank competition.
- Users with low activity should receive re-entry affordances before competitive pressure.

### 6. Monetization Boundary

Monetization must preserve trust in the learning loop.

Acceptable:
- paywall after demonstrated learning value
- shop entry from energy context when energy is understandable
- premium value tied to continuity, convenience, or depth

Reject:
- paywall before first successful lesson completion
- energy tuning that increases blocks while reducing retention
- monetization prompts after emotionally heavy failure moments
- paid advantages that distort league fairness

Required behavior:
- Paywall exposure must be evaluated against D1/D7 retention.
- Energy experiments must use sequential windows and rollback gates.
- Premium must not make the free path feel intentionally broken.

## Numeric Guardrails

These are product-level guardrails. If runtime, config, or docs disagree, the change must update this file or be rejected.

### Activation

| Rule | Guardrail |
|------|-----------|
| First value moment | User must be able to complete at least 1 lesson before monetization pressure. |
| Standard paywall eligibility | `lesson_complete >= 3` before normal paywall gating. |
| First-session default goal | Must be reachable by 1 short core lesson or less. Current daily goal is `10 XP`; current lesson completion is `20 XP`. |
| Weak lesson completion | `lesson_complete_user_rate_7d <= 25%` means fix lesson start/completion before adding engagement pressure. |
| Healthy lesson completion | `lesson_complete_user_rate_7d >= 30%`; `45%+` is strong. |

### Retention And Comeback

| Rule | Guardrail |
|------|-----------|
| D1 retention health | `25%+` healthy, `35%+` strong. |
| D7 retention health | `10%+` healthy, `15%+` strong. |
| Engagement rollback | Roll back if D1 drops `> 1.5pp` or D7 drops `> 1.0pp` after a change. |
| Comeback reward | Current threshold is `7 days`; current reward is `+2 energy` and `+10 gems`. |
| Lapse handling | Lapsed users receive re-entry before league, shop, or difficulty pressure. |

### Reward And Energy

| Rule | Guardrail |
|------|-----------|
| Energy block target | `energy_block_rate` must stay in `8%` to `18%` during energy experiments. |
| Energy rollback | Roll back immediately if `energy_block_rate > 18%`. |
| Energy shop intent | Candidate energy changes need `energy_shop_intent >= 25%` without retention damage. |
| Quest reward ceiling | Daily/weekly/monthly claim bonuses use current caps of `5/10/15 gems`. |
| Event rewards | May exceed normal quest caps only when campaign-limited and not treated as daily baseline. |
| XP farming | Non-lesson loops must not produce XP faster than normal lesson completion. |

### Social And Monetization

| Rule | Guardrail |
|------|-----------|
| League zero-XP health | `weekly_xp_zero_ratio < 20%` is healthy; `>= 40%` is risk. |
| League match quality | `xpGapRelative` p50 must stay `<= 0.30` and p90 `<= 0.65` for Go. |
| Paywall conversion | `1-3%` healthy, `3-6%` strong, `<0.5%` weak. |
| Monetization tradeoff | Conversion lift is not acceptable if lesson completion or retention materially drops. |

## Motivation Economy Exchange Rates

The economy has four currencies with separate jobs:
- XP measures study output and drives progress/league ranking.
- Gems pay for optional convenience and recovery.
- Energy paces lesson starts without becoming the product goal.
- Badges/identity rewards mark milestones and should not be spendable.

Current source-of-truth values:

| Mechanic | Current value | Contract |
|----------|---------------|----------|
| `correct_answer` | `5 XP` | Study-flow XP only; no duplicate grants. |
| `lesson_complete` | `20 XP` | Primary unit for XP, league, and progression. |
| `felt_better_positive` | `10 XP` | Allowed only as a post-study reflection signal, not generic self-report farming. |
| Daily goal | `10 XP`, `5 gems` reward | Must be reachable by one short session. |
| Daily quest claim bonus | `5 gems` | Reinforces one useful study action. |
| Weekly quest claim bonus | `10 gems` | Must not require unhealthy grinding. |
| Monthly quest claim bonus | `15 gems` | Long-horizon reinforcement, not a paywall substitute. |
| Quest reroll | `5 gems`, `1/day` | Convenience sink only; must not be needed to progress. |
| Comeback reward | `+2 energy`, `+10 gems` | Recovery support after lapse, not a punishment reversal. |
| Energy full refill | `30 gems`, `1/day` | Optional pacing bypass; monitor retention and block rate. |
| Double XP boost | `20 gems`, `15 minutes` | Must not distort league fairness for low-activity users. |
| Streak repair | `50 gems`, `48h window` | Recovery affordance; copy must not shame lapse. |
| Streak milestone | `3d:5`, `7d:10`, `14d:15`, `30d:20`, `60d:30`, `100d:50`, `365d:100 gems` | Lifetime-once milestones; no repeat farming. |

Exchange rules:
- Do not add direct XP rewards for opening screens, tapping support actions, or self-reporting non-study actions.
- A quest claim may release XP only when the quest's underlying metric is real study behavior or an explicitly approved practice mechanic.
- A quest can reward gems for study completion, but the study action must remain the reason to do it.
- Boosts can accelerate rewards only after real lesson work; they must not create a better path than normal learning.
- Gems can reduce friction, but must not buy mastery, graduation, evidence quality, or league rank directly.
- Support, return, refresh, replay, and mastery flows may earn normal study XP only when they run through a real lesson/question flow.

## Course Screen Priority

The course screen must show one primary action. Secondary engagement systems can be visible, but they must not compete with the next useful learning step.

Priority order:

| Priority | Primary action | When |
|----------|----------------|------|
| 1 | Continue or start the next core lesson | Default state when a core lesson is available. |
| 2 | Resume an interrupted lesson/session | User has unfinished in-session progress that can safely resume. |
| 3 | Return/comeback re-entry | User is lapsed, abandoned, or has high suppression/killed support signals. |
| 4 | Mastery candidate | Core unit is complete, slot is available, user is not graduated, and not at ceiling. |
| 5 | Short review/refresh | User shows decay or repeated miss without needing a full return flow. |
| 6 | Daily goal/quest nudge | It reinforces the selected primary learning action. |
| 7 | League/social status | User has recent learning activity and is not in recovery state. |
| 8 | Shop/paywall | User has passed value gates and the prompt does not block the primary learning action. |

Reject:
- More than one primary CTA on the course screen.
- League, quest, shop, or paywall UI above the first useful lesson action for new/lapsed users.
- Mastery CTA when the user has not completed the core unit, has no slot, is graduated, or is at ceiling.
- Support cards that hide the core path or make support look like the main product.

## Engagement State Machine

Engagement behavior must be chosen from user state, not from whichever feature wants attention.

| State | Enter when | Primary product behavior | Disallowed pressure |
|-------|------------|--------------------------|---------------------|
| `new_user` | No completed lesson | Route to one fast successful lesson. | Paywall, league pressure, hard mastery, multi-step quests. |
| `activated` | `1-2` completed lessons | Reinforce daily goal, next lesson, and clear progress. | Normal paywall before `lesson_complete >= 3`. |
| `daily_active` | Studied today or active short streak | Show next lesson plus lightweight quest/streak progress. | Shop-first or league-first course screen. |
| `stable` | Repeated completions with healthy accuracy/completion | Introduce mastery, league, badges, and deeper challenge. | Reward spam after every tap. |
| `lapsed` | Missed expected return window or no study after comeback threshold | Offer neutral re-entry, comeback reward if eligible, and short lesson. | Shame copy, demotion-first league copy, monetization after failure. |
| `comeback` | First session after lapse | Keep the path short; celebrate one real completion. | Harder lesson, long quest chain, paywall after failed comeback. |
| `at_risk` | Abandonment, repeated killed/suppressed support, or low completion quality | Reduce friction, show return/support, and lower difficulty pressure. | Mastery escalation, competitive pressure, scarcity prompts. |

State transition rules:
- `new_user -> activated` only after a completed lesson.
- `activated -> daily_active` after a same-day return or continued study.
- `daily_active -> stable` after repeated completions without completion-quality damage.
- Any state can enter `lapsed` after missed return windows.
- Any state can enter `at_risk` after abandonment or repeated support failure.
- `lapsed -> comeback -> daily_active` requires a completed re-entry lesson, not just opening the app.

## Analytics Event Contract

Engagement analytics must explain three things: what was shown, what the user did, and whether the reward/economy stayed valid.

Required common properties:
- `user_state`
- `surface`
- `source`
- `app_env`
- `app_version`
- `session_id`
- `local_date`

Reward events must also include:
- `reward_type`
- `reward_amount`
- `source_event_id`
- `idempotency_key`

Required events:

| Event | Required specific properties | Purpose |
|-------|------------------------------|---------|
| `engagement_primary_action_shown` | `primary_action_type`, `priority_rank`, `priority_reason`, `lesson_id`, `support_kind` | Confirms course screen priority rules. |
| `engagement_primary_action_started` | `primary_action_type`, `priority_rank`, `entrypoint` | Measures whether the chosen action is actually used. |
| `daily_goal_reached` | `dailyGoal`, `dailyXp`, `gemsAwarded`, `source` | Verifies habit loop reward yield. |
| `quest_claimed` | `templateId`, `type`, `rewardXp`, `rewardGems`, `source` | Detects quest farming and reward drift. |
| `streak_repair_offered` | `previousStreak`, `costGems`, `expiresAt` | Audits lapse recovery pressure. |
| `comeback_reward_offered` | `daysSinceStudy`, `rewardEnergy`, `rewardGems`, `thresholdDays`, `source` | Measures neutral re-entry exposure. |
| `comeback_reward_claimed` | `daysSinceStudy`, `rewardEnergy`, `rewardGems`, `source` | Tracks recovery reward claims. |
| `course_support_shown` | `lessonId`, `kind`, `reason`, `signalConfidence`, `weeklySupportRemaining`, `weeklyKindRemaining` | Audits return/adaptive/refresh/replay/mastery pressure. |
| `course_support_started` | `lessonId`, `kind`, `reason`, `activeSlotsRemaining` | Confirms support CTAs are used. |
| `course_support_completed` | `lessonId`, `kind`, `reason`, `source` | Verifies support sessions do not substitute for core progress. |
| `league_entry_shown` | `weekId`, `leagueId`, `tier`, `weeklyXp`, `weeklyXpZeroState`, `memberCount`, `rank` | Ensures social pressure appears in the right states. |
| `engagement_paywall_guardrail` | `lesson_complete_count`, `allowed`, `blocked_reason` | Proves paywall gates preserve first value and retention guardrails. |
| `engagement_reward_granted` | `rewardType`, `rewardAmount`, `sourceEventName`, `sourceEventId`, `idempotencyKey`, `surface` | Central audit trail for reward grants. |

Implementation notes:
- Existing events keep their current names; do not rename them only to match this document.
- `engagement_primary_action_shown`, `engagement_primary_action_started`, and `engagement_paywall_guardrail` are implemented for the course world surface.
- `league_entry_shown` is implemented for the leaderboard tab.
- `engagement_reward_granted` is implemented for quest claims, daily goals, comeback rewards, streak milestones, and league rewards.
- `onboarding_first_lesson_targeted` and `onboarding_first_lesson_completed` are implemented to measure first-session success.
- Lesson completion now has an explicit habit-loop closure card plus one-shot success haptic and level-up sound.
- Course world now receives daily goal, daily XP, and streak state so the visible return reason is tied to runtime progress.
- `engagement_return_reason_shown` is implemented for the course world habit summary so daily-goal, streak repair, comeback reward, and return-support reasons are auditable.
- Quest reward guardrails are covered by `rewardEconomyGuardrails.test.ts`.
- `/debug/analytics` now exposes engagement counters and an engagement audit feed with payload fields for local runtime verification.
- `/debug/analytics` also evaluates local engagement health: primary-action shown/started drift, reward idempotency keys, duplicate reward grants, and paywall-before-first-completion guardrails.
- Analytics debug payload capture preserves arrays and shallow objects as bounded strings so onboarding selections and reward payloads remain inspectable.
- Reward events that can double-grant must gain `idempotency_key` before they are used as the grant audit source.

Reject:
- Reward grant without `idempotency_key`.
- Primary action event without `user_state` or `priority_rank`.
- Paywall exposure that cannot report `lesson_complete_count`.
- Quest claim event that omits reward values.
- League event that cannot distinguish zero-XP users.

## Success Metrics

Primary:
- `lesson_complete_user_rate_7d`
- `D1 retention`
- `D7 retention`
- `weekly_xp_zero_ratio`
- `engagement_primary_action_start_rate`

Habit:
- `first_session_lesson_completion_rate`
- `daily_goal_completion_rate`
- `comeback_session_completion_rate`
- `streak_repair_accept_rate`

Motivation economy:
- `quest_started_rate`
- `quest_completed_rate`
- `quest_claim_rate`
- `badge_toast_seen_to_next_lesson_rate`
- `xp_per_completed_lesson_distribution`

Pacing:
- `lesson_abandon_rate`
- `question_accuracy_by_lesson`
- `return_support_completion_rate`
- `mastery_started_rate`
- `mastery_completed_rate`

Social:
- `league_join_rate`
- `weekly_xp_zero_ratio`
- `league_active_member_ratio`
- `league_match_quality_p50_p90`

Monetization:
- `paywall_shown_rate`
- `paid_conversion_7d`
- `energy_block_rate`
- `energy_shop_intent`
- `D1/D7 retention after monetization exposure`

Analytics quality:
- `engagement_event_schema_valid_rate`
- `reward_grant_idempotency_conflict_rate`
- `primary_action_missing_state_rate`
- `paywall_guardrail_block_rate`

## Failure Conditions

- D1 retention drops more than `1.5pp` after an engagement change.
- D7 retention drops more than `1.0pp` after an engagement change.
- `weekly_xp_zero_ratio >= 40%` after league surfacing changes.
- Energy block rate exceeds the current experiment rollback gate.
- Quest or support paths become more efficient for XP than normal lesson completion.
- Paywall conversion improves while lesson completion or retention materially drops.
- Any engagement loop creates shame copy around lapse, low rank, or support use.
- Course screen shows multiple primary CTAs or violates the priority order without a documented exception.
- Reward, paywall, or primary-action events ship without the required analytics properties.

## Test / Verification Plan

Static checks:
- Verify XP sources remain study-centered.
- Verify quest rewards do not exceed comparable lesson effort.
- Verify paywall is not reachable before first value moment.
- Verify support paths do not progress core path as a substitute.
- Verify course screen priority resolves to exactly one primary action per user state.
- Verify engagement config values stay within Numeric Guardrails.

Runtime checks:
- Complete a first session and confirm next action remains clear.
- Miss a day and confirm comeback flow is neutral and short.
- Trigger support and verify it does not produce better reward yield than core lessons.
- Complete a lesson and confirm XP, quests, streak, and league all update once.
- Exercise `new_user`, `activated`, `daily_active`, `lapsed`, `comeback`, `stable`, and `at_risk` states and confirm pressure is appropriate.

Analytics checks:
- Use `DATA_COLLECTION_PLAYBOOK.md` for the first 7-day read.
- Use `ENERGY_EXPERIMENT_GATES.md` for energy changes.
- Use `LEAGUE_OPS.md` for league health.
- Compare any monetization change against retention before increasing exposure.
- Validate required engagement events and reward idempotency keys before enabling new mechanics.

## Relationship To Existing Docs

| Area | Source of truth |
|---|---|
| Content quality | `PRINCIPLES.md`, `CONTENT_SYSTEM_SPEC.md`, `QUALITY_CONSTITUTION.md` |
| XP and study progression | `XP_UNIT_SPEC.md` |
| Energy tuning | `ENERGY_EXPERIMENT_GATES.md` |
| League operations | `LEAGUE_OPS.md` |
| Measurement cadence | `DATA_COLLECTION_PLAYBOOK.md` |
| Engagement top-level rules | `ENGAGEMENT_PRINCIPLES.md` |

## Assumptions

- The current priority is retention and learning continuity, not short-term monetization maximization.
- Psycle should feel closer to a supportive learning companion than a pure competitive game.
- Engagement mechanics should make the next good learning action easier to take.
