import type {
  CheckoutFailedEvent,
  CheckoutStartEvent,
  DailyGoalReachedEvent,
  FreezeUsedEvent,
  LeagueRewardClaimedEvent,
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
    ]);
  });
});
