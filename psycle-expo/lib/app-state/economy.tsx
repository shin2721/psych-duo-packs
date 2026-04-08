import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "../AuthContext";
import { getEffectiveFreeEnergyCap } from "../energyPolicy";
import { useBillingState } from "./billing";
import {
  addEnergyAction,
  buyDoubleXpAction,
  buyEnergyFullRefillAction,
  buyFreezeAction,
  consumeEnergyAction,
  tryTriggerStreakEnergyBonusAction,
  useFreezeAction,
} from "./economy/economyActions";
import {
  DOUBLE_XP_COST_GEMS,
  DOUBLE_XP_DURATION_MS,
  ENERGY_REFILL_MINUTES,
  ENERGY_REFILL_MS,
  ENERGY_STREAK_BONUS_CHANCE,
  ENERGY_STREAK_BONUS_DAILY_CAP,
  ENERGY_STREAK_BONUS_EVERY,
  FIRST_DAY_BONUS_ENERGY,
  FREE_BASE_MAX_ENERGY,
  INITIAL_GEMS,
  LESSON_ENERGY_COST,
  QUEST_REROLL_CONFIG,
  SHOP_SINKS_CONFIG,
  SUBSCRIBER_MAX_ENERGY,
} from "./economy/economyConfig";
import { getTodayDate } from "./economy/economyUtils";
import { useEconomyEnergyRuntime } from "./economy/useEconomyEnergyRuntime";
import { useEconomyHydrationEffect } from "./economy/useEconomyHydrationEffect";
import { useEconomyPeriodicEffects } from "./economy/useEconomyPeriodicEffects";
import { useEconomyPersistenceEffects } from "./economy/useEconomyPersistenceEffects";
import { useEconomyValue, type EconomyProviderValue } from "./economy/useEconomyValue";
import type { EconomyState } from "./types";
const EconomyStateContext = createContext<EconomyProviderValue | undefined>(undefined);

export function EconomyStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isSubscriptionActive } = useBillingState();
  const [gems, setGems] = useState(INITIAL_GEMS);
  const [freezeCount, setFreezeCount] = useState(2);
  const [doubleXpEndTime, setDoubleXpEndTime] = useState<number | null>(null);
  const [energy, setEnergy] = useState(FREE_BASE_MAX_ENERGY);
  const [lastEnergyUpdateTime, setLastEnergyUpdateTime] = useState<number | null>(null);
  const [dailyEnergyBonusDate, setDailyEnergyBonusDate] = useState(getTodayDate());
  const [dailyEnergyBonusCount, setDailyEnergyBonusCount] = useState(0);
  const [dailyEnergyRefillDate, setDailyEnergyRefillDate] = useState(getTodayDate());
  const [dailyEnergyRefillCount, setDailyEnergyRefillCount] = useState(0);
  const [dailyQuestRerollDate, setDailyQuestRerollDate] = useState(getTodayDate());
  const [dailyQuestRerollCount, setDailyQuestRerollCount] = useState(0);
  const [firstLaunchAtMs, setFirstLaunchAtMs] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const getCurrentFreeMaxEnergy = useCallback(
    (nowMs: number = Date.now()) =>
      getEffectiveFreeEnergyCap(FREE_BASE_MAX_ENERGY, FIRST_DAY_BONUS_ENERGY, firstLaunchAtMs, nowMs),
    [firstLaunchAtMs]
  );

  useEconomyHydrationEffect({
    baseMaxEnergy: FREE_BASE_MAX_ENERGY,
    bonusEnergy: FIRST_DAY_BONUS_ENERGY,
    initialGems: INITIAL_GEMS,
    setDailyEnergyBonusCount,
    setDailyEnergyBonusDate,
    setDailyEnergyRefillCount,
    setDailyEnergyRefillDate,
    setDailyQuestRerollCount,
    setDailyQuestRerollDate,
    setDoubleXpEndTime,
    setEnergy,
    setFirstLaunchAtMs,
    setFreezeCount,
    setGems,
    setIsHydrated,
    setLastEnergyUpdateTime,
    userId: user?.id,
  });

  useEconomyPersistenceEffects({
    dailyEnergyBonusCount,
    dailyEnergyBonusDate,
    dailyEnergyRefillCount,
    dailyEnergyRefillDate,
    dailyQuestRerollCount,
    dailyQuestRerollDate,
    energy,
    firstLaunchAtMs,
    gems,
    isHydrated,
    lastEnergyUpdateTime,
    userId: user?.id,
  });

  useEconomyPeriodicEffects({
    dailyEnergyBonusDate,
    dailyEnergyRefillDate,
    dailyQuestRerollDate,
    isHydrated,
    setDailyEnergyBonusCount,
    setDailyEnergyBonusDate,
    setDailyEnergyRefillCount,
    setDailyEnergyRefillDate,
    setDailyQuestRerollCount,
    setDailyQuestRerollDate,
  });

  const effectiveFreeMaxEnergy = getCurrentFreeMaxEnergy();
  const maxEnergy = isSubscriptionActive ? SUBSCRIBER_MAX_ENERGY : effectiveFreeMaxEnergy;
  const isDoubleXpActive = doubleXpEndTime !== null && Date.now() < doubleXpEndTime;

  useEconomyEnergyRuntime({
    effectiveFreeMaxEnergy,
    energy,
    energyRefillMs: ENERGY_REFILL_MS,
    isHydrated,
    isSubscriptionActive,
    lastEnergyUpdateTime,
    setEnergy,
    setLastEnergyUpdateTime,
    subscriberMaxEnergy: SUBSCRIBER_MAX_ENERGY,
  });

  const addGems = useCallback((amount: number) => {
    setGems((prev) => prev + amount);
  }, []);

  const setGemsDirectly = useCallback((amount: number) => {
    setGems(amount);
  }, []);

  const spendGems = useCallback(
    (amount: number): boolean => {
      if (gems >= amount) {
        setGems((prev) => prev - amount);
        return true;
      }
      return false;
    },
    [gems]
  );

  const buyFreeze = useCallback((): boolean => {
    return buyFreezeAction({
      freezeCount,
      gems,
      setFreezeCount,
      setGems,
    });
  }, [freezeCount, gems]);

  const buyEnergyFullRefill = useCallback(() => {
    return buyEnergyFullRefillAction({
      config: SHOP_SINKS_CONFIG.energy_full_refill,
      dailyEnergyRefillCount,
      dailyEnergyRefillDate,
      energy,
      gems,
      isSubscriptionActive,
      maxEnergy,
      setDailyEnergyRefillCount,
      setDailyEnergyRefillDate,
      setEnergy,
      setGems,
      setLastEnergyUpdateTime,
    });
  }, [
    dailyEnergyRefillCount,
    dailyEnergyRefillDate,
    energy,
    gems,
    isSubscriptionActive,
    maxEnergy,
  ]);

  const buyDoubleXP = useCallback(
    (source: "shop_item" | "lesson_complete_nudge" = "shop_item") => {
      return buyDoubleXpAction({
        costGems: DOUBLE_XP_COST_GEMS,
        durationMs: DOUBLE_XP_DURATION_MS,
        gems,
        isDoubleXpActive,
        setDoubleXpEndTime,
        setGems,
        source,
      });
    },
    [gems, isDoubleXpActive]
  );

  const useFreeze = useCallback((): boolean => {
    return useFreezeAction({
      freezeCount,
      setFreezeCount,
    });
  }, [freezeCount]);

  const consumeEnergy = useCallback(
    (amount = LESSON_ENERGY_COST): boolean => {
      return consumeEnergyAction({
        amount,
        currentEnergy: energy,
        effectiveFreeMaxEnergy,
        isSubscriptionActive,
        lastEnergyUpdateTime,
        setEnergy,
        setLastEnergyUpdateTime,
      });
    },
    [effectiveFreeMaxEnergy, energy, isSubscriptionActive, lastEnergyUpdateTime]
  );

  const addEnergy = useCallback(
    (amount: number) => {
      addEnergyAction({
        amount,
        currentEnergy: energy,
        effectiveFreeMaxEnergy,
        isSubscriptionActive,
        lastEnergyUpdateTime,
        setEnergy,
        setLastEnergyUpdateTime,
      });
    },
    [effectiveFreeMaxEnergy, energy, isSubscriptionActive, lastEnergyUpdateTime]
  );

  const tryTriggerStreakEnergyBonus = useCallback(
    (correctStreak: number): boolean => {
      return tryTriggerStreakEnergyBonusAction({
        correctStreak,
        currentEnergy: energy,
        dailyEnergyBonusCount,
        dailyEnergyBonusDate,
        dailyEnergyBonusDailyCap: ENERGY_STREAK_BONUS_DAILY_CAP,
        energyStreakBonusChance: ENERGY_STREAK_BONUS_CHANCE,
        energyStreakBonusEvery: ENERGY_STREAK_BONUS_EVERY,
        getCurrentFreeMaxEnergy,
        isSubscriptionActive,
        setDailyEnergyBonusCount,
        setDailyEnergyBonusDate,
        addEnergy,
      });
    },
    [
      addEnergy,
      dailyEnergyBonusCount,
      dailyEnergyBonusDate,
      energy,
      getCurrentFreeMaxEnergy,
      isSubscriptionActive,
    ]
  );

  const value = useEconomyValue({
    gems,
    addGems,
    setGemsDirectly,
    spendGems,
    freezeCount,
    useFreeze,
    buyFreeze,
    buyEnergyFullRefill,
    doubleXpEndTime,
    buyDoubleXP,
    isDoubleXpActive,
    isSubscriptionActive,
    energy,
    freeMaxEnergy: effectiveFreeMaxEnergy,
    subscriberMaxEnergy: SUBSCRIBER_MAX_ENERGY,
    consumeEnergy,
    lessonEnergyCost: LESSON_ENERGY_COST,
    addEnergy,
    tryTriggerStreakEnergyBonus,
    energyRefillMinutes: ENERGY_REFILL_MINUTES,
    energyStreakBonusDailyCap: ENERGY_STREAK_BONUS_DAILY_CAP,
    energyFullRefillDailyLimit: SHOP_SINKS_CONFIG.energy_full_refill.daily_limit,
    energyFullRefillEnabled: SHOP_SINKS_CONFIG.energy_full_refill.enabled,
    dailyEnergyBonusDate,
    dailyEnergyBonusCount,
    dailyEnergyRefillDate,
    dailyEnergyRefillCount,
    questRerollDailyLimit: QUEST_REROLL_CONFIG.daily_limit,
    questRerollEnabled: QUEST_REROLL_CONFIG.enabled,
    dailyQuestRerollDate,
    dailyQuestRerollCount,
    lastEnergyUpdateTime,
    setFreezeCountRaw: setFreezeCount,
    setDailyQuestRerollDateRaw: setDailyQuestRerollDate,
    setDailyQuestRerollCountRaw: setDailyQuestRerollCount,
    isHydrated,
  });

  return <EconomyStateContext.Provider value={value}>{children}</EconomyStateContext.Provider>;
}

export function useEconomyState() {
  const context = useContext(EconomyStateContext);
  if (!context) {
    throw new Error("useEconomyState must be used within EconomyStateProvider");
  }
  return context;
}
