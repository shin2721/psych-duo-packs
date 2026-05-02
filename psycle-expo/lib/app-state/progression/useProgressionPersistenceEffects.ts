import { useEffect } from "react";
import type { EventCampaignState } from "../../eventCampaign";
import type { PersonalizationSegment } from "../../gamificationConfig";
import type { QuestCycleKeys } from "../../questCycles";
import type { QuestInstance } from "../../questDefinitions";
import type { QuestRotationSelection } from "../../questRotation";
import type { ComebackRewardOffer } from "../../comebackReward";
import type { StreakRepairOffer } from "../../streakRepair";
import { warnDev } from "../../devLog";
import { syncProfileStreak, syncProfileXp } from "../progressionRemote";
import {
  createPersistJsonEffect,
  createPersistNumberEffect,
  createPersistStringEffect,
} from "../persistEffects";

export function useProgressionPersistenceEffects(args: {
  eventCampaignState: EventCampaignState | null;
  personalizationAssignedAtMs: number | null;
  personalizationSegment: PersonalizationSegment;
  isStateHydrated: boolean;
  questCycleKeys: QuestCycleKeys;
  questRotationPrev: QuestRotationSelection;
  questSchemaVersion: number;
  quests: QuestInstance[];
  selectedGenre: string;
  streak: number;
  streakRepairOffer: StreakRepairOffer | null;
  comebackRewardOffer: ComebackRewardOffer | null;
  claimedStreakMilestones: number[];
  userId?: string | null;
  xp: number;
}): void {
  useEffect(() => {
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "xp",
      value: args.xp,
    });
    if (!args.userId || !args.isStateHydrated) return;
    const timer = setTimeout(() => {
      syncProfileXp(args.userId, args.xp).catch((error) => {
        warnDev("Failed to sync XP to Supabase", error);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [args.isStateHydrated, args.userId, args.xp]);

  useEffect(() => {
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "streak",
      value: args.streak,
    });
    if (!args.userId || !args.isStateHydrated) return;
    syncProfileStreak(args.userId, args.streak).catch((error) => {
      if (error) warnDev("Failed to sync streak to Supabase", error);
    });
  }, [args.isStateHydrated, args.streak, args.userId]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "quests",
      value: args.quests,
    });
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "questCycleKeys",
      value: args.questCycleKeys,
    });
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "questRotationPrev",
      value: args.questRotationPrev,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "questSchemaVersion",
      value: args.questSchemaVersion,
    });
  }, [
    args.isStateHydrated,
    args.questCycleKeys,
    args.questRotationPrev,
    args.questSchemaVersion,
    args.quests,
    args.userId,
  ]);

  useEffect(() => {
    createPersistStringEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "selectedGenre",
      value: args.selectedGenre,
    });
  }, [args.isStateHydrated, args.selectedGenre, args.userId]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "streakRepairOffer",
      value: args.streakRepairOffer,
    });
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "comebackRewardOffer",
      value: args.comebackRewardOffer,
    });
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "streakMilestonesClaimed",
      value: args.claimedStreakMilestones,
    });
  }, [
    args.claimedStreakMilestones,
    args.comebackRewardOffer,
    args.isStateHydrated,
    args.streakRepairOffer,
    args.userId,
  ]);

  useEffect(() => {
    createPersistJsonEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "eventCampaignState",
      value: args.eventCampaignState,
    });
    createPersistStringEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "personalizationSegment",
      value: args.personalizationSegment,
    });
    createPersistNumberEffect({
      userId: args.userId,
      isHydrated: args.isStateHydrated,
      key: "personalizationSegmentAssignedAt",
      value: args.personalizationAssignedAtMs,
    });
  }, [
    args.eventCampaignState,
    args.isStateHydrated,
    args.personalizationAssignedAtMs,
    args.personalizationSegment,
    args.userId,
  ]);
}
