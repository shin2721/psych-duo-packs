import { recoverEnergyState } from "../../lib/app-state/economy/useEconomyEnergyRuntime";

describe("economyEnergyRuntime", () => {
  test("free plan recovers energy over time", () => {
    const result = recoverEnergyState({
      effectiveFreeMaxEnergy: 3,
      energy: 1,
      energyRefillMs: 60_000,
      lastEnergyUpdateTime: 0,
      nowMs: 120_000,
    });

    expect(result).toEqual({
      nextEnergy: 3,
      nextLastEnergyUpdateTime: null,
    });
  });

  test("cap reached clears timer anchor", () => {
    const result = recoverEnergyState({
      effectiveFreeMaxEnergy: 3,
      energy: 3,
      energyRefillMs: 60_000,
      lastEnergyUpdateTime: 1_000,
      nowMs: 61_000,
    });

    expect(result).toEqual({
      nextEnergy: 3,
      nextLastEnergyUpdateTime: null,
    });
  });

  test("no elapsed refill returns null", () => {
    const result = recoverEnergyState({
      effectiveFreeMaxEnergy: 3,
      energy: 1,
      energyRefillMs: 60_000,
      lastEnergyUpdateTime: 10_000,
      nowMs: 50_000,
    });

    expect(result).toBeNull();
  });
});
