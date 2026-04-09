export type StreakLostEvent = {
  name: "streak_lost";
  properties: {
    streakType: "study";
    previousStreak: number;
    gapDays: number;
    freezesRemaining?: number;
    freezesNeeded?: number;
  };
};

export type EnergyBlockedEvent = {
  name: "energy_blocked";
  properties: { lessonId: string; genreId: string; energy: number; maxEnergy: number };
};

export type EnergyBonusHitEvent = {
  name: "energy_bonus_hit";
  properties: {
    correctStreak: number;
    energyBefore: number;
    energyAfter: number;
    dailyBonusCount: number;
    dailyBonusCap: number;
  };
};

export type ShopOpenFromEnergyEvent = {
  name: "shop_open_from_energy";
  properties: { source: string; lessonId?: string };
};

export type FirstDayEnergyBonusGrantedEvent = {
  name: "first_day_energy_bonus_granted";
  properties: {
    bonusEnergy: number;
    baseCap: number;
    effectiveCap: number;
    expiresAt: string;
    source: "first_launch";
  };
};

export type StreakRepairOfferedEvent = {
  name: "streak_repair_offered";
  properties: { previousStreak: number; costGems: number; expiresAt: string };
};

export type StreakRepairPurchasedEvent = {
  name: "streak_repair_purchased";
  properties: { previousStreak: number; costGems: number; gemsBefore: number; gemsAfter: number };
};

export type StreakRepairExpiredEvent = {
  name: "streak_repair_expired";
  properties: { previousStreak: number; expiredAt: string };
};

export type ComboMilestoneShownEvent = {
  name: "combo_milestone_shown";
  properties: { milestone: 3 | 5 | 10; lessonId: string; questionId: string };
};

export type ComboXpBonusAppliedEvent = {
  name: "combo_xp_bonus_applied";
  properties: {
    lessonId: string;
    questionId: string;
    streak: number;
    baseXp: number;
    bonusXp: number;
    multiplier: number;
    usedBonusXp: number;
    capBonusXp: number;
  };
};

export type FeltBetterXpAwardedEvent = {
  name: "felt_better_xp_awarded";
  properties: {
    lessonId: string;
    interventionId: string;
    feltBetterValue: -2 | -1 | 0 | 1 | 2;
    xpAwarded: number;
  };
};

export type EnergyFullRefillPurchasedEvent = {
  name: "energy_full_refill_purchased";
  properties: {
    costGems: number;
    gemsBefore: number;
    gemsAfter: number;
    energyBefore: number;
    energyAfter: number;
    dailyCountAfter: number;
  };
};

export type DoubleXpNudgeShownEvent = {
  name: "double_xp_nudge_shown";
  properties: { source: "lesson_complete"; gems: number; dailyRemainingAfterShow: number };
};

export type DoubleXpNudgeClickedEvent = {
  name: "double_xp_nudge_clicked";
  properties: { source: "lesson_complete"; gems: number };
};

export type DoubleXpPurchasedEvent = {
  name: "double_xp_purchased";
  properties: {
    source: "shop_item" | "lesson_complete_nudge";
    costGems: number;
    gemsBefore: number;
    gemsAfter: number;
    activeUntil: string;
  };
};

export type FreezeUsedEvent = {
  name: "freeze_used";
  properties: { freezesRemaining: number; streak: number; source: "streak_protection" };
};

export type DailyGoalReachedEvent = {
  name: "daily_goal_reached";
  properties: { dailyGoal: number; dailyXp: number; gemsAwarded: number; source: "xp_gain" };
};

export type StreakMilestoneRewardedEvent = {
  name: "streak_milestone_rewarded";
  properties: {
    day: 3 | 7 | 14 | 30 | 60 | 100 | 365;
    rewardGems: number;
    source: "streak_update";
    lifetimeOnce: true;
  };
};

export type ComebackRewardOfferedEvent = {
  name: "comeback_reward_offered";
  properties: {
    daysSinceStudy: number;
    rewardEnergy: number;
    rewardGems: number;
    thresholdDays: number;
    source: "streak_update";
  };
};

export type ComebackRewardClaimedEvent = {
  name: "comeback_reward_claimed";
  properties: { rewardEnergy: number; rewardGems: number; daysSinceStudy: number; source: "lesson_complete" };
};

export type ComebackRewardExpiredEvent = {
  name: "comeback_reward_expired";
  properties: { daysSinceStudy: number; expiredAt: string; source: "offer_expiry" };
};

export type EconomyTrackedEvent =
  | StreakLostEvent
  | EnergyBlockedEvent
  | EnergyBonusHitEvent
  | ShopOpenFromEnergyEvent
  | FirstDayEnergyBonusGrantedEvent
  | StreakRepairOfferedEvent
  | StreakRepairPurchasedEvent
  | StreakRepairExpiredEvent
  | ComboMilestoneShownEvent
  | ComboXpBonusAppliedEvent
  | FeltBetterXpAwardedEvent
  | EnergyFullRefillPurchasedEvent
  | DoubleXpNudgeShownEvent
  | DoubleXpNudgeClickedEvent
  | DoubleXpPurchasedEvent
  | FreezeUsedEvent
  | DailyGoalReachedEvent
  | StreakMilestoneRewardedEvent
  | ComebackRewardOfferedEvent
  | ComebackRewardClaimedEvent
  | ComebackRewardExpiredEvent;
