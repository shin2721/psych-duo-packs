const ACTUAL_CONFIG = JSON.parse(
  JSON.stringify(jest.requireActual("../../config/gamification.json"))
) as Record<string, unknown>;

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadGamificationModule(mockConfig: unknown) {
  jest.resetModules();
  const warnDev = jest.fn();
  let gamificationModule: typeof import("../../lib/gamificationConfig");

  jest.doMock("../../lib/devLog", () => ({
    warnDev,
  }));
  jest.doMock("../../config/gamification.json", () => ({
    __esModule: true,
    default: mockConfig,
  }));

  jest.isolateModules(() => {
    gamificationModule = require("../../lib/gamificationConfig");
  });

  return { gamificationModule: gamificationModule!, warnDev };
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock("../../config/gamification.json");
  jest.dontMock("../../lib/devLog");
});

describe("gamificationConfig normalization", () => {
  test("top-level non object falls back to defaults and warns once", () => {
    const { gamificationModule, warnDev } = loadGamificationModule("bad-config");

    expect(gamificationModule.getInitialGems()).toBe(50);
    expect(gamificationModule.getExperimentsConfig().enabled).toBe(false);
    expect(warnDev).toHaveBeenCalledTimes(1);
  });

  test("invalid scalar fields fall back per-field without warning", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.initial_gems = "oops";
    mockConfig.checkout = { max_plan_enabled: "nope" };

    const { gamificationModule, warnDev } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getInitialGems()).toBe(50);
    expect(gamificationModule.getCheckoutConfig().max_plan_enabled).toBe(false);
    expect(warnDev).not.toHaveBeenCalled();
  });

  test("streak milestones keep only valid items", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.streak_milestones = {
      lifetime_once: true,
      rewards: [{ day: 3, gems: 5 }, { day: "bad" }, { gems: 9 }, { day: 7, gems: 10 }],
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getStreakMilestonesConfig().rewards).toEqual([
      { day: 3, gems: 5 },
      { day: 7, gems: 10 },
    ]);
  });

  test("combo milestones keep only valid items", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.combo_xp = {
      enabled: true,
      bonus_cap_per_lesson: 20,
      milestones: [{ streak: 3, multiplier: 1.2 }, { streak: "bad" }, { multiplier: 2 }, { streak: 5, multiplier: 1.5 }],
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getComboXpConfig().milestones).toEqual([
      { streak: 3, multiplier: 1.2 },
      { streak: 5, multiplier: 1.5 },
    ]);
  });

  test("event campaign quests keep only valid items", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.event_campaign = {
      enabled: true,
      id: "spring",
      start_at: "2026-04-29T00:00:00+09:00",
      end_at: "2026-05-06T23:59:59+09:00",
      title_key: "events.spring.title",
      community_target_lessons: 123,
      reward_badge_id: "event_spring",
      quests: [
        {
          template_id: "ok",
          metric: "lesson_complete",
          need: 10,
          reward_gems: 5,
          title_key: "quest.ok",
        },
        {
          template_id: "bad",
          metric: "lesson_complete",
          reward_gems: 5,
          title_key: "quest.bad",
        },
      ],
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.gamificationConfig.event_campaign.quests).toEqual([
      {
        template_id: "ok",
        metric: "lesson_complete",
        need: 10,
        reward_gems: 5,
        title_key: "quest.ok",
      },
    ]);
  });

  test("liveops invalid campaigns are skipped and defaulted when all invalid", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.liveops = {
      enabled: true,
      max_active_campaigns: 2,
      campaigns: [{ foo: "bar" }, { id: "missing-quests" }],
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getLiveOpsConfig().campaigns).toEqual(
      gamificationModule.gamificationConfig.liveops.campaigns
    );
    expect(gamificationModule.getLiveOpsConfig().campaigns).toEqual([
      {
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
      },
    ]);
  });

  test("invalid known experiment variants fall back to defaults", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.experiments = {
      enabled: false,
      experiments: {
        ...((ACTUAL_CONFIG.experiments as Record<string, unknown>) ?? {}),
        double_xp_nudge_lesson_complete: {
          enabled: true,
          rollout_percentage: 5,
          variants: ["bad"],
        },
      },
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getExperimentsConfig().experiments.double_xp_nudge_lesson_complete.variants).toEqual([
      { id: "control", weight: 50, payload: { copyStyle: "default" } },
      { id: "variant_a", weight: 50, payload: { copyStyle: "urgency" } },
    ]);
  });

  test("unknown experiments are preserved with safe normalized shape", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.experiments = {
      enabled: true,
      experiments: {
        ...((ACTUAL_CONFIG.experiments as Record<string, unknown>) ?? {}),
        mystery_experiment: {
          enabled: true,
          rollout_percentage: 33,
          variants: [{ id: "m1", weight: 10, payload: { mode: "test" } }, { foo: "bar" }],
        },
      },
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);
    const unknown = gamificationModule.getExperimentsConfig().experiments.mystery_experiment;

    expect(unknown).toEqual({
      enabled: true,
      rollout_percentage: 33,
      variants: [{ id: "m1", weight: 10, payload: { mode: "test" } }],
    });
  });

  test("quest reward bonus map falls back per missing key", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.quest_rewards = {
      claim_bonus_gems_by_type: {
        daily: 9,
        monthly: "bad",
      },
    };

    const { gamificationModule } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getQuestRewardsConfig().claim_bonus_gems_by_type).toEqual({
      daily: 9,
      weekly: 10,
      monthly: 15,
    });
  });

  test("field-level invalid data does not emit warnings", () => {
    const mockConfig = cloneConfig(ACTUAL_CONFIG);
    mockConfig.personalization = {
      enabled: "bad",
      segment_reassign_cooldown_hours: "bad",
      quest_need_adjustment: { new: -2 },
      comeback_reward_adjustment: { power: 3 },
    };

    const { gamificationModule, warnDev } = loadGamificationModule(mockConfig);

    expect(gamificationModule.getPersonalizationConfig()).toEqual({
      enabled: false,
      segment_reassign_cooldown_hours: 24,
      quest_need_adjustment: {
        new: -2,
        active: 0,
        at_risk: -1,
        power: 1,
      },
      comeback_reward_adjustment: {
        new: 0,
        active: 0,
        at_risk: 1,
        power: 3,
      },
    });
    expect(warnDev).not.toHaveBeenCalled();
  });
});
