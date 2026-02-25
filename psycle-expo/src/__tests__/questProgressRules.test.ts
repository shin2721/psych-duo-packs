import {
  getLessonCompletionQuestIncrements,
  getStreakQuestIncrement,
  shouldAwardFeltBetterXp,
} from "../../lib/questProgressRules";

describe("questProgressRules", () => {
  test("nextStreak=4 では streak5_milestone を進めない", () => {
    expect(getStreakQuestIncrement(4)).toBeNull();
  });

  test("nextStreak=5 では streak5_milestone を進める", () => {
    expect(getStreakQuestIncrement(5)).toEqual({
      metric: "streak5_milestone",
      step: 1,
    });
  });

  test("nextStreak=10 では streak5_milestone を進める", () => {
    expect(getStreakQuestIncrement(10)).toEqual({
      metric: "streak5_milestone",
      step: 1,
    });
  });

  test("lesson完了クエスト進捗は lesson_complete メトリクスのみ", () => {
    expect(getLessonCompletionQuestIncrements()).toEqual([
      { metric: "lesson_complete", step: 1 },
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
