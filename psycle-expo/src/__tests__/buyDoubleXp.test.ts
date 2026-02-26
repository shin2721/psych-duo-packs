import { evaluateDoubleXpPurchase } from "../../lib/doubleXpPurchase";

describe("buyDoubleXP", () => {
  test("Gems十分 + inactive で成功", () => {
    const result = evaluateDoubleXpPurchase({
      gems: 40,
      costGems: 20,
      isActive: false,
      nowMs: 1_700_000_000_000,
      durationMs: 15 * 60 * 1000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.gemsAfter).toBe(20);
      expect(result.activeUntilMs).toBe(1_700_000_000_000 + 15 * 60 * 1000);
    }
  });

  test("Gems不足で insufficient_gems", () => {
    const result = evaluateDoubleXpPurchase({
      gems: 19,
      costGems: 20,
      isActive: false,
      nowMs: 1_700_000_000_000,
      durationMs: 15 * 60 * 1000,
    });
    expect(result).toEqual({ success: false, reason: "insufficient_gems" });
  });

  test("既に有効で already_active", () => {
    const result = evaluateDoubleXpPurchase({
      gems: 99,
      costGems: 20,
      isActive: true,
      nowMs: 1_700_000_000_000,
      durationMs: 15 * 60 * 1000,
    });
    expect(result).toEqual({ success: false, reason: "already_active" });
  });
});

