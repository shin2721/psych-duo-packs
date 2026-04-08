jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../lib/app-state/persistence', () => ({
  getUserStorageKey: jest.fn((key: string, userId: string) => `${userId}:${key}`),
  loadUserEntries: jest.fn(),
  parseStoredInt: jest.fn((value: string | null | undefined) => {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }),
  persistNumber: jest.fn().mockResolvedValue(undefined),
  persistString: jest.fn().mockResolvedValue(undefined),
}));

import { syncProfileGems } from '../../lib/app-state/economyRemote';
import {
  initializeEconomyFirstLaunchState,
  loadEconomyPersistenceSnapshot,
} from '../../lib/app-state/economyPersistence';
import { supabase } from '../../lib/supabase';
import {
  loadUserEntries,
  persistNumber,
  persistString,
} from '../../lib/app-state/persistence';

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
};

const mockLoadUserEntries = loadUserEntries as jest.Mock;
const mockPersistNumber = persistNumber as jest.Mock;
const mockPersistString = persistString as jest.Mock;

describe('economy remote guest guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('guest user gems sync short-circuits without querying Supabase', async () => {
    await expect(syncProfileGems('guest_user_1', 99)).resolves.toBeUndefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

describe('economy helper authenticated flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('syncProfileGems preserves update call shape', async () => {
    const builder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from.mockReturnValueOnce(builder);

    await expect(syncProfileGems('user-1', 120)).resolves.toBeUndefined();

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(builder.update).toHaveBeenCalledWith({ gems: 120 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  test('loadEconomyPersistenceSnapshot normalizes stored values', async () => {
    mockLoadUserEntries.mockResolvedValueOnce({
      gems: '50',
      energy: '3',
      energyUpdateTime: '1000',
      energyBonusDate: '2026-04-06',
      energyBonusCount: '1',
      energyRefillDate: '2026-04-06',
      energyRefillCount: '2',
      questRerollDate: '2026-04-06',
      questRerollCount: '0',
      firstLaunchAt: '123456',
      firstDayEnergyBonusTracked: '1',
    });

    await expect(loadEconomyPersistenceSnapshot('user-1')).resolves.toEqual({
      gems: 50,
      energy: 3,
      energyUpdateTime: 1000,
      energyBonusDate: '2026-04-06',
      energyBonusCount: 1,
      energyRefillDate: '2026-04-06',
      energyRefillCount: 2,
      questRerollDate: '2026-04-06',
      questRerollCount: 0,
      firstLaunchAt: 123456,
      firstDayEnergyBonusTracked: true,
    });
  });

  test('initializeEconomyFirstLaunchState persists first launch only once', async () => {
    await expect(
      initializeEconomyFirstLaunchState({
        baseMaxEnergy: 3,
        bonusEnergy: 3,
        userId: 'user-1',
        hasTrackedBonus: false,
        savedFirstLaunchAt: null,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        effectiveCap: 6,
        firstLaunchAt: expect.any(Number),
        initializedNow: true,
      })
    );

    expect(mockPersistNumber).toHaveBeenCalled();
    expect(mockPersistString).toHaveBeenCalled();
  });
});
