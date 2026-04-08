import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import { enqueueBadgeToastIds } from "../../badgeToastQueue";
import { warnDev } from "../../devLog";
import type { EventCampaignState, EventQuestInstance } from "../../eventCampaign";
import type { EventQuestMetric, PersonalizationSegment } from "../../gamificationConfig";
import { getQuestCycleKeys, type QuestCycleKeys, areQuestCycleKeysEqual } from "../../questCycles";
import type { QuestInstance, QuestMetric } from "../../questDefinitions";
import { applyQuestMetricProgress, type QuestRotationSelection } from "../../questRotation";
import {
  adjustQuestNeedsBySegment,
  claimQuestState,
  openClaimedQuestChestState,
  reconcileQuestCyclesState,
  rerollQuestState,
} from "../progressionQuests";
import { getActiveEventCampaignConfig } from "../progressionLiveOps";
import { awardEventCompletionBadge } from "./progressionBadges";
import { progressEventCampaignMetric, reconcileEventCampaignState } from "./progressionEvents";
import type { ProgressionRefs } from "./useProgressionRefs";
import { getTodayDate } from "./progressionUtils";

export function reconcileQuestCyclesAction(args: {
  addGems: (amount: number) => void;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  personalizationSegment: PersonalizationSegment;
  questCycleKeysRef: ProgressionRefs["questCycleKeysRef"];
  questRotationPrevRef: ProgressionRefs["questRotationPrevRef"];
  questsRef: ProgressionRefs["questsRef"];
  setQuestCycleKeys: Dispatch<SetStateAction<QuestCycleKeys>>;
  setQuestRotationPrev: Dispatch<SetStateAction<QuestRotationSelection>>;
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
  setXP: Dispatch<SetStateAction<number>>;
  source?: "cycle_reconcile" | "schema_migration";
}): void {
  const source = args.source ?? "cycle_reconcile";
  const prevKeys = args.questCycleKeysRef.current;
  const nextKeys = getQuestCycleKeys();

  const reconcileResult = reconcileQuestCyclesState({
    quests: args.questsRef.current,
    prevKeys,
    nextKeys,
    previousSelection: args.questRotationPrevRef.current,
    claimBonusGemsByType: args.claimBonusGemsByType,
  });

  if (reconcileResult.changedTypes.length > 0) {
    const adjustedQuests = adjustQuestNeedsBySegment(
      reconcileResult.quests,
      args.personalizationSegment
    );
    args.questsRef.current = adjustedQuests;
    args.setQuests(adjustedQuests);
    args.questRotationPrevRef.current = reconcileResult.selection;
    args.setQuestRotationPrev(reconcileResult.selection);

    if (reconcileResult.autoClaimed.totalRewardXp > 0) {
      args.setXP((prev) => prev + reconcileResult.autoClaimed.totalRewardXp);
    }
    if (reconcileResult.autoClaimed.totalRewardGems > 0) {
      args.addGems(reconcileResult.autoClaimed.totalRewardGems);
    }

    if (source === "cycle_reconcile") {
      Analytics.track("quest_cycle_reset", {
        dailyReset: reconcileResult.changedTypes.includes("daily"),
        weeklyReset: reconcileResult.changedTypes.includes("weekly"),
        monthlyReset: reconcileResult.changedTypes.includes("monthly"),
        source: "cycle_reconcile",
      });
    }

    Analytics.track("quest_rotation_applied", {
      dailyChanged: reconcileResult.changedTypes.includes("daily"),
      weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
      monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
      dailyCount: adjustedQuests.filter((quest) => quest.type === "daily").length,
      weeklyCount: adjustedQuests.filter((quest) => quest.type === "weekly").length,
      source,
    });

    if (reconcileResult.autoClaimed.claimedCount > 0) {
      Analytics.track("quest_auto_claimed_on_cycle", {
        claimedCount: reconcileResult.autoClaimed.claimedCount,
        totalRewardXp: reconcileResult.autoClaimed.totalRewardXp,
        totalRewardGems: reconcileResult.autoClaimed.totalRewardGems,
        dailyChanged: reconcileResult.changedTypes.includes("daily"),
        weeklyChanged: reconcileResult.changedTypes.includes("weekly"),
        monthlyChanged: reconcileResult.changedTypes.includes("monthly"),
        source,
      });
    }
  }

  if (!areQuestCycleKeysEqual(prevKeys, nextKeys)) {
    args.questCycleKeysRef.current = nextKeys;
    args.setQuestCycleKeys(nextKeys);
  }
}

export function reconcileEventCampaignAction(args: {
  eventCampaignStateRef: ProgressionRefs["eventCampaignStateRef"];
  liveOpsActivationRef: ProgressionRefs["liveOpsActivationRef"];
  setEventCampaignState: Dispatch<SetStateAction<EventCampaignState | null>>;
}): void {
  const result = reconcileEventCampaignState({
    previousState: args.eventCampaignStateRef.current,
    activeConfig: getActiveEventCampaignConfig(new Date()),
    liveOpsActivationId: args.liveOpsActivationRef.current,
    now: new Date(),
  });

  if (result.activatedEventId) {
    Analytics.track("liveops_event_activated", {
      eventId: result.activatedEventId,
      source: "event_reconcile",
    });
  }

  args.liveOpsActivationRef.current = result.nextLiveOpsActivationId;
  args.eventCampaignStateRef.current = result.nextState;
  args.setEventCampaignState(result.nextState);
}

export function incrementQuestAction(args: {
  id: string;
  reconcileQuestCycles: (source?: "cycle_reconcile" | "schema_migration") => void;
  questsRef: ProgressionRefs["questsRef"];
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
  step?: number;
}): void {
  args.reconcileQuestCycles("cycle_reconcile");
  args.setQuests((prev) => {
    const next = prev.map((quest) =>
      quest.id === args.id ? { ...quest, progress: Math.min(quest.progress + (args.step ?? 1), quest.need) } : quest
    );
    args.questsRef.current = next;
    return next;
  });
}

export function incrementQuestMetricAction(args: {
  addGems: (amount: number) => void;
  eventCampaignStateRef: ProgressionRefs["eventCampaignStateRef"];
  questMetric: QuestMetric;
  reconcileQuestCycles: (source?: "cycle_reconcile" | "schema_migration") => void;
  setBadgeToastQueue: Dispatch<SetStateAction<string[]>>;
  setEventCampaignState: Dispatch<SetStateAction<EventCampaignState | null>>;
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
  setUnlockedBadges: Dispatch<SetStateAction<Set<string>>>;
  step?: number;
  userId?: string | null;
  questsRef: ProgressionRefs["questsRef"];
}): void {
  const step = args.step ?? 1;
  args.reconcileQuestCycles("cycle_reconcile");
  args.setQuests((prev) => {
    const next = applyQuestMetricProgress(prev, args.questMetric, step);
    args.questsRef.current = next;
    return next;
  });

  const activeEventConfig = getActiveEventCampaignConfig(new Date());
  if (!activeEventConfig) {
    if (args.eventCampaignStateRef.current) args.setEventCampaignState(null);
    return;
  }

  const progressed = progressEventCampaignMetric({
    previousState: args.eventCampaignStateRef.current,
    activeConfig: activeEventConfig,
    metric: args.questMetric as EventQuestMetric,
    step,
    now: new Date(),
  });
  args.eventCampaignStateRef.current = progressed.nextState;
  args.setEventCampaignState(progressed.nextState);

  if (progressed.rewardedGems > 0) args.addGems(progressed.rewardedGems);

  progressed.rewardedQuests.forEach((quest: EventQuestInstance) => {
    Analytics.track("event_quest_rewarded", {
      eventId: activeEventConfig.id,
      templateId: quest.templateId,
      metric: quest.metric,
      rewardGems: quest.rewardGems,
      source: "metric_progress",
    });
  });

  if (progressed.startedNow) {
    Analytics.track("event_started", { eventId: activeEventConfig.id, source: "metric_progress" });
  }

  if (progressed.completedNow) {
    const rewardBadgeId = activeEventConfig.reward_badge_id;
    Analytics.track("event_completed", {
      eventId: activeEventConfig.id,
      rewardBadgeId,
      source: "metric_progress",
    });

    if (args.userId) {
      Promise.resolve(awardEventCompletionBadge(args.userId, rewardBadgeId))
        .then(() => {
          args.setUnlockedBadges((prev) => {
            if (prev.has(rewardBadgeId)) return prev;
            const next = new Set(prev);
            next.add(rewardBadgeId);
            return next;
          });
          args.setBadgeToastQueue((prev) => enqueueBadgeToastIds(prev, [rewardBadgeId]));
        })
        .catch((error: unknown) => {
          console.error("Failed to unlock event badge:", error);
        });
    }
  }
}

export function claimQuestAction(args: {
  addGems: (amount: number) => void;
  addXp: (amount: number) => Promise<void>;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  id: string;
  reconcileQuestCycles: (source?: "cycle_reconcile" | "schema_migration") => void;
  questsRef: ProgressionRefs["questsRef"];
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
}): void {
  args.reconcileQuestCycles("cycle_reconcile");
  const result = claimQuestState({
    quests: args.questsRef.current,
    id: args.id,
    claimBonusGemsByType: args.claimBonusGemsByType,
  });
  if (!result.claimedQuest) return;

  args.questsRef.current = result.nextQuests;
  args.setQuests(result.nextQuests);
  void args.addXp(result.claimedQuest.rewardXp);
  if (result.rewardGems > 0) args.addGems(result.rewardGems);
  Analytics.track("quest_claimed", {
    templateId: result.claimedQuest.templateId,
    type: result.claimedQuest.type,
    rewardXp: result.claimedQuest.rewardXp,
    rewardGems: result.rewardGems,
    source: "manual_claim",
  });

  setTimeout(() => {
    args.setQuests((prev) => {
      const next = openClaimedQuestChestState(prev, args.id);
      args.questsRef.current = next;
      return next;
    });
  }, 1200);
}

export function rerollQuestAction(args: {
  dailyQuestRerollCount: number;
  dailyQuestRerollDate: string | null;
  gems: number;
  questId: string;
  questRerollCostGems: number;
  questRerollDailyLimit: number;
  questRerollEnabled: boolean;
  questsRef: ProgressionRefs["questsRef"];
  setDailyQuestRerollCountRaw: (count: number) => void;
  setDailyQuestRerollDateRaw: (date: string) => void;
  setGemsDirectly: (amount: number) => void;
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
}):
  | {
      success: false;
      reason:
        | "disabled"
        | "invalid_type"
        | "limit_reached"
        | "insufficient_gems"
        | "already_completed"
        | "no_candidate";
    }
  | { success: true } {
  const rerolled = rerollQuestState({
    quests: args.questsRef.current,
    questId: args.questId,
    questRerollEnabled: args.questRerollEnabled,
    dailyLimit: args.questRerollDailyLimit,
    rerollCostGems: args.questRerollCostGems,
    dailyQuestRerollDate: args.dailyQuestRerollDate,
    dailyQuestRerollCount: args.dailyQuestRerollCount,
    todayDate: getTodayDate(),
    gems: args.gems,
  });
  if (!rerolled.success) {
    return { success: false as const, reason: rerolled.reason };
  }

  args.questsRef.current = rerolled.nextQuests;
  args.setQuests(rerolled.nextQuests);
  args.setGemsDirectly(rerolled.nextGems);
  args.setDailyQuestRerollDateRaw(rerolled.nextRerollDate);
  args.setDailyQuestRerollCountRaw(rerolled.nextRerollCount);

  if (rerolled.oldTemplateId && rerolled.newTemplateId && rerolled.type) {
    Analytics.track("quest_rerolled", {
      questId: args.questId,
      type: rerolled.type,
      oldTemplateId: rerolled.oldTemplateId,
      newTemplateId: rerolled.newTemplateId,
      costGems: args.questRerollCostGems,
      source: "quests_tab",
    });
  }

  return { success: true as const };
}
