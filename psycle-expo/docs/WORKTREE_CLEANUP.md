# Worktree Cleanup Map

Use this file to turn the current large Psycle worktree into understandable feature-area chunks.

Quick status command:

```bash
python3 scripts/worktree-status-buckets.py
```

This prints the current `git status --short` grouped by the buckets below.

## Current Cleanup Snapshot

As of 2026-05-16, the worktree is organized enough to reason about, but it is
not commit-ready as one change. `python3 scripts/worktree-status-buckets.py`
must print no `[other]` bucket before calling the tree organized.

Current buckets:

- `workspace_agent_guidance`
  - workspace-level agent rules in `../AGENTS.md` / `../CLAUDE.md`.
  - Keep separate from app behavior changes.
- `north_star_quality_system`
  - North Star docs, content-intake stores, lesson-quality audits, and CI hooks.
  - This is the first bucket to preserve because other work depends on these contracts.
- `local_artifacts`
  - tracked release archives under `_artifacts/`.
  - These are local build outputs and should not be regenerated just to silence status noise.
- `screen_shells`
  - lesson/course UI wiring and the new lesson intro surface.
  - Requires Simulator verification before being called product-ready.
- `ui_foundation`
  - shared course-world visuals.
- `question_runtime`
  - question result / swipe runtime / shared question types.
- `app_state`
  - auth and progression state behavior.
- `analytics_content_config`
  - lesson metadata, lesson loading, analytics event definitions.
- `lesson_runtime`
  - lesson flow, completion effects, recap, analytics, and pacing.
- `content_generation_pipeline`
  - generator, evidence, extractor, deterministic gates, and lesson validation.
- `generated_data`
  - lesson JSON and locale dictionaries generated from the current lesson spine.
  - High risk for accidental churn. Stage only after validating the corresponding lesson/runtime change.
- `preview_debug`
  - retained debug route changes.
- `test_contracts`
  - Jest setup and tests that pin the above changes.

Do not collapse these into one commit or one PR narrative. The current tree is
understandable only when split by these buckets.

Commit split order:

```bash
cat docs/COMMIT_HYGIENE.md
```

## Preserve

Do not delete these surfaces during cleanup:

- `design-previews/`
- `app/debug/`
- `components/provisional/`

These include retained debug surfaces and explicitly owned temporary UI.

## Cleanup Order

1. workspace agent guidance
2. North Star quality system
3. repo hygiene and docs
4. local artifact cleanup
5. app shell / lesson UI
6. app-state and auth behavior
7. question runtime and renderer split
8. analytics, lesson runtime, content config
9. content generation pipeline
10. generated lesson / locale data
11. preview/debug assets
12. test contracts, paired with their owning bucket when possible

## Suggested Feature Buckets

### 1. Hygiene and Tooling

- `.gitignore`
- `docs/REPO_HYGIENE.md`
- `docs/START_HERE.md`
- `docs/WORKTREE_CLEANUP.md`
- `docs/IOS_NATIVE_REPAIR_PLAYBOOK.md`
- `docs/UX_NATIVE_AGENT.md`
- `scripts/ios/`
- `scripts/native-agent/`

### 1a. Workspace Agent Guidance

- `../AGENTS.md`
- `../CLAUDE.md`

### 1b. North Star Quality System

- `.github/workflows/content-quality.yml`
- `docs/PRINCIPLES.md`
- `docs/CONTENT_SYSTEM_SPEC.md`
- `docs/CONTENT_GUIDELINES.md`
- `docs/LESSON_AUTHORING.md`
- `docs/OPERATIONS.md`
- `docs/BIGAPP_ROADMAP.md`
- `docs/LESSON_PILOT_RAW.md`
- `docs/NORTH_STAR_PROGRESS.md`
- `docs/REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md`
- `data/content-intake/`
- `scripts/append-north-star-progress.js`
- `scripts/audit-lesson-quality-algorithm.js`
- `scripts/audit-paleo-insight-layer.js`
- `scripts/audit-reference-calibration.js`
- `scripts/audit-retention-content-loop.js`
- `scripts/check-lesson-authoring-single-source.sh`
- `scripts/check-north-star-progress.js`
- `scripts/content-intake.js`
- `scripts/rebuild-ja-lessons-to-spine.js`
- `types/contentIntake.ts`

### 1c. Local Artifacts

- `_artifacts/`

These should remain ignored for future output. If tracked release archives are
removed, keep that as an explicit cleanup decision rather than mixing it with
lesson or UI changes.

### 2. Screen and Component Shell Compression

- `app/(tabs)/course.tsx`
- `app/(tabs)/friends.tsx`
- `app/(tabs)/leaderboard.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/quests.tsx`
- `app/(tabs)/shop.tsx`
- `app/auth.tsx`
- `app/lesson.tsx`
- `app/mistakes-hub.tsx`
- `app/review.tsx`
- `app/settings/`
- `components/course/`
- `components/friends/`
- `components/leaderboard/`
- `components/lesson/`
- `components/profile/`
- `components/quests/`
- `components/review/`
- `components/settings/`
- `components/shop/`

### 3. Question Runtime Split

- `components/QuestionRenderer.tsx`
- `components/QuestionRendererView.tsx`
- `components/QuestionTypes.tsx`
- `components/question-runtime/`
- `components/question-types/`
- `types/question.ts`

### 4. App State Refactors

- `lib/app-state/billing.tsx`
- `lib/app-state/economy.tsx`
- `lib/app-state/practice.tsx`
- `lib/app-state/progression.tsx`
- `lib/app-state/economy/`
- `lib/app-state/progression/`
- `lib/app-state/economyPersistence.ts`
- `lib/app-state/economyRemote.ts`
- `lib/app-state/progressionLiveOps.ts`
- `lib/app-state/progressionQuests.ts`

### 5. Analytics, Content, and Config Facades

- `lib/analytics*`
- `lib/analytics-events/`
- `lib/analytics-runtime/`
- `lib/remoteContent*`
- `lib/lessons.ts`
- `lib/lesson-data/`
- `lib/gamificationConfig*`
- `lib/courseWorld*`

### 6. Social, League, and Quest Cleanup

- `lib/friendChallenges.ts`
- `lib/league*`
- `lib/questDefinitions.ts`
- `lib/questFactory.ts`
- `lib/questTemplates.ts`
- `lib/social.ts`
- `lib/notifications*`

### 7. Generated and Data Surfaces

- `data/lessons/*/index.ts`
- `lib/locales/*.ts`
- `scripts/gen-lesson-locale-index.js`

### 8. Preview and Debug Surfaces

- `design-previews/*.swift`
- `app/debug/`
- `components/provisional/`
- `lib/debug/`

## Done Definition

The worktree is reasonably organized when:

1. `git status --short` is understandable by feature bucket.
2. preview/debug surfaces are preserved intentionally, not mixed into unrelated cleanup.
3. local-only artifacts stay ignored.
4. native smoke status is recorded separately from code cleanup status.
