# Commit Hygiene

Current `psycle-expo` worktree is large enough that it should be split into deliberate commit buckets instead of a single sweep commit.

## Preserve First

Do not delete or collapse these surfaces during cleanup:

- `design-previews/`
- `app/debug/`
- `components/provisional/`

Unreferenced static mockups under `public/` are cleanup targets, not preserve-first surfaces.

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

2. `release_config`
   - `app.config.js`
   - `eas.json`
   - `config/`
   - launch/readiness scripts
   - E2E smoke files
   - Supabase config surfaces

3. `screen_shells`
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

4. `ui_foundation`
   - global UI primitives
   - course-world visual shell
   - shared theme changes

5. `question_runtime`
   - `components/QuestionRenderer.tsx`
   - `components/QuestionTypes.tsx`
   - `components/QuestionRendererView.tsx`
   - `components/question-runtime/`
   - `components/question-types/`
   - `types/question.ts`

6. `app_state`
   - `lib/app-state/economy*`
   - `lib/app-state/progression*`
   - `lib/app-state/billing*`
   - `lib/app-state/practice*`
   - `lib/badges.ts`
   - `lib/streaks.ts`

7. `analytics_content_config`
   - `lib/analytics*`
   - `lib/gamificationConfig*`
   - `lib/lessons.ts`
   - `lib/lesson-data/`
   - `lib/remoteContent*`
   - `lib/courseWorld*`
   - theme manifest runtime/data

8. `lesson_runtime`
   - `lib/lesson/`
   - `lib/lessonContinuity*`
   - `lib/lessonOperational*`
   - mastery candidate/inventory logic
   - onboarding selection logic

9. `billing_shop`
   - `lib/billing.ts`
   - `lib/shop/`
   - checkout policy

10. `content_generation_pipeline`
   - content generator package and pipeline files
   - evidence/claim/continuity helper scripts
   - retired external-LLM generation scripts

11. `generated_data`
   - `data/lessons/*/index.ts`
   - lesson JSON, evidence JSON, continuity JSON
   - `lib/locales/*.ts`
   - `scripts/gen-lesson-locale-index.js`

12. `preview_debug`
   - `app/debug/*`
   - `components/provisional/`
   - `design-previews/`
   - `lib/debug/`

13. `test_contracts`
   - `src/__tests__/`

## Working Rule

Before staging, run:

```bash
python3 scripts/worktree-status-buckets.py
```

Stage one bucket at a time. If a file spans multiple concerns, keep it with the commit that best explains the behavior change, not the folder it happens to live in.
