import {
  consumeDailyNudgeQuota,
  getDailyNudgeRemaining,
  shouldShowDoubleXpNudge,
} from "../../lib/doubleXpNudge";

describe("doubleXpNudge", () => {
  const baseInput = {
    enabled: true,
    isComplete: true,
    isDoubleXpActive: false,
    gems: 100,
    minGems: 20,
    requireInactiveBoost: true,
    dailyShowLimit: 1,
    state: { lastShownDate: null, shownCountToday: 0 },
    today: "2026-03-01",
  };

  test("表示条件を満たすと true", () => {
    expect(shouldShowDoubleXpNudge(baseInput)).toBe(true);
  });

  test("Boost有効中は false", () => {
    expect(
      shouldShowDoubleXpNudge({
        ...baseInput,
        isDoubleXpActive: true,
      })
    ).toBe(false);
  });

  test("Gems不足は false", () => {
    expect(
      shouldShowDoubleXpNudge({
        ...baseInput,
        gems: 19,
      })
    ).toBe(false);
  });

  test("同日2回目は false", () => {
    const consumed = consumeDailyNudgeQuota(baseInput.state, baseInput.today);
    expect(getDailyNudgeRemaining(consumed, 1, baseInput.today)).toBe(0);
    expect(
      shouldShowDoubleXpNudge({
        ...baseInput,
        state: consumed,
      })
    ).toBe(false);
  });

  test("日付跨ぎで再び true", () => {
    const consumed = consumeDailyNudgeQuota(baseInput.state, baseInput.today);
    expect(
      shouldShowDoubleXpNudge({
        ...baseInput,
        state: consumed,
        today: "2026-03-02",
      })
    ).toBe(true);
  });
});

