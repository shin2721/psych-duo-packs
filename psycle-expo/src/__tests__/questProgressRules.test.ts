import {
  getLessonCompletionQuestIncrements,
  getStreakQuestIncrement,
  shouldAwardFeltBetterXp,
} from "../../lib/questProgressRules";

describe("questProgressRules", () => {
  test("nextStreak=4 では q_daily_5streak を進めない", () => {
    expect(getStreakQuestIncrement(4)).toBeNull();
  });

  test("nextStreak=5 では q_daily_5streak を進める", () => {
    expect(getStreakQuestIncrement(5)).toEqual({
      id: "q_daily_5streak",
      step: 1,
    });
  });

  test("nextStreak=10 では q_daily_5streak を進める", () => {
    expect(getStreakQuestIncrement(10)).toEqual({
      id: "q_daily_5streak",
      step: 1,
    });
  });

  test("lesson完了クエスト進捗はdaily/weekly/monthlyの3件", () => {
    expect(getLessonCompletionQuestIncrements()).toEqual([
      { id: "q_daily_3lessons", step: 1 },
      { id: "q_weekly_10lessons", step: 1 },
      { id: "q_monthly_50pts", step: 1 },
    ]);
  });

  test("felt_better XP付与条件は value > 0 のみ", () => {
    expect(shouldAwardFeltBetterXp(-2)).toBe(false);
    expect(shouldAwardFeltBetterXp(-1)).toBe(false);
    expect(shouldAwardFeltBetterXp(0)).toBe(false);
    expect(shouldAwardFeltBetterXp(1)).toBe(true);
    expect(shouldAwardFeltBetterXp(2)).toBe(true);
  });
});
