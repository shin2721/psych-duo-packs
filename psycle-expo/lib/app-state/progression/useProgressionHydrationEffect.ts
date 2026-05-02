import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ComebackRewardOffer } from "../../comebackReward";
import type { EventCampaignState } from "../../eventCampaign";
import type { PersonalizationSegment } from "../../gamificationConfig";
import type { QuestCycleKeys } from "../../questCycles";
import type { QuestInstance } from "../../questDefinitions";
import type { QuestRotationSelection } from "../../questRotation";
import type { ComebackRewardToastItem } from "../../comebackRewardToastQueue";
import type { StreakMilestoneToastItem } from "../../streakMilestoneToastQueue";
import type { StreakRepairOffer } from "../../streakRepair";
import { logDev } from "../../devLog";
import { runHydrationTask } from "../hydration";
import { buildSignedOutProgressionReset, hydrateProgressionState } from "./progressionHydration";
import type { ProgressionRefs } from "./useProgressionRefs";

export function useProgressionHydrationEffect(args: {
  addGems: (amount: number) => void;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  questSchemaVersion: number;
  refs: ProgressionRefs;
  setBadgeToastQueue: Dispatch<SetStateAction<string[]>>;
  setClaimedStreakMilestones: Dispatch<SetStateAction<number[]>>;
  setComebackRewardOffer: Dispatch<SetStateAction<ComebackRewardOffer | null>>;
  setComebackRewardToastQueue: Dispatch<SetStateAction<ComebackRewardToastItem[]>>;
  setEventCampaignState: Dispatch<SetStateAction<EventCampaignState | null>>;
  setFriendCount: Dispatch<SetStateAction<number>>;
  setIsStateHydrated: Dispatch<SetStateAction<boolean>>;
  setLeaderboardRank: Dispatch<SetStateAction<number>>;
  setPersonalizationAssignedAtMs: Dispatch<SetStateAction<number | null>>;
  setPersonalizationSegment: Dispatch<SetStateAction<PersonalizationSegment>>;
  setQuestCycleKeys: Dispatch<SetStateAction<QuestCycleKeys>>;
  setQuestRotationPrev: Dispatch<SetStateAction<QuestRotationSelection>>;
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
  setSelectedGenre: Dispatch<SetStateAction<string>>;
  setStreak: Dispatch<SetStateAction<number>>;
  setStreakMilestoneToastQueue: Dispatch<SetStateAction<StreakMilestoneToastItem[]>>;
  setStreakRepairOffer: Dispatch<SetStateAction<StreakRepairOffer | null>>;
  setXP: Dispatch<SetStateAction<number>>;
  userId?: string | null;
}): void {
  useEffect(() => {
    if (!args.userId) {
      const resetState = buildSignedOutProgressionReset();
      args.setIsStateHydrated(false);
      args.setBadgeToastQueue(resetState.badgeToastQueue);
      args.setStreakMilestoneToastQueue(resetState.streakMilestoneToastQueue);
      args.setComebackRewardToastQueue(resetState.comebackRewardToastQueue);
      args.setClaimedStreakMilestones(resetState.claimedStreakMilestones);
      args.setQuests(resetState.quests);
      args.refs.questsRef.current = resetState.quests;
      args.setQuestCycleKeys(resetState.questCycleKeys);
      args.refs.questCycleKeysRef.current = resetState.questCycleKeys;
      args.setQuestRotationPrev(resetState.questRotationPrev);
      args.refs.questRotationPrevRef.current = resetState.questRotationPrev;
      args.setEventCampaignState(resetState.eventCampaignState);
      args.refs.eventCampaignStateRef.current = resetState.eventCampaignState;
      args.setPersonalizationSegment(resetState.personalizationSegment);
      args.refs.personalizationSegmentRef.current = resetState.personalizationSegment;
      args.setPersonalizationAssignedAtMs(resetState.personalizationAssignedAtMs);
      args.refs.personalizationAssignedAtMsRef.current = resetState.personalizationAssignedAtMs;
      args.refs.liveOpsActivationRef.current = null;
      args.refs.badgeToastQueueRef.current = resetState.badgeToastQueue;
      args.refs.streakMilestoneToastQueueRef.current = resetState.streakMilestoneToastQueue;
      args.refs.comebackRewardToastQueueRef.current = resetState.comebackRewardToastQueue;
      args.refs.claimedStreakMilestonesRef.current = resetState.claimedStreakMilestones;
      args.setXP(resetState.xp);
      args.setStreak(resetState.streak);
      args.setFriendCount(resetState.friendCount);
      args.setLeaderboardRank(resetState.leaderboardRank);
      args.setStreakRepairOffer(resetState.streakRepairOffer);
      args.setComebackRewardOffer(resetState.comebackRewardOffer);
      args.setSelectedGenre(resetState.selectedGenre);
      return;
    }

    const userId = args.userId;

    return runHydrationTask({
      setIsHydrated: args.setIsStateHydrated,
      task: async ({ isCancelled }) => {
        const hydrated = await hydrateProgressionState({
          userId,
          questSchemaVersion: args.questSchemaVersion,
          claimBonusGemsByType: args.claimBonusGemsByType,
        });
        if (isCancelled()) return;

        if (hydrated.savedXp !== null) args.setXP(hydrated.savedXp);
        if (hydrated.savedStreak !== null) args.setStreak(hydrated.savedStreak);
        if (hydrated.pendingAutoClaimXp > 0) args.setXP((prev) => prev + hydrated.pendingAutoClaimXp);
        if (hydrated.pendingAutoClaimGems > 0) args.addGems(hydrated.pendingAutoClaimGems);

        args.setPersonalizationSegment(hydrated.personalizationSegment);
        args.refs.personalizationSegmentRef.current = hydrated.personalizationSegment;
        args.setPersonalizationAssignedAtMs(hydrated.personalizationAssignedAtMs);
        args.refs.personalizationAssignedAtMsRef.current = hydrated.personalizationAssignedAtMs;
        args.setSelectedGenre(hydrated.selectedGenre);

        args.setQuests(hydrated.quests);
        args.refs.questsRef.current = hydrated.quests;
        args.setQuestCycleKeys(hydrated.questCycleKeys);
        args.refs.questCycleKeysRef.current = hydrated.questCycleKeys;
        args.setQuestRotationPrev(hydrated.questRotationPrev);
        args.refs.questRotationPrevRef.current = hydrated.questRotationPrev;
        args.setEventCampaignState(hydrated.eventCampaignState);
        args.refs.eventCampaignStateRef.current = hydrated.eventCampaignState;
        args.setClaimedStreakMilestones(hydrated.claimedStreakMilestones);
        args.refs.claimedStreakMilestonesRef.current = hydrated.claimedStreakMilestones;
        args.setStreakRepairOffer(hydrated.streakRepairOffer);
        args.setComebackRewardOffer(hydrated.comebackRewardOffer);

        if (hydrated.remoteSnapshot) {
          if (hydrated.remoteSnapshot.xp !== null) args.setXP(hydrated.remoteSnapshot.xp);
          if (hydrated.remoteSnapshot.streak !== null) args.setStreak(hydrated.remoteSnapshot.streak);
          args.setFriendCount(hydrated.remoteSnapshot.friendCount);
          args.setLeaderboardRank(hydrated.remoteSnapshot.leaderboardRank);
        }
      },
      onError: (error) => {
        logDev("Progression local storage read failed:", error);
      },
    });
  }, [
    args.addGems,
    args.claimBonusGemsByType,
    args.questSchemaVersion,
    args.refs,
    args.setBadgeToastQueue,
    args.setClaimedStreakMilestones,
    args.setComebackRewardOffer,
    args.setComebackRewardToastQueue,
    args.setEventCampaignState,
    args.setFriendCount,
    args.setIsStateHydrated,
    args.setLeaderboardRank,
    args.setPersonalizationAssignedAtMs,
    args.setPersonalizationSegment,
    args.setQuestCycleKeys,
    args.setQuestRotationPrev,
    args.setQuests,
    args.setSelectedGenre,
    args.setStreak,
    args.setStreakMilestoneToastQueue,
    args.setStreakRepairOffer,
    args.setXP,
    args.userId,
  ]);
}
