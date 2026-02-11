# Energy Experiment Gates (T0-based)

## Constraints
- Single-spec operation only.
  - Per `/docs/PRINCIPLES.md`, we do **not** run parallel A/B specs.
  - We evaluate by **sequential pre/post windows**.
- Timezone for all windows and reporting:
  - `Asia/Tokyo (JST, UTC+9)`
- Change only one parameter per iteration.

## Window Definition (T0)
- `T0` = the exact timestamp when candidate config becomes effective for production users.
- Baseline window:
  - `T0 - 7d` to `T0` (exclusive)
  - compare against the exact previous spec
- Candidate window:
  - `T0` to `T0 + 7d` (exclusive)
  - exactly one parameter change per iteration

## Current Candidate (single change)
- only change:
  - `energy_streak_bonus_chance: 0.10 -> 0.08`
- fixed (unchanged) parameters:
  - `maxEnergy = 3`
  - `refill = +1 / 60 minutes`
  - `lesson cost = 1`
  - `streak bonus every = 5`
  - `streak bonus daily cap = 1`

## Runbook
- Step 1: record `T0` in JST when rollout is confirmed.
- Step 2: lock both windows using `T0`.
- Step 3: do not ship any additional energy parameter changes during candidate window.
- Step 4: evaluate at `T0 + 7d`.

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

## Decision Gates (at `T0 + 7d`)
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

## Implementation Status
- Runtime energy parameters are sourced from `config/entitlements.json` defaults.
- `lesson` entry gate consumes the configured lesson energy cost.
