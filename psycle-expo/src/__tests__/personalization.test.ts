import {
  deriveUserSegment,
  getAdjustedComebackReward,
  getAdjustedQuestNeed,
  normalizePersonalizationSegment,
  shouldReassignSegment,
} from "../../lib/personalization";
import type { PersonalizationConfig } from "../../lib/gamificationConfig";

const TEST_CONFIG: PersonalizationConfig = {
  enabled: true,
  segment_reassign_cooldown_hours: 24,
  quest_need_adjustment: {
    new: -1,
    active: 0,
    at_risk: -1,
    power: 1,
  },
  comeback_reward_adjustment: {
    new: 0,
    active: 0,
    at_risk: 1,
    power: 0,
  },
};

describe("personalization", () => {
  test("deriveUserSegment classifies at_risk first", () => {
    expect(
      deriveUserSegment({
        lessonsCompleted7d: 30,
        daysSinceStudy: 4,
        currentStreak: 30,
      })
    ).toBe("at_risk");
  });

  test("deriveUserSegment classifies power users", () => {
    expect(
      deriveUserSegment({
        lessonsCompleted7d: 21,
        daysSinceStudy: 0,
        currentStreak: 5,
      })
    ).toBe("power");
  });

  test("deriveUserSegment classifies new users", () => {
    expect(
      deriveUserSegment({
        lessonsCompleted7d: 1,
        daysSinceStudy: 0,
        currentStreak: 1,
      })
    ).toBe("new");
  });

  test("deriveUserSegment classifies active as fallback", () => {
    expect(
      deriveUserSegment({
        lessonsCompleted7d: 7,
        daysSinceStudy: 1,
        currentStreak: 4,
      })
    ).toBe("active");
  });

  test("adjusted quest need clamps to >= 1", () => {
    expect(getAdjustedQuestNeed(1, "new", TEST_CONFIG)).toBe(1);
    expect(getAdjustedQuestNeed(3, "power", TEST_CONFIG)).toBe(4);
  });

  test("adjusted comeback reward applies segment delta", () => {
    expect(getAdjustedComebackReward(2, "at_risk", TEST_CONFIG)).toBe(3);
    expect(getAdjustedComebackReward(2, "active", TEST_CONFIG)).toBe(2);
  });

  test("normalizePersonalizationSegment falls back to new", () => {
    expect(normalizePersonalizationSegment("power")).toBe("power");
    expect(normalizePersonalizationSegment("unknown")).toBe("new");
  });

  test("shouldReassignSegment respects cooldown", () => {
    const nowMs = 2_000_000_000;
    expect(
      shouldReassignSegment({
        lastAssignedAtMs: null,
        nowMs,
        cooldownHours: 24,
      })
    ).toBe(true);

    expect(
      shouldReassignSegment({
        lastAssignedAtMs: nowMs - 1 * 60 * 60 * 1000,
        nowMs,
        cooldownHours: 24,
      })
    ).toBe(false);

    expect(
      shouldReassignSegment({
        lastAssignedAtMs: nowMs - 25 * 60 * 60 * 1000,
        nowMs,
        cooldownHours: 24,
      })
    ).toBe(true);
  });
});
