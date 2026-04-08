import {
  getUserStorageKey,
  loadUserEntries,
  parseStoredInt,
  persistNumber,
  persistString,
} from "./persistence";

export interface EconomyPersistenceSnapshot {
  energy: number | null;
  energyBonusCount: number | null;
  energyBonusDate: string | null;
  energyRefillCount: number | null;
  energyRefillDate: string | null;
  energyUpdateTime: number | null;
  firstDayEnergyBonusTracked: boolean;
  firstLaunchAt: number | null;
  gems: number | null;
  questRerollCount: number | null;
  questRerollDate: string | null;
}

export async function loadEconomyPersistenceSnapshot(userId: string): Promise<EconomyPersistenceSnapshot> {
  const saved = await loadUserEntries(userId, [
    "gems",
    "energy",
    "energyUpdateTime",
    "energyBonusDate",
    "energyBonusCount",
    "energyRefillDate",
    "energyRefillCount",
    "questRerollDate",
    "questRerollCount",
    "firstLaunchAt",
    "firstDayEnergyBonusTracked",
  ]);

  return {
    energy: parseStoredInt(saved.energy),
    energyBonusCount: parseStoredInt(saved.energyBonusCount),
    energyBonusDate: saved.energyBonusDate ?? null,
    energyRefillCount: parseStoredInt(saved.energyRefillCount),
    energyRefillDate: saved.energyRefillDate ?? null,
    energyUpdateTime: parseStoredInt(saved.energyUpdateTime),
    firstDayEnergyBonusTracked: Boolean(saved.firstDayEnergyBonusTracked),
    firstLaunchAt: parseStoredInt(saved.firstLaunchAt),
    gems: parseStoredInt(saved.gems),
    questRerollCount: parseStoredInt(saved.questRerollCount),
    questRerollDate: saved.questRerollDate ?? null,
  };
}

export async function persistEconomyNumberState(
  userId: string,
  key: Parameters<typeof getUserStorageKey>[0],
  value: number | null | undefined
): Promise<void> {
  await persistNumber(getUserStorageKey(key, userId), value ?? null);
}

export async function persistEconomyStringState(
  userId: string,
  key: Parameters<typeof getUserStorageKey>[0],
  value: string | null | undefined
): Promise<void> {
  await persistString(getUserStorageKey(key, userId), value ?? null);
}

export async function initializeEconomyFirstLaunchState(params: {
  baseMaxEnergy: number;
  bonusEnergy: number;
  userId: string;
  hasTrackedBonus: boolean;
  savedFirstLaunchAt: number | null;
}): Promise<{
  effectiveCap: number;
  expiresAtIso: string;
  firstLaunchAt: number;
  initializedNow: boolean;
}> {
  if (params.savedFirstLaunchAt !== null && params.savedFirstLaunchAt > 0) {
    const expiresAtMs = params.savedFirstLaunchAt + 24 * 60 * 60 * 1000;
    return {
      effectiveCap: params.baseMaxEnergy + params.bonusEnergy,
      expiresAtIso: new Date(expiresAtMs).toISOString(),
      firstLaunchAt: params.savedFirstLaunchAt,
      initializedNow: false,
    };
  }

  const firstLaunchAt = Date.now();
  await persistEconomyNumberState(params.userId, "firstLaunchAt", firstLaunchAt);
  if (!params.hasTrackedBonus) {
    await persistEconomyStringState(params.userId, "firstDayEnergyBonusTracked", "1");
  }

  return {
    effectiveCap: params.baseMaxEnergy + params.bonusEnergy,
    expiresAtIso: new Date(firstLaunchAt + 24 * 60 * 60 * 1000).toISOString(),
    firstLaunchAt,
    initializedNow: true,
  };
}
