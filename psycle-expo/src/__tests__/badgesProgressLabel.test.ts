import { BADGES } from "../../lib/badges";

describe("badges progress labels", () => {
  test("level_5 is unlocked by completed lessons and uses lessons wording", () => {
    const badge = BADGES.find((item) => item.id === "level_5");
    expect(badge).toBeDefined();
    expect(badge?.unlockCondition({
      completedLessons: 5,
      streak: 0,
      xp: 0,
      mistakesCleared: 0,
      friendCount: 0,
      leaderboardRank: 0,
    })).toBe(true);
    expect(badge?.name).toContain("レッスン");
    expect(badge?.description).toContain("レッスン");
  });

  test("level_10 is unlocked by completed lessons and uses lessons wording", () => {
    const badge = BADGES.find((item) => item.id === "level_10");
    expect(badge).toBeDefined();
    expect(badge?.unlockCondition({
      completedLessons: 10,
      streak: 0,
      xp: 0,
      mistakesCleared: 0,
      friendCount: 0,
      leaderboardRank: 0,
    })).toBe(true);
    expect(badge?.name).toContain("レッスン");
    expect(badge?.description).toContain("レッスン");
  });

  test("level_5 and level_10 labels no longer describe level reach", () => {
    const level5 = BADGES.find((item) => item.id === "level_5");
    const level10 = BADGES.find((item) => item.id === "level_10");
    expect(level5?.name).not.toContain("レベル");
    expect(level5?.description).not.toContain("レベル");
    expect(level10?.name).not.toContain("レベル");
    expect(level10?.description).not.toContain("レベル");
  });
});
