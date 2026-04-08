import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import { Analytics } from "../analytics";
import entitlements from "../../config/entitlements.json";
import { addFreezes, getStreakData, useFreeze as useFreezeStreak } from "../streaks";
import { getEffectiveFreeEnergyCap } from "../energyPolicy";
import { getDoubleXpBoostConfig, getInitialGems, getQuestRerollConfig, getShopSinksConfig } from "../gamificationConfig";
import { evaluateEnergyFullRefillPurchase } from "../energyFullRefill";
import { evaluateDoubleXpPurchase } from "../doubleXpPurchase";
import { useBillingState } from "./billing";
import {
  initializeEconomyFirstLaunchState,
  loadEconomyPersistenceSnapshot,
  persistEconomyNumberState,
  persistEconomyStringState,
} from "./economyPersistence";
import { syncProfileGems } from "./economyRemote";
import type { EconomyState } from "./types";

interface EntitlementsConfig {
  plans?: {
    free?: {
      energy?: {
        daily_cap?: number | null;
      };
    };
  };
  defaults?: {
    energy_refill_minutes?: number;
    lesson_energy_cost?: number;
    first_day_bonus_energy?: number;
    energy_streak_bonus_every?: number;
    energy_streak_bonus_chance?: number;
    energy_streak_bonus_daily_cap?: number;
  };
}

type EconomyContextValue = EconomyState & {
  isHydrated: boolean;
  setFreezeCountRaw: React.Dispatch<React.SetStateAction<number>>;
  dailyQuestRerollDate: string;
  dailyQuestRerollCount: number;
  setDailyQuestRerollDateRaw: React.Dispatch<React.SetStateAction<string>>;
  setDailyQuestRerollCountRaw: React.Dispatch<React.SetStateAction<number>>;
};

const EconomyStateContext = createContext<EconomyContextValue | undefined>(undefined);

function normalizePositiveInt(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

function normalizeNonNegativeInt(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized >= 0 ? normalized : fallback;
}

function normalizeProbability(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const entitlementConfig = entitlements as EntitlementsConfig;
const FREE_BASE_MAX_ENERGY = normalizePositiveInt(
  entitlementConfig.plans?.free?.energy?.daily_cap ?? null,
  3
);
const FIRST_DAY_BONUS_ENERGY = normalizePositiveInt(
  entitlementConfig.defaults?.first_day_bonus_energy,
  0
);
const SUBSCRIBER_MAX_ENERGY = 999;
const ENERGY_REFILL_MINUTES = normalizePositiveInt(
  entitlementConfig.defaults?.energy_refill_minutes,
  60
);
const LESSON_ENERGY_COST = normalizePositiveInt(
  entitlementConfig.defaults?.lesson_energy_cost,
  1
);
const ENERGY_STREAK_BONUS_EVERY = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_every,
  5
);
const ENERGY_STREAK_BONUS_CHANCE = normalizeProbability(
  entitlementConfig.defaults?.energy_streak_bonus_chance,
  0.1
);
const ENERGY_STREAK_BONUS_DAILY_CAP = normalizePositiveInt(
  entitlementConfig.defaults?.energy_streak_bonus_daily_cap,
  1
);
const ENERGY_REFILL_MS = ENERGY_REFILL_MINUTES * 60 * 1000;
const INITIAL_GEMS = normalizeNonNegativeInt(getInitialGems(), 50);
const shopSinksConfig = getShopSinksConfig();
const questRerollConfig = getQuestRerollConfig();
const doubleXpBoostConfig = getDoubleXpBoostConfig();
const DOUBLE_XP_COST_GEMS = normalizeNonNegativeInt(doubleXpBoostConfig.cost_gems, 20);
const DOUBLE_XP_DURATION_MS = normalizePositiveInt(doubleXpBoostConfig.duration_minutes, 15) * 60 * 1000;

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

  const getCurrentFreeMaxEnergy = (nowMs: number = Date.now()) =>
    getEffectiveFreeEnergyCap(FREE_BASE_MAX_ENERGY, FIRST_DAY_BONUS_ENERGY, firstLaunchAtMs, nowMs);

  useEffect(() => {
    if (!user) {
      setGems(INITIAL_GEMS);
      setFreezeCount(2);
      setDoubleXpEndTime(null);
      setEnergy(FREE_BASE_MAX_ENERGY);
      setLastEnergyUpdateTime(null);
      setDailyEnergyBonusDate(getTodayDate());
      setDailyEnergyBonusCount(0);
      setDailyEnergyRefillDate(getTodayDate());
      setDailyEnergyRefillCount(0);
      setDailyQuestRerollDate(getTodayDate());
      setDailyQuestRerollCount(0);
      setFirstLaunchAtMs(null);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    setIsHydrated(false);

    const loadEconomy = async () => {
      try {
        const saved = await loadEconomyPersistenceSnapshot(user.id);
        const streakData = await getStreakData();
        if (cancelled) return;

        if (saved.gems !== null) setGems(saved.gems);
        if (saved.energy !== null) setEnergy(saved.energy);
        if (saved.energyUpdateTime !== null) setLastEnergyUpdateTime(saved.energyUpdateTime);
        if (saved.energyBonusDate) setDailyEnergyBonusDate(saved.energyBonusDate);
        if (saved.energyBonusCount !== null) setDailyEnergyBonusCount(saved.energyBonusCount);
        if (saved.energyRefillDate) setDailyEnergyRefillDate(saved.energyRefillDate);
        if (saved.energyRefillCount !== null) setDailyEnergyRefillCount(saved.energyRefillCount);
        if (saved.questRerollDate) setDailyQuestRerollDate(saved.questRerollDate);
        if (saved.questRerollCount !== null) setDailyQuestRerollCount(saved.questRerollCount);
        setFreezeCount(streakData.freezesRemaining);

        if (saved.firstLaunchAt !== null && saved.firstLaunchAt > 0) {
          setFirstLaunchAtMs(saved.firstLaunchAt);
        } else {
          const initialized = await initializeEconomyFirstLaunchState({
            baseMaxEnergy: FREE_BASE_MAX_ENERGY,
            bonusEnergy: FIRST_DAY_BONUS_ENERGY,
            userId: user.id,
            hasTrackedBonus: saved.firstDayEnergyBonusTracked,
            savedFirstLaunchAt: saved.firstLaunchAt,
          });
          setFirstLaunchAtMs(initialized.firstLaunchAt);
          if (initialized.initializedNow && !saved.firstDayEnergyBonusTracked) {
            Analytics.track("first_day_energy_bonus_granted", {
              bonusEnergy: FIRST_DAY_BONUS_ENERGY,
              baseCap: FREE_BASE_MAX_ENERGY,
              effectiveCap: initialized.effectiveCap,
              expiresAt: initialized.expiresAtIso,
              source: "first_launch",
            });
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log("Economy local storage read failed:", error);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    loadEconomy();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "gems", gems).catch(() => {});
    syncProfileGems(user.id, gems).catch((error) => {
      if (error) console.error("Failed to sync gems to Supabase", error);
    });
  }, [gems, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "energy", energy).catch(() => {});
  }, [energy, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "energyUpdateTime", lastEnergyUpdateTime).catch(() => {});
  }, [isHydrated, lastEnergyUpdateTime, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyStringState(user.id, "energyBonusDate", dailyEnergyBonusDate).catch(() => {});
  }, [dailyEnergyBonusDate, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "energyBonusCount", dailyEnergyBonusCount).catch(() => {});
  }, [dailyEnergyBonusCount, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyStringState(user.id, "energyRefillDate", dailyEnergyRefillDate).catch(() => {});
  }, [dailyEnergyRefillDate, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "energyRefillCount", dailyEnergyRefillCount).catch(() => {});
  }, [dailyEnergyRefillCount, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyStringState(user.id, "questRerollDate", dailyQuestRerollDate).catch(() => {});
  }, [dailyQuestRerollDate, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated) return;
    persistEconomyNumberState(user.id, "questRerollCount", dailyQuestRerollCount).catch(() => {});
  }, [dailyQuestRerollCount, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated || firstLaunchAtMs === null) return;
    persistEconomyNumberState(user.id, "firstLaunchAt", firstLaunchAtMs).catch(() => {});
  }, [firstLaunchAtMs, isHydrated, user]);

  useEffect(() => {
    const today = getTodayDate();
    if (dailyEnergyBonusDate !== today) {
      setDailyEnergyBonusDate(today);
      setDailyEnergyBonusCount(0);
    }
    const interval = setInterval(() => {
      const nextToday = getTodayDate();
      if (dailyEnergyBonusDate !== nextToday) {
        setDailyEnergyBonusDate(nextToday);
        setDailyEnergyBonusCount(0);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyEnergyBonusDate]);

  useEffect(() => {
    const today = getTodayDate();
    if (dailyEnergyRefillDate !== today) {
      setDailyEnergyRefillDate(today);
      setDailyEnergyRefillCount(0);
    }
    const interval = setInterval(() => {
      const nextToday = getTodayDate();
      if (dailyEnergyRefillDate !== nextToday) {
        setDailyEnergyRefillDate(nextToday);
        setDailyEnergyRefillCount(0);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyEnergyRefillDate]);

  useEffect(() => {
    const today = getTodayDate();
    if (dailyQuestRerollDate !== today) {
      setDailyQuestRerollDate(today);
      setDailyQuestRerollCount(0);
    }
    const interval = setInterval(() => {
      const nextToday = getTodayDate();
      if (dailyQuestRerollDate !== nextToday) {
        setDailyQuestRerollDate(nextToday);
        setDailyQuestRerollCount(0);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyQuestRerollDate]);

  const effectiveFreeMaxEnergy = getCurrentFreeMaxEnergy();
  const maxEnergy = isSubscriptionActive ? SUBSCRIBER_MAX_ENERGY : effectiveFreeMaxEnergy;

  useEffect(() => {
    if (isSubscriptionActive) {
      if (energy !== SUBSCRIBER_MAX_ENERGY) setEnergy(SUBSCRIBER_MAX_ENERGY);
      if (lastEnergyUpdateTime !== null) setLastEnergyUpdateTime(null);
      return;
    }

    if (energy > effectiveFreeMaxEnergy) {
      setEnergy(effectiveFreeMaxEnergy);
      setLastEnergyUpdateTime(null);
      return;
    }

    const recoverEnergy = () => {
      if (lastEnergyUpdateTime === null) return;
      if (energy >= effectiveFreeMaxEnergy) {
        setLastEnergyUpdateTime(null);
        return;
      }

      const elapsed = Date.now() - lastEnergyUpdateTime;
      const recovered = Math.floor(elapsed / ENERGY_REFILL_MS);
      if (recovered <= 0) return;

      const nextEnergy = Math.min(effectiveFreeMaxEnergy, energy + recovered);
      setEnergy(nextEnergy);
      if (nextEnergy >= effectiveFreeMaxEnergy) {
        setLastEnergyUpdateTime(null);
      } else {
        setLastEnergyUpdateTime(lastEnergyUpdateTime + recovered * ENERGY_REFILL_MS);
      }
    };

    recoverEnergy();
    const interval = setInterval(recoverEnergy, 60000);
    return () => clearInterval(interval);
  }, [effectiveFreeMaxEnergy, energy, isSubscriptionActive, lastEnergyUpdateTime]);

  const addGems = (amount: number) => {
    setGems((prev) => prev + amount);
  };

  const setGemsDirectly = (amount: number) => {
    setGems(amount);
  };

  const spendGems = (amount: number): boolean => {
    if (gems >= amount) {
      setGems((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const buyFreeze = (): boolean => {
    const cost = 10;
    if (spendGems(cost)) {
      setFreezeCount((prev) => prev + 1);
      addFreezes(1).catch((error) => console.error("Failed to add freeze to streak data", error));
      return true;
    }
    return false;
  };

  const isDoubleXpActive = doubleXpEndTime !== null && Date.now() < doubleXpEndTime;

  const buyEnergyFullRefill = () => {
    const config = shopSinksConfig.energy_full_refill;
    const today = getTodayDate();
    const currentRefillCount = dailyEnergyRefillDate === today ? dailyEnergyRefillCount : 0;

    const result = evaluateEnergyFullRefillPurchase({
      enabled: config.enabled,
      isSubscriptionActive,
      energy,
      maxEnergy,
      dailyCount: currentRefillCount,
      dailyLimit: config.daily_limit,
      gems,
      costGems: config.cost_gems,
    });

    if (!result.success) {
      return { success: false as const, reason: result.reason };
    }

    const gemsBefore = gems;
    const energyBefore = energy;
    const nextGems = gemsBefore - config.cost_gems;
    const nextDailyCount = currentRefillCount + 1;

    setGems(nextGems);
    setEnergy(maxEnergy);
    setLastEnergyUpdateTime(null);
    setDailyEnergyRefillDate(today);
    setDailyEnergyRefillCount(nextDailyCount);

    Analytics.track("energy_full_refill_purchased", {
      costGems: config.cost_gems,
      gemsBefore,
      gemsAfter: nextGems,
      energyBefore,
      energyAfter: maxEnergy,
      dailyCountAfter: nextDailyCount,
    });

    return { success: true as const };
  };

  const buyDoubleXP = (source: "shop_item" | "lesson_complete_nudge" = "shop_item") => {
    const nowMs = Date.now();
    const purchase = evaluateDoubleXpPurchase({
      gems,
      costGems: DOUBLE_XP_COST_GEMS,
      isActive: isDoubleXpActive,
      nowMs,
      durationMs: DOUBLE_XP_DURATION_MS,
    });

    if (!purchase.success) {
      return { success: false as const, reason: purchase.reason };
    }

    const gemsBefore = gems;
    setGems(purchase.gemsAfter);
    setDoubleXpEndTime(purchase.activeUntilMs);

    Analytics.track("double_xp_purchased", {
      source,
      costGems: DOUBLE_XP_COST_GEMS,
      gemsBefore,
      gemsAfter: purchase.gemsAfter,
      activeUntil: new Date(purchase.activeUntilMs).toISOString(),
    });

    return { success: true as const };
  };

  const useFreeze = (): boolean => {
    if (freezeCount > 0) {
      const nextCount = freezeCount - 1;
      setFreezeCount(nextCount);
      Analytics.track("freeze_used", {
        freezesRemaining: nextCount,
        source: "streak_protection",
      });
      useFreezeStreak().catch((error) => console.error("Failed to use freeze from streak data", error));
      return true;
    }
    return false;
  };

  const consumeEnergy = (amount = LESSON_ENERGY_COST): boolean => {
    if (isSubscriptionActive) return true;
    const freeMaxEnergy = getCurrentFreeMaxEnergy();
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return true;
    if (energy < normalized) return false;

    const nextEnergy = Math.max(0, energy - normalized);
    setEnergy(nextEnergy);
    if (nextEnergy < freeMaxEnergy && lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
    return true;
  };

  const addEnergy = (amount: number) => {
    if (isSubscriptionActive) return;
    const freeMaxEnergy = getCurrentFreeMaxEnergy();
    const normalized = Math.max(0, Math.floor(amount));
    if (normalized === 0) return;

    const nextEnergy = Math.min(freeMaxEnergy, energy + normalized);
    setEnergy(nextEnergy);
    if (nextEnergy >= freeMaxEnergy) {
      setLastEnergyUpdateTime(null);
    } else if (lastEnergyUpdateTime === null) {
      setLastEnergyUpdateTime(Date.now());
    }
  };

  const tryTriggerStreakEnergyBonus = (correctStreak: number): boolean => {
    if (isSubscriptionActive) return false;
    if (correctStreak <= 0 || correctStreak % ENERGY_STREAK_BONUS_EVERY !== 0) return false;

    const today = getTodayDate();
    const currentBonusCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    if (currentBonusCount >= ENERGY_STREAK_BONUS_DAILY_CAP) return false;
    if (Math.random() >= ENERGY_STREAK_BONUS_CHANCE) return false;

    const prevEnergy = energy;
    const nextEnergy = Math.min(getCurrentFreeMaxEnergy(), prevEnergy + 1);
    addEnergy(1);
    setDailyEnergyBonusDate(today);
    setDailyEnergyBonusCount(currentBonusCount + 1);
    Analytics.track("energy_bonus_hit", {
      correctStreak,
      energyBefore: prevEnergy,
      energyAfter: nextEnergy,
      dailyBonusCount: currentBonusCount + 1,
      dailyBonusCap: ENERGY_STREAK_BONUS_DAILY_CAP,
    });
    return true;
  };

  const dailyEnergyBonusRemaining = (() => {
    if (isSubscriptionActive) return ENERGY_STREAK_BONUS_DAILY_CAP;
    const today = getTodayDate();
    const usedCount = dailyEnergyBonusDate === today ? dailyEnergyBonusCount : 0;
    return Math.max(0, ENERGY_STREAK_BONUS_DAILY_CAP - usedCount);
  })();

  const dailyEnergyRefillRemaining = (() => {
    const config = shopSinksConfig.energy_full_refill;
    if (!config.enabled || isSubscriptionActive) return 0;
    const today = getTodayDate();
    const usedCount = dailyEnergyRefillDate === today ? dailyEnergyRefillCount : 0;
    return Math.max(0, config.daily_limit - usedCount);
  })();

  const dailyQuestRerollRemaining = (() => {
    if (!questRerollConfig.enabled) return 0;
    const today = getTodayDate();
    const usedCount = dailyQuestRerollDate === today ? dailyQuestRerollCount : 0;
    return Math.max(0, normalizePositiveInt(questRerollConfig.daily_limit, 1) - usedCount);
  })();

  const value = useMemo<EconomyContextValue>(
    () => ({
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
      energy,
      maxEnergy,
      consumeEnergy,
      lessonEnergyCost: LESSON_ENERGY_COST,
      addEnergy,
      tryTriggerStreakEnergyBonus,
      energyRefillMinutes: ENERGY_REFILL_MINUTES,
      dailyEnergyBonusRemaining,
      dailyEnergyRefillRemaining,
      dailyQuestRerollRemaining,
      lastEnergyUpdateTime,
      setFreezeCountRaw: setFreezeCount,
      dailyQuestRerollDate,
      dailyQuestRerollCount,
      setDailyQuestRerollDateRaw: setDailyQuestRerollDate,
      setDailyQuestRerollCountRaw: setDailyQuestRerollCount,
      isHydrated,
    }),
    [
      dailyEnergyBonusRemaining,
      dailyEnergyRefillRemaining,
      dailyQuestRerollRemaining,
      doubleXpEndTime,
      energy,
      freezeCount,
      gems,
      isDoubleXpActive,
      isHydrated,
      lastEnergyUpdateTime,
      maxEnergy,
      dailyQuestRerollCount,
      dailyQuestRerollDate,
    ]
  );

  return <EconomyStateContext.Provider value={value}>{children}</EconomyStateContext.Provider>;
}

export function useEconomyState() {
  const context = useContext(EconomyStateContext);
  if (!context) {
    throw new Error("useEconomyState must be used within EconomyStateProvider");
  }
  return context;
}
