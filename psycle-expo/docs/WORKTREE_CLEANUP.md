# Worktree Cleanup Map

Use this file to turn the current large Psycle worktree into understandable feature-area chunks.

Quick status command:

```bash
python3 scripts/worktree-status-buckets.py
```

This prints the current `git status --short` grouped by the buckets below.

## Do Not Repeat

The cleanup exists because lesson-quality work previously mixed weak content,
new principles, audit changes, UI/runtime edits, generated lesson JSON, and
tests in one worktree. That made it impossible to tell whether Psycle improved
or merely accumulated rules.

Do not repeat that workflow.

- A weak lesson is fixed first as a raw pilot or lesson experience, not by
  adding docs or audit gates.
- A raw pilot becomes runtime work only after it is worth preserving.
- Generated lesson JSON is never staged just because a script changed it.
  Keep it out of the active change until the matching lesson/runtime behavior
  has been verified in Simulator.
- Do not use `stash` as a hidden junk drawer. If a stash is kept, it needs a
  name that says whether it is quarantine, future work, or a candidate patch.
- If `python3 scripts/worktree-status-buckets.py` prints `[other]`, or if one
  bucket mixes docs, runtime, generated data, and tests, stop feature work and
  organize the tree first.
- Do not commit a "quality system" change unless the audits it introduces can
  pass on the files included in the same commit.

## Current Cleanup Snapshot

As of 2026-07-11, the current product surface is the clock Course World plus the
question/completion runtime. The earlier vertical Trail, legacy Course shell,
provisional hero, GPT course prototype, and Expo starter entry have been
removed. Course nodes now come from real loaded lesson inventory rather than a
generated 100-node scaffold.

The remaining high-risk areas stay separate:

- `learning_core`: question identity, claim/source trace, authored sequence
- `progression_state`: completion, review, mastery, and persistence
- `content_evidence`: lesson/evidence semantic alignment and production state
- `native_billing`: reproducible native build and server-owned entitlements
- `test_contracts`: behavior and integration proof for the owning area

Do not collapse these into one commit or one PR narrative.

Commit split order:

```bash
cat docs/COMMIT_HYGIENE.md
```

## Preserve

Do not delete these surfaces during cleanup:

- `design-previews/`
- `app/debug/`

These include retained references and wired debug surfaces. Unwired prototypes
are deleted rather than kept as provisional product code.

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
- `lib/debug/`

## Done Definition

The worktree is reasonably organized when:

1. `git status --short` is understandable by feature bucket.
2. preview/debug surfaces are preserved intentionally, not mixed into unrelated cleanup.
3. local-only artifacts stay ignored.
4. native smoke status is recorded separately from code cleanup status.
