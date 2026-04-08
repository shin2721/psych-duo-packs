import {
  canClaimComebackReward,
  createComebackRewardOffer,
  type ComebackClaimFailureReason,
  type ComebackRewardOffer,
} from "../../comebackReward";
import type { PersonalizationConfig, StreakMilestonesConfig } from "../../gamificationConfig";
import { getAdjustedComebackReward } from "../../personalization";
import {
  createStreakRepairOffer,
  purchaseStreakRepairOffer,
  type StreakRepairFailureReason,
  type StreakRepairOffer,
} from "../../streakRepair";
import {
  getClaimableStreakMilestone,
  type ClaimableStreakMilestone,
} from "../../streakMilestones";
import type { PersonalizationSegment } from "../../gamificationConfig";
import { getDaysSinceDate } from "../progressionLiveOps";

export function computeInlineStreakUpdate(args: {
  lastStudyDate: string | null;
  streak: number;
  freezeCount: number;
  todayDate: string;
  yesterdayDate: string;
}): {
  nextStreak: number;
  nextLastStudyDate: string;
  nextFreezeCount: number | null;
} | null {
  if (args.lastStudyDate === args.todayDate) {
    return null;
  }

  if (args.lastStudyDate === args.yesterdayDate) {
    return {
      nextStreak: args.streak + 1,
      nextLastStudyDate: args.todayDate,
      nextFreezeCount: null,
    };
  }

  if (args.lastStudyDate === null) {
    return {
      nextStreak: 1,
      nextLastStudyDate: args.todayDate,
      nextFreezeCount: null,
    };
  }

  if (args.freezeCount > 0) {
    return {
      nextStreak: args.streak + 1,
      nextLastStudyDate: args.todayDate,
      nextFreezeCount: args.freezeCount - 1,
    };
  }

  return null;
}

export function computeStreakForTodayUpdate(args: {
  lastActivityDate: string | null;
  streak: number;
  freezeCount: number;
  isSubscriptionActive: boolean;
  personalizationSegment: PersonalizationSegment;
  personalizationConfig: PersonalizationConfig;
  comebackRewardThresholdDays: number;
  comebackRewardEnergy: number;
  comebackRewardGems: number;
  claimedMilestones: number[];
  streakMilestonesConfig: StreakMilestonesConfig;
  streakRepairCostGems: number;
  streakRepairWindowMs: number;
  currentXp: number;
  todayDate: string;
  yesterdayDate: string;
  nowMs?: number;
}):
  | { skipped: true }
  | {
      skipped: false;
      nextStreak: number;
      nextLastActivityDate: string;
      nextFreezeCount: number | null;
      streakRepairOffer: StreakRepairOffer | null;
      streakRepairOffered: StreakRepairOffer | null;
      comebackRewardOffer: ComebackRewardOffer | null;
      comebackRewardOffered: ComebackRewardOffer | null;
      claimableMilestone: ClaimableStreakMilestone | null;
      daysSinceStudy: number;
      syncPayload: {
        date: string;
        lessonsCompleted: number;
        xpEarned: number;
        totalXp: number;
        currentStreak: number;
      };
    } {
  const nowMs = args.nowMs ?? Date.now();
  const previousStreak = args.streak;
  const daysSinceStudy = getDaysSinceDate(args.lastActivityDate);

  if (args.lastActivityDate === args.todayDate) {
    return { skipped: true };
  }

  let nextStreak = args.streak;
  let nextFreezeCount: number | null = null;
  let streakRepairOffer: StreakRepairOffer | null = null;
  let streakRepairOffered: StreakRepairOffer | null = null;

  if (args.lastActivityDate === args.yesterdayDate) {
    nextStreak = args.streak + 1;
  } else if (args.lastActivityDate === null) {
    nextStreak = 1;
  } else if (args.freezeCount > 0) {
    nextFreezeCount = args.freezeCount - 1;
    nextStreak = args.streak + 1;
  } else {
    nextStreak = 1;
    streakRepairOffer = createStreakRepairOffer(previousStreak, nowMs, {
      costGems: args.streakRepairCostGems,
      windowMs: args.streakRepairWindowMs,
    });
    streakRepairOffered = streakRepairOffer;
  }

  let comebackRewardOffer: ComebackRewardOffer | null = null;
  let comebackRewardOffered: ComebackRewardOffer | null = null;

  if (!args.isSubscriptionActive) {
    const adjustedComebackReward = getAdjustedComebackReward(
      args.comebackRewardEnergy,
      args.personalizationSegment,
      args.personalizationConfig
    );

    if (adjustedComebackReward > 0) {
      comebackRewardOffer = createComebackRewardOffer({
        daysSinceStudy,
        thresholdDays: args.comebackRewardThresholdDays,
        rewardEnergy: adjustedComebackReward,
        rewardGems: args.comebackRewardGems,
      });
      comebackRewardOffered = comebackRewardOffer;
    }
  }

  return {
    skipped: false,
    nextStreak,
    nextLastActivityDate: args.todayDate,
    nextFreezeCount,
    streakRepairOffer,
    streakRepairOffered,
    comebackRewardOffer,
    comebackRewardOffered,
    claimableMilestone: getClaimableStreakMilestone({
      newStreak: nextStreak,
      claimedMilestones: args.claimedMilestones,
      config: args.streakMilestonesConfig,
    }),
    daysSinceStudy,
    syncPayload: {
      date: args.todayDate,
      lessonsCompleted: 1,
      xpEarned: 0,
      totalXp: args.currentXp,
      currentStreak: nextStreak,
    },
  };
}

export function purchaseStreakRepairAction(args: {
  offer: StreakRepairOffer | null;
  gems: number;
  currentStreak: number;
  nowMs?: number;
}): {
  success: boolean;
  reason?: StreakRepairFailureReason;
  nextOffer: StreakRepairOffer | null;
  nextGems: number;
  restoredStreak: number;
} {
  return purchaseStreakRepairOffer(args);
}

export function claimComebackRewardAction(args: {
  offer: ComebackRewardOffer | null;
  isSubscriptionActive: boolean;
  todayDateKey: string;
}):
  | {
      awarded: false;
      reason: ComebackClaimFailureReason;
      nextOffer: ComebackRewardOffer | null;
    }
  | {
      awarded: true;
      rewardEnergy: number;
      rewardGems: number;
      nextOffer: ComebackRewardOffer;
    } {
  const claimResult = canClaimComebackReward({
    offer: args.offer,
    isSubscriptionActive: args.isSubscriptionActive,
    todayDateKey: args.todayDateKey,
  });

  if (!claimResult.claimable || !args.offer) {
    return {
      awarded: false,
      reason: claimResult.reason ?? "no_offer",
      nextOffer: claimResult.reason === "expired" ? null : args.offer,
    };
  }

  return {
    awarded: true,
    rewardEnergy: Math.max(1, Math.floor(args.offer.rewardEnergy)),
    rewardGems: Math.max(0, Math.floor(args.offer.rewardGems ?? 0)),
    nextOffer: { ...args.offer, active: false },
  };
}
