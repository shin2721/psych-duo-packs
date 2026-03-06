# Psycle UI Probabilistic Evaluation (iOS Simulator)

Date: 2026-03-05 (JST)  
Scope: onboarding/auth/course/lesson/review/mistakes-hub/quests/leaderboard/friends/shop/profile/settings/edit-profile/analytics-debug

## Evidence
- E2E pass:
  - `npm run e2e:ios:release -- --testPathPattern='ui.full_touch.e2e.ts'` (PASS)
  - `npm run e2e:ios:release -- --testNamePattern='Scenario A: Initial Launch'` (PASS)
- Screenshots (pass run):
  - `artifacts/ios.sim.release.2026-03-05 08-52-35Z/✓ UI Full Touch Walkthrough should touch core, social, monetization, settings and support routes/`

## Scorecard (0-100)
1. First Session Reach (onboarding -> auth -> lesson_start): 86
2. Navigation Clarity (tab + settings + support routes): 74
3. Learning Loop Completion (lesson start/answer/continue): 71
4. Monetization Reach (paywall/shop/subscription CTA reachability): 73
5. Accessibility / Readability (contrast, text size, empty/error clarity): 66
6. Visual Consistency (layout rhythm, language consistency, loading behavior): 79

Overall probabilistic UI score: **75%**

## Friction Findings

### P0 (flow risk)
1. Leaderboard can stay in loading state without explicit timeout/retry/error CTA.
   - File: `app/(tabs)/leaderboard.tsx`
   - Signals: spinner-only state observed; loading path exists but no timeout UI.

2. `mistakes-hub` can open into a blocking error alert when session data is empty.
   - File: `app/mistakes-hub.tsx`
   - Signals: alert-only path on empty session; weak recovery UX.

### P1 (high impact on completion/CVR)
1. Friends tab has mixed language strings in JP flow (`Friends`, `Requests`, `Search`, empty text in EN).
   - File: `app/(tabs)/friends.tsx`
   - Likely impact: trust/readability drop.

2. Profile quick-action discoverability is inconsistent (`MistakesHubButton` visibility depends on data/progress).
   - Files: `app/(tabs)/profile.tsx`, `components/MistakesHubButton.tsx`
   - Likely impact: support-route reachability drop.

3. Settings/support has many rows but no in-screen status feedback for restore/portal success/failure except alerts.
   - File: `app/settings/index.tsx`
   - Likely impact: user uncertainty after action.

4. Shop first viewport prioritizes energy/status + one large card; yearly value props can be below the fold.
   - File: `app/(tabs)/shop.tsx`
   - Likely impact: annual conversion suppression.

### P2 (quality polish)
1. Header transition/crop feels unstable around settings/edit-profile screenshots.
   - Files: `app/settings/index.tsx`, `app/settings/edit-profile.tsx`

2. Course map lacks explicit “next lesson” textual cue on initial entry.
   - File: `app/(tabs)/course.tsx`

3. Review and MistakesHub empty states are semantically similar but visually different; could unify mental model.
   - Files: `app/review.tsx`, `app/mistakes-hub.tsx`

## Top 10 Implementation Backlog (effect x effort)

1. Leaderboard loading timeout + retry CTA
   - Files: `app/(tabs)/leaderboard.tsx`
   - Change: add timeout state (e.g. 10s) -> error panel with `Retry`.
   - Acceptance: loading spinner never persists without actionable retry.

2. MistakesHub empty-session fallback card (no blocking alert first)
   - Files: `app/mistakes-hub.tsx`
   - Change: replace first render alert path with in-screen empty state + `Back to Course`.
   - Acceptance: no modal error required for empty data path.

3. Friends tab full i18n migration
   - Files: `app/(tabs)/friends.tsx`, `lib/locales/ja.ts`, `lib/locales/en.ts`, `lib/locales/es.ts`, `lib/locales/zh.ts`, `lib/locales/fr.ts`, `lib/locales/de.ts`, `lib/locales/ko.ts`, `lib/locales/pt.ts`
   - Change: replace hardcoded EN labels/messages with i18n keys.
   - Acceptance: JP locale contains zero English UI strings in Friends routes.

4. Profile quick-actions deterministic visibility
   - Files: `components/MistakesHubButton.tsx`, `app/(tabs)/profile.tsx`
   - Change: always show button; if unavailable, show disabled state + reason.
   - Acceptance: quick action is always discoverable.

5. Settings action feedback standardization
   - File: `app/settings/index.tsx`
   - Change: add inline loading/success/failure indicator rows for restore/portal actions.
   - Acceptance: user can confirm action result without relying only on transient alerts.

6. Shop yearly value above fold
   - File: `app/(tabs)/shop.tsx`
   - Change: show yearly equivalent/discount summary near top when yearly is available.
   - Acceptance: annual value visible without scroll.

7. Header safe-area normalization (settings/edit-profile)
   - Files: `app/settings/index.tsx`, `app/settings/edit-profile.tsx`
   - Change: standardize header top spacing + safe-area edges.
   - Acceptance: no title crop/clipping during normal transitions.

8. Course “Next lesson” helper CTA
   - File: `app/(tabs)/course.tsx`
   - Change: add textual helper/CTA pointing to current node intent.
   - Acceptance: first-time user can identify next action in <3s.

9. Empty-state design system unification (review + mistakes hub)
   - Files: `app/review.tsx`, `app/mistakes-hub.tsx`
   - Change: shared empty-state component and copy pattern.
   - Acceptance: same structure/CTA semantics in both routes.

10. Leaderboard fallback for missing league join response
   - File: `app/(tabs)/leaderboard.tsx`
   - Change: when `leagueInfo` unresolved, show explicit state + manual refresh action.
   - Acceptance: user never sees ambiguous waiting state.

## Regression Snapshot
- `npx jest --watchman=false`: PASS (50/50 suites, 245/245 tests)
- `npm run validate:lessons`: PASS
- `npm run content:i18n:check`: PASS
- `npm run content:i18n:smoke`: PASS

## Rollback
All UI-evaluation specific changes are limited to testability/e2e files and can be reverted by removing:
- `e2e/ui.full_touch.e2e.ts`
- Added `testID` attributes in touched UI files

