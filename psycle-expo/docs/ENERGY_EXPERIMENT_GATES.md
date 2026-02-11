# Energy Experiment Gates (Fixed v1)

## Constraints
- Single-spec operation only.
  - Per `/docs/PRINCIPLES.md`, we do **not** run parallel A/B specs.
  - We evaluate by **sequential pre/post windows**.
- Timezone for all windows and reporting:
  - `Asia/Tokyo (JST, UTC+9)`
- Change only one parameter per iteration.

## Fixed Spec (v1)
- Baseline window (current spec):
  - `2026-02-11 00:00 JST` to `2026-02-17 23:59 JST`
  - `maxEnergy = 3`
  - `refill = +1 / 60 minutes`
  - `lesson cost = 1`
  - `streak bonus = 10%` at every `5` correct, `max 1/day`
- Candidate window (single change):
  - `2026-02-18 00:00 JST` to `2026-02-24 23:59 JST`
  - only change: `energy_streak_bonus_chance = 0.08`
  - all other parameters remain identical

## Event Definitions
- `energy_blocked`: user attempted lesson start without enough energy.
- `shop_open_from_energy`: user opened shop from an energy context.
- `energy_bonus_hit`: streak bonus was successfully granted.

## Primary KPIs
- `energy_block_rate = energy_blocked / lesson_start`
- `energy_shop_intent = shop_open_from_energy / energy_blocked`
- `D1_retention` and `D7_retention` vs baseline cohort
- `paid_conversion_7d` from the same cohort (Stripe/Supabase source of truth)

## Minimum Sample Gates
- `lesson_start_uv >= 300` in each 7-day window
- `energy_blocked >= 80` in candidate window
- If sample gates fail, extend candidate window by 7 days and re-evaluate.

## Decision Gates (after candidate day 7)
- Ship candidate (`0.10 -> 0.08`) only if all pass:
  - `D1_retention` drop <= `1.5pp` vs baseline
  - `D7_retention` drop <= `1.0pp` vs baseline
  - `energy_block_rate` in `8%` to `18%`
  - `energy_shop_intent >= 25%`
  - `paid_conversion_7d` lift >= `+0.3pp` vs baseline
- Roll back immediately if any hit:
  - `D1_retention` drop > `1.5pp`
  - `D7_retention` drop > `1.0pp`
  - `energy_block_rate > 18%`
- Keep baseline if candidate is neutral:
  - conversion lift `< +0.3pp` and no meaningful guardrail improvement.

## Next Move Ladder (single-step only)
- If too loose (`energy_block_rate < 8%` and no conversion lift):
  - next candidate: `energy_streak_bonus_chance = 0.06`
- If too strict (retention hit or high block):
  - revert to baseline then test `energy_refill_minutes = 50`

## Implementation Prerequisite
- Before starting candidate window, parameter source must be unified.
  - Current `state.tsx` uses hardcoded energy constants.
  - Candidate rollout requires reading from `config/entitlements.json` defaults, so one config change maps to runtime behavior.
