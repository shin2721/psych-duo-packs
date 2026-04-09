/**
 * Gamification Config - 調整可能なパラメータの一元管理
 *
 * config/gamification.json を読み込み、型安全に提供
 * リリースなしでバランス調整が可能
 */

import configData from "../config/gamification.json";
import { warnDev } from "./devLog";
import { DEFAULT_CONFIG } from "./gamificationConfig.defaults";
import {
  isRecord,
  isValidEventCampaign,
  normalizeGamificationConfig,
} from "./gamificationConfig.normalizers";
import type {
  CheckoutConfig,
  ComboXpConfig,
  ComebackRewardConfig,
  DailyGoalConfig,
  DoubleXpBoostConfig,
  DoubleXpNudgeConfig,
  EventCampaignConfig,
  ExperimentsConfig,
  FreezeConfig,
  FriendChallengeConfig,
  GamificationConfig,
  LeagueMatchmakingConfig,
  LiveOpsConfig,
  NotificationsConfig,
  PersonalizationConfig,
  QuestRerollConfig,
  QuestRewardsConfig,
  ShopSinksConfig,
  StreakConfig,
  StreakRepairConfig,
  StreakMilestonesConfig,
  XPRewards,
} from "./gamificationConfig.types";

export type {
  CheckoutConfig,
  ComboXpConfig,
  ComboXpMilestone,
  ComebackRewardConfig,
  DailyGoalConfig,
  DoubleXpBoostConfig,
  DoubleXpNudgeConfig,
  EventCampaignConfig,
  EventQuestMetric,
  EventQuestTemplateConfig,
  ExperimentDefinitionConfig,
  ExperimentVariantConfig,
  ExperimentsConfig,
  FreezeConfig,
  FriendChallengeConfig,
  GamificationConfig,
  LeagueMatchmakingConfig,
  LiveOpsConfig,
  NotificationsConfig,
  PersonalizationConfig,
  PersonalizationSegment,
  QuestRerollConfig,
  QuestRewardsConfig,
  ShopSinksConfig,
  StreakConfig,
  StreakRepairConfig,
  StreakMilestoneReward,
  StreakMilestonesConfig,
  XPRewards,
} from "./gamificationConfig.types";

function loadConfig(): GamificationConfig {
  if (!isRecord(configData)) {
    warnDev(
      "[GamificationConfig] Failed to load config, using defaults:",
      new Error("Invalid top-level config shape")
    );
    return DEFAULT_CONFIG;
  }

  return normalizeGamificationConfig(configData);
}

export const gamificationConfig: GamificationConfig = loadConfig();

export function getXpRewards(): XPRewards {
  return gamificationConfig.xp_rewards;
}

export function getInitialGems(): number {
  return gamificationConfig.initial_gems;
}

export function getFreezeConfig(): FreezeConfig {
  return gamificationConfig.freeze;
}

export function getStreakConfig(): StreakConfig {
  return gamificationConfig.streak;
}

export function getStreakMilestonesConfig(): StreakMilestonesConfig {
  return gamificationConfig.streak_milestones;
}

export function getComboXpConfig(): ComboXpConfig {
  return gamificationConfig.combo_xp;
}

export function getShopSinksConfig(): ShopSinksConfig {
  return gamificationConfig.shop_sinks;
}

export function getDoubleXpBoostConfig(): DoubleXpBoostConfig {
  return gamificationConfig.double_xp_boost;
}

export function getStreakRepairConfig(): StreakRepairConfig {
  return gamificationConfig.streak_repair;
}

export function getDoubleXpNudgeConfig(): DoubleXpNudgeConfig {
  return gamificationConfig.double_xp_nudge;
}

export function getComebackRewardConfig(): ComebackRewardConfig {
  return gamificationConfig.comeback_reward;
}

export function getDailyGoalConfig(): DailyGoalConfig {
  return gamificationConfig.daily_goal;
}

export function getFriendChallengeConfig(): FriendChallengeConfig {
  return gamificationConfig.friend_challenge;
}

export function getCheckoutConfig(): CheckoutConfig {
  return gamificationConfig.checkout;
}

export function getQuestRewardsConfig(): QuestRewardsConfig {
  return gamificationConfig.quest_rewards;
}

export function getQuestRerollConfig(): QuestRerollConfig {
  return gamificationConfig.quest_reroll;
}

export function getExperimentsConfig(): ExperimentsConfig {
  return gamificationConfig.experiments;
}

export function getPersonalizationConfig(): PersonalizationConfig {
  return gamificationConfig.personalization;
}

export function getLiveOpsConfig(): LiveOpsConfig {
  return gamificationConfig.liveops;
}

export function getEventCampaignConfig(): EventCampaignConfig | null {
  const nowMs = Date.now();
  const liveOps = gamificationConfig.liveops;

  if (liveOps.enabled && liveOps.campaigns.length > 0) {
    const activeCampaign = liveOps.campaigns
      .filter((campaign) => campaign.enabled && isValidEventCampaign(campaign))
      .map((campaign) => ({
        campaign,
        startMs: new Date(campaign.start_at).getTime(),
        endMs: new Date(campaign.end_at).getTime(),
      }))
      .filter((item) => Number.isFinite(item.startMs) && Number.isFinite(item.endMs))
      .filter((item) => nowMs >= item.startMs && nowMs <= item.endMs)
      .sort((a, b) => a.startMs - b.startMs)[0];

    if (activeCampaign) {
      return activeCampaign.campaign;
    }
    return null;
  }

  const legacy = gamificationConfig.event_campaign;
  if (!legacy?.enabled || !isValidEventCampaign(legacy)) {
    return null;
  }
  return legacy;
}

export function getLeagueMatchmakingConfig(): LeagueMatchmakingConfig {
  return gamificationConfig.league_matchmaking;
}

export function getNotificationsConfig(): NotificationsConfig {
  return gamificationConfig.notifications;
}
