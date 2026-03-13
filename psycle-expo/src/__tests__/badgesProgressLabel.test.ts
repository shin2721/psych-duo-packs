import { BADGES } from "../../lib/badges";
import i18n from "../../lib/i18n";

describe("badges progress labels", () => {
  const originalLocale = i18n.locale;

  afterEach(() => {
    i18n.locale = originalLocale;
  });

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

  test("streak_14 is unlocked by 14-day streak", () => {
    const badge = BADGES.find((item) => item.id === "streak_14");
    expect(badge).toBeDefined();

    const before = badge?.unlockCondition({
      completedLessons: 0,
      streak: 13,
      xp: 0,
      mistakesCleared: 0,
      friendCount: 0,
      leaderboardRank: 0,
    });
    expect(before).toBe(false);

    const reached = badge?.unlockCondition({
      completedLessons: 0,
      streak: 14,
      xp: 0,
      mistakesCleared: 0,
      friendCount: 0,
      leaderboardRank: 0,
    });
    expect(reached).toBe(true);
  });

  test("badge names follow the active locale", () => {
    const badge = BADGES.find((item) => item.id === "first_lesson");
    expect(badge).toBeDefined();

    i18n.locale = "ja";
    expect(badge?.name).toBe("初めの一歩");

    i18n.locale = "en";
    expect(badge?.name).toBe("First Step");
  });
});
