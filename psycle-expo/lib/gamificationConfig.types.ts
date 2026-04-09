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

export type UnknownRecord = Record<string, unknown>;
