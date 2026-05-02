import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { enqueueComebackRewardToast } from "../../comebackRewardToastQueue";
import type { ComebackRewardToastItem } from "../../comebackRewardToastQueue";
import type {
  PersonalizationConfig,
  PersonalizationSegment,
  StreakMilestonesConfig,
} from "../../gamificationConfig";
import { normalizeClaimedMilestones } from "../../streakMilestones";
import { enqueueStreakMilestoneToast, type StreakMilestoneToastItem } from "../../streakMilestoneToastQueue";
import type { ComebackRewardOffer } from "../../comebackReward";
import type { StreakRepairOffer } from "../../streakRepair";
import { claimComebackRewardAction, computeInlineStreakUpdate, computeStreakForTodayUpdate, purchaseStreakRepairAction } from "./progressionStreak";
import type { ProgressionRefs } from "./useProgressionRefs";
import { getTodayDate, getYesterdayDate } from "./progressionUtils";
import { isTrackedStreakMilestoneDay } from "../progressionLiveOps";
import { syncStreakAndLeaderboard } from "../progressionRemote";

function getEngagementAppEnv(): "dev" | "prod" {
  return typeof __DEV__ !== "undefined" && __DEV__ ? "dev" : "prod";
}

export function purchaseStreakRepairEntry(args: {
  gems: number;
  offer: StreakRepairOffer | null;
  setGemsDirectly: (amount: number) => void;
  setStreak: Dispatch<SetStateAction<number>>;
  setStreakRepairOffer: Dispatch<SetStateAction<StreakRepairOffer | null>>;
  streak: number;
  streakRepairCostGems: number;
}):
  | { success: false; reason?: "no_offer" | "expired" | "insufficient_gems" }
  | { success: true } {
  const result = purchaseStreakRepairAction({
    offer: args.offer,
    gems: args.gems,
    currentStreak: args.streak,
    nowMs: Date.now(),
  });

  if (!result.success) {
    if (result.reason === "expired" && args.offer?.active) {
      Analytics.track("streak_repair_expired", {
        previousStreak: args.offer.previousStreak,
        expiredAt: new Date(args.offer.expiresAtMs).toISOString(),
      });
      args.setStreakRepairOffer(null);
    }
    return { success: false as const, reason: result.reason };
  }

  const gemsBefore = args.gems;
  args.setGemsDirectly(result.nextGems);
  args.setStreak(result.restoredStreak);
  args.setStreakRepairOffer(result.nextOffer);

  Analytics.track("streak_repair_purchased", {
    previousStreak: result.restoredStreak,
    costGems: args.offer?.costGems ?? args.streakRepairCostGems,
    gemsBefore,
    gemsAfter: result.nextGems,
  });

  return { success: true as const };
}

export function claimComebackRewardEntry(args: {
  addEnergy: (amount: number) => void;
  addGems: (amount: number) => void;
  comebackRewardOffer: ComebackRewardOffer | null;
  enqueueToast: Dispatch<SetStateAction<ComebackRewardToastItem[]>>;
  isSubscriptionActive: boolean;
  setComebackRewardOffer: Dispatch<SetStateAction<ComebackRewardOffer | null>>;
}):
  | { awarded: false; reason?: "no_offer" | "expired" | "already_claimed" | "subscription_excluded" }
  | { awarded: true } {
  const claimResult = claimComebackRewardAction({
    offer: args.comebackRewardOffer,
    isSubscriptionActive: args.isSubscriptionActive,
    todayDateKey: getTodayDate(),
  });

  if (!claimResult.awarded) {
    if (claimResult.reason === "expired" && args.comebackRewardOffer) {
      if (args.comebackRewardOffer.active) {
        Analytics.track("comeback_reward_expired", {
          daysSinceStudy: args.comebackRewardOffer.daysSinceStudy,
          expiredAt: new Date(args.comebackRewardOffer.expiresAtMs).toISOString(),
          source: "offer_expiry",
        });
      }
      args.setComebackRewardOffer(claimResult.nextOffer);
    }
    return { awarded: false as const, reason: claimResult.reason };
  }

  args.addEnergy(claimResult.rewardEnergy);
  if (claimResult.rewardGems > 0) args.addGems(claimResult.rewardGems);
  args.setComebackRewardOffer(claimResult.nextOffer);
  args.enqueueToast((prev) =>
    enqueueComebackRewardToast(prev, {
      rewardEnergy: claimResult.rewardEnergy,
      rewardGems: claimResult.rewardGems,
    })
  );
  Analytics.track("comeback_reward_claimed", {
    rewardEnergy: claimResult.rewardEnergy,
    rewardGems: claimResult.rewardGems,
    daysSinceStudy: args.comebackRewardOffer?.daysSinceStudy ?? 0,
    source: "lesson_complete",
  });
  const sourceEventId = `comeback_reward_claimed:${args.comebackRewardOffer?.triggerDate ?? getTodayDate()}`;
  Analytics.track("engagement_reward_granted", {
    rewardType: "energy",
    rewardAmount: claimResult.rewardEnergy,
    sourceEventName: "comeback_reward_claimed",
    sourceEventId,
    idempotencyKey: `${sourceEventId}:energy`,
    surface: "comeback_reward",
    appEnv: getEngagementAppEnv(),
  });
  if (claimResult.rewardGems > 0) {
    Analytics.track("engagement_reward_granted", {
      rewardType: "gems",
      rewardAmount: claimResult.rewardGems,
      sourceEventName: "comeback_reward_claimed",
      sourceEventId,
      idempotencyKey: `${sourceEventId}:gems`,
      surface: "comeback_reward",
      appEnv: getEngagementAppEnv(),
    });
  }
  return { awarded: true as const };
}

export async function updateStreakForTodayEntry(args: {
  addGems: (amount: number) => void;
  claimedStreakMilestonesRef: ProgressionRefs["claimedStreakMilestonesRef"];
  comebackRewardEnergy: number;
  comebackRewardGems: number;
  comebackRewardThresholdDays: number;
  currentXp: number;
  freezeCount: number;
  isSubscriptionActive: boolean;
  lastActivityDate: string | null;
  personalizationConfig: PersonalizationConfig;
  personalizationSegment: PersonalizationSegment;
  setComebackRewardOffer: Dispatch<SetStateAction<ComebackRewardOffer | null>>;
  setFreezeCountRaw: (count: number) => void;
  setStreak: Dispatch<SetStateAction<number>>;
  setStreakMilestoneToastQueue: Dispatch<SetStateAction<StreakMilestoneToastItem[]>>;
  setStreakRepairOffer: Dispatch<SetStateAction<StreakRepairOffer | null>>;
  setLastActivityDate: Dispatch<SetStateAction<string | null>>;
  setClaimedStreakMilestones: Dispatch<SetStateAction<number[]>>;
  streak: number;
  streakMilestonesConfig: StreakMilestonesConfig;
  streakRepairCostGems: number;
  streakRepairWindowMs: number;
  user?: { id?: string | null; email?: string | null } | null;
}): Promise<void> {
  const update = computeStreakForTodayUpdate({
    lastActivityDate: args.lastActivityDate,
    streak: args.streak,
    freezeCount: args.freezeCount,
    isSubscriptionActive: args.isSubscriptionActive,
    personalizationSegment: args.personalizationSegment,
    personalizationConfig: args.personalizationConfig,
    comebackRewardThresholdDays: args.comebackRewardThresholdDays,
    comebackRewardEnergy: args.comebackRewardEnergy,
    comebackRewardGems: args.comebackRewardGems,
    claimedMilestones: args.claimedStreakMilestonesRef.current,
    streakMilestonesConfig: args.streakMilestonesConfig,
    streakRepairCostGems: args.streakRepairCostGems,
    streakRepairWindowMs: args.streakRepairWindowMs,
    currentXp: args.currentXp,
    todayDate: getTodayDate(),
    yesterdayDate: getYesterdayDate(),
  });

  if (update.skipped) return;

  if (update.nextFreezeCount !== null) {
    args.setFreezeCountRaw(update.nextFreezeCount);
  }

  args.setStreak(update.nextStreak);
  args.setLastActivityDate(update.nextLastActivityDate);
  args.setStreakRepairOffer(update.streakRepairOffer);
  args.setComebackRewardOffer(update.comebackRewardOffer);

  if (update.streakRepairOffered) {
    Analytics.track("streak_repair_offered", {
      previousStreak: update.streakRepairOffered.previousStreak,
      costGems: update.streakRepairOffered.costGems,
      expiresAt: new Date(update.streakRepairOffered.expiresAtMs).toISOString(),
    });
  }

  if (update.comebackRewardOffered) {
    Analytics.track("comeback_reward_offered", {
      daysSinceStudy: update.comebackRewardOffered.daysSinceStudy,
      rewardEnergy: update.comebackRewardOffered.rewardEnergy,
      rewardGems: update.comebackRewardOffered.rewardGems,
      thresholdDays: args.comebackRewardThresholdDays,
      source: "streak_update",
    });
  }

  if (update.claimableMilestone) {
    const claimableMilestone = update.claimableMilestone;
    const nextClaimedMilestones = normalizeClaimedMilestones([
      ...args.claimedStreakMilestonesRef.current,
      claimableMilestone.day,
    ]);
    args.claimedStreakMilestonesRef.current = nextClaimedMilestones;
    args.setClaimedStreakMilestones(nextClaimedMilestones);
    args.addGems(claimableMilestone.gems);
    args.setStreakMilestoneToastQueue((prev) => enqueueStreakMilestoneToast(prev, claimableMilestone));

    if (isTrackedStreakMilestoneDay(claimableMilestone.day)) {
      const sourceEventId = `streak_milestone_rewarded:${claimableMilestone.day}`;
      Analytics.track("streak_milestone_rewarded", {
        day: claimableMilestone.day,
        rewardGems: claimableMilestone.gems,
        source: "streak_update",
        lifetimeOnce: true,
      });
      Analytics.track("engagement_reward_granted", {
        rewardType: "gems",
        rewardAmount: claimableMilestone.gems,
        sourceEventName: "streak_milestone_rewarded",
        sourceEventId,
        idempotencyKey: `${sourceEventId}:gems`,
        surface: "streak_milestone",
        appEnv: getEngagementAppEnv(),
      });
    }
  }

  if (args.user?.id) {
    try {
      await syncStreakAndLeaderboard(args.user.id, {
        ...update.syncPayload,
        username: args.user.email?.split("@")[0] || "User",
      });
    } catch (error) {
      console.error("Error updating streak in Supabase:", error);
    }
  }
}

export function updateInlineStreakAction(args: {
  freezeCount: number;
  lastStudyDate: string | null;
  setFreezeCountRaw: (count: number) => void;
  setLastStudyDate: Dispatch<SetStateAction<string | null>>;
  setStreak: Dispatch<SetStateAction<number>>;
  streak: number;
}): void {
  const nextState = computeInlineStreakUpdate({
    lastStudyDate: args.lastStudyDate,
    streak: args.streak,
    freezeCount: args.freezeCount,
    todayDate: getTodayDate(),
    yesterdayDate: getYesterdayDate(),
  });
  if (!nextState) return;

  if (nextState.nextFreezeCount !== null) {
    args.setFreezeCountRaw(nextState.nextFreezeCount);
  }
  args.setStreak(nextState.nextStreak);
  args.setLastStudyDate(nextState.nextLastStudyDate);
}
