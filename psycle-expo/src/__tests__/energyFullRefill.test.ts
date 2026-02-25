import { evaluateEnergyFullRefillPurchase } from "../../lib/energyFullRefill";

describe("energyFullRefill", () => {
  test("gems十分 + 日次枠あり + not full で成功", () => {
    const result = evaluateEnergyFullRefillPurchase({
      enabled: true,
      isSubscriptionActive: false,
      energy: 1,
      maxEnergy: 3,
      dailyCount: 0,
      dailyLimit: 1,
      gems: 100,
      costGems: 30,
    });
    expect(result).toEqual({ success: true });
  });

  test("gems不足で失敗", () => {
    const result = evaluateEnergyFullRefillPurchase({
      enabled: true,
      isSubscriptionActive: false,
      energy: 1,
      maxEnergy: 3,
      dailyCount: 0,
      dailyLimit: 1,
      gems: 29,
      costGems: 30,
    });
    expect(result).toEqual({ success: false, reason: "insufficient_gems" });
  });

  test("日次上限超過で失敗", () => {
    const result = evaluateEnergyFullRefillPurchase({
      enabled: true,
      isSubscriptionActive: false,
      energy: 1,
      maxEnergy: 3,
      dailyCount: 1,
      dailyLimit: 1,
      gems: 100,
      costGems: 30,
    });
    expect(result).toEqual({ success: false, reason: "limit_reached" });
  });

  test("already fullで失敗", () => {
    const result = evaluateEnergyFullRefillPurchase({
      enabled: true,
      isSubscriptionActive: false,
      energy: 3,
      maxEnergy: 3,
      dailyCount: 0,
      dailyLimit: 1,
      gems: 100,
      costGems: 30,
    });
    expect(result).toEqual({ success: false, reason: "already_full" });
  });

  test("subscription中で失敗", () => {
    const result = evaluateEnergyFullRefillPurchase({
      enabled: true,
      isSubscriptionActive: true,
      energy: 100,
      maxEnergy: 999,
      dailyCount: 0,
      dailyLimit: 1,
      gems: 100,
      costGems: 30,
    });
    expect(result).toEqual({ success: false, reason: "subscription_unnecessary" });
  });
});
