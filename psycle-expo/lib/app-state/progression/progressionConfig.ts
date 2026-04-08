import {
  getComebackRewardConfig,
  getDailyGoalConfig,
  getPersonalizationConfig,
  getQuestRewardsConfig,
  getQuestRerollConfig,
  getStreakMilestonesConfig,
  getStreakRepairConfig,
} from "../../gamificationConfig";
import { normalizeNonNegativeInt, normalizePositiveInt } from "./progressionUtils";

export const streakMilestonesConfig = getStreakMilestonesConfig();
export const personalizationConfig = getPersonalizationConfig();

const comebackRewardConfig = getComebackRewardConfig();
const dailyGoalConfig = getDailyGoalConfig();
const questRewardsConfig = getQuestRewardsConfig();
const questRerollConfig = getQuestRerollConfig();
const streakRepairConfig = getStreakRepairConfig();

export const QUEST_SCHEMA_VERSION = 2;
export const COMEBACK_REWARD_THRESHOLD_DAYS = normalizePositiveInt(comebackRewardConfig.threshold_days, 7);
export const COMEBACK_REWARD_ENERGY = normalizePositiveInt(comebackRewardConfig.reward_energy, 2);
export const COMEBACK_REWARD_GEMS = normalizeNonNegativeInt(comebackRewardConfig.reward_gems, 10);
export const DAILY_GOAL_DEFAULT_XP = normalizePositiveInt(dailyGoalConfig.default_xp, 10);
export const DAILY_GOAL_REWARD_GEMS = normalizeNonNegativeInt(dailyGoalConfig.reward_gems, 5);
export const STREAK_REPAIR_COST_GEMS = normalizePositiveInt(streakRepairConfig.cost_gems, 50);
export const STREAK_REPAIR_WINDOW_MS =
  normalizePositiveInt(streakRepairConfig.window_hours, 48) * 60 * 60 * 1000;
export const QUEST_CLAIM_BONUS_GEMS_BY_TYPE = {
  daily: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.daily, 5),
  weekly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.weekly, 10),
  monthly: normalizeNonNegativeInt(questRewardsConfig.claim_bonus_gems_by_type.monthly, 15),
} as const;
export const QUEST_REROLL_CONFIG = questRerollConfig;
export const QUEST_REROLL_COST_GEMS = normalizeNonNegativeInt(questRerollConfig.cost_gems, 5);
export const QUEST_REROLL_DAILY_LIMIT = normalizePositiveInt(questRerollConfig.daily_limit, 1);
