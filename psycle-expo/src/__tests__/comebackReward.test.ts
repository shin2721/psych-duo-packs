import {
  canClaimComebackReward,
  createComebackRewardOffer,
  isComebackEligible,
  normalizeComebackRewardOffer,
} from "../../lib/comebackReward";

describe("comeback reward", () => {
  test("daysSinceStudy=6 is not eligible", () => {
    expect(isComebackEligible(6, 7)).toBe(false);
  });

  test("daysSinceStudy=7 creates an active offer", () => {
    const now = new Date(2026, 1, 25, 10, 0, 0, 0);
    const offer = createComebackRewardOffer({
      daysSinceStudy: 7,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now,
    });

    expect(offer).not.toBeNull();
    expect(offer?.active).toBe(true);
    expect(offer?.rewardEnergy).toBe(2);
    expect(offer?.rewardGems).toBe(10);
  });

  test("offer is claimable on trigger day and expires after day end", () => {
    const now = new Date(2026, 1, 25, 10, 0, 0, 0);
    const offer = createComebackRewardOffer({
      daysSinceStudy: 8,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now,
    });
    expect(offer).not.toBeNull();
    if (!offer) return;

    const claimable = canClaimComebackReward({
      offer,
      isSubscriptionActive: false,
      todayDateKey: offer.triggerDate,
      nowMs: offer.expiresAtMs - 1,
    });
    expect(claimable).toEqual({ claimable: true });

    const expired = canClaimComebackReward({
      offer,
      isSubscriptionActive: false,
      todayDateKey: offer.triggerDate,
      nowMs: offer.expiresAtMs + 1,
    });
    expect(expired).toEqual({ claimable: false, reason: "expired" });
  });

  test("second claim on same day is blocked as already_claimed", () => {
    const now = new Date(2026, 1, 25, 10, 0, 0, 0);
    const offer = createComebackRewardOffer({
      daysSinceStudy: 9,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now,
    });
    expect(offer).not.toBeNull();
    if (!offer) return;

    const consumedOffer = { ...offer, active: false };
    const secondClaim = canClaimComebackReward({
      offer: consumedOffer,
      isSubscriptionActive: false,
      todayDateKey: offer.triggerDate,
      nowMs: offer.expiresAtMs - 1,
    });
    expect(secondClaim).toEqual({ claimable: false, reason: "already_claimed" });
  });

  test("subscription users are excluded", () => {
    const now = new Date(2026, 1, 25, 10, 0, 0, 0);
    const offer = createComebackRewardOffer({
      daysSinceStudy: 7,
      thresholdDays: 7,
      rewardEnergy: 2,
      rewardGems: 10,
      now,
    });
    expect(offer).not.toBeNull();
    if (!offer) return;

    const result = canClaimComebackReward({
      offer,
      isSubscriptionActive: true,
      todayDateKey: offer.triggerDate,
      nowMs: offer.expiresAtMs - 1,
    });
    expect(result).toEqual({ claimable: false, reason: "subscription_excluded" });
  });

  test("legacy offer without rewardGems normalizes safely", () => {
    const normalized = normalizeComebackRewardOffer({
      active: true,
      triggerDate: "2026-02-25",
      daysSinceStudy: 7,
      rewardEnergy: 2,
      expiresAtMs: Date.now() + 1000,
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.rewardGems).toBe(0);
  });
});
