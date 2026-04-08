import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { isComebackOfferExpired, type ComebackRewardOffer } from "../../comebackReward";
import { getTodayDate } from "./progressionUtils";

export function useProgressionPeriodicEffects(args: {
  dailyGoalLastReset: string;
  isStateHydrated: boolean;
  reconcileEventCampaign: () => void;
  reconcileQuestCycles: (source?: "cycle_reconcile" | "schema_migration") => void;
  setComebackRewardOffer: Dispatch<SetStateAction<ComebackRewardOffer | null>>;
  setDailyGoalLastReset: Dispatch<SetStateAction<string>>;
  setDailyXP: Dispatch<SetStateAction<number>>;
  userId?: string | null;
}): void {
  useEffect(() => {
    if (!args.userId || !args.isStateHydrated) return;
    args.reconcileQuestCycles("cycle_reconcile");
    args.reconcileEventCampaign();
    const interval = setInterval(() => {
      args.reconcileQuestCycles("cycle_reconcile");
      args.reconcileEventCampaign();
    }, 60000);
    return () => clearInterval(interval);
  }, [args.isStateHydrated, args.reconcileEventCampaign, args.reconcileQuestCycles, args.userId]);

  useEffect(() => {
    if (!args.userId || !args.isStateHydrated) return;
    const interval = setInterval(() => {
      args.setComebackRewardOffer((prev) => {
        if (!prev) return prev;
        if (!isComebackOfferExpired(prev)) return prev;

        if (prev.active) {
          Analytics.track("comeback_reward_expired", {
            daysSinceStudy: prev.daysSinceStudy,
            expiredAt: new Date(prev.expiresAtMs).toISOString(),
            source: "offer_expiry",
          });
        }
        return null;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [args.isStateHydrated, args.setComebackRewardOffer, args.userId]);

  useEffect(() => {
    const today = getTodayDate();
    if (args.dailyGoalLastReset !== today) {
      args.setDailyXP(0);
      args.setDailyGoalLastReset(today);
    }
  }, [args.dailyGoalLastReset, args.setDailyGoalLastReset, args.setDailyXP]);
}
