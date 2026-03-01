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

  test("experiments stay disabled by default and personalization stays disabled", () => {
    expect(getExperimentsConfig().enabled).toBe(false);
    expect(getPersonalizationConfig().enabled).toBe(false);
  });

  test("experiment rollout percentage is normalized and current config is 5%", () => {
    const experiments = getExperimentsConfig();
    const definition = experiments.experiments.double_xp_nudge_lesson_complete;
    const trialDefinition = experiments.experiments.pro_trial_checkout;
    const monthlyPriceDefinition = experiments.experiments.pro_monthly_price_jp;
    expect(definition.enabled).toBe(true);
    expect(definition.rollout_percentage).toBe(5);
    expect(definition.rollout_percentage).toBeGreaterThanOrEqual(0);
    expect(definition.rollout_percentage).toBeLessThanOrEqual(100);
    expect(definition.variants[0]?.payload).toEqual({ copyStyle: "default" });
    expect(definition.variants[1]?.payload).toEqual({ copyStyle: "default" });
    expect(trialDefinition.enabled).toBe(false);
    expect(trialDefinition.rollout_percentage).toBe(5);
    expect(trialDefinition.variants[0]?.payload).toEqual({ trialDays: 0 });
    expect(trialDefinition.variants[1]?.payload).toEqual({ trialDays: 7 });
    expect(monthlyPriceDefinition.enabled).toBe(false);
    expect(monthlyPriceDefinition.rollout_percentage).toBe(5);
    expect(monthlyPriceDefinition.variants[0]?.payload).toEqual({ priceVersion: "control" });
    expect(monthlyPriceDefinition.variants[1]?.payload).toEqual({ priceVersion: "variant_a" });
  });
});
