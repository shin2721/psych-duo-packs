import {
  getClaimableStreakMilestone,
  normalizeClaimedMilestones,
} from "../../lib/streakMilestones";
import type { StreakMilestonesConfig } from "../../lib/gamificationConfig";

const config: StreakMilestonesConfig = {
  lifetime_once: true,
  rewards: [
    { day: 3, gems: 5 },
    { day: 7, gems: 10 },
    { day: 14, gems: 15 },
    { day: 30, gems: 20 },
    { day: 60, gems: 30 },
    { day: 100, gems: 50 },
    { day: 365, gems: 100 },
  ],
};

describe("streak milestones", () => {
  test.each([
    [3, 5],
    [7, 10],
    [14, 15],
    [30, 20],
    [60, 30],
    [100, 50],
    [365, 100],
  ])("newStreak=%i is claimable", (newStreak, gems) => {
    const claimable = getClaimableStreakMilestone({
      newStreak,
      claimedMilestones: [],
      config,
    });
    expect(claimable).toEqual({ day: newStreak, gems });
  });

  test.each([2, 4, 8, 13, 99])("newStreak=%i is not claimable", (newStreak) => {
    const claimable = getClaimableStreakMilestone({
      newStreak,
      claimedMilestones: [],
      config,
    });
    expect(claimable).toBeNull();
  });

  test("already claimed milestone is not claimable when lifetime_once=true", () => {
    const claimable = getClaimableStreakMilestone({
      newStreak: 7,
      claimedMilestones: [3, 7],
      config,
    });
    expect(claimable).toBeNull();
  });

  test("normalizeClaimedMilestones removes invalid values and duplicates", () => {
    const normalized = normalizeClaimedMilestones([3, 7, 7, 0, -2, "x", 30.9, 365, null] as unknown);
    expect(normalized).toEqual([3, 7, 30, 365]);
  });
});
