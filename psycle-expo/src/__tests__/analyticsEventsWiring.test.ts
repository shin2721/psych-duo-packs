import type {
  CheckoutFailedEvent,
  CheckoutStartEvent,
  AppStartupPerformanceEvent,
  DailyGoalReachedEvent,
  EngagementPaywallGuardrailEvent,
  EngagementPrimaryActionShownEvent,
  EngagementPrimaryActionStartedEvent,
  EngagementRewardGrantedEvent,
  EngagementReturnReasonShownEvent,
  FreezeUsedEvent,
  LeagueEntryShownEvent,
  LessonLoadPerformanceEvent,
  LeagueRewardClaimedEvent,
  OnboardingFirstLessonCompletedEvent,
  OnboardingFirstLessonTargetedEvent,
  OnboardingGenresSelectedEvent,
  PlanChangedEvent,
  PlanSelectEvent,
  QuestClaimedEvent,
  QuestCycleResetEvent,
} from "../../lib/analytics.types";

describe("analytics events wiring", () => {
  test("new event contracts are available and typed", () => {
    const events: Array<
      | QuestClaimedEvent
      | FreezeUsedEvent
      | DailyGoalReachedEvent
      | LeagueRewardClaimedEvent
      | PlanChangedEvent
      | QuestCycleResetEvent
      | PlanSelectEvent
      | CheckoutStartEvent
      | CheckoutFailedEvent
      | AppStartupPerformanceEvent
      | LessonLoadPerformanceEvent
      | EngagementPrimaryActionShownEvent
      | EngagementPrimaryActionStartedEvent
      | EngagementPaywallGuardrailEvent
      | EngagementRewardGrantedEvent
      | EngagementReturnReasonShownEvent
      | LeagueEntryShownEvent
      | OnboardingGenresSelectedEvent
      | OnboardingFirstLessonTargetedEvent
      | OnboardingFirstLessonCompletedEvent
    > = [
      {
        name: "quest_claimed",
        properties: {
          templateId: "qd_lessons_3",
          type: "daily",
          rewardXp: 30,
          rewardGems: 10,
          source: "manual_claim",
        },
      },
      {
        name: "freeze_used",
        properties: {
          freezesRemaining: 1,
          streak: 12,
          source: "streak_protection",
        },
      },
      {
        name: "daily_goal_reached",
        properties: {
          dailyGoal: 10,
          dailyXp: 12,
          gemsAwarded: 5,
          source: "xp_gain",
        },
      },
      {
        name: "league_reward_claimed",
        properties: {
          rewardId: "reward-1",
          gems: 20,
          badgesCount: 1,
          weekId: "2026-W10",
          source: "league_result_modal",
        },
      },
      {
        name: "quest_cycle_reset",
        properties: {
          dailyReset: true,
          weeklyReset: false,
          monthlyReset: false,
          source: "cycle_reconcile",
        },
      },
      {
        name: "plan_select",
        properties: {
          source: "shop_tab",
          planId: "pro",
        },
      },
      {
        name: "checkout_start",
        properties: {
          source: "shop_tab",
          planId: "pro",
          billingPeriod: "monthly",
          trialDays: 0,
          priceVersion: "control",
          priceCohort: "default",
        },
      },
      {
        name: "checkout_failed",
        properties: {
          source: "billing_lib",
          planId: "pro",
          reason: "http_error",
          status: 500,
        },
      },
      {
        name: "plan_changed",
        properties: {
          source: "profile_sync",
          fromPlan: "free",
          toPlan: "pro",
          isUpgrade: true,
          isDowngrade: false,
          activeUntil: "2026-03-31T00:00:00.000Z",
          priceVersion: "control",
        },
      },
      {
        name: "app_startup_performance",
        properties: {
          durationMs: 420,
          source: "root_layout_ready",
        },
      },
      {
        name: "lesson_load_performance",
        properties: {
          durationMs: 120,
          genreId: "work",
          lessonId: "work_l01",
          pacingMode: "steady",
          questionCount: 8,
          requestedLessonId: "work_l01",
          source: "lesson_runtime",
          status: "loaded",
          targetDifficulty: "medium",
        },
      },
      {
        name: "engagement_primary_action_shown",
        properties: {
          userState: "daily_active",
          surface: "course_world",
          source: "course_world_model",
          primaryActionType: "lesson",
          priorityRank: 1,
          priorityReason: "next_core_lesson",
          genreId: "mental",
          lessonId: "mental_l03",
          appEnv: "dev",
        },
      },
      {
        name: "engagement_primary_action_started",
        properties: {
          userState: "daily_active",
          surface: "course_world",
          source: "course_world_model",
          primaryActionType: "lesson",
          priorityRank: 1,
          entrypoint: "node",
          genreId: "mental",
          lessonId: "mental_l03",
          appEnv: "dev",
        },
      },
      {
        name: "engagement_paywall_guardrail",
        properties: {
          userState: "activated",
          surface: "course_world",
          source: "locked_lesson_access",
          genreId: "work",
          lessonCompleteCount: 2,
          allowed: false,
          blockedReason: "below_lesson_complete_threshold",
          appEnv: "dev",
        },
      },
      {
        name: "engagement_reward_granted",
        properties: {
          rewardType: "gems",
          rewardAmount: 5,
          sourceEventName: "daily_goal_reached",
          sourceEventId: "daily_goal_reached:2026-04-24",
          idempotencyKey: "daily_goal_reached:2026-04-24:gems",
          surface: "daily_goal",
          appEnv: "dev",
        },
      },
      {
        name: "engagement_return_reason_shown",
        properties: {
          userState: "daily_active",
          surface: "course_world",
          source: "course_world_habit_summary",
          reason: "daily_goal_remaining",
          dailyGoal: 10,
          dailyXp: 4,
          remainingXp: 6,
          streak: 3,
          genreId: "mental",
          primaryActionType: "lesson",
          appEnv: "dev",
        },
      },
      {
        name: "engagement_return_reason_shown",
        properties: {
          userState: "lapsed",
          surface: "course_world",
          source: "course_world_habit_summary",
          reason: "comeback_reward_available",
          dailyGoal: 10,
          dailyXp: 0,
          remainingXp: 10,
          streak: 0,
          genreId: "mental",
          primaryActionType: "comeback_reward",
          supportKind: "comebackReward",
          appEnv: "dev",
        },
      },
      {
        name: "league_entry_shown",
        properties: {
          source: "leaderboard_tab",
          surface: "leaderboard",
          weekId: "2026-W17",
          leagueId: "league-1",
          tier: 2,
          weeklyXp: 0,
          weeklyXpZeroState: "zero",
          memberCount: 30,
          rank: 18,
          appEnv: "dev",
        },
      },
      {
        name: "onboarding_genres_selected",
        properties: {
          selectedGenres: ["work", "study"],
          primaryGenreId: "work",
          selectionCount: 2,
          source: "onboarding_interests",
        },
      },
      {
        name: "onboarding_first_lesson_targeted",
        properties: {
          genreId: "work",
          lessonFile: "work_l01",
          source: "onboarding_interests",
        },
      },
      {
        name: "onboarding_first_lesson_completed",
        properties: {
          genreId: "work",
          lessonId: "work_l01",
          source: "lesson_complete",
        },
      },
    ];

    expect(events.map((event) => event.name)).toEqual([
      "quest_claimed",
      "freeze_used",
      "daily_goal_reached",
      "league_reward_claimed",
      "quest_cycle_reset",
      "plan_select",
      "checkout_start",
      "checkout_failed",
      "plan_changed",
      "app_startup_performance",
      "lesson_load_performance",
      "engagement_primary_action_shown",
      "engagement_primary_action_started",
      "engagement_paywall_guardrail",
      "engagement_reward_granted",
      "engagement_return_reason_shown",
      "engagement_return_reason_shown",
      "league_entry_shown",
      "onboarding_genres_selected",
      "onboarding_first_lesson_targeted",
      "onboarding_first_lesson_completed",
    ]);
  });
});
