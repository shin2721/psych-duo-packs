jest.mock("../../lib/streaks", () => ({
  __esModule: true,
  getStreakData: jest.fn(),
}));

jest.mock("../../lib/analytics", () => ({
  __esModule: true,
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/app-state/economyPersistence", () => ({
  __esModule: true,
  loadEconomyPersistenceSnapshot: jest.fn(),
  initializeEconomyFirstLaunchState: jest.fn(),
}));

import { getStreakData } from "../../lib/streaks";
import {
  buildSignedOutEconomyReset,
  hydrateEconomyState,
} from "../../lib/app-state/economy/useEconomyHydrationEffect";
import {
  initializeEconomyFirstLaunchState,
  loadEconomyPersistenceSnapshot,
} from "../../lib/app-state/economyPersistence";

const mockGetStreakData = getStreakData as jest.MockedFunction<typeof getStreakData>;
const mockLoadEconomyPersistenceSnapshot =
  loadEconomyPersistenceSnapshot as jest.MockedFunction<typeof loadEconomyPersistenceSnapshot>;
const mockInitializeEconomyFirstLaunchState =
  initializeEconomyFirstLaunchState as jest.MockedFunction<typeof initializeEconomyFirstLaunchState>;

describe("economyHydration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("user absent reset returns default guest state", () => {
    expect(
      buildSignedOutEconomyReset({
        baseMaxEnergy: 3,
        initialGems: 50,
      })
    ).toEqual(
      expect.objectContaining({
        gems: 50,
        freezeCount: 2,
        energy: 3,
        firstLaunchAtMs: null,
      })
    );
  });

  test("local restore preserves stored snapshot values", async () => {
    mockLoadEconomyPersistenceSnapshot.mockResolvedValueOnce({
      gems: 80,
      energy: 2,
      energyUpdateTime: 123,
      energyBonusDate: "2026-04-06",
      energyBonusCount: 1,
      energyRefillDate: "2026-04-06",
      energyRefillCount: 1,
      firstDayEnergyBonusTracked: true,
      firstLaunchAt: 999,
      questRerollCount: 0,
      questRerollDate: "2026-04-06",
    });
    mockGetStreakData.mockResolvedValueOnce({
      studyStreak: 0,
      lastStudyDate: null,
      freezesRemaining: 4,
      freezeWeekStart: null,
      totalXP: 0,
      todayXP: 0,
      xpDate: null,
    });

    const result = await hydrateEconomyState({
      baseMaxEnergy: 3,
      bonusEnergy: 0,
      userId: "user-1",
    });

    expect(result.snapshot.gems).toBe(80);
    expect(result.snapshot.energy).toBe(2);
    expect(result.firstLaunchAtMs).toBe(999);
    expect(result.freezesRemaining).toBe(4);
    expect(mockInitializeEconomyFirstLaunchState).not.toHaveBeenCalled();
  });

  test("first launch init path initializes only when missing", async () => {
    mockLoadEconomyPersistenceSnapshot.mockResolvedValueOnce({
      gems: null,
      energy: null,
      energyUpdateTime: null,
      energyBonusDate: null,
      energyBonusCount: null,
      energyRefillDate: null,
      energyRefillCount: null,
      firstDayEnergyBonusTracked: false,
      firstLaunchAt: null,
      questRerollCount: null,
      questRerollDate: null,
    });
    mockGetStreakData.mockResolvedValueOnce({
      studyStreak: 0,
      lastStudyDate: null,
      freezesRemaining: 2,
      freezeWeekStart: null,
      totalXP: 0,
      todayXP: 0,
      xpDate: null,
    });
    mockInitializeEconomyFirstLaunchState.mockResolvedValueOnce({
      effectiveCap: 6,
      expiresAtIso: "2026-04-08T00:00:00.000Z",
      firstLaunchAt: 123456,
      initializedNow: true,
    });

    const result = await hydrateEconomyState({
      baseMaxEnergy: 3,
      bonusEnergy: 3,
      userId: "user-1",
    });

    expect(result.firstLaunchInitializedNow).toBe(true);
    expect(result.firstLaunchAtMs).toBe(123456);
    expect(result.firstLaunchEffectiveCap).toBe(6);
    expect(mockInitializeEconomyFirstLaunchState).toHaveBeenCalled();
  });

  test("streak freeze sync path uses freezes remaining from streak data", async () => {
    mockLoadEconomyPersistenceSnapshot.mockResolvedValueOnce({
      gems: 10,
      energy: 3,
      energyUpdateTime: null,
      energyBonusDate: null,
      energyBonusCount: null,
      energyRefillDate: null,
      energyRefillCount: null,
      firstDayEnergyBonusTracked: true,
      firstLaunchAt: 123,
      questRerollCount: null,
      questRerollDate: null,
    });
    mockGetStreakData.mockResolvedValueOnce({
      studyStreak: 0,
      lastStudyDate: null,
      freezesRemaining: 7,
      freezeWeekStart: null,
      totalXP: 0,
      todayXP: 0,
      xpDate: null,
    });

    const result = await hydrateEconomyState({
      baseMaxEnergy: 3,
      bonusEnergy: 0,
      userId: "user-1",
    });

    expect(result.freezesRemaining).toBe(7);
  });
});
