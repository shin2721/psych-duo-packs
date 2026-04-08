import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { addWeeklyXp } from "../../league";
import { warnDev } from "../../devLog";

export async function addXpAction(args: {
  addGems: (amount: number) => void;
  amount: number;
  dailyGoal: number;
  dailyGoalRewardGems: number;
  isDoubleXpActive: boolean;
  setDailyXP: Dispatch<SetStateAction<number>>;
  setXP: Dispatch<SetStateAction<number>>;
  updateStreak: () => void;
  updateStreakForToday: (currentXP?: number) => Promise<void>;
  userId?: string | null;
  xp: number;
}): Promise<void> {
  const effectiveAmount = args.isDoubleXpActive ? args.amount * 2 : args.amount;
  const newXP = args.xp + effectiveAmount;
  args.setXP(newXP);
  args.setDailyXP((prev) => {
    const newDailyXP = prev + effectiveAmount;
    if (prev < args.dailyGoal && newDailyXP >= args.dailyGoal) {
      if (args.dailyGoalRewardGems > 0) args.addGems(args.dailyGoalRewardGems);
      Analytics.track("daily_goal_reached", {
        dailyGoal: args.dailyGoal,
        dailyXp: newDailyXP,
        gemsAwarded: args.dailyGoalRewardGems,
        source: "xp_gain",
      });
    }
    return newDailyXP;
  });

  args.updateStreak();
  void args.updateStreakForToday(newXP);

  if (args.userId) {
    try {
      await addWeeklyXp(args.userId, effectiveAmount);
    } catch (error) {
      warnDev("[League] Failed to add weekly XP:", error);
    }
  }
}
