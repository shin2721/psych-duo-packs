# Energy Experiment Gates

## Scope
- Applies to the current energy economy:
  - `maxEnergy = 3`
  - `refill = +1 / 60 minutes`
  - `lesson cost = 1`
  - `streak bonus = 10% at every 5-correct streak, max 1/day`
- Evaluation window:
  - Day 1 to Day 7 after rollout (example: 2026-02-10 to 2026-02-17)

## Event Definitions
- `energy_blocked`: user attempted lesson start without enough energy.
- `shop_open_from_energy`: user opened shop from an energy context.
- `energy_bonus_hit`: streak bonus successfully granted.

## Primary KPIs
- `energy_block_rate = energy_blocked / lesson_start`
- `energy_shop_intent = shop_open_from_energy / energy_blocked`
- `D1_retention` and `D7_retention` versus baseline cohort
- `paid_conversion_7d` from the same launch cohort (Stripe/Supabase source of truth)

## Decision Gates (Day 7)
- Keep as-is:
  - `D1_retention` drop <= `1.5pp` vs baseline
  - `D7_retention` drop <= `1.0pp` vs baseline
  - `energy_block_rate` in `8%` to `18%`
  - `energy_shop_intent >= 25%`
  - `paid_conversion_7d` lift >= `+0.3pp` vs baseline
- Tighten monetization:
  - `energy_block_rate < 8%` and no conversion lift
- Loosen friction:
  - `D1` or `D7` drops exceed limits, or `energy_block_rate > 18%`

## Fallback Parameter Moves
- If too loose (low block, low conversion):
  - keep cap `3`, reduce bonus chance to `8%`
- If too strict (retention hit):
  - keep cap `3`, move refill to `50` minutes
  - keep daily bonus cap at `1`
