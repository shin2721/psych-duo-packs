import entitlements from "../../../config/entitlements.json";
import { getDoubleXpBoostConfig, getInitialGems, getQuestRerollConfig, getShopSinksConfig } from "../../gamificationConfig";
import { normalizeNonNegativeInt, normalizePositiveInt, normalizeProbability } from "./economyUtils";

interface EntitlementsConfig {
  plans?: {
    free?: {
      energy?: {
        daily_cap?: number | null;
      };
    };
  };
  defaults?: {
    energy_refill_minutes?: number;
    lesson_energy_cost?: number;
    first_day_bonus_energy?: number;
    energy_streak_bonus_every?: number;
    energy_streak_bonus_chance?: number;
    energy_streak_bonus_daily_cap?: number;
  };
}

const entitlementConfig = entitlements as EntitlementsConfig;
const shopSinksConfig = getShopSinksConfig();
const questRerollConfig = getQuestRerollConfig();
const doubleXpBoostConfig = getDoubleXpBoostConfig();

export const FREE_BASE_MAX_ENERGY = normalizePositiveInt(
  entitlementConfig.plans?.free?.energy?.daily_cap ?? null,
  3
);
export const FIRST_DAY_BONUS_ENERGY = normalizePositiveInt(
  entitlementConfig.defaults?.first_day_bonus_energy,
  0
);
export const SUBSCRIBER_MAX_ENERGY = 999;
export const ENERGY_REFILL_MINUTES = normalizePositiveInt(
  entitlementConfig.defaults?.energy_refill_minutes,
  60
);
export const LESSON_ENERGY_COST = normalizePositiveInt(
  entitlementConfig.defaults?.lesson_energy_cost,
  1
);
export const ENERGY_STREAK_BONUS_EVERY = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_every,
  5
);
export const ENERGY_STREAK_BONUS_CHANCE = normalizeProbability(
  entitlementConfig.defaults?.energy_streak_bonus_chance,
  0.1
);
export const ENERGY_STREAK_BONUS_DAILY_CAP = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_daily_cap,
  1
);
export const ENERGY_REFILL_MS = ENERGY_REFILL_MINUTES * 60 * 1000;
export const INITIAL_GEMS = normalizeNonNegativeInt(getInitialGems(), 50);
export const DOUBLE_XP_COST_GEMS = normalizeNonNegativeInt(doubleXpBoostConfig.cost_gems, 20);
export const DOUBLE_XP_DURATION_MS = normalizePositiveInt(doubleXpBoostConfig.duration_minutes, 15) * 60 * 1000;
export const SHOP_SINKS_CONFIG = shopSinksConfig;
export const QUEST_REROLL_CONFIG = questRerollConfig;
