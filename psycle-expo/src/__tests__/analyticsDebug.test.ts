jest.mock("expo/env", () => ({}), { virtual: true });
jest.mock("expo/virtual/env", () => ({}), { virtual: true });

describe("analytics debug", () => {
  const loadDebugModule = () => require("../../lib/analytics-debug");

  beforeEach(() => {
    jest.resetModules();
  });

  test("tracked events increment counters without widening to arbitrary names", () => {
    const {
      getDebugState,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-1");
    recordDebugEvent("app_open", "sent", "anon-1");
    recordDebugEvent("custom_event", "sent", "anon-1");

    const state = getDebugState();
    expect(state.counters.app_open).toBe(1);
    expect(state.counters.custom_event).toBeUndefined();
  });

  test("queued tracked events stay diagnostic and do not double count sent events", () => {
    const {
      getDebugState,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-queued");
    recordDebugEvent("session_start", "queued", "anon-queued");
    recordDebugEvent("session_start", "sent", "anon-queued");

    const state = getDebugState();
    expect(state.counters.session_start).toBe(1);
    expect(state.events.map((event) => event.status)).toEqual(["sent", "queued"]);
  });

  test("enabling second launch mode starts a fresh launch measurement window", () => {
    const {
      getDebugState,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
      setSecondLaunchMode,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-second");
    recordDebugEvent("app_open", "sent", "anon-second");
    recordDebugEvent("session_start", "sent", "anon-second");

    setSecondLaunchMode(true);

    const state = getDebugState();
    expect(state.secondLaunchMode).toBe(true);
    expect(state.events).toEqual([]);
    expect(state.counters.app_open).toBe(0);
    expect(state.counters.session_start).toBe(0);
  });

  test("engagement events increment counters and are audit-filterable", () => {
    const {
      evaluateEngagementDebugHealth,
      getDebugState,
      isEngagementDebugEventName,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-3");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-3", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-3", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 4,
      genreId: "mental",
      primaryActionType: "lesson",
      reason: "daily_goal_remaining",
      remainingXp: 6,
      source: "course_world_habit_summary",
      streak: 3,
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("lesson_complete", "sent", "anon-3");

    const state = getDebugState();
    expect(state.counters.engagement_primary_action_shown).toBe(1);
    expect(isEngagementDebugEventName("engagement_primary_action_shown")).toBe(true);
    expect(isEngagementDebugEventName("engagement_return_reason_shown")).toBe(true);
    expect(isEngagementDebugEventName("lesson_complete")).toBe(false);
    expect(state.events[0]).toMatchObject({
      name: "lesson_complete",
    });
    expect(state.events.find((event) => event.name === "engagement_primary_action_shown")).toMatchObject({
      name: "engagement_primary_action_shown",
      meta: {
        primaryActionType: "lesson",
        priorityRank: 1,
        userState: "daily_active",
      },
    });
    expect(evaluateEngagementDebugHealth(state.events)).toMatchObject({
      passed: false,
      primaryActionShown: 1,
      primaryActionStarted: 0,
      returnReasonsShown: 1,
      rewardGrants: 0,
      warnings: ["primary action shown but never started in the current debug buffer"],
    });
  });

  test("every engagement debug event has a required payload contract", () => {
    const {
      ENGAGEMENT_DEBUG_EVENTS,
      ENGAGEMENT_REQUIRED_PAYLOAD_FIELDS,
    } = loadDebugModule();

    for (const eventName of ENGAGEMENT_DEBUG_EVENTS) {
      expect(ENGAGEMENT_REQUIRED_PAYLOAD_FIELDS[eventName]).toBeDefined();
      expect(ENGAGEMENT_REQUIRED_PAYLOAD_FIELDS[eventName].length).toBeGreaterThan(0);
    }
  });

  test("engagement health catches missing return reason telemetry", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-5");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-5", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-5", {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      primaryActionShown: 1,
      primaryActionStarted: 1,
      returnReasonsShown: 0,
      warnings: ["primary action shown without engagement_return_reason_shown"],
    });
  });

  test("engagement health catches primary action start without a shown event", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-start");
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-start", {
      primaryActionType: "lesson",
      priorityRank: 1,
    });

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      primaryActionShown: 0,
      primaryActionStarted: 1,
      warnings: [
        "primary action started without engagement_primary_action_shown",
        "engagement_primary_action_started missing required audit payload: 1",
      ],
    });
  });

  test("engagement health catches too many primary action starts", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-too-many-starts");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6-too-many-starts", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-too-many-starts", {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-too-many-starts", {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6-too-many-starts", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 4,
      genreId: "mental",
      primaryActionType: "lesson",
      reason: "daily_goal_remaining",
      remainingXp: 6,
      source: "course_world_habit_summary",
      streak: 3,
      surface: "course_world",
      userState: "daily_active",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health).toMatchObject({
      passed: false,
      primaryActionShown: 1,
      primaryActionStarted: 2,
    });
    expect(health.warnings).toContain("primary action started more often than shown: 2/1");
  });

  test("engagement health catches duplicate primary action started events", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-duplicate-start");
    const startedMeta = {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    };
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6-duplicate-start", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-duplicate-start", startedMeta);
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-duplicate-start", startedMeta);
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6-duplicate-start", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 4,
      genreId: "mental",
      primaryActionType: "lesson",
      reason: "daily_goal_remaining",
      remainingXp: 6,
      source: "course_world_habit_summary",
      streak: 3,
      surface: "course_world",
      userState: "daily_active",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain("duplicate engagement_primary_action_started observed: 1");
  });

  test("engagement health catches return reason without a primary action", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-return-only");
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6-return-only", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 4,
      genreId: "mental",
      primaryActionType: "lesson",
      reason: "daily_goal_remaining",
      remainingXp: 6,
      source: "course_world_habit_summary",
      streak: 3,
      surface: "course_world",
      userState: "daily_active",
    });

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      primaryActionShown: 0,
      returnReasonsShown: 1,
      warnings: ["engagement_return_reason_shown without engagement_primary_action_shown"],
    });
  });

  test("engagement health catches missing started and paywall guardrail audit payload", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-start-required");
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-start-required", {
      primaryActionType: "lesson",
    });
    recordDebugEvent("engagement_paywall_guardrail", "sent", "anon-6-start-required", {
      allowed: false,
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "engagement_primary_action_started missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "engagement_paywall_guardrail missing required audit payload: 1"
    );
  });

  test("engagement health catches missing primary action and return reason audit payload", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-required");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6-required", {
      primaryActionType: "lesson",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6-required", {
      reason: "daily_goal_remaining",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "engagement_primary_action_shown missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "engagement_return_reason_shown missing required audit payload: 1"
    );
  });

  test("engagement health catches duplicate primary action shown events", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6-duplicate");
    const primaryActionMeta = {
      appEnv: "dev",
      userState: "daily_active",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      lessonId: "mental_l03",
      source: "course_world_model",
      surface: "course_world",
    };
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6-duplicate", primaryActionMeta);
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6-duplicate", primaryActionMeta);
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-6-duplicate", {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6-duplicate", {
      appEnv: "dev",
      userState: "daily_active",
      genreId: "mental",
      reason: "daily_goal_remaining",
      dailyGoal: 10,
      dailyXp: 4,
      remainingXp: 6,
      streak: 3,
      primaryActionType: "lesson",
      source: "course_world_habit_summary",
      surface: "course_world",
    });

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      primaryActionShown: 2,
      primaryActionStarted: 1,
      warnings: ["duplicate engagement_primary_action_shown observed: 1"],
    });
  });

  test("engagement health catches return reason mismatch against support primary action", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-6");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-6", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "comeback_reward",
      priorityRank: 3,
      priorityReason: "comeback_reward_available",
      source: "course_world_model",
      surface: "course_world",
      supportKind: "comebackReward",
      userState: "lapsed",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-6", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 0,
      genreId: "mental",
      primaryActionType: "comeback_reward",
      reason: "daily_goal_remaining",
      remainingXp: 10,
      source: "course_world_habit_summary",
      streak: 0,
      supportKind: "comebackReward",
      surface: "course_world",
      userState: "lapsed",
    });

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      primaryActionShown: 1,
      returnReasonsShown: 1,
      warnings: [
        "primary action shown but never started in the current debug buffer",
        "return reason mismatch: expected comeback_reward_available, got daily_goal_remaining",
      ],
    });
  });

  test("engagement health catches duplicate return reason events", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-7");
    const returnReasonMeta = {
      appEnv: "dev",
      userState: "daily_active",
      genreId: "mental",
      reason: "daily_goal_remaining",
      dailyGoal: 10,
      dailyXp: 4,
      remainingXp: 6,
      streak: 3,
      primaryActionType: "lesson",
      source: "course_world_habit_summary",
      surface: "course_world",
    };
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-7", {
      appEnv: "dev",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      priorityReason: "next_core_lesson",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_primary_action_started", "sent", "anon-7", {
      appEnv: "dev",
      entrypoint: "primary_cta",
      genreId: "mental",
      primaryActionType: "lesson",
      priorityRank: 1,
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-7", returnReasonMeta);
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-7", returnReasonMeta);

    expect(evaluateEngagementDebugHealth()).toMatchObject({
      passed: false,
      returnReasonsShown: 2,
      warnings: ["duplicate engagement_return_reason_shown observed: 1"],
    });
  });

  test("engagement health catches reward and paywall guardrail wiring drift", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-4");
    recordDebugEvent("engagement_paywall_guardrail", "sent", "anon-4", {
      allowed: true,
      blockedReason: "eligible",
      lessonCompleteCount: 0,
    });
    recordDebugEvent("engagement_reward_granted", "sent", "anon-4", {
      rewardType: "gems",
      rewardAmount: 5,
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.rewardGrants).toBe(1);
    expect(health.warnings).toContain("engagement_reward_granted missing idempotencyKey: 1");
    expect(health.warnings).toContain("engagement_reward_granted missing required audit payload: 1");
    expect(health.warnings).toContain("paywall allowed before onboarding_first_lesson_completed");
  });

  test("engagement health catches reward idempotency source mismatch", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-reward-mismatch");
    recordDebugEvent("engagement_reward_granted", "sent", "anon-reward-mismatch", {
      appEnv: "dev",
      idempotencyKey: "quest_claimed:other:gems",
      rewardAmount: 5,
      rewardType: "gems",
      sourceEventId: "quest_claimed:qd_lessons_3",
      sourceEventName: "quest_claimed",
      surface: "quest_claim",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "engagement_reward_granted idempotency/source mismatch: 1"
    );
  });

  test("engagement health catches reward source event name/id mismatch", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-reward-source-mismatch");
    recordDebugEvent("engagement_reward_granted", "sent", "anon-reward-source-mismatch", {
      appEnv: "dev",
      idempotencyKey: "quest_claimed:qd_lessons_3:gems",
      rewardAmount: 5,
      rewardType: "gems",
      sourceEventId: "quest_claimed:qd_lessons_3",
      sourceEventName: "daily_goal_reached",
      surface: "quest_claim",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "engagement_reward_granted sourceEventName/sourceEventId mismatch: 1"
    );
  });

  test("engagement health catches invalid engagement payload domain values", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-domain-values");
    recordDebugEvent("engagement_primary_action_shown", "sent", "anon-domain-values", {
      appEnv: "staging",
      genreId: "mental",
      primaryActionType: "spin",
      priorityRank: 1,
      priorityReason: "unknown",
      source: "course_world_model",
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_return_reason_shown", "sent", "anon-domain-values", {
      appEnv: "dev",
      dailyGoal: 10,
      dailyXp: 4,
      genreId: "mental",
      primaryActionType: "spin",
      reason: "random_bonus",
      remainingXp: 6,
      source: "course_world_habit_summary",
      streak: 3,
      surface: "course_world",
      userState: "daily_active",
    });
    recordDebugEvent("engagement_reward_granted", "sent", "anon-domain-values", {
      appEnv: "prod",
      idempotencyKey: "quest_claimed:qd_lessons_3:coupon",
      rewardAmount: 0,
      rewardType: "coupon",
      sourceEventId: "quest_claimed:qd_lessons_3",
      sourceEventName: "quest_claimed",
      surface: "quest_claim",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain("engagement event invalid appEnv: 1");
    expect(health.warnings).toContain("engagement event invalid primaryActionType: 2");
    expect(health.warnings).toContain("engagement_return_reason_shown invalid reason: 1");
    expect(health.warnings).toContain("engagement_reward_granted invalid rewardType: 1");
    expect(health.warnings).toContain("engagement_reward_granted non-positive rewardAmount: 1");
  });

  test("engagement health catches paywall allowed/block reason mismatch", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-paywall-mismatch");
    recordDebugEvent("onboarding_first_lesson_completed", "sent", "anon-paywall-mismatch", {
      genreId: "mental",
      lessonId: "mental_l01",
      source: "lesson_complete",
    });
    recordDebugEvent("engagement_paywall_guardrail", "sent", "anon-paywall-mismatch", {
      appEnv: "dev",
      allowed: false,
      blockedReason: "eligible",
      genreId: "mental",
      lessonCompleteCount: 1,
      source: "locked_lesson_access",
      surface: "course_world",
      userState: "activated",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "engagement_paywall_guardrail allowed/block reason mismatch: 1"
    );
  });

  test("engagement health catches missing support engagement event audit payload", () => {
    const {
      evaluateEngagementDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-support-events");
    recordDebugEvent("onboarding_genres_selected", "sent", "anon-support-events", {
      primaryGenreId: "mental",
    });
    recordDebugEvent("daily_goal_reached", "sent", "anon-support-events", {
      dailyGoal: 10,
    });
    recordDebugEvent("quest_claimed", "sent", "anon-support-events", {
      templateId: "qd_lessons_3",
    });
    recordDebugEvent("comeback_reward_claimed", "sent", "anon-support-events", {
      rewardEnergy: 2,
    });
    recordDebugEvent("league_entry_shown", "sent", "anon-support-events", {
      weekId: "2026-W17",
    });

    const health = evaluateEngagementDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      "onboarding_genres_selected missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "daily_goal_reached missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "quest_claimed missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "comeback_reward_claimed missing required audit payload: 1"
    );
    expect(health.warnings).toContain(
      "league_entry_shown missing required audit payload: 1"
    );
  });

  test("performance health passes within startup and lesson budgets", () => {
    const {
      PERFORMANCE_BUDGETS,
      evaluatePerformanceDebugHealth,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-performance-ok");
    recordDebugEvent("app_startup_performance", "sent", "anon-performance-ok", {
      durationMs: PERFORMANCE_BUDGETS.appStartupMs - 1,
      source: "root_layout_ready",
    });
    recordDebugEvent("lesson_load_performance", "sent", "anon-performance-ok", {
      durationMs: PERFORMANCE_BUDGETS.lessonLoadMs - 1,
      source: "lesson_runtime",
      status: "loaded",
    });

    expect(evaluatePerformanceDebugHealth()).toMatchObject({
      passed: true,
      latestStartupMs: PERFORMANCE_BUDGETS.appStartupMs - 1,
      latestLessonLoadMs: PERFORMANCE_BUDGETS.lessonLoadMs - 1,
      lessonLoadSamples: 1,
      warnings: [],
    });
  });

  test("performance health catches startup, lesson load, and malformed durations", () => {
    const {
      PERFORMANCE_BUDGETS,
      evaluatePerformanceDebugHealth,
      getDebugReport,
      recordDebugEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-performance-warn");
    recordDebugEvent("app_startup_performance", "sent", "anon-performance-warn", {
      durationMs: PERFORMANCE_BUDGETS.appStartupMs + 250,
      source: "root_layout_ready",
    });
    recordDebugEvent("lesson_load_performance", "sent", "anon-performance-warn", {
      durationMs: PERFORMANCE_BUDGETS.lessonLoadMs + 125,
      source: "lesson_runtime",
      status: "loaded",
    });
    recordDebugEvent("lesson_load_performance", "sent", "anon-performance-warn", {
      durationMs: -1,
      source: "lesson_runtime",
      status: "failed",
    });

    const health = evaluatePerformanceDebugHealth();
    expect(health.passed).toBe(false);
    expect(health.warnings).toContain(
      `app startup exceeded budget: ${PERFORMANCE_BUDGETS.appStartupMs + 250}ms/${PERFORMANCE_BUDGETS.appStartupMs}ms`
    );
    expect(health.warnings).toContain(
      `lesson load exceeded budget: ${PERFORMANCE_BUDGETS.lessonLoadMs + 125}ms/${PERFORMANCE_BUDGETS.lessonLoadMs}ms`
    );
    expect(health.warnings).toContain("performance event missing valid durationMs: 1");
    expect(getDebugReport()).toContain("--- Performance Health ---");
  });

  test("system events stay out of tracked counters", () => {
    const {
      getDebugState,
      recordSystemEvent,
      resetDebugState,
      setCurrentAnonId,
    } = loadDebugModule();

    resetDebugState();
    setCurrentAnonId("anon-2");
    recordSystemEvent("initialized", "anon-2");

    const state = getDebugState();
    expect(state.counters.app_open).toBe(0);
    expect(state.events[0]).toMatchObject({
      type: "system",
      name: "initialized",
      anonId: "anon-2",
    });
  });
});
