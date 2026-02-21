# Psycle Big App Roadmap

> Updated for v1.23: North-star behavior is Study (`lesson_complete`), not self-reported action.

## Current strengths

- League loop is implemented end-to-end (weekly settle, rewards, claim flow).
- Study streak + streak repair + local reminder stack is active.
- Config + entitlement based tuning is available for fast iteration.
- Dogfood logging and analytics schema versioning are in place.

## S-priority work

### S1. Resource simplification

- Keep lesson gating on Energy only.
- Avoid reintroducing duplicate gating systems.

### S2. North-star consistency (Study-centered)

- Daily win condition: complete at least one lesson.
- Progress and retention tuning should optimize `lesson_complete_user_rate_7d`.
- Streak and reminder logic should remain based on `studyStreak` / `lastStudyDate`.

### S3. Monetization clarity

- Keep subscription model clear (Free vs Pro/Max value boundary).
- Avoid mechanics that increase complexity without improving conversion.

### S4. Measurement maturity

Minimum events:

- `lesson_start` / `lesson_complete`
- `question_incorrect` / `streak_lost`
- `energy_blocked`
- `checkout_start` / `plan_changed`
- `reminder_scheduled` / `reminder_opened`

## A-priority growth loops

- Shareable moments: streak repair success, league promotion.
- Referral and comeback loops after retention stabilizes.

## 7-day KPI watch

| KPI | Purpose |
|-----|---------|
| `lesson_complete_user_rate_7d` | Core engagement health |
| `d7_retention_rate_7d` | Retention health |
| `streak_repair_purchased / streak_repair_offered` | Churn rescue effectiveness |
| `plan_changed / checkout_start` | Monetization guardrail |
