import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { getStreakData } from "../../streaks";
import { logDev } from "../../devLog";
import { runHydrationTask } from "../hydration";
import {
  initializeEconomyFirstLaunchState,
  loadEconomyPersistenceSnapshot,
  type EconomyPersistenceSnapshot,
} from "../economyPersistence";
import { getTodayDate } from "./economyUtils";

export interface EconomyHydratedState {
  snapshot: EconomyPersistenceSnapshot;
  firstLaunchAtMs: number | null;
  firstLaunchInitializedNow: boolean;
  firstLaunchEffectiveCap: number;
  firstLaunchExpiresAtIso: string | null;
  freezesRemaining: number;
}

export interface SignedOutEconomyResetState {
  gems: number;
  freezeCount: number;
  doubleXpEndTime: number | null;
  energy: number;
  lastEnergyUpdateTime: number | null;
  dailyEnergyBonusDate: string;
  dailyEnergyBonusCount: number;
  dailyEnergyRefillDate: string;
  dailyEnergyRefillCount: number;
  dailyQuestRerollDate: string;
  dailyQuestRerollCount: number;
  firstLaunchAtMs: number | null;
}

export function buildSignedOutEconomyReset(args: {
  baseMaxEnergy: number;
  initialGems: number;
}): SignedOutEconomyResetState {
  const today = getTodayDate();
  return {
    gems: args.initialGems,
    freezeCount: 2,
    doubleXpEndTime: null,
    energy: args.baseMaxEnergy,
    lastEnergyUpdateTime: null,
    dailyEnergyBonusDate: today,
    dailyEnergyBonusCount: 0,
    dailyEnergyRefillDate: today,
    dailyEnergyRefillCount: 0,
    dailyQuestRerollDate: today,
    dailyQuestRerollCount: 0,
    firstLaunchAtMs: null,
  };
}

export async function hydrateEconomyState(args: {
  baseMaxEnergy: number;
  bonusEnergy: number;
  userId: string;
}): Promise<EconomyHydratedState> {
  const [snapshot, streakData] = await Promise.all([
    loadEconomyPersistenceSnapshot(args.userId),
    getStreakData(),
  ]);

  let firstLaunchAtMs: number | null = null;
  let firstLaunchInitializedNow = false;
  let firstLaunchEffectiveCap = args.baseMaxEnergy;
  let firstLaunchExpiresAtIso: string | null = null;

  if (snapshot.firstLaunchAt !== null && snapshot.firstLaunchAt > 0) {
    firstLaunchAtMs = snapshot.firstLaunchAt;
  } else {
    const initialized = await initializeEconomyFirstLaunchState({
      baseMaxEnergy: args.baseMaxEnergy,
      bonusEnergy: args.bonusEnergy,
      userId: args.userId,
      hasTrackedBonus: snapshot.firstDayEnergyBonusTracked,
      savedFirstLaunchAt: snapshot.firstLaunchAt,
    });
    firstLaunchAtMs = initialized.firstLaunchAt;
    firstLaunchInitializedNow = initialized.initializedNow;
    firstLaunchEffectiveCap = initialized.effectiveCap;
    firstLaunchExpiresAtIso = initialized.expiresAtIso;
  }

  return {
    snapshot,
    firstLaunchAtMs,
    firstLaunchInitializedNow,
    firstLaunchEffectiveCap,
    firstLaunchExpiresAtIso,
    freezesRemaining: streakData.freezesRemaining,
  };
}

export function useEconomyHydrationEffect(args: {
  baseMaxEnergy: number;
  bonusEnergy: number;
  initialGems: number;
  setDailyEnergyBonusCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyBonusDate: Dispatch<SetStateAction<string>>;
  setDailyEnergyRefillCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyRefillDate: Dispatch<SetStateAction<string>>;
  setDailyQuestRerollCount: Dispatch<SetStateAction<number>>;
  setDailyQuestRerollDate: Dispatch<SetStateAction<string>>;
  setDoubleXpEndTime: Dispatch<SetStateAction<number | null>>;
  setEnergy: Dispatch<SetStateAction<number>>;
  setFirstLaunchAtMs: Dispatch<SetStateAction<number | null>>;
  setFreezeCount: Dispatch<SetStateAction<number>>;
  setGems: Dispatch<SetStateAction<number>>;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  setLastEnergyUpdateTime: Dispatch<SetStateAction<number | null>>;
  userId?: string | null;
}): void {
  useEffect(() => {
    if (!args.userId) {
      const reset = buildSignedOutEconomyReset({
        baseMaxEnergy: args.baseMaxEnergy,
        initialGems: args.initialGems,
      });
      args.setGems(reset.gems);
      args.setFreezeCount(reset.freezeCount);
      args.setDoubleXpEndTime(reset.doubleXpEndTime);
      args.setEnergy(reset.energy);
      args.setLastEnergyUpdateTime(reset.lastEnergyUpdateTime);
      args.setDailyEnergyBonusDate(reset.dailyEnergyBonusDate);
      args.setDailyEnergyBonusCount(reset.dailyEnergyBonusCount);
      args.setDailyEnergyRefillDate(reset.dailyEnergyRefillDate);
      args.setDailyEnergyRefillCount(reset.dailyEnergyRefillCount);
      args.setDailyQuestRerollDate(reset.dailyQuestRerollDate);
      args.setDailyQuestRerollCount(reset.dailyQuestRerollCount);
      args.setFirstLaunchAtMs(reset.firstLaunchAtMs);
      args.setIsHydrated(true);
      return;
    }

    const userId = args.userId;

    return runHydrationTask({
      setIsHydrated: args.setIsHydrated,
      task: async ({ isCancelled }) => {
        const hydrated = await hydrateEconomyState({
          baseMaxEnergy: args.baseMaxEnergy,
          bonusEnergy: args.bonusEnergy,
          userId,
        });
        if (isCancelled()) return;

        const { snapshot } = hydrated;
        if (snapshot.gems !== null) args.setGems(snapshot.gems);
        if (snapshot.energy !== null) args.setEnergy(snapshot.energy);
        if (snapshot.energyUpdateTime !== null) args.setLastEnergyUpdateTime(snapshot.energyUpdateTime);
        if (snapshot.energyBonusDate) args.setDailyEnergyBonusDate(snapshot.energyBonusDate);
        if (snapshot.energyBonusCount !== null) args.setDailyEnergyBonusCount(snapshot.energyBonusCount);
        if (snapshot.energyRefillDate) args.setDailyEnergyRefillDate(snapshot.energyRefillDate);
        if (snapshot.energyRefillCount !== null) args.setDailyEnergyRefillCount(snapshot.energyRefillCount);
        if (snapshot.questRerollDate) args.setDailyQuestRerollDate(snapshot.questRerollDate);
        if (snapshot.questRerollCount !== null) args.setDailyQuestRerollCount(snapshot.questRerollCount);
        args.setFreezeCount(hydrated.freezesRemaining);
        args.setFirstLaunchAtMs(hydrated.firstLaunchAtMs);

        if (hydrated.firstLaunchInitializedNow && !snapshot.firstDayEnergyBonusTracked) {
          Analytics.track("first_day_energy_bonus_granted", {
            bonusEnergy: args.bonusEnergy,
            baseCap: args.baseMaxEnergy,
            effectiveCap: hydrated.firstLaunchEffectiveCap,
            expiresAt: hydrated.firstLaunchExpiresAtIso,
            source: "first_launch",
          });
        }
      },
      onError: (error) => {
        logDev("Economy local storage read failed:", error);
      },
    });
  }, [
    args.baseMaxEnergy,
    args.bonusEnergy,
    args.initialGems,
    args.setDailyEnergyBonusCount,
    args.setDailyEnergyBonusDate,
    args.setDailyEnergyRefillCount,
    args.setDailyEnergyRefillDate,
    args.setDailyQuestRerollCount,
    args.setDailyQuestRerollDate,
    args.setDoubleXpEndTime,
    args.setEnergy,
    args.setFirstLaunchAtMs,
    args.setFreezeCount,
    args.setGems,
    args.setIsHydrated,
    args.setLastEnergyUpdateTime,
    args.userId,
  ]);
}
