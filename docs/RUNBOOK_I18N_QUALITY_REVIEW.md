# i18n Quality Review Runbook

## Purpose
Run a lightweight weekly review of translated lessons to catch unnatural phrasing, probabilistic wording issues, and terminology drift.

## Scope
- EN lesson files under `psycle-expo/data/lessons/**`.
- Focused on language quality, not structural validation (those are handled by `content:i18n:check`).

## Cadence
- Weekly (15–30 minutes).

## Sample Selection
1. Pick one unit per week (rotate: mental → health → money → social → study → work).
2. Review 2 lessons from that unit.
3. Review 5–10 questions per lesson.

## What to Look For
- **Unnatural phrasing**: sentences that feel machine-translated or awkward.
- **Probabilistic wording**: “may”, “might”, “likely” used inconsistently or ambiguously.
- **Terminology consistency**: the same concept translated in multiple ways.
- **Answer clarity**: correct option is defensible and explanation supports it.

## Recording Issues
Capture issues in a short note or issue tracker entry:
- Lesson ID
- Question ID
- Problem type
- Exact text snippet
- Suggested correction

## Follow-up
1. Fix in a small PR (one unit or one purpose only).
2. Run `content:i18n:check`.
3. Link the review note to the PR.
