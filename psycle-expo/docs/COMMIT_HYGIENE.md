# Commit Hygiene

Current `psycle-expo` worktree is large enough that it should be split into deliberate commit buckets instead of a single sweep commit.

## Preserve First

Do not delete or collapse these surfaces during cleanup:

- `design-previews/`
- `app/debug/`
- `components/provisional/`
- `public/*.html`

## Recommended Commit Order

1. `hygiene_tooling`
   - `.gitignore`
   - `docs/REPO_HYGIENE.md`
   - `docs/START_HERE.md`
   - `docs/WORKTREE_CLEANUP.md`
   - `docs/UX_NATIVE_AGENT.md`
   - `scripts/worktree-status-buckets.py`
   - `scripts/native-agent/*`
   - `scripts/ios/*`

2. `screen_shells`
   - `app/(tabs)/*`
   - `app/lesson.tsx`
   - `app/review.tsx`
   - `app/mistakes-hub.tsx`
   - `app/settings/*`
   - `components/course/`
   - `components/friends/`
   - `components/leaderboard/`
   - `components/lesson/`
   - `components/profile/`
   - `components/quests/`
   - `components/review/`
   - `components/settings/`
   - `components/shop/`

3. `question_runtime`
   - `components/QuestionRenderer.tsx`
   - `components/QuestionTypes.tsx`
   - `components/QuestionRendererView.tsx`
   - `components/question-runtime/`
   - `components/question-types/`
   - `types/question.ts`

4. `app_state`
   - `lib/app-state/economy*`
   - `lib/app-state/progression*`
   - `lib/app-state/billing*`
   - `lib/app-state/practice*`
   - `lib/badges.ts`
   - `lib/streaks.ts`

5. `analytics_content_config`
   - `lib/analytics*`
   - `lib/gamificationConfig*`
   - `lib/lessons.ts`
   - `lib/lesson-data/`
   - `lib/remoteContent*`
   - `lib/courseWorld*`

6. `social_league_quest`
   - `lib/friendChallenges.ts`
   - `lib/social.ts`
   - `lib/league*`
   - `lib/notifications*`
   - `lib/quest*`
   - `lib/friends/`
   - `lib/quests/`

7. `generated_data`
   - `data/lessons/*/index.ts`
   - `lib/locales/*.ts`
   - `scripts/gen-lesson-locale-index.js`

8. `preview_debug`
   - `app/debug/*`
   - `components/provisional/`
   - `design-previews/`
   - `lib/debug/`
   - `public/`

9. `remaining_other`
   - root infra
   - tests
   - misc helpers not cleanly covered above

## Working Rule

Before staging, run:

```bash
python3 scripts/worktree-status-buckets.py
```

Stage one bucket at a time. If a file spans multiple concerns, keep it with the commit that best explains the behavior change, not the folder it happens to live in.
