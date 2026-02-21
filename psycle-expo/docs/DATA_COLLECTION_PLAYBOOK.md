# Data Collection Playbook

> 1-week measurement phase. No feature additions; tune config only.

## Operating rules

- Do not add new product mechanics during the measurement week.
- Limit config changes to at most twice per week.
- Check the same KPI set at the same local time every day.

## Core KPIs and targets

### 1) `lesson_complete_user_rate_7d` (primary)

| Status | Reference |
|--------|-----------|
| Strong | 45%+ |
| Healthy | 30–45% |
| Weak | <=25% |

When weak:

1. Improve lesson start discoverability.
2. Reduce early-session friction.
3. Improve first-session completion quality.

### 2) Retention (`d1`, `d7`)

| KPI | Reference |
|-----|-----------|
| D1 | 25%+ healthy, 35%+ strong |
| D7 | 10%+ healthy, 15%+ strong |

### 3) League activity (`weekly_xp = 0` ratio)

| Status | Reference |
|--------|-----------|
| Healthy | <20% |
| Risk | >=40% |

If high, inspect league discoverability and weekly XP connection first.

### 4) Paywall conversion

| Status | Reference |
|--------|-----------|
| Healthy | 1–3% |
| Strong | 3–6% |
| Weak | <0.5% |

Do not over-increase paywall exposure if retention drops.

## 7-day decision cadence

| Period | Check |
|--------|-------|
| Day 1–2 | Fatal funnel breaks (`lesson_complete_user_rate_7d`, weekly XP health) |
| Day 3–4 | League loop quality and visibility |
| Day 5–7 | Early D7 trend and comeback behavior |

## Decision template

| Signal | Action |
|--------|--------|
| Lesson completion healthy + league zero-XP low | Continue tuning |
| Lesson completion weak | Fix first-session success path before adding systems |
| Paywall weak but retention stable | Tune paywall copy/value, not frequency first |
