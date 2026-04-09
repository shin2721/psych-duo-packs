jest.mock("../../lib/app-state/progressionRemote", () => ({
  insertUserBadge: jest.fn(),
  loadRemoteBadgeIds: jest.fn(),
}));

import { awardEventCompletionBadge, checkAndUnlockBadges, hydrateRemoteBadgeIds } from "../../lib/app-state/progression/progressionBadges";
import { insertUserBadge, loadRemoteBadgeIds } from "../../lib/app-state/progressionRemote";

const mockedInsertUserBadge = insertUserBadge as jest.MockedFunction<typeof insertUserBadge>;
const mockedLoadRemoteBadgeIds = loadRemoteBadgeIds as jest.MockedFunction<typeof loadRemoteBadgeIds>;

describe("progressionBadges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("hydrateRemoteBadgeIds proxies remote badge load", async () => {
    mockedLoadRemoteBadgeIds.mockResolvedValue(["first_lesson", "streak_3"]);

    await expect(hydrateRemoteBadgeIds("user-1")).resolves.toEqual(["first_lesson", "streak_3"]);
    expect(mockedLoadRemoteBadgeIds).toHaveBeenCalledWith("user-1");
  });

  test("checkAndUnlockBadges unlocks only eligible missing badges", async () => {
    mockedInsertUserBadge.mockResolvedValue("inserted");

    const newlyUnlocked = await checkAndUnlockBadges({
      userId: "user-1",
      stats: {
        completedLessons: 1,
        streak: 3,
        xp: 1000,
        mistakesCleared: 0,
        friendCount: 0,
        leaderboardRank: 0,
      },
      unlockedBadges: new Set(["first_lesson"]),
    });

    expect(newlyUnlocked).toEqual(["streak_3", "xp_1000"]);
    expect(mockedInsertUserBadge).toHaveBeenCalledTimes(2);
    expect(mockedInsertUserBadge).toHaveBeenNthCalledWith(1, "user-1", "streak_3");
    expect(mockedInsertUserBadge).toHaveBeenNthCalledWith(2, "user-1", "xp_1000");
  });

  test("awardEventCompletionBadge skips guest and proxies auth insert", async () => {
    mockedInsertUserBadge.mockResolvedValue("duplicate");

    await expect(awardEventCompletionBadge(null, "event_spring_2026")).resolves.toBe("skipped");
    await expect(awardEventCompletionBadge("user-1", "event_spring_2026")).resolves.toBe("duplicate");
    expect(mockedInsertUserBadge).toHaveBeenCalledTimes(1);
    expect(mockedInsertUserBadge).toHaveBeenCalledWith("user-1", "event_spring_2026");
  });
});
