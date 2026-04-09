export type BadgeUnlockedEvent = {
  name: "badge_unlocked";
  properties: { badgeId: string; source: "auto_check" };
};

export type QuestCycleResetEvent = {
  name: "quest_cycle_reset";
  properties: {
    dailyReset: boolean;
    weeklyReset: boolean;
    monthlyReset: boolean;
    source: "cycle_reconcile";
  };
};

export type QuestRotationAppliedEvent = {
  name: "quest_rotation_applied";
  properties: {
    dailyChanged: boolean;
    weeklyChanged: boolean;
    monthlyChanged: boolean;
    dailyCount: number;
    weeklyCount: number;
    source: "cycle_reconcile" | "schema_migration";
  };
};

export type QuestAutoClaimedOnCycleEvent = {
  name: "quest_auto_claimed_on_cycle";
  properties: {
    claimedCount: number;
    totalRewardXp: number;
    totalRewardGems: number;
    dailyChanged: boolean;
    weeklyChanged: boolean;
    monthlyChanged: boolean;
    source: "cycle_reconcile" | "schema_migration";
  };
};

export type QuestClaimedEvent = {
  name: "quest_claimed";
  properties: {
    templateId: string;
    type: "daily" | "weekly" | "monthly";
    rewardXp: number;
    rewardGems: number;
    source: "manual_claim";
  };
};

export type QuestRerolledEvent = {
  name: "quest_rerolled";
  properties: {
    questId: string;
    type: "daily" | "weekly";
    oldTemplateId: string;
    newTemplateId: string;
    costGems: number;
    source: "quests_tab";
  };
};

export type EventShownEvent = {
  name: "event_shown";
  properties: { eventId: string; source: "quests_tab" };
};

export type CommunityGoalShownEvent = {
  name: "community_goal_shown";
  properties: { eventId: string; targetLessons: number; source: "quests_tab" };
};

export type EventStartedEvent = {
  name: "event_started";
  properties: { eventId: string; source: "metric_progress" };
};

export type EventQuestRewardedEvent = {
  name: "event_quest_rewarded";
  properties: {
    eventId: string;
    templateId: string;
    metric: "lesson_complete" | "streak5_milestone";
    rewardGems: number;
    source: "metric_progress";
  };
};

export type EventCompletedEvent = {
  name: "event_completed";
  properties: { eventId: string; rewardBadgeId: string; source: "metric_progress" };
};

export type ExperimentExposedEvent = {
  name: "experiment_exposed";
  properties: { experimentId: string; variantId: string; source: "lesson_complete_nudge" };
};

export type ExperimentConvertedEvent = {
  name: "experiment_converted";
  properties: {
    experimentId: string;
    variantId: string;
    source: "lesson_complete_nudge";
    conversion: "double_xp_purchased";
  };
};

export type PersonalizationSegmentAssignedEvent = {
  name: "personalization_segment_assigned";
  properties: {
    segment: "new" | "active" | "at_risk" | "power";
    lessonsCompleted7d: number;
    daysSinceStudy: number;
    source: "daily_reassign";
  };
};

export type LiveOpsEventActivatedEvent = {
  name: "liveops_event_activated";
  properties: { eventId: string; source: "event_reconcile" };
};

export type ProgressionTrackedEvent =
  | BadgeUnlockedEvent
  | QuestCycleResetEvent
  | QuestRotationAppliedEvent
  | QuestAutoClaimedOnCycleEvent
  | QuestClaimedEvent
  | QuestRerolledEvent
  | EventShownEvent
  | CommunityGoalShownEvent
  | EventStartedEvent
  | EventQuestRewardedEvent
  | EventCompletedEvent
  | ExperimentExposedEvent
  | ExperimentConvertedEvent
  | PersonalizationSegmentAssignedEvent
  | LiveOpsEventActivatedEvent;
