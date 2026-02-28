import {
  getComebackRewardConfig,
  getDailyGoalConfig,
  getExperimentsConfig,
  getFriendChallengeConfig,
  getPersonalizationConfig,
  getQuestRerollConfig,
  getQuestRewardsConfig,
} from "../../lib/gamificationConfig";

describe("gamificationConfig", () => {
  test("comeback reward config keeps current defaults", () => {
    const config = getComebackRewardConfig();
    expect(config.threshold_days).toBe(7);
    expect(config.reward_energy).toBe(2);
    expect(config.reward_gems).toBe(10);
  });

  test("daily goal and friend challenge configs keep current defaults", () => {
    const dailyGoal = getDailyGoalConfig();
    const friendChallenge = getFriendChallengeConfig();

    expect(dailyGoal.default_xp).toBe(10);
    expect(dailyGoal.reward_gems).toBe(5);
    expect(friendChallenge.reward_gems).toBe(15);
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

  test("experiments and personalization stay disabled by default for A/A gate", () => {
    expect(getExperimentsConfig().enabled).toBe(false);
    expect(getPersonalizationConfig().enabled).toBe(false);
  });
});
