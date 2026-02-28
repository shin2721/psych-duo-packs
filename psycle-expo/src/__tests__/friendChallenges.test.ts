jest.mock("../../lib/league", () => ({
  getCurrentWeekId: jest.fn(async () => "2026-W20"),
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  buildWeeklyFriendChallenge,
  evaluateFriendChallengeProgress,
} from "../../lib/friendChallenges";

describe("friendChallenges", () => {
  test("progress is completed when my xp is greater than opponent and positive", () => {
    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: 120,
      opponentWeeklyXp: 100,
    });

    expect(progress.completed).toBe(true);
    expect(progress.xpGap).toBe(20);
  });

  test("progress is not completed when both users have zero xp", () => {
    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: 0,
      opponentWeeklyXp: 0,
    });

    expect(progress.completed).toBe(false);
  });

  test("progress is completed when my xp is positive and not less than opponent", () => {
    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: 1,
      opponentWeeklyXp: 0,
    });

    expect(progress.completed).toBe(true);
  });

  test("progress normalizes negative values to zero", () => {
    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: -10,
      opponentWeeklyXp: 30,
    });

    expect(progress.myWeeklyXp).toBe(0);
    expect(progress.opponentWeeklyXp).toBe(30);
    expect(progress.completed).toBe(false);
  });

  test("buildWeeklyFriendChallenge returns null when userId is empty", async () => {
    await expect(buildWeeklyFriendChallenge("")).resolves.toBeNull();
  });
});
