/**
 * Gamification Config - 調整可能なパラメータの一元管理
 *
 * config/gamification.json を読み込み、型安全に提供
 * リリースなしでバランス調整が可能
 */

import configData from "../config/gamification.json";

// Type definitions
export interface XPRewards {
  correct_answer: number;
  lesson_complete: number;
  felt_better_positive: number;
}

export interface FreezeConfig {
  weekly_refill: number;
  purchase_cost_gems: number;
  max_cap: number;
}

export interface StreakConfig {
  study_per_day_limit: number;
}

export interface StreakMilestoneReward {
  day: number;
  gems: number;
}

export interface StreakMilestonesConfig {
  lifetime_once: boolean;
  rewards: StreakMilestoneReward[];
}

export interface ComboXpMilestone {
  streak: number;
  multiplier: number;
}

export interface ComboXpConfig {
  enabled: boolean;
  milestones: ComboXpMilestone[];
  bonus_cap_per_lesson: number;
}

export interface EnergyFullRefillSinkConfig {
  enabled: boolean;
  cost_gems: number;
  daily_limit: number;
}

export interface ShopSinksConfig {
  energy_full_refill: EnergyFullRefillSinkConfig;
}

export interface DoubleXpBoostConfig {
  cost_gems: number;
  duration_minutes: number;
}

export interface StreakRepairConfig {
  cost_gems: number;
  window_hours: number;
}

export interface DoubleXpNudgeConfig {
  enabled: boolean;
  daily_show_limit: number;
  min_gems: number;
  require_inactive_boost: boolean;
}

export interface ComebackRewardConfig {
  threshold_days: number;
  reward_energy: number;
  reward_gems: number;
}

export interface DailyGoalConfig {
  default_xp: number;
  reward_gems: number;
}

export interface FriendChallengeConfig {
  reward_gems: number;
}

export interface CheckoutConfig {
  max_plan_enabled: boolean;
}

export interface QuestRewardsConfig {
  claim_bonus_gems_by_type: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface QuestRerollConfig {
  enabled: boolean;
  cost_gems: number;
  daily_limit: number;
}

export type EventQuestMetric = "lesson_complete" | "streak5_milestone";

export interface EventQuestTemplateConfig {
  template_id: string;
  metric: EventQuestMetric;
  need: number;
  reward_gems: number;
  title_key: string;
}

export interface EventCampaignConfig {
  enabled: boolean;
  id: string;
  start_at: string;
  end_at: string;
  title_key: string;
  community_target_lessons: number;
  reward_badge_id: string;
  quests: EventQuestTemplateConfig[];
}

export interface LeagueMatchmakingConfig {
  relative_gap_weight: number;
  variance_penalty_weight: number;
  min_members_for_variance: number;
}

export interface NotificationsConfig {
  streak_risk_hour: number;
  daily_quest_deadline_hour: number;
  league_demotion_risk_hour_sunday: number;
  default_enabled: boolean;
}

export interface ExperimentVariantConfig {
  id: string;
  weight: number;
  payload?: Record<string, unknown>;
}

export interface ExperimentDefinitionConfig {
  enabled: boolean;
  rollout_percentage: number;
  variants: ExperimentVariantConfig[];
}

export interface ExperimentsConfig {
  enabled: boolean;
  experiments: Record<string, ExperimentDefinitionConfig>;
}

export type PersonalizationSegment = "new" | "active" | "at_risk" | "power";

export interface PersonalizationConfig {
  enabled: boolean;
  segment_reassign_cooldown_hours: number;
  quest_need_adjustment: Record<PersonalizationSegment, number>;
  comeback_reward_adjustment: Record<PersonalizationSegment, number>;
}

export interface LiveOpsConfig {
  enabled: boolean;
  max_active_campaigns: number;
  campaigns: EventCampaignConfig[];
}

export interface GamificationConfig {
  version: number;
  initial_gems: number;
  xp_rewards: XPRewards;
  freeze: FreezeConfig;
  streak: StreakConfig;
  streak_milestones: StreakMilestonesConfig;
  combo_xp: ComboXpConfig;
  shop_sinks: ShopSinksConfig;
  double_xp_boost: DoubleXpBoostConfig;
  streak_repair: StreakRepairConfig;
  double_xp_nudge: DoubleXpNudgeConfig;
  comeback_reward: ComebackRewardConfig;
  daily_goal: DailyGoalConfig;
  friend_challenge: FriendChallengeConfig;
  checkout: CheckoutConfig;
  quest_rewards: QuestRewardsConfig;
  quest_reroll: QuestRerollConfig;
  event_campaign: EventCampaignConfig;
  experiments: ExperimentsConfig;
  personalization: PersonalizationConfig;
  liveops: LiveOpsConfig;
  league_matchmaking: LeagueMatchmakingConfig;
  notifications: NotificationsConfig;
}

const DEFAULT_EVENT_CAMPAIGN: EventCampaignConfig = {
  enabled: true,
  id: "spring_challenge_2026",
  start_at: "2026-04-29T00:00:00+09:00",
  end_at: "2026-05-06T23:59:59+09:00",
  title_key: "events.spring2026.title",
  community_target_lessons: 10000,
  reward_badge_id: "event_spring_2026",
  quests: [
    {
      template_id: "ev_lessons_20",
      metric: "lesson_complete",
      need: 20,
      reward_gems: 20,
      title_key: "events.spring2026.quest_lessons_20",
    },
    {
      template_id: "ev_streak5_5",
      metric: "streak5_milestone",
      need: 5,
      reward_gems: 30,
      title_key: "events.spring2026.quest_streak5_5",
    },
  ],
};

// Default values (fallback if config is corrupted)
const DEFAULT_CONFIG: GamificationConfig = {
  version: 1,
  initial_gems: 50,
  xp_rewards: {
    correct_answer: 5,
    lesson_complete: 20,
    felt_better_positive: 10,
  },
  freeze: {
    weekly_refill: 2,
    purchase_cost_gems: 10,
    max_cap: 10,
  },
  streak: {
    study_per_day_limit: 1,
  },
  streak_milestones: {
    lifetime_once: true,
    rewards: [
      { day: 3, gems: 5 },
      { day: 7, gems: 10 },
      { day: 14, gems: 15 },
      { day: 30, gems: 20 },
      { day: 60, gems: 30 },
      { day: 100, gems: 50 },
      { day: 365, gems: 100 },
    ],
  },
  combo_xp: {
    enabled: true,
    milestones: [
      { streak: 3, multiplier: 1.2 },
      { streak: 5, multiplier: 1.5 },
      { streak: 10, multiplier: 2.0 },
    ],
    bonus_cap_per_lesson: 20,
  },
  shop_sinks: {
    energy_full_refill: {
      enabled: true,
      cost_gems: 30,
      daily_limit: 1,
    },
  },
  double_xp_boost: {
    cost_gems: 20,
    duration_minutes: 15,
  },
  streak_repair: {
    cost_gems: 50,
    window_hours: 48,
  },
  double_xp_nudge: {
    enabled: true,
    daily_show_limit: 1,
    min_gems: 20,
    require_inactive_boost: true,
  },
  comeback_reward: {
    threshold_days: 7,
    reward_energy: 2,
    reward_gems: 10,
  },
  daily_goal: {
    default_xp: 10,
    reward_gems: 5,
  },
  friend_challenge: {
    reward_gems: 15,
  },
  checkout: {
    max_plan_enabled: false,
  },
  quest_rewards: {
    claim_bonus_gems_by_type: {
      daily: 5,
      weekly: 10,
      monthly: 15,
    },
  },
  quest_reroll: {
    enabled: true,
    cost_gems: 5,
    daily_limit: 1,
  },
  event_campaign: DEFAULT_EVENT_CAMPAIGN,
  experiments: {
    enabled: false,
    experiments: {
      double_xp_nudge_lesson_complete: {
        enabled: false,
        rollout_percentage: 100,
        variants: [
          { id: "control", weight: 50, payload: { copyStyle: "default" } },
          { id: "variant_a", weight: 50, payload: { copyStyle: "urgency" } },
        ],
      },
    },
  },
  personalization: {
    enabled: false,
    segment_reassign_cooldown_hours: 24,
    quest_need_adjustment: {
      new: -1,
      active: 0,
      at_risk: -1,
      power: 1,
    },
    comeback_reward_adjustment: {
      new: 0,
      active: 0,
      at_risk: 1,
      power: 0,
    },
  },
  liveops: {
    enabled: false,
    max_active_campaigns: 1,
    campaigns: [DEFAULT_EVENT_CAMPAIGN],
  },
  league_matchmaking: {
    relative_gap_weight: 1.0,
    variance_penalty_weight: 0.35,
    min_members_for_variance: 3,
  },
  notifications: {
    streak_risk_hour: 22,
    daily_quest_deadline_hour: 21,
    league_demotion_risk_hour_sunday: 18,
    default_enabled: true,
  },
};

function normalizeVariants(value: unknown, fallback: ExperimentVariantConfig[]): ExperimentVariantConfig[] {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const raw = variant as Partial<ExperimentVariantConfig>;
      if (typeof raw.id !== "string" || raw.id.length === 0) return null;
      const weight = Number.isFinite(raw.weight as number) ? Math.max(0, Number(raw.weight)) : 0;
      return {
        id: raw.id,
        weight,
        payload: raw.payload && typeof raw.payload === "object" ? raw.payload : {},
      };
    })
    .filter((item): item is ExperimentVariantConfig => item !== null);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeExperiments(value: unknown): ExperimentsConfig {
  const source = value && typeof value === "object" ? (value as Partial<ExperimentsConfig>) : {};
  const rawExperiments =
    source.experiments && typeof source.experiments === "object"
      ? (source.experiments as Record<string, Partial<ExperimentDefinitionConfig>>)
      : {};
  const normalizedExperiments: Record<string, ExperimentDefinitionConfig> = {};

  Object.entries(rawExperiments).forEach(([experimentId, definition]) => {
    const fallback = DEFAULT_CONFIG.experiments.experiments[experimentId];
    normalizedExperiments[experimentId] = {
      enabled: typeof definition?.enabled === "boolean" ? definition.enabled : fallback?.enabled ?? false,
      rollout_percentage: Number.isFinite(definition?.rollout_percentage as number)
        ? Math.min(100, Math.max(0, Math.floor(Number(definition?.rollout_percentage))))
        : fallback?.rollout_percentage ?? 100,
      variants: normalizeVariants(definition?.variants, fallback?.variants ?? []),
    };
  });

  Object.entries(DEFAULT_CONFIG.experiments.experiments).forEach(([experimentId, definition]) => {
    if (!normalizedExperiments[experimentId]) {
      normalizedExperiments[experimentId] = definition;
    }
  });

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_CONFIG.experiments.enabled,
    experiments: normalizedExperiments,
  };
}

function normalizePersonalization(value: unknown): PersonalizationConfig {
  const source = value && typeof value === "object" ? (value as Partial<PersonalizationConfig>) : {};
  const mergeAdjustment = (
    raw: unknown,
    fallback: Record<PersonalizationSegment, number>
  ): Record<PersonalizationSegment, number> => {
    const obj = raw && typeof raw === "object" ? (raw as Partial<Record<PersonalizationSegment, number>>) : {};
    return {
      new: Number.isFinite(obj.new as number) ? Number(obj.new) : fallback.new,
      active: Number.isFinite(obj.active as number) ? Number(obj.active) : fallback.active,
      at_risk: Number.isFinite(obj.at_risk as number) ? Number(obj.at_risk) : fallback.at_risk,
      power: Number.isFinite(obj.power as number) ? Number(obj.power) : fallback.power,
    };
  };

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_CONFIG.personalization.enabled,
    segment_reassign_cooldown_hours: Number.isFinite(source.segment_reassign_cooldown_hours as number)
      ? Math.max(1, Math.floor(Number(source.segment_reassign_cooldown_hours)))
      : DEFAULT_CONFIG.personalization.segment_reassign_cooldown_hours,
    quest_need_adjustment: mergeAdjustment(
      source.quest_need_adjustment,
      DEFAULT_CONFIG.personalization.quest_need_adjustment
    ),
    comeback_reward_adjustment: mergeAdjustment(
      source.comeback_reward_adjustment,
      DEFAULT_CONFIG.personalization.comeback_reward_adjustment
    ),
  };
}

function normalizeEventCampaign(raw: unknown, fallback: EventCampaignConfig): EventCampaignConfig {
  const source = raw && typeof raw === "object" ? (raw as Partial<EventCampaignConfig>) : {};
  return {
    ...fallback,
    ...source,
    quests: Array.isArray(source.quests) ? source.quests : fallback.quests,
  };
}

function normalizeLiveOps(value: unknown): LiveOpsConfig {
  const source = value && typeof value === "object" ? (value as Partial<LiveOpsConfig>) : {};
  const campaigns = Array.isArray(source.campaigns)
    ? source.campaigns.map((campaign) => normalizeEventCampaign(campaign, DEFAULT_EVENT_CAMPAIGN))
    : DEFAULT_CONFIG.liveops.campaigns;

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_CONFIG.liveops.enabled,
    max_active_campaigns: Number.isFinite(source.max_active_campaigns as number)
      ? Math.max(1, Math.floor(Number(source.max_active_campaigns)))
      : DEFAULT_CONFIG.liveops.max_active_campaigns,
    campaigns,
  };
}

// Merge config with defaults (in case some fields are missing)
function loadConfig(): GamificationConfig {
  try {
    const source = configData as any;
    return {
      version: source.version ?? DEFAULT_CONFIG.version,
      initial_gems: Number.isFinite(source.initial_gems)
        ? Math.max(0, Math.floor(Number(source.initial_gems)))
        : DEFAULT_CONFIG.initial_gems,
      xp_rewards: { ...DEFAULT_CONFIG.xp_rewards, ...source.xp_rewards },
      freeze: { ...DEFAULT_CONFIG.freeze, ...source.freeze },
      streak: { ...DEFAULT_CONFIG.streak, ...source.streak },
      streak_milestones: {
        ...DEFAULT_CONFIG.streak_milestones,
        ...source.streak_milestones,
        rewards: Array.isArray(source.streak_milestones?.rewards)
          ? source.streak_milestones.rewards
          : DEFAULT_CONFIG.streak_milestones.rewards,
      },
      combo_xp: {
        ...DEFAULT_CONFIG.combo_xp,
        ...source.combo_xp,
        milestones: Array.isArray(source.combo_xp?.milestones)
          ? source.combo_xp.milestones
          : DEFAULT_CONFIG.combo_xp.milestones,
      },
      shop_sinks: {
        ...DEFAULT_CONFIG.shop_sinks,
        ...source.shop_sinks,
        energy_full_refill: {
          ...DEFAULT_CONFIG.shop_sinks.energy_full_refill,
          ...source.shop_sinks?.energy_full_refill,
        },
      },
      double_xp_boost: {
        ...DEFAULT_CONFIG.double_xp_boost,
        ...source.double_xp_boost,
      },
      streak_repair: {
        ...DEFAULT_CONFIG.streak_repair,
        ...source.streak_repair,
      },
      double_xp_nudge: {
        ...DEFAULT_CONFIG.double_xp_nudge,
        ...source.double_xp_nudge,
      },
      comeback_reward: {
        ...DEFAULT_CONFIG.comeback_reward,
        ...source.comeback_reward,
      },
      daily_goal: {
        ...DEFAULT_CONFIG.daily_goal,
        ...source.daily_goal,
      },
      friend_challenge: {
        ...DEFAULT_CONFIG.friend_challenge,
        ...source.friend_challenge,
      },
      checkout: {
        ...DEFAULT_CONFIG.checkout,
        ...source.checkout,
      },
      quest_rewards: {
        ...DEFAULT_CONFIG.quest_rewards,
        ...source.quest_rewards,
        claim_bonus_gems_by_type: {
          ...DEFAULT_CONFIG.quest_rewards.claim_bonus_gems_by_type,
          ...source.quest_rewards?.claim_bonus_gems_by_type,
        },
      },
      quest_reroll: {
        ...DEFAULT_CONFIG.quest_reroll,
        ...source.quest_reroll,
      },
      event_campaign: normalizeEventCampaign(source.event_campaign, DEFAULT_CONFIG.event_campaign),
      experiments: normalizeExperiments(source.experiments),
      personalization: normalizePersonalization(source.personalization),
      liveops: normalizeLiveOps(source.liveops),
      league_matchmaking: {
        ...DEFAULT_CONFIG.league_matchmaking,
        ...source.league_matchmaking,
      },
      notifications: { ...DEFAULT_CONFIG.notifications, ...source.notifications },
    };
  } catch (e) {
    console.warn("[GamificationConfig] Failed to load config, using defaults:", e);
    return DEFAULT_CONFIG;
  }
}

function isValidEventCampaign(value: unknown): value is EventCampaignConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as EventCampaignConfig;
  if (
    typeof config.id !== "string" ||
    typeof config.start_at !== "string" ||
    typeof config.end_at !== "string" ||
    typeof config.title_key !== "string" ||
    typeof config.reward_badge_id !== "string" ||
    !Array.isArray(config.quests)
  ) {
    return false;
  }

  return config.quests.every(
    (quest) =>
      typeof quest.template_id === "string" &&
      (quest.metric === "lesson_complete" || quest.metric === "streak5_milestone") &&
      Number.isFinite(quest.need) &&
      Number.isFinite(quest.reward_gems) &&
      typeof quest.title_key === "string"
  );
}

// Singleton config instance
export const gamificationConfig: GamificationConfig = loadConfig();

// Convenience accessors
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
