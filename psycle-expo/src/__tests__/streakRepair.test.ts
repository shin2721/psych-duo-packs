import {
  createStreakRepairOffer,
  purchaseStreakRepairOffer,
  STREAK_REPAIR_COST_GEMS,
  STREAK_REPAIR_WINDOW_MS,
} from "../../lib/streakRepair";

describe("streakRepair", () => {
  test("creates offer when previous streak is greater than 1", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(12, nowMs);
    expect(offer).not.toBeNull();
    expect(offer).toEqual({
      previousStreak: 12,
      costGems: STREAK_REPAIR_COST_GEMS,
      expiresAtMs: nowMs + STREAK_REPAIR_WINDOW_MS,
      active: true,
    });
  });

  test("supports custom cost and expiry window options", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(12, nowMs, {
      costGems: 35,
      windowMs: 24 * 60 * 60 * 1000,
    });
    expect(offer).toEqual({
      previousStreak: 12,
      costGems: 35,
      expiresAtMs: nowMs + 24 * 60 * 60 * 1000,
      active: true,
    });
  });

  test("purchases successfully within 48h when gems are enough", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(9, nowMs);
    const result = purchaseStreakRepairOffer({
      offer,
      gems: 120,
      currentStreak: 1,
      nowMs: nowMs + 6 * 60 * 60 * 1000,
    });

    expect(result.success).toBe(true);
    expect(result.nextGems).toBe(70);
    expect(result.restoredStreak).toBe(9);
    expect(result.nextOffer?.active).toBe(false);
  });

  test("fails when gems are insufficient", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(8, nowMs);
    const result = purchaseStreakRepairOffer({
      offer,
      gems: 49,
      currentStreak: 1,
      nowMs: nowMs + 2 * 60 * 60 * 1000,
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_gems");
    expect(result.nextGems).toBe(49);
    expect(result.restoredStreak).toBe(1);
  });

  test("fails after 48h expiration", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(7, nowMs);
    const result = purchaseStreakRepairOffer({
      offer,
      gems: 500,
      currentStreak: 1,
      nowMs: nowMs + STREAK_REPAIR_WINDOW_MS + 1,
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("expired");
  });

  test("cannot purchase the same offer twice", () => {
    const nowMs = Date.UTC(2026, 1, 22, 9, 0, 0);
    const offer = createStreakRepairOffer(11, nowMs);
    const first = purchaseStreakRepairOffer({
      offer,
      gems: 100,
      currentStreak: 1,
      nowMs: nowMs + 1000,
    });
    expect(first.success).toBe(true);

    const second = purchaseStreakRepairOffer({
      offer: first.nextOffer,
      gems: first.nextGems,
      currentStreak: first.restoredStreak,
      nowMs: nowMs + 2000,
    });
    expect(second.success).toBe(false);
    expect(second.reason).toBe("no_offer");
  });
});
