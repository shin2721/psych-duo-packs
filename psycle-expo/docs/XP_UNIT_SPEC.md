# XP & Unit Progress Spec

> v1.23 update: Study-centered progression. No self-reported action bonus.

## 1. XP policy

- XP is awarded through study flow only.
- No extra XP is granted from self-reported action buttons.
- Keep XP logic deterministic and idempotent.

### Current XP sources

| Source | Value | Condition |
|--------|-------|-----------|
| `lesson_complete` | 20 | lesson completion |
| `correct_answer` | 5 | per correct answer where applicable |
| `felt_better_positive` | 10 | positive felt-better response |

## 2. Study progression

- Daily core path: complete lessons and maintain study streak.
- Start flow should prioritize fastest route to next lesson completion.
- Onboarding should guarantee first successful lesson completion quickly.

## 3. Lesson composition

Recommended lesson template:

1. Concept
2. Example
3. Procedure
4. Pitfall
5. Reflection
6. Review checkpoint
7. Summary

## 4. Operational checks

- No duplicated XP grants for one lesson completion.
- Weekly league XP updates from lesson XP remain connected.
- App restart does not lose XP/streak state.

## 5. Done criteria

- Lesson completion updates XP exactly once.
- No action-based bonus appears in XP breakdown.
- Study streak progresses from lesson behavior only.
- Paywall gating remains lesson-based (`lesson_complete >= 3`).
