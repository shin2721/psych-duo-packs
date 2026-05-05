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

export type CourseSupportShownEvent = {
  name: "course_support_shown";
  properties: {
    source: "course_world";
    lessonId: string;
    kind: "return" | "adaptive" | "refresh" | "replay" | "mastery";
    reason:
      | "abandonment"
      | "weakness"
      | "forgetting"
      | "evidence_update"
      | "completion_drift"
      | "mastery_slot_open";
    signalConfidence: "low" | "medium" | "high" | "unknown";
    weeklySupportBudget?: number;
    weeklySupportUsed?: number;
    weeklySupportRemaining?: number;
    weeklyKindRemaining?: number;
    activeSlotsRemaining?: number;
    graduationState?: "learning" | "graduated";
    masteryCeilingState?: "open" | "ceiling_reached";
  };
};

export type CourseSupportStartedEvent = {
  name: "course_support_started";
  properties: {
    source: "course_world";
    lessonId: string;
    kind: "return" | "adaptive" | "refresh" | "replay" | "mastery";
    reason:
      | "abandonment"
      | "weakness"
      | "forgetting"
      | "evidence_update"
      | "completion_drift"
      | "mastery_slot_open";
    activeSlotsRemaining?: number;
  };
};

export type CourseSupportCompletedEvent = {
  name: "course_support_completed";
  properties: {
    source: "lesson_session" | "review_session";
    lessonId: string;
    kind: "return" | "adaptive" | "refresh" | "replay" | "mastery";
    reason:
      | "abandonment"
      | "weakness"
      | "forgetting"
      | "evidence_update"
      | "completion_drift"
      | "mastery_slot_open";
  };
};

export type CourseSupportSuppressedEvent = {
  name: "course_support_suppressed";
  properties: {
    source: "course_world" | "review_session";
    lessonId: string;
    kind: "return" | "adaptive" | "refresh" | "replay" | "mastery";
    reason:
      | "abandonment"
      | "weakness"
      | "forgetting"
      | "evidence_update"
      | "completion_drift"
      | "mastery_slot_open";
  };
};

export type CourseSupportKilledEvent = {
  name: "course_support_killed";
  properties: {
    source: "runtime_guard";
    lessonId: string;
    kind: "return" | "adaptive" | "refresh" | "replay" | "mastery";
    reason:
      | "abandonment"
      | "weakness"
      | "forgetting"
      | "evidence_update"
      | "completion_drift"
      | "mastery_slot_open";
    blockReason:
      | "package_killed"
      | "continuity_retired"
      | "dependency_unmet"
      | "theme_not_active"
      | "theme_review_overdue"
      | "package_not_production"
      | "tier_a_stale";
  };
};

export type EngagementUserState =
  | "new_user"
  | "activated"
  | "daily_active"
  | "stable"
  | "lapsed"
  | "comeback"
  | "at_risk";

export type EngagementPrimaryActionType =
  | "lesson"
  | "review"
  | "paywall"
  | "return"
  | "adaptive"
  | "refresh"
  | "replay"
  | "mastery"
  | "streak_repair"
  | "comeback_reward";

export type EngagementPrimaryActionShownEvent = {
  name: "engagement_primary_action_shown";
  properties: {
    userState: EngagementUserState;
    surface: "course_world";
    source: "course_world_model";
    primaryActionType: EngagementPrimaryActionType;
    priorityRank: number;
    priorityReason: string;
    genreId: string;
    lessonId?: string;
    supportKind?: "return" | "adaptive" | "refresh" | "replay" | "mastery" | "streakRepair" | "comebackReward";
    appEnv: "dev" | "prod";
  };
};

export type EngagementPrimaryActionStartedEvent = {
  name: "engagement_primary_action_started";
  properties: {
    userState: EngagementUserState;
    surface: "course_world";
    source: "course_world_model";
    primaryActionType: EngagementPrimaryActionType;
    priorityRank: number;
    entrypoint: "primary_cta" | "node" | "support_card";
    genreId: string;
    lessonId?: string;
    supportKind?: "return" | "adaptive" | "refresh" | "replay" | "mastery" | "streakRepair" | "comebackReward";
    appEnv: "dev" | "prod";
  };
};

export type EngagementPaywallGuardrailEvent = {
  name: "engagement_paywall_guardrail";
  properties: {
    userState: EngagementUserState;
    surface: "course_world";
    source: "locked_lesson_access";
    genreId: string;
    lessonCompleteCount: number;
    allowed: boolean;
    blockedReason: "below_lesson_complete_threshold" | "eligible";
    appEnv: "dev" | "prod";
  };
};

export type EngagementRewardGrantedEvent = {
  name: "engagement_reward_granted";
  properties: {
    rewardType: "xp" | "gems" | "energy" | "badge";
    rewardAmount: number;
    sourceEventName: string;
    sourceEventId: string;
    idempotencyKey: string;
    surface:
      | "course_world"
      | "quest_claim"
      | "daily_goal"
      | "comeback_reward"
      | "streak_milestone"
      | "league_result";
    appEnv: "dev" | "prod";
  };
};

export type EngagementReturnReasonShownEvent = {
  name: "engagement_return_reason_shown";
  properties: {
    userState: EngagementUserState;
    surface: "course_world";
    source: "course_world_habit_summary";
    reason:
      | "daily_goal_remaining"
      | "daily_goal_complete"
      | "streak_repair_available"
      | "comeback_reward_available"
      | "return_support_available";
    dailyGoal: number;
    dailyXp: number;
    remainingXp: number;
    streak: number;
    genreId: string;
    primaryActionType: EngagementPrimaryActionType;
    supportKind?: "return" | "adaptive" | "refresh" | "replay" | "mastery" | "streakRepair" | "comebackReward";
    appEnv: "dev" | "prod";
  };
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
  | LiveOpsEventActivatedEvent
  | CourseSupportShownEvent
  | CourseSupportStartedEvent
  | CourseSupportCompletedEvent
  | CourseSupportSuppressedEvent
  | CourseSupportKilledEvent
  | EngagementPrimaryActionShownEvent
  | EngagementPrimaryActionStartedEvent
  | EngagementPaywallGuardrailEvent
  | EngagementRewardGrantedEvent
  | EngagementReturnReasonShownEvent;
