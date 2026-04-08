import type React from "react";
import { useMemo } from "react";
import { getTodayDate, normalizePositiveInt } from "./economyUtils";
import type { EconomyState } from "../types";

export type EconomyProviderValue = EconomyState & {
  isHydrated: boolean;
  setFreezeCountRaw: React.Dispatch<React.SetStateAction<number>>;
  dailyQuestRerollDate: string;
  dailyQuestRerollCount: number;
  setDailyQuestRerollDateRaw: React.Dispatch<React.SetStateAction<string>>;
  setDailyQuestRerollCountRaw: React.Dispatch<React.SetStateAction<number>>;
};

type UseEconomyValueParams = Omit<
  EconomyProviderValue,
  "dailyEnergyBonusRemaining" | "dailyEnergyRefillRemaining" | "dailyQuestRerollRemaining" | "maxEnergy"
> & {
  dailyEnergyBonusDate: string;
  dailyEnergyBonusCount: number;
  dailyEnergyRefillDate: string;
  dailyEnergyRefillCount: number;
  energyFullRefillDailyLimit: number;
  energyFullRefillEnabled: boolean;
  energyStreakBonusDailyCap: number;
  freeMaxEnergy: number;
  isSubscriptionActive: boolean;
  questRerollDailyLimit: number;
  questRerollEnabled: boolean;
  subscriberMaxEnergy: number;
};

export function useEconomyValue(params: UseEconomyValueParams): EconomyProviderValue {
  return useMemo(() => {
    const today = getTodayDate();
    const maxEnergy = params.isSubscriptionActive ? params.subscriberMaxEnergy : params.freeMaxEnergy;
    const dailyEnergyBonusUsed =
      params.dailyEnergyBonusDate === today ? params.dailyEnergyBonusCount : 0;
    const dailyEnergyRefillUsed =
      params.dailyEnergyRefillDate === today ? params.dailyEnergyRefillCount : 0;
    const dailyQuestRerollUsed =
      params.dailyQuestRerollDate === today ? params.dailyQuestRerollCount : 0;

    const dailyEnergyBonusRemaining = params.isSubscriptionActive
      ? params.energyStreakBonusDailyCap
      : Math.max(0, params.energyStreakBonusDailyCap - dailyEnergyBonusUsed);
    const dailyEnergyRefillRemaining =
      !params.energyFullRefillEnabled || params.isSubscriptionActive
        ? 0
        : Math.max(0, params.energyFullRefillDailyLimit - dailyEnergyRefillUsed);
    const dailyQuestRerollRemaining = !params.questRerollEnabled
      ? 0
      : Math.max(0, normalizePositiveInt(params.questRerollDailyLimit, 1) - dailyQuestRerollUsed);

    return {
      gems: params.gems,
      addGems: params.addGems,
      setGemsDirectly: params.setGemsDirectly,
      spendGems: params.spendGems,
      freezeCount: params.freezeCount,
      useFreeze: params.useFreeze,
      buyFreeze: params.buyFreeze,
      buyEnergyFullRefill: params.buyEnergyFullRefill,
      doubleXpEndTime: params.doubleXpEndTime,
      buyDoubleXP: params.buyDoubleXP,
      isDoubleXpActive: params.isDoubleXpActive,
      energy: params.energy,
      maxEnergy,
      consumeEnergy: params.consumeEnergy,
      lessonEnergyCost: params.lessonEnergyCost,
      addEnergy: params.addEnergy,
      tryTriggerStreakEnergyBonus: params.tryTriggerStreakEnergyBonus,
      energyRefillMinutes: params.energyRefillMinutes,
      dailyEnergyBonusRemaining,
      dailyEnergyRefillRemaining,
      dailyQuestRerollRemaining,
      lastEnergyUpdateTime: params.lastEnergyUpdateTime,
      setFreezeCountRaw: params.setFreezeCountRaw,
      dailyQuestRerollDate: params.dailyQuestRerollDate,
      dailyQuestRerollCount: params.dailyQuestRerollCount,
      setDailyQuestRerollDateRaw: params.setDailyQuestRerollDateRaw,
      setDailyQuestRerollCountRaw: params.setDailyQuestRerollCountRaw,
      isHydrated: params.isHydrated,
    };
  }, [params]);
}
