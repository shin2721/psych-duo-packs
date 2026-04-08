import { useEffect } from "react";
import { warnDev } from "../../devLog";
import { syncProfileGems } from "../economyRemote";
import { createPersistNumberEffect, createPersistStringEffect } from "../persistEffects";

export function useEconomyPersistenceEffects(args: {
  dailyEnergyBonusCount: number;
  dailyEnergyBonusDate: string;
  dailyEnergyRefillCount: number;
  dailyEnergyRefillDate: string;
  dailyQuestRerollCount: number;
  dailyQuestRerollDate: string;
  energy: number;
  firstLaunchAtMs: number | null;
  gems: number;
  isHydrated: boolean;
  lastEnergyUpdateTime: number | null;
  userId?: string | null;
}): void {
  useEffect(() => {
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "gems",
      value: args.gems,
    });
    if (!args.userId || !args.isHydrated) return;
    syncProfileGems(args.userId, args.gems).catch((error) => {
      if (error) warnDev("Failed to sync gems to Supabase", error);
    });
  }, [args.gems, args.isHydrated, args.userId]);

  useEffect(() => {
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energy",
      value: args.energy,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energyUpdateTime",
      value: args.lastEnergyUpdateTime,
    });
  }, [args.energy, args.isHydrated, args.lastEnergyUpdateTime, args.userId]);

  useEffect(() => {
    createPersistStringEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energyBonusDate",
      value: args.dailyEnergyBonusDate,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energyBonusCount",
      value: args.dailyEnergyBonusCount,
    });
    createPersistStringEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energyRefillDate",
      value: args.dailyEnergyRefillDate,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "energyRefillCount",
      value: args.dailyEnergyRefillCount,
    });
    createPersistStringEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "questRerollDate",
      value: args.dailyQuestRerollDate,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "questRerollCount",
      value: args.dailyQuestRerollCount,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isHydrated,
      key: "firstLaunchAt",
      value: args.firstLaunchAtMs,
    });
  }, [
    args.dailyEnergyBonusCount,
    args.dailyEnergyBonusDate,
    args.dailyEnergyRefillCount,
    args.dailyEnergyRefillDate,
    args.dailyQuestRerollCount,
    args.dailyQuestRerollDate,
    args.firstLaunchAtMs,
    args.isHydrated,
    args.userId,
  ]);
}
