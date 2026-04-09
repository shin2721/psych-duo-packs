import { DEFAULT_CONFIG, DEFAULT_EVENT_CAMPAIGN } from "./gamificationConfig.defaults";
import type {
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
  StreakMilestoneReward,
  StreakMilestonesConfig,
  UnknownRecord,
  XPRewards,
} from "./gamificationConfig.types";

export function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeFiniteNumber(value: unknown, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function normalizeNonNegativeInt(value: unknown, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(Number(value)));
}

function normalizePositiveInt(value: unknown, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(Number(value)));
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeObject(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function normalizeStreakMilestoneRewards(
  value: unknown,
  fallback: StreakMilestoneReward[]
): StreakMilestoneReward[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .filter(isRecord)
    .map((reward) => {
      if (!Number.isFinite(reward.day) || !Number.isFinite(reward.gems)) return null;
      return {
        day: normalizePositiveInt(reward.day, 1),
        gems: normalizeNonNegativeInt(reward.gems, 0),
      };
    })
    .filter((reward): reward is StreakMilestoneReward => reward !== null);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeComboMilestones(
  value: unknown,
  fallback: ComboXpMilestone[]
): ComboXpMilestone[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .filter(isRecord)
    .map((milestone) => {
      if (!Number.isFinite(milestone.streak) || !Number.isFinite(milestone.multiplier)) return null;
      return {
        streak: normalizePositiveInt(milestone.streak, 1),
        multiplier: normalizeFiniteNumber(milestone.multiplier, 1),
      };
    })
    .filter((milestone): milestone is ComboXpMilestone => milestone !== null);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeQuestBonusGemsMap(
  value: unknown,
  fallback: QuestRewardsConfig["claim_bonus_gems_by_type"]
): QuestRewardsConfig["claim_bonus_gems_by_type"] {
  const source = normalizeObject(value);
  return {
    daily: normalizeNonNegativeInt(source.daily, fallback.daily),
    weekly: normalizeNonNegativeInt(source.weekly, fallback.weekly),
    monthly: normalizeNonNegativeInt(source.monthly, fallback.monthly),
  };
}

function normalizeEventMetric(value: unknown, fallback: EventQuestMetric): EventQuestMetric {
  return value === "lesson_complete" || value === "streak5_milestone" ? value : fallback;
}

function normalizeEventQuestTemplates(
  value: unknown,
  fallback: EventQuestTemplateConfig[]
): EventQuestTemplateConfig[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .filter(isRecord)
    .map((quest) => {
      if (
        typeof quest.template_id !== "string" ||
        quest.template_id.length === 0 ||
        typeof quest.title_key !== "string" ||
        quest.title_key.length === 0 ||
        !Number.isFinite(quest.need) ||
        !Number.isFinite(quest.reward_gems)
      ) {
        return null;
      }

      return {
        template_id: quest.template_id,
        metric: normalizeEventMetric(quest.metric, "lesson_complete"),
        need: normalizePositiveInt(quest.need, 1),
        reward_gems: normalizeNonNegativeInt(quest.reward_gems, 0),
        title_key: quest.title_key,
      };
    })
    .filter((quest): quest is EventQuestTemplateConfig => quest !== null);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeXpRewards(value: unknown): XPRewards {
  const source = normalizeObject(value);
  return {
    correct_answer: normalizeNonNegativeInt(source.correct_answer, DEFAULT_CONFIG.xp_rewards.correct_answer),
    lesson_complete: normalizeNonNegativeInt(source.lesson_complete, DEFAULT_CONFIG.xp_rewards.lesson_complete),
    felt_better_positive: normalizeNonNegativeInt(
      source.felt_better_positive,
      DEFAULT_CONFIG.xp_rewards.felt_better_positive
    ),
  };
}

function normalizeFreezeConfig(value: unknown): FreezeConfig {
  const source = normalizeObject(value);
  return {
    weekly_refill: normalizeNonNegativeInt(source.weekly_refill, DEFAULT_CONFIG.freeze.weekly_refill),
    purchase_cost_gems: normalizeNonNegativeInt(source.purchase_cost_gems, DEFAULT_CONFIG.freeze.purchase_cost_gems),
    max_cap: normalizePositiveInt(source.max_cap, DEFAULT_CONFIG.freeze.max_cap),
  };
}

function normalizeStreakConfig(value: unknown): StreakConfig {
  const source = normalizeObject(value);
  return {
    study_per_day_limit: normalizePositiveInt(source.study_per_day_limit, DEFAULT_CONFIG.streak.study_per_day_limit),
  };
}

function normalizeStreakMilestonesConfig(value: unknown): StreakMilestonesConfig {
  const source = normalizeObject(value);
  return {
    lifetime_once: normalizeBoolean(source.lifetime_once, DEFAULT_CONFIG.streak_milestones.lifetime_once),
    rewards: normalizeStreakMilestoneRewards(source.rewards, DEFAULT_CONFIG.streak_milestones.rewards),
  };
}

function normalizeComboXpConfig(value: unknown): ComboXpConfig {
  const source = normalizeObject(value);
  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.combo_xp.enabled),
    milestones: normalizeComboMilestones(source.milestones, DEFAULT_CONFIG.combo_xp.milestones),
    bonus_cap_per_lesson: normalizeNonNegativeInt(
      source.bonus_cap_per_lesson,
      DEFAULT_CONFIG.combo_xp.bonus_cap_per_lesson
    ),
  };
}

function normalizeShopSinksConfig(value: unknown): ShopSinksConfig {
  const source = normalizeObject(value);
  const refill = normalizeObject(source.energy_full_refill);
  return {
    energy_full_refill: {
      enabled: normalizeBoolean(refill.enabled, DEFAULT_CONFIG.shop_sinks.energy_full_refill.enabled),
      cost_gems: normalizeNonNegativeInt(refill.cost_gems, DEFAULT_CONFIG.shop_sinks.energy_full_refill.cost_gems),
      daily_limit: normalizeNonNegativeInt(
        refill.daily_limit,
        DEFAULT_CONFIG.shop_sinks.energy_full_refill.daily_limit
      ),
    },
  };
}

function normalizeDoubleXpBoostConfig(value: unknown): DoubleXpBoostConfig {
  const source = normalizeObject(value);
  return {
    cost_gems: normalizeNonNegativeInt(source.cost_gems, DEFAULT_CONFIG.double_xp_boost.cost_gems),
    duration_minutes: normalizePositiveInt(source.duration_minutes, DEFAULT_CONFIG.double_xp_boost.duration_minutes),
  };
}

function normalizeStreakRepairConfig(value: unknown) {
  const source = normalizeObject(value);
  return {
    cost_gems: normalizeNonNegativeInt(source.cost_gems, DEFAULT_CONFIG.streak_repair.cost_gems),
    window_hours: normalizePositiveInt(source.window_hours, DEFAULT_CONFIG.streak_repair.window_hours),
  };
}

function normalizeDoubleXpNudgeConfig(value: unknown): DoubleXpNudgeConfig {
  const source = normalizeObject(value);
  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.double_xp_nudge.enabled),
    daily_show_limit: normalizeNonNegativeInt(source.daily_show_limit, DEFAULT_CONFIG.double_xp_nudge.daily_show_limit),
    min_gems: normalizeNonNegativeInt(source.min_gems, DEFAULT_CONFIG.double_xp_nudge.min_gems),
    require_inactive_boost: normalizeBoolean(
      source.require_inactive_boost,
      DEFAULT_CONFIG.double_xp_nudge.require_inactive_boost
    ),
  };
}

function normalizeComebackRewardConfig(value: unknown): ComebackRewardConfig {
  const source = normalizeObject(value);
  return {
    threshold_days: normalizePositiveInt(source.threshold_days, DEFAULT_CONFIG.comeback_reward.threshold_days),
    reward_energy: normalizeNonNegativeInt(source.reward_energy, DEFAULT_CONFIG.comeback_reward.reward_energy),
    reward_gems: normalizeNonNegativeInt(source.reward_gems, DEFAULT_CONFIG.comeback_reward.reward_gems),
  };
}

function normalizeDailyGoalConfig(value: unknown): DailyGoalConfig {
  const source = normalizeObject(value);
  return {
    default_xp: normalizeNonNegativeInt(source.default_xp, DEFAULT_CONFIG.daily_goal.default_xp),
    reward_gems: normalizeNonNegativeInt(source.reward_gems, DEFAULT_CONFIG.daily_goal.reward_gems),
  };
}

function normalizeFriendChallengeConfig(value: unknown): FriendChallengeConfig {
  const source = normalizeObject(value);
  return {
    reward_gems: normalizeNonNegativeInt(source.reward_gems, DEFAULT_CONFIG.friend_challenge.reward_gems),
  };
}

function normalizeCheckoutConfig(value: unknown): CheckoutConfig {
  const source = normalizeObject(value);
  return {
    max_plan_enabled: normalizeBoolean(source.max_plan_enabled, DEFAULT_CONFIG.checkout.max_plan_enabled),
  };
}

function normalizeQuestRewardsConfig(value: unknown): QuestRewardsConfig {
  const source = normalizeObject(value);
  return {
    claim_bonus_gems_by_type: normalizeQuestBonusGemsMap(
      source.claim_bonus_gems_by_type,
      DEFAULT_CONFIG.quest_rewards.claim_bonus_gems_by_type
    ),
  };
}

function normalizeQuestRerollConfig(value: unknown): QuestRerollConfig {
  const source = normalizeObject(value);
  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.quest_reroll.enabled),
    cost_gems: normalizeNonNegativeInt(source.cost_gems, DEFAULT_CONFIG.quest_reroll.cost_gems),
    daily_limit: normalizeNonNegativeInt(source.daily_limit, DEFAULT_CONFIG.quest_reroll.daily_limit),
  };
}

function normalizeLeagueMatchmakingConfig(value: unknown): LeagueMatchmakingConfig {
  const source = normalizeObject(value);
  return {
    relative_gap_weight: normalizeFiniteNumber(
      source.relative_gap_weight,
      DEFAULT_CONFIG.league_matchmaking.relative_gap_weight
    ),
    variance_penalty_weight: normalizeFiniteNumber(
      source.variance_penalty_weight,
      DEFAULT_CONFIG.league_matchmaking.variance_penalty_weight
    ),
    min_members_for_variance: normalizePositiveInt(
      source.min_members_for_variance,
      DEFAULT_CONFIG.league_matchmaking.min_members_for_variance
    ),
  };
}

function normalizeNotificationsConfig(value: unknown): NotificationsConfig {
  const source = normalizeObject(value);
  return {
    streak_risk_hour: normalizeNonNegativeInt(source.streak_risk_hour, DEFAULT_CONFIG.notifications.streak_risk_hour),
    daily_quest_deadline_hour: normalizeNonNegativeInt(
      source.daily_quest_deadline_hour,
      DEFAULT_CONFIG.notifications.daily_quest_deadline_hour
    ),
    league_demotion_risk_hour_sunday: normalizeNonNegativeInt(
      source.league_demotion_risk_hour_sunday,
      DEFAULT_CONFIG.notifications.league_demotion_risk_hour_sunday
    ),
    default_enabled: normalizeBoolean(source.default_enabled, DEFAULT_CONFIG.notifications.default_enabled),
  };
}

function normalizeVariants(value: unknown, fallback: ExperimentVariantConfig[]): ExperimentVariantConfig[] {
  if (!Array.isArray(value)) return fallback;
  const normalized: ExperimentVariantConfig[] = [];

  for (const variant of value) {
    if (!isRecord(variant)) continue;
    if (typeof variant.id !== "string" || variant.id.length === 0) continue;
    normalized.push({
      id: variant.id,
      weight: normalizeNonNegativeInt(variant.weight, 0),
      payload: isRecord(variant.payload) ? variant.payload : {},
    });
  }

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeExperiments(value: unknown): ExperimentsConfig {
  const source = normalizeObject(value);
  const rawExperiments = normalizeObject(source.experiments);
  const normalizedExperiments: Record<string, ExperimentDefinitionConfig> = {};

  Object.entries(rawExperiments).forEach(([experimentId, definition]) => {
    const sourceDefinition = normalizeObject(definition);
    const fallback = DEFAULT_CONFIG.experiments.experiments[experimentId];
    normalizedExperiments[experimentId] = {
      enabled: normalizeBoolean(sourceDefinition.enabled, fallback?.enabled ?? false),
      rollout_percentage: Math.min(
        100,
        Math.max(0, normalizeNonNegativeInt(sourceDefinition.rollout_percentage, fallback?.rollout_percentage ?? 100))
      ),
      variants: normalizeVariants(sourceDefinition.variants, fallback?.variants ?? []),
    };
  });

  Object.entries(DEFAULT_CONFIG.experiments.experiments).forEach(([experimentId, definition]) => {
    if (!normalizedExperiments[experimentId]) {
      normalizedExperiments[experimentId] = definition;
    }
  });

  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.experiments.enabled),
    experiments: normalizedExperiments,
  };
}

function normalizePersonalization(value: unknown): PersonalizationConfig {
  const source = normalizeObject(value);
  const mergeAdjustment = (
    raw: unknown,
    fallback: Record<PersonalizationSegment, number>
  ): Record<PersonalizationSegment, number> => {
    const obj = normalizeObject(raw);
    return {
      new: normalizeFiniteNumber(obj.new, fallback.new),
      active: normalizeFiniteNumber(obj.active, fallback.active),
      at_risk: normalizeFiniteNumber(obj.at_risk, fallback.at_risk),
      power: normalizeFiniteNumber(obj.power, fallback.power),
    };
  };

  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.personalization.enabled),
    segment_reassign_cooldown_hours: normalizePositiveInt(
      source.segment_reassign_cooldown_hours,
      DEFAULT_CONFIG.personalization.segment_reassign_cooldown_hours
    ),
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

function normalizeEventCampaign(
  raw: unknown,
  fallback: EventCampaignConfig
): EventCampaignConfig {
  const source = normalizeObject(raw);
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    id: normalizeNonEmptyString(source.id, fallback.id),
    start_at: normalizeString(source.start_at, fallback.start_at),
    end_at: normalizeString(source.end_at, fallback.end_at),
    title_key: normalizeString(source.title_key, fallback.title_key),
    community_target_lessons: normalizeNonNegativeInt(
      source.community_target_lessons,
      fallback.community_target_lessons
    ),
    reward_badge_id: normalizeNonEmptyString(source.reward_badge_id, fallback.reward_badge_id),
    quests: normalizeEventQuestTemplates(source.quests, fallback.quests),
  };
}

function normalizeLiveOps(value: unknown): LiveOpsConfig {
  const source = normalizeObject(value);
  const campaigns = Array.isArray(source.campaigns)
    ? source.campaigns
        .filter(isRecord)
        .filter(
          (campaign) =>
            typeof campaign.id === "string" &&
            typeof campaign.start_at === "string" &&
            typeof campaign.end_at === "string" &&
            typeof campaign.title_key === "string" &&
            typeof campaign.reward_badge_id === "string" &&
            Array.isArray(campaign.quests)
        )
        .map((campaign) => normalizeEventCampaign(campaign, DEFAULT_EVENT_CAMPAIGN))
    : DEFAULT_CONFIG.liveops.campaigns;

  return {
    enabled: normalizeBoolean(source.enabled, DEFAULT_CONFIG.liveops.enabled),
    max_active_campaigns: normalizePositiveInt(source.max_active_campaigns, DEFAULT_CONFIG.liveops.max_active_campaigns),
    campaigns: campaigns.length > 0 ? campaigns : DEFAULT_CONFIG.liveops.campaigns,
  };
}

export function normalizeGamificationConfig(source: UnknownRecord): GamificationConfig {
  return {
    version: normalizePositiveInt(source.version, DEFAULT_CONFIG.version),
    initial_gems: normalizeNonNegativeInt(source.initial_gems, DEFAULT_CONFIG.initial_gems),
    xp_rewards: normalizeXpRewards(source.xp_rewards),
    freeze: normalizeFreezeConfig(source.freeze),
    streak: normalizeStreakConfig(source.streak),
    streak_milestones: normalizeStreakMilestonesConfig(source.streak_milestones),
    combo_xp: normalizeComboXpConfig(source.combo_xp),
    shop_sinks: normalizeShopSinksConfig(source.shop_sinks),
    double_xp_boost: normalizeDoubleXpBoostConfig(source.double_xp_boost),
    streak_repair: normalizeStreakRepairConfig(source.streak_repair),
    double_xp_nudge: normalizeDoubleXpNudgeConfig(source.double_xp_nudge),
    comeback_reward: normalizeComebackRewardConfig(source.comeback_reward),
    daily_goal: normalizeDailyGoalConfig(source.daily_goal),
    friend_challenge: normalizeFriendChallengeConfig(source.friend_challenge),
    checkout: normalizeCheckoutConfig(source.checkout),
    quest_rewards: normalizeQuestRewardsConfig(source.quest_rewards),
    quest_reroll: normalizeQuestRerollConfig(source.quest_reroll),
    event_campaign: normalizeEventCampaign(source.event_campaign, DEFAULT_CONFIG.event_campaign),
    experiments: normalizeExperiments(source.experiments),
    personalization: normalizePersonalization(source.personalization),
    liveops: normalizeLiveOps(source.liveops),
    league_matchmaking: normalizeLeagueMatchmakingConfig(source.league_matchmaking),
    notifications: normalizeNotificationsConfig(source.notifications),
  };
}

export function isValidEventCampaign(value: unknown): value is EventCampaignConfig {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.start_at !== "string" ||
    typeof value.end_at !== "string" ||
    typeof value.title_key !== "string" ||
    typeof value.reward_badge_id !== "string" ||
    !Array.isArray(value.quests)
  ) {
    return false;
  }

  return value.quests.every(
    (quest) =>
      isRecord(quest) &&
      typeof quest.template_id === "string" &&
      (quest.metric === "lesson_complete" || quest.metric === "streak5_milestone") &&
      Number.isFinite(quest.need) &&
      Number.isFinite(quest.reward_gems) &&
      typeof quest.title_key === "string"
  );
}
