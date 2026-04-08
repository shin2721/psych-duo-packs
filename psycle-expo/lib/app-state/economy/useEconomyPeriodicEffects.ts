import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getTodayDate } from "./economyUtils";

function useDailyResetEffect(args: {
  currentDate: string;
  isHydrated: boolean;
  setCount: Dispatch<SetStateAction<number>>;
  setDate: Dispatch<SetStateAction<string>>;
}): void {
  useEffect(() => {
    if (!args.isHydrated) return;
    const today = getTodayDate();
    if (args.currentDate !== today) {
      args.setDate(today);
      args.setCount(0);
    }
    const interval = setInterval(() => {
      const nextToday = getTodayDate();
      if (args.currentDate !== nextToday) {
        args.setDate(nextToday);
        args.setCount(0);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [args.currentDate, args.isHydrated, args.setCount, args.setDate]);
}

export function useEconomyPeriodicEffects(args: {
  dailyEnergyBonusDate: string;
  dailyEnergyRefillDate: string;
  dailyQuestRerollDate: string;
  isHydrated: boolean;
  setDailyEnergyBonusCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyBonusDate: Dispatch<SetStateAction<string>>;
  setDailyEnergyRefillCount: Dispatch<SetStateAction<number>>;
  setDailyEnergyRefillDate: Dispatch<SetStateAction<string>>;
  setDailyQuestRerollCount: Dispatch<SetStateAction<number>>;
  setDailyQuestRerollDate: Dispatch<SetStateAction<string>>;
}): void {
  useDailyResetEffect({
    currentDate: args.dailyEnergyBonusDate,
    isHydrated: args.isHydrated,
    setCount: args.setDailyEnergyBonusCount,
    setDate: args.setDailyEnergyBonusDate,
  });
  useDailyResetEffect({
    currentDate: args.dailyEnergyRefillDate,
    isHydrated: args.isHydrated,
    setCount: args.setDailyEnergyRefillCount,
    setDate: args.setDailyEnergyRefillDate,
  });
  useDailyResetEffect({
    currentDate: args.dailyQuestRerollDate,
    isHydrated: args.isHydrated,
    setCount: args.setDailyQuestRerollCount,
    setDate: args.setDailyQuestRerollDate,
  });
}
