import { getPersonalizationConfig, getStreakMilestonesConfig } from "../../lib/gamificationConfig";
import { createComebackRewardOffer } from "../../lib/comebackReward";
import { createStreakRepairOffer } from "../../lib/streakRepair";
import {
  claimComebackRewardAction,
  computeInlineStreakUpdate,
  computeStreakForTodayUpdate,
  purchaseStreakRepairAction,
} from "../../lib/app-state/progression/progressionStreak";

describe("progressionStreak", () => {
  test("computeInlineStreakUpdate continues streak across yesterday", () => {
    const result = computeInlineStreakUpdate({
      lastStudyDate: "2026-04-06",
      streak: 3,
      freezeCount: 0,
      todayDate: "2026-04-07",
      yesterdayDate: "2026-04-06",
    });

    expect(result).toEqual({
      nextStreak: 4,
      nextLastStudyDate: "2026-04-07",
      nextFreezeCount: null,
    });
  });

  test("computeStreakForTodayUpdate creates repair/comeback offers after lapse", () => {
    const result = computeStreakForTodayUpdate({
      lastActivityDate: "2026-03-25",
      streak: 6,
      freezeCount: 0,
      isSubscriptionActive: false,
      personalizationSegment: "power",
      personalizationConfig: getPersonalizationConfig(),
      comebackRewardThresholdDays: 7,
      comebackRewardEnergy: 2,
      comebackRewardGems: 10,
      claimedMilestones: [],
      streakMilestonesConfig: getStreakMilestonesConfig(),
      streakRepairCostGems: 50,
      streakRepairWindowMs: 48 * 60 * 60 * 1000,
      currentXp: 100,
      todayDate: "2026-04-07",
      yesterdayDate: "2026-04-06",
      nowMs: new Date("2026-04-07T10:00:00+09:00").getTime(),
    });

    expect(result.skipped).toBe(false);
    if (result.skipped) return;
    expect(result.nextStreak).toBe(1);
    expect(result.streakRepairOffered).not.toBeNull();
    expect(result.comebackRewardOffered).not.toBeNull();
    expect(result.daysSinceStudy).toBeGreaterThanOrEqual(7);
  });

  test("purchaseStreakRepairAction restores streak on success", () => {
    const offer = createStreakRepairOffer(12, new Date("2026-04-07T10:00:00+09:00").getTime(), {
      costGems: 50,
      windowMs: 1000,
    });

    const result = purchaseStreakRepairAction({
      offer,
      gems: 80,
      currentStreak: 1,
      nowMs: new Date("2026-04-07T10:00:00+09:00").getTime(),
    });

    expect(result).toMatchObject({
      success: true,
      nextGems: 30,
      restoredStreak: 12,
    });
  });

  test("claimComebackRewardAction awards once and deactivates offer", () => {
    const offer = createComebackRewardOffer({
      daysSinceStudy: 8,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now: new Date("2026-04-07T09:00:00+09:00"),
    });

    const result = claimComebackRewardAction({
      offer,
      isSubscriptionActive: false,
      todayDateKey: "2026-04-07",
    });

    expect(result).toMatchObject({
      awarded: true,
      rewardEnergy: 2,
      rewardGems: 10,
    });
    if (!result.awarded) return;
    expect(result.nextOffer.active).toBe(false);
  });
});
