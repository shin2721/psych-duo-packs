import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { evaluateDoubleXpPurchase, type DoubleXpPurchaseFailureReason } from "../../doubleXpPurchase";
import { evaluateEnergyFullRefillPurchase, type EnergyFullRefillFailureReason } from "../../energyFullRefill";
import { addFreezes, useFreeze as useFreezeStreak } from "../../streaks";
import { warnDev } from "../../devLog";
import { getTodayDate } from "./economyUtils";

const FREEZE_COST_GEMS = 10;

export function buyFreezeAction(args: {
  freezeCount: number;
  gems: number;
  setFreezeCount: Dispatch<SetStateAction<number>>;
  setGems: Dispatch<SetStateAction<number>>;
}): boolean {
  if (args.gems < FREEZE_COST_GEMS) return false;
  args.setGems(args.gems - FREEZE_COST_GEMS);
  args.setFreezeCount(args.freezeCount + 1);
  addFreezes(1).catch((error) => warnDev("Failed to add freeze to streak data", error));
  return true;
}

export function buyEnergyFullRefillAction(args: {
  config: { enabled: boolean; daily_limit: number; cost_gems: number };
  dailyEnergyRefillCount: number;
  dailyEnergyRefillDate: string;
  energy: number;
  gems: number;
  isSubscriptionActive: boolean;
  maxEnergy: number;
  setDailyEnergyRefillCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyRefillDate: Dispatch<SetStateAction<string>>;
  setEnergy: Dispatch<SetStateAction<number>>;
  setGems: Dispatch<SetStateAction<number>>;
  setLastEnergyUpdateTime: Dispatch<SetStateAction<number | null>>;
}): { success: true } | { success: false; reason: EnergyFullRefillFailureReason } {
  const today = getTodayDate();
  const currentRefillCount =
    args.dailyEnergyRefillDate === today ? args.dailyEnergyRefillCount : 0;

  const result = evaluateEnergyFullRefillPurchase({
    enabled: args.config.enabled,
    isSubscriptionActive: args.isSubscriptionActive,
    energy: args.energy,
    maxEnergy: args.maxEnergy,
    dailyCount: currentRefillCount,
    dailyLimit: args.config.daily_limit,
    gems: args.gems,
    costGems: args.config.cost_gems,
  });

  if (!result.success) return { success: false, reason: result.reason };

  const gemsBefore = args.gems;
  const energyBefore = args.energy;
  const nextGems = gemsBefore - args.config.cost_gems;
  const nextDailyCount = currentRefillCount + 1;

  args.setGems(nextGems);
  args.setEnergy(args.maxEnergy);
  args.setLastEnergyUpdateTime(null);
  args.setDailyEnergyRefillDate(today);
  args.setDailyEnergyRefillCount(nextDailyCount);

  Analytics.track("energy_full_refill_purchased", {
    costGems: args.config.cost_gems,
    gemsBefore,
    gemsAfter: nextGems,
    energyBefore,
    energyAfter: args.maxEnergy,
    dailyCountAfter: nextDailyCount,
  });

  return { success: true };
}

export function buyDoubleXpAction(args: {
  costGems: number;
  durationMs: number;
  gems: number;
  isDoubleXpActive: boolean;
  setDoubleXpEndTime: Dispatch<SetStateAction<number | null>>;
  setGems: Dispatch<SetStateAction<number>>;
  source: "shop_item" | "lesson_complete_nudge";
}): { success: true } | { success: false; reason: DoubleXpPurchaseFailureReason } {
  const purchase = evaluateDoubleXpPurchase({
    gems: args.gems,
    costGems: args.costGems,
    isActive: args.isDoubleXpActive,
    nowMs: Date.now(),
    durationMs: args.durationMs,
  });

  if (!purchase.success) return { success: false, reason: purchase.reason };

  const gemsBefore = args.gems;
  args.setGems(purchase.gemsAfter);
  args.setDoubleXpEndTime(purchase.activeUntilMs);

  Analytics.track("double_xp_purchased", {
    source: args.source,
    costGems: args.costGems,
    gemsBefore,
    gemsAfter: purchase.gemsAfter,
    activeUntil: new Date(purchase.activeUntilMs).toISOString(),
  });

  return { success: true };
}

export function useFreezeAction(args: {
  freezeCount: number;
  setFreezeCount: Dispatch<SetStateAction<number>>;
}): boolean {
  if (args.freezeCount <= 0) return false;
  const nextCount = args.freezeCount - 1;
  args.setFreezeCount(nextCount);
  Analytics.track("freeze_used", {
    freezesRemaining: nextCount,
    source: "streak_protection",
  });
  useFreezeStreak().catch((error) => warnDev("Failed to use freeze from streak data", error));
  return true;
}

export function consumeEnergyAction(args: {
  amount: number;
  currentEnergy: number;
  effectiveFreeMaxEnergy: number;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  setEnergy: Dispatch<SetStateAction<number>>;
  setLastEnergyUpdateTime: Dispatch<SetStateAction<number | null>>;
}): boolean {
  if (args.isSubscriptionActive) return true;
  const normalized = Math.max(0, Math.floor(args.amount));
  if (normalized === 0) return true;
  if (args.currentEnergy < normalized) return false;

  const nextEnergy = Math.max(0, args.currentEnergy - normalized);
  args.setEnergy(nextEnergy);
  if (nextEnergy < args.effectiveFreeMaxEnergy && args.lastEnergyUpdateTime === null) {
    args.setLastEnergyUpdateTime(Date.now());
  }
  return true;
}

export function addEnergyAction(args: {
  amount: number;
  currentEnergy: number;
  effectiveFreeMaxEnergy: number;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  setEnergy: Dispatch<SetStateAction<number>>;
  setLastEnergyUpdateTime: Dispatch<SetStateAction<number | null>>;
}): void {
  if (args.isSubscriptionActive) return;
  const normalized = Math.max(0, Math.floor(args.amount));
  if (normalized === 0) return;

  const nextEnergy = Math.min(args.effectiveFreeMaxEnergy, args.currentEnergy + normalized);
  args.setEnergy(nextEnergy);
  if (nextEnergy >= args.effectiveFreeMaxEnergy) {
    args.setLastEnergyUpdateTime(null);
  } else if (args.lastEnergyUpdateTime === null) {
    args.setLastEnergyUpdateTime(Date.now());
  }
}

export function tryTriggerStreakEnergyBonusAction(args: {
  correctStreak: number;
  currentEnergy: number;
  dailyEnergyBonusCount: number;
  dailyEnergyBonusDate: string;
  dailyEnergyBonusDailyCap: number;
  energyStreakBonusChance: number;
  energyStreakBonusEvery: number;
  getCurrentFreeMaxEnergy: () => number;
  isSubscriptionActive: boolean;
  randomFn?: () => number;
  setDailyEnergyBonusCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyBonusDate: Dispatch<SetStateAction<string>>;
  addEnergy: (amount: number) => void;
}): boolean {
  if (args.isSubscriptionActive) return false;
  if (args.correctStreak <= 0 || args.correctStreak % args.energyStreakBonusEvery !== 0) return false;

  const today = getTodayDate();
  const currentBonusCount =
    args.dailyEnergyBonusDate === today ? args.dailyEnergyBonusCount : 0;
  if (currentBonusCount >= args.dailyEnergyBonusDailyCap) return false;
  if ((args.randomFn ?? Math.random)() >= args.energyStreakBonusChance) return false;

  const prevEnergy = args.currentEnergy;
  const nextEnergy = Math.min(args.getCurrentFreeMaxEnergy(), prevEnergy + 1);
  args.addEnergy(1);
  args.setDailyEnergyBonusDate(today);
  args.setDailyEnergyBonusCount(currentBonusCount + 1);
  Analytics.track("energy_bonus_hit", {
    correctStreak: args.correctStreak,
    energyBefore: prevEnergy,
    energyAfter: nextEnergy,
    dailyBonusCount: currentBonusCount + 1,
    dailyBonusCap: args.dailyEnergyBonusDailyCap,
  });
  return true;
}
