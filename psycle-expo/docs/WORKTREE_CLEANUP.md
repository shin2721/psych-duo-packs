# Worktree Cleanup Map

Use this file to turn the current large Psycle worktree into understandable feature-area chunks.

Quick status command:

```bash
python3 scripts/worktree-status-buckets.py
```

This prints the current `git status --short` grouped by the buckets below.

Commit split order:

```bash
cat docs/COMMIT_HYGIENE.md
```

## Preserve

Do not delete these surfaces during cleanup:

- `design-previews/`
- `app/debug/`
- `components/provisional/`
- `public/*.html`

These include Claude/Codex temporary UI and retained debug surfaces.

## Cleanup Order

1. repo hygiene and docs
2. iOS native repair and smoke tooling
3. app shell compression
4. app-state container split
5. question runtime and renderer split
6. analytics, remote content, lessons, config facades
7. generated lesson locale indexes
8. preview/debug assets

## Suggested Feature Buckets

### 1. Hygiene and Tooling

- `.gitignore`
- `docs/REPO_HYGIENE.md`
- `docs/START_HERE.md`
- `docs/IOS_NATIVE_REPAIR_PLAYBOOK.md`
- `docs/UX_NATIVE_AGENT.md`
- `scripts/ios/`
- `scripts/native-agent/`

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

- `design-previews/claude/`
- `design-previews/*.swift`
- `app/debug/`
- `components/provisional/`
- `lib/debug/`
- `public/*.html`

## Done Definition

The worktree is reasonably organized when:

1. `git status --short` is understandable by feature bucket.
2. preview/debug surfaces are preserved intentionally, not mixed into unrelated cleanup.
3. local-only artifacts stay ignored.
4. native smoke status is recorded separately from code cleanup status.
