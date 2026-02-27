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
  test("progress is completed when my xp is greater than opponent", () => {
    const progress = evaluateFriendChallengeProgress({
      myWeeklyXp: 120,
      opponentWeeklyXp: 100,
    });

    expect(progress.completed).toBe(true);
    expect(progress.xpGap).toBe(20);
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
