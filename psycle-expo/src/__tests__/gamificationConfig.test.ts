import {
  getComebackRewardConfig,
  getCheckoutConfig,
  getDailyGoalConfig,
  getDoubleXpBoostConfig,
  getExperimentsConfig,
  getFriendChallengeConfig,
  getInitialGems,
  getPersonalizationConfig,
  getQuestRerollConfig,
  getQuestRewardsConfig,
  getStreakRepairConfig,
} from "../../lib/gamificationConfig";

describe("gamificationConfig", () => {
  test("initial gems and boost/repair configs keep current defaults", () => {
    expect(getInitialGems()).toBe(50);
    expect(getDoubleXpBoostConfig()).toEqual({
      cost_gems: 20,
      duration_minutes: 15,
    });
    expect(getStreakRepairConfig()).toEqual({
      cost_gems: 50,
      window_hours: 48,
    });
  });

  test("comeback reward config keeps current defaults", () => {
    const config = getComebackRewardConfig();
    expect(config.threshold_days).toBe(7);
    expect(config.reward_energy).toBe(2);
    expect(config.reward_gems).toBe(10);
  });

  test("daily goal and friend challenge configs keep current defaults", () => {
    const dailyGoal = getDailyGoalConfig();
    const friendChallenge = getFriendChallengeConfig();
    const checkout = getCheckoutConfig();

    expect(dailyGoal.default_xp).toBe(10);
    expect(dailyGoal.reward_gems).toBe(5);
    expect(friendChallenge.reward_gems).toBe(15);
    expect(checkout.max_plan_enabled).toBe(false);
  });

  test("quest reward claim gems map is present for all quest types", () => {
    const rewardConfig = getQuestRewardsConfig().claim_bonus_gems_by_type;
    expect(rewardConfig.daily).toBe(5);
    expect(rewardConfig.weekly).toBe(10);
    expect(rewardConfig.monthly).toBe(15);
  });

  test("quest reroll config keeps safe defaults", () => {
    const config = getQuestRerollConfig();
    expect(config.enabled).toBe(true);
    expect(config.cost_gems).toBe(5);
    expect(config.daily_limit).toBe(1);
  });

  test("experiments are enabled for A/A and personalization stays disabled", () => {
    expect(getExperimentsConfig().enabled).toBe(true);
    expect(getPersonalizationConfig().enabled).toBe(false);
  });

  test("experiment rollout percentage is normalized and current config is 5%", () => {
    const experiments = getExperimentsConfig();
    const definition = experiments.experiments.double_xp_nudge_lesson_complete;
    expect(definition.enabled).toBe(true);
    expect(definition.rollout_percentage).toBe(5);
    expect(definition.rollout_percentage).toBeGreaterThanOrEqual(0);
    expect(definition.rollout_percentage).toBeLessThanOrEqual(100);
    expect(definition.variants[0]?.payload).toEqual({ copyStyle: "default" });
    expect(definition.variants[1]?.payload).toEqual({ copyStyle: "default" });
  });
});
