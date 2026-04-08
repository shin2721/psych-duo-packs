import {
  createMonthlyFixedQuestInstances,
  getQuestTemplateNeed,
  type QuestInstance,
  type QuestMetric,
} from "../questDefinitions";
import {
  buildQuestBoardForCycles,
  reconcileQuestBoardOnCycleChange,
  rerollQuestInstance,
  type QuestReconcileResult,
  type QuestRerollResult,
  type QuestRotationSelection,
} from "../questRotation";
import { getAdjustedQuestNeed } from "../personalization";
import { getPersonalizationConfig, type PersonalizationSegment } from "../gamificationConfig";
import type { QuestCycleKeys } from "../questCycles";

const personalizationConfig = getPersonalizationConfig();

function isQuestType(value: unknown): value is "daily" | "weekly" | "monthly" {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function isQuestMetric(value: unknown): value is QuestMetric {
  return value === "lesson_complete" || value === "streak5_milestone";
}

function normalizeQuestChestState(value: unknown): "closed" | "opening" | "opened" {
  return value === "opening" || value === "opened" ? value : "closed";
}

export function adjustQuestNeedsBySegment(
  quests: QuestInstance[],
  segment: PersonalizationSegment
): QuestInstance[] {
  if (!personalizationConfig.enabled) return quests;

  let changed = false;
  const next = quests.map((quest) => {
    if (quest.type === "monthly" || quest.claimed) return quest;

    const baseNeed = getQuestTemplateNeed(quest.templateId) ?? quest.need;
    const adjustedNeed = getAdjustedQuestNeed(baseNeed, segment, personalizationConfig);
    if (adjustedNeed === quest.need) return quest;

    changed = true;
    return {
      ...quest,
      need: adjustedNeed,
      progress: Math.min(quest.progress, adjustedNeed),
    };
  });

  return changed ? next : quests;
}

export function createInitialQuestState(cycleKeys: QuestCycleKeys): {
  quests: QuestInstance[];
  rotationSelection: QuestRotationSelection;
} {
  const { quests, selection } = buildQuestBoardForCycles({
    cycleKeys,
    previousSelection: { daily: [], weekly: [] },
    monthlyQuests: createMonthlyFixedQuestInstances(cycleKeys.monthly),
  });

  return { quests, rotationSelection: selection };
}

export function normalizeStoredQuestInstances(
  raw: unknown,
  cycleKeys: QuestCycleKeys
): QuestInstance[] | null {
  if (!Array.isArray(raw)) return null;

  const normalized: QuestInstance[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const quest = item as Record<string, unknown>;
    const type = isQuestType(quest.type) ? quest.type : null;
    if (!type) continue;

    const needRaw = Number(quest.need);
    const need = Number.isFinite(needRaw) ? Math.max(1, Math.floor(needRaw)) : 1;
    const progressRaw = Number(quest.progress);
    const progress = Number.isFinite(progressRaw) ? Math.max(0, Math.floor(progressRaw)) : 0;
    const rewardXpRaw = Number(quest.rewardXp);
    const rewardXp = Number.isFinite(rewardXpRaw) ? Math.max(0, Math.floor(rewardXpRaw)) : 0;
    const templateId =
      typeof quest.templateId === "string" && quest.templateId.length > 0
        ? quest.templateId
        : typeof quest.id === "string" && quest.id.length > 0
          ? quest.id
          : null;
    if (!templateId) continue;

    const id =
      typeof quest.id === "string" && quest.id.length > 0 ? quest.id : `${templateId}__${type}`;
    const metric = isQuestMetric(quest.metric) ? quest.metric : null;
    const cycleKey =
      typeof quest.cycleKey === "string" && quest.cycleKey.length > 0
        ? quest.cycleKey
        : type === "daily"
          ? cycleKeys.daily
          : type === "weekly"
            ? cycleKeys.weekly
            : cycleKeys.monthly;

    normalized.push({
      id,
      templateId,
      type,
      metric,
      need,
      progress: Math.min(need, progress),
      rewardXp,
      claimed: Boolean(quest.claimed),
      chestState: normalizeQuestChestState(quest.chestState),
      title: typeof quest.title === "string" ? quest.title : templateId,
      titleKey: typeof quest.titleKey === "string" ? quest.titleKey : undefined,
      cycleKey,
    });
  }

  return normalized.length > 0 ? normalized : null;
}

export function migrateMonthlyQuests(
  storedQuests: QuestInstance[] | null,
  monthlyCycleKey: string
): QuestInstance[] {
  const baseMonthly = createMonthlyFixedQuestInstances(monthlyCycleKey);
  if (!storedQuests) return baseMonthly;

  const previousMonthly = new Map<string, QuestInstance>();
  storedQuests
    .filter((quest) => quest.type === "monthly")
    .forEach((quest) => {
      previousMonthly.set(quest.templateId, quest);
      previousMonthly.set(quest.id, quest);
    });

  return baseMonthly.map((quest) => {
    const previous = previousMonthly.get(quest.templateId) ?? previousMonthly.get(quest.id);
    if (!previous) return quest;
    return {
      ...quest,
      progress: Math.min(quest.need, Math.max(0, previous.progress)),
      claimed: previous.claimed,
      chestState: normalizeQuestChestState(previous.chestState),
    };
  });
}

export function reconcileQuestCyclesState(args: {
  quests: QuestInstance[];
  prevKeys: QuestCycleKeys;
  nextKeys: QuestCycleKeys;
  previousSelection: QuestRotationSelection;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}): QuestReconcileResult {
  return reconcileQuestBoardOnCycleChange({
    quests: args.quests,
    prevKeys: args.prevKeys,
    nextKeys: args.nextKeys,
    previousSelection: args.previousSelection,
    claimBonusGemsByType: args.claimBonusGemsByType,
  });
}

export function claimQuestState(args: {
  quests: QuestInstance[];
  id: string;
  claimBonusGemsByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}): {
  nextQuests: QuestInstance[];
  claimedQuest: QuestInstance | null;
  rewardGems: number;
} {
  let claimedQuest: QuestInstance | null = null;
  let rewardGems = 0;

  const nextQuests = args.quests.map((quest) => {
    if (quest.id !== args.id || quest.progress < quest.need || quest.claimed) {
      return quest;
    }

    rewardGems = args.claimBonusGemsByType[quest.type] ?? 0;
    claimedQuest = {
      ...quest,
      claimed: true,
      chestState: "opening",
    };
    return claimedQuest;
  });

  return {
    nextQuests,
    claimedQuest,
    rewardGems,
  };
}

export function openClaimedQuestChestState(quests: QuestInstance[], id: string): QuestInstance[] {
  return quests.map((quest) => (quest.id === id ? { ...quest, chestState: "opened" } : quest));
}

export function rerollQuestState(args: {
  quests: QuestInstance[];
  questId: string;
  questRerollEnabled: boolean;
  dailyLimit: number;
  rerollCostGems: number;
  dailyQuestRerollDate: string | null;
  dailyQuestRerollCount: number;
  todayDate: string;
  gems: number;
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
  | {
      success: true;
      nextQuests: QuestInstance[];
      nextGems: number;
      nextRerollDate: string;
      nextRerollCount: number;
      oldTemplateId?: string;
      newTemplateId?: string;
      type?: "daily" | "weekly";
    } {
  if (!args.questRerollEnabled) return { success: false, reason: "disabled" };

  const targetQuest = args.quests.find((quest) => quest.id === args.questId);
  if (!targetQuest) return { success: false, reason: "no_candidate" };
  if (targetQuest.type !== "daily" && targetQuest.type !== "weekly") {
    return { success: false, reason: "invalid_type" };
  }

  const usedCount = args.dailyQuestRerollDate === args.todayDate ? args.dailyQuestRerollCount : 0;
  if (usedCount >= args.dailyLimit) {
    return { success: false, reason: "limit_reached" };
  }
  if (args.gems < args.rerollCostGems) {
    return { success: false, reason: "insufficient_gems" };
  }
  if (targetQuest.claimed || targetQuest.progress >= targetQuest.need) {
    return { success: false, reason: "already_completed" };
  }

  const rerolled: QuestRerollResult = rerollQuestInstance({
    quests: args.quests,
    questId: args.questId,
  });
  if (!rerolled.success) {
    return { success: false, reason: rerolled.reason ?? "no_candidate" };
  }

  return {
    success: true,
    nextQuests: rerolled.quests,
    nextGems: args.gems - args.rerollCostGems,
    nextRerollDate: args.todayDate,
    nextRerollCount: usedCount + 1,
    oldTemplateId: rerolled.oldTemplateId,
    newTemplateId: rerolled.newTemplateId,
    type: rerolled.type,
  };
}
