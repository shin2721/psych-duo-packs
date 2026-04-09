jest.mock("../../lib/analytics", () => ({
  __esModule: true,
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/streaks", () => ({
  __esModule: true,
  addFreezes: jest.fn().mockResolvedValue(undefined),
  useFreeze: jest.fn().mockResolvedValue(undefined),
}));

import { Analytics } from "../../lib/analytics";
import { addFreezes, useFreeze as useFreezeStreak } from "../../lib/streaks";
import {
  addEnergyAction,
  buyDoubleXpAction,
  buyEnergyFullRefillAction,
  buyFreezeAction,
  consumeEnergyAction,
  tryTriggerStreakEnergyBonusAction,
  useFreezeAction,
} from "../../lib/app-state/economy/economyActions";

const mockTrack = (Analytics as unknown as { track: jest.Mock }).track;
const mockAddFreezes = addFreezes as jest.MockedFunction<typeof addFreezes>;
const mockUseFreezeStreak = useFreezeStreak as jest.MockedFunction<typeof useFreezeStreak>;

describe("economyActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buyFreezeAction preserves gems/freeze/addFreezes contract", () => {
    let gems = 20;
    let freezeCount = 2;

    const result = buyFreezeAction({
      freezeCount,
      gems,
      setFreezeCount: (value) => {
        freezeCount = typeof value === "function" ? value(freezeCount) : value;
      },
      setGems: (value) => {
        gems = typeof value === "function" ? value(gems) : value;
      },
    });

    expect(result).toBe(true);
    expect(gems).toBe(10);
    expect(freezeCount).toBe(3);
    expect(mockAddFreezes).toHaveBeenCalledWith(1);
  });

  test("buyEnergyFullRefillAction preserves daily count/date/gems/analytics", () => {
    let gems = 50;
    let energy = 1;
    let refillDate = "2026-04-06";
    let refillCount = 0;
    let lastEnergyUpdateTime: number | null = 1000;

    const result = buyEnergyFullRefillAction({
      config: { enabled: true, daily_limit: 2, cost_gems: 15 },
      dailyEnergyRefillCount: refillCount,
      dailyEnergyRefillDate: refillDate,
      energy,
      gems,
      isSubscriptionActive: false,
      maxEnergy: 3,
      setDailyEnergyRefillCount: (value) => {
        refillCount = typeof value === "function" ? value(refillCount) : value;
      },
      setDailyEnergyRefillDate: (value) => {
        refillDate = typeof value === "function" ? value(refillDate) : value;
      },
      setEnergy: (value) => {
        energy = typeof value === "function" ? value(energy) : value;
      },
      setGems: (value) => {
        gems = typeof value === "function" ? value(gems) : value;
      },
      setLastEnergyUpdateTime: (value) => {
        lastEnergyUpdateTime =
          typeof value === "function" ? value(lastEnergyUpdateTime) : value;
      },
    });

    expect(result).toEqual({ success: true });
    expect(gems).toBe(35);
    expect(energy).toBe(3);
    expect(refillCount).toBe(1);
    expect(refillDate).toMatch(/^20/);
    expect(lastEnergyUpdateTime).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith(
      "energy_full_refill_purchased",
      expect.objectContaining({
        costGems: 15,
        gemsAfter: 35,
        energyAfter: 3,
      })
    );
  });

  test("buyDoubleXpAction preserves gems/activeUntil/analytics", () => {
    let gems = 40;
    let activeUntil: number | null = null;

    const result = buyDoubleXpAction({
      costGems: 20,
      durationMs: 15 * 60 * 1000,
      gems,
      isDoubleXpActive: false,
      setDoubleXpEndTime: (value) => {
        activeUntil = typeof value === "function" ? value(activeUntil) : value;
      },
      setGems: (value) => {
        gems = typeof value === "function" ? value(gems) : value;
      },
      source: "shop_item",
    });

    expect(result).toEqual({ success: true });
    expect(gems).toBe(20);
    expect(activeUntil).toEqual(expect.any(Number));
    expect(mockTrack).toHaveBeenCalledWith(
      "double_xp_purchased",
      expect.objectContaining({
        source: "shop_item",
        gemsAfter: 20,
      })
    );
  });

  test("consumeEnergyAction and addEnergyAction preserve timer anchor behavior", () => {
    let energy = 3;
    let lastEnergyUpdateTime: number | null = null;

    const consumed = consumeEnergyAction({
      amount: 1,
      currentEnergy: energy,
      effectiveFreeMaxEnergy: 3,
      isSubscriptionActive: false,
      lastEnergyUpdateTime,
      setEnergy: (value) => {
        energy = typeof value === "function" ? value(energy) : value;
      },
      setLastEnergyUpdateTime: (value) => {
        lastEnergyUpdateTime =
          typeof value === "function" ? value(lastEnergyUpdateTime) : value;
      },
    });

    expect(consumed).toBe(true);
    expect(energy).toBe(2);
    expect(lastEnergyUpdateTime).toEqual(expect.any(Number));

    addEnergyAction({
      amount: 1,
      currentEnergy: energy,
      effectiveFreeMaxEnergy: 3,
      isSubscriptionActive: false,
      lastEnergyUpdateTime,
      setEnergy: (value) => {
        energy = typeof value === "function" ? value(energy) : value;
      },
      setLastEnergyUpdateTime: (value) => {
        lastEnergyUpdateTime =
          typeof value === "function" ? value(lastEnergyUpdateTime) : value;
      },
    });

    expect(energy).toBe(3);
    expect(lastEnergyUpdateTime).toBeNull();
  });

  test("tryTriggerStreakEnergyBonusAction preserves cap/chance/analytics", () => {
    let energy = 1;
    let bonusDate = "2026-04-07";
    let bonusCount = 0;

    const result = tryTriggerStreakEnergyBonusAction({
      correctStreak: 5,
      currentEnergy: energy,
      dailyEnergyBonusCount: bonusCount,
      dailyEnergyBonusDate: bonusDate,
      dailyEnergyBonusDailyCap: 1,
      energyStreakBonusChance: 0.1,
      energyStreakBonusEvery: 5,
      getCurrentFreeMaxEnergy: () => 3,
      isSubscriptionActive: false,
      randomFn: () => 0.01,
      setDailyEnergyBonusCount: (value) => {
        bonusCount = typeof value === "function" ? value(bonusCount) : value;
      },
      setDailyEnergyBonusDate: (value) => {
        bonusDate = typeof value === "function" ? value(bonusDate) : value;
      },
      addEnergy: (amount) => {
        energy += amount;
      },
    });

    expect(result).toBe(true);
    expect(energy).toBe(2);
    expect(bonusCount).toBe(1);
    expect(mockTrack).toHaveBeenCalledWith(
      "energy_bonus_hit",
      expect.objectContaining({
        correctStreak: 5,
        energyAfter: 2,
      })
    );
  });

  test("useFreezeAction tracks and triggers streak side effect", () => {
    let freezeCount = 2;

    const result = useFreezeAction({
      freezeCount,
      setFreezeCount: (value) => {
        freezeCount = typeof value === "function" ? value(freezeCount) : value;
      },
    });

    expect(result).toBe(true);
    expect(freezeCount).toBe(1);
    expect(mockUseFreezeStreak).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("freeze_used", {
      freezesRemaining: 1,
      source: "streak_protection",
    });
  });
});
