# Commit Hygiene

Current `psycle-expo` worktree is large enough that it should be split into deliberate commit buckets instead of a single sweep commit.

## Non-Negotiable Rule

Do not let a weak lesson create a broad mixed commit.

The correct order is:

1. raw pilot / lesson experience
2. Simulator playthrough
3. small runtime or data change
4. audit regression net
5. docs handoff

If a change contains generated lesson JSON before the corresponding runtime
experience has been verified, keep the generated data out of the commit. If a
change introduces a new audit, the same commit must include the minimum content
or metadata required for that audit to pass.

## Preserve First

Do not delete or collapse these surfaces during cleanup:

- `design-previews/`
- `app/debug/`
- `components/provisional/`

Unreferenced static mockups under `public/` are cleanup targets, not preserve-first surfaces.

## Recommended Commit Order

1. `workspace_agent_guidance`
   - `../AGENTS.md`
   - `../CLAUDE.md`

2. `north_star_quality_system`
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

3. `local_artifacts`
   - `_artifacts/`

   Treat tracked archive deletion as a deliberate repo hygiene cleanup. Do not
   regenerate archives to make the worktree look clean.

4. `hygiene_tooling`
   - `.gitignore`
   - `docs/REPO_HYGIENE.md`
   - `docs/START_HERE.md`
   - `docs/WORKTREE_CLEANUP.md`
   - `docs/UX_NATIVE_AGENT.md`
   - `scripts/worktree-status-buckets.py`
   - `scripts/native-agent/*`
   - `scripts/ios/*`

5. `release_config`
   - `app.config.js`
   - `eas.json`
   - `config/`
   - `package.json` / `package-lock.json`
   - launch/readiness scripts
   - E2E smoke files
   - Supabase config surfaces

6. `screen_shells`
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

7. `ui_foundation`
   - global UI primitives
   - course-world visual shell
   - shared theme changes

8. `question_runtime`
   - `components/QuestionRenderer.tsx`
   - `components/QuestionTypes.tsx`
   - `components/QuestionRendererView.tsx`
   - `components/question-runtime/`
   - `components/question-types/`
   - `types/question.ts`

9. `app_state`
   - `lib/AuthContext.tsx`
   - `lib/app-state/economy*`
   - `lib/app-state/progression*`
   - `lib/app-state/billing*`
   - `lib/app-state/practice*`
   - `lib/badges.ts`
   - `lib/streaks.ts`

10. `analytics_content_config`
   - `lib/analytics*`
   - `lib/gamificationConfig*`
   - `lib/lessons.ts`
   - `lib/lesson-data/`
   - `lib/remoteContent*`
   - `lib/courseWorld*`
   - theme manifest runtime/data

11. `lesson_runtime`
   - `lib/lesson/`
   - `lib/lessonCompletionRecap.ts`
   - `lib/lessonContinuity*`
   - `lib/lessonOperational*`
   - mastery candidate/inventory logic
   - onboarding selection logic

12. `billing_shop`
   - `lib/billing.ts`
   - `lib/shop/`
   - checkout policy

13. `content_generation_pipeline`
   - content generator package and pipeline files
   - evidence/claim/continuity helper scripts
   - retired external-LLM generation scripts

14. `generated_data`
   - `data/lessons/*/index.ts`
   - lesson JSON, evidence JSON, continuity JSON
   - `lib/locales/*.ts`
   - `scripts/gen-lesson-locale-index.js`

15. `preview_debug`
   - `app/debug/*`
   - `components/provisional/`
   - `design-previews/`
   - `lib/debug/`

16. `test_contracts`
   - `jest.setup.js`
   - `src/__tests__/`

## Working Rule

Before staging, run:

```bash
python3 scripts/worktree-status-buckets.py
```

Stage one bucket at a time. If a file spans multiple concerns, keep it with the commit that best explains the behavior change, not the folder it happens to live in.
