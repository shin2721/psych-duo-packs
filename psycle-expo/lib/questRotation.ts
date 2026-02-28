import type { QuestCycleKeys, QuestCycleResetType } from "./questCycles";
import {
  DAILY_QUEST_TEMPLATES,
  DAILY_ROTATION_COUNT,
  WEEKLY_QUEST_TEMPLATES,
  WEEKLY_ROTATION_COUNT,
  createMonthlyFixedQuestInstances,
  createQuestInstanceFromTemplate,
  type QuestInstance,
  type QuestMetric,
  type QuestTemplate,
} from "./questDefinitions";

export interface QuestRotationSelection {
  daily: string[];
  weekly: string[];
}

export interface QuestAutoClaimSummary {
  claimedCount: number;
  totalRewardXp: number;
  totalRewardGems: number;
}

export interface QuestReconcileResult {
  quests: QuestInstance[];
  selection: QuestRotationSelection;
  changedTypes: QuestCycleResetType[];
  autoClaimed: QuestAutoClaimSummary;
}

export type QuestRerollFailureReason =
  | "invalid_type"
  | "already_completed"
  | "no_candidate";

export interface QuestRerollResult {
  success: boolean;
  reason?: QuestRerollFailureReason;
  quests: QuestInstance[];
  oldTemplateId?: string;
  newTemplateId?: string;
  type?: "daily" | "weekly";
}

interface BuildQuestBoardForCyclesInput {
  cycleKeys: QuestCycleKeys;
  previousSelection?: QuestRotationSelection | null;
  random?: () => number;
  monthlyQuests?: QuestInstance[] | null;
}

interface ReconcileQuestBoardOnCycleChangeInput {
  quests: QuestInstance[];
  prevKeys: QuestCycleKeys;
  nextKeys: QuestCycleKeys;
  previousSelection?: QuestRotationSelection | null;
  random?: () => number;
}

function uniqueTemplateIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))];
}

export function normalizeQuestRotationSelection(input: unknown): QuestRotationSelection {
  if (!input || typeof input !== "object") {
    return { daily: [], weekly: [] };
  }
  const partial = input as Partial<QuestRotationSelection>;
  return {
    daily: uniqueTemplateIds(Array.isArray(partial.daily) ? partial.daily : []),
    weekly: uniqueTemplateIds(Array.isArray(partial.weekly) ? partial.weekly : []),
  };
}

function pickTemplates(
  templates: QuestTemplate[],
  count: number,
  previousTemplateIds: string[],
  random: () => number
): QuestTemplate[] {
  const targetCount = Math.max(0, Math.min(Math.floor(count), templates.length));
  if (targetCount === 0) return [];

  const previousSet = new Set(previousTemplateIds);
  const firstPool = templates.filter((template) => !previousSet.has(template.templateId));

  const selected: QuestTemplate[] = [];
  const selectedIds = new Set<string>();

  const pickFromPool = (pool: QuestTemplate[]) => {
    const mutable = [...pool];
    while (mutable.length > 0 && selected.length < targetCount) {
      const index = Math.max(0, Math.min(mutable.length - 1, Math.floor(random() * mutable.length)));
      const [picked] = mutable.splice(index, 1);
      if (selectedIds.has(picked.templateId)) continue;
      selected.push(picked);
      selectedIds.add(picked.templateId);
    }
  };

  pickFromPool(firstPool);

  if (selected.length < targetCount) {
    pickFromPool(templates.filter((template) => !selectedIds.has(template.templateId)));
  }

  return selected;
}

export function extractSelectionFromQuests(quests: QuestInstance[]): QuestRotationSelection {
  return {
    daily: uniqueTemplateIds(quests.filter((quest) => quest.type === "daily").map((quest) => quest.templateId)),
    weekly: uniqueTemplateIds(quests.filter((quest) => quest.type === "weekly").map((quest) => quest.templateId)),
  };
}

function normalizeRandom(random?: () => number): () => number {
  if (typeof random !== "function") return Math.random;
  return random;
}

function calculateChangedTypes(prevKeys: QuestCycleKeys, nextKeys: QuestCycleKeys): QuestCycleResetType[] {
  const changed: QuestCycleResetType[] = [];
  if (prevKeys.daily !== nextKeys.daily) changed.push("daily");
  if (prevKeys.weekly !== nextKeys.weekly) changed.push("weekly");
  if (prevKeys.monthly !== nextKeys.monthly) changed.push("monthly");
  return changed;
}

export function buildQuestBoardForCycles(input: BuildQuestBoardForCyclesInput): {
  quests: QuestInstance[];
  selection: QuestRotationSelection;
} {
  const random = normalizeRandom(input.random);
  const previousSelection = normalizeQuestRotationSelection(input.previousSelection);

  const dailyTemplates = pickTemplates(
    DAILY_QUEST_TEMPLATES,
    DAILY_ROTATION_COUNT,
    previousSelection.daily,
    random
  );
  const weeklyTemplates = pickTemplates(
    WEEKLY_QUEST_TEMPLATES,
    WEEKLY_ROTATION_COUNT,
    previousSelection.weekly,
    random
  );

  const daily = dailyTemplates.map((template) =>
    createQuestInstanceFromTemplate(template, input.cycleKeys.daily)
  );
  const weekly = weeklyTemplates.map((template) =>
    createQuestInstanceFromTemplate(template, input.cycleKeys.weekly)
  );
  const monthly =
    input.monthlyQuests && input.monthlyQuests.length > 0
      ? input.monthlyQuests
      : createMonthlyFixedQuestInstances(input.cycleKeys.monthly);

  return {
    quests: [...monthly, ...daily, ...weekly],
    selection: {
      daily: dailyTemplates.map((template) => template.templateId),
      weekly: weeklyTemplates.map((template) => template.templateId),
    },
  };
}

export function reconcileQuestBoardOnCycleChange(
  input: ReconcileQuestBoardOnCycleChangeInput
): QuestReconcileResult {
  const changedTypes = calculateChangedTypes(input.prevKeys, input.nextKeys);
  const currentSelection = extractSelectionFromQuests(input.quests);
  if (changedTypes.length === 0) {
    return {
      quests: input.quests,
      selection: currentSelection,
      changedTypes,
      autoClaimed: {
        claimedCount: 0,
        totalRewardXp: 0,
        totalRewardGems: 0,
      },
    };
  }

  const changedTypeSet = new Set(changedTypes);
  const claimable = input.quests.filter(
    (quest) => changedTypeSet.has(quest.type) && quest.progress >= quest.need && !quest.claimed
  );

  const autoClaimed = claimable.reduce<QuestAutoClaimSummary>(
    (acc, quest) => {
      acc.claimedCount += 1;
      acc.totalRewardXp += quest.rewardXp;
      return acc;
    },
    {
      claimedCount: 0,
      totalRewardXp: 0,
      totalRewardGems: 0,
    }
  );
  autoClaimed.totalRewardGems = autoClaimed.claimedCount * 10;

  const previousSelection = normalizeQuestRotationSelection(input.previousSelection ?? currentSelection);
  const random = normalizeRandom(input.random);

  const currentMonthly = input.quests.filter((quest) => quest.type === "monthly");
  const currentDaily = input.quests.filter((quest) => quest.type === "daily");
  const currentWeekly = input.quests.filter((quest) => quest.type === "weekly");

  const nextMonthly = changedTypeSet.has("monthly")
    ? createMonthlyFixedQuestInstances(input.nextKeys.monthly)
    : currentMonthly;

  const nextDaily = changedTypeSet.has("daily")
    ? pickTemplates(DAILY_QUEST_TEMPLATES, DAILY_ROTATION_COUNT, previousSelection.daily, random).map(
        (template) => createQuestInstanceFromTemplate(template, input.nextKeys.daily)
      )
    : currentDaily;

  const nextWeekly = changedTypeSet.has("weekly")
    ? pickTemplates(WEEKLY_QUEST_TEMPLATES, WEEKLY_ROTATION_COUNT, previousSelection.weekly, random).map(
        (template) => createQuestInstanceFromTemplate(template, input.nextKeys.weekly)
      )
    : currentWeekly;

  return {
    quests: [...nextMonthly, ...nextDaily, ...nextWeekly],
    selection: {
      daily: nextDaily.map((quest) => quest.templateId),
      weekly: nextWeekly.map((quest) => quest.templateId),
    },
    changedTypes,
    autoClaimed,
  };
}

export function applyQuestMetricProgress(
  quests: QuestInstance[],
  metric: QuestMetric,
  step: number
): QuestInstance[] {
  const safeStep = Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0;
  if (safeStep <= 0) return quests;

  return quests.map((quest) => {
    if (quest.metric !== metric) return quest;
    return {
      ...quest,
      progress: Math.min(quest.need, quest.progress + safeStep),
    };
  });
}

interface RerollQuestInstanceInput {
  quests: QuestInstance[];
  questId: string;
  random?: () => number;
}

export function rerollQuestInstance(input: RerollQuestInstanceInput): QuestRerollResult {
  const random = normalizeRandom(input.random);
  const targetIndex = input.quests.findIndex((quest) => quest.id === input.questId);
  if (targetIndex < 0) {
    return { success: false, reason: "no_candidate", quests: input.quests };
  }

  const target = input.quests[targetIndex];
  if (target.type !== "daily" && target.type !== "weekly") {
    return { success: false, reason: "invalid_type", quests: input.quests };
  }

  if (target.claimed || target.progress >= target.need) {
    return { success: false, reason: "already_completed", quests: input.quests };
  }

  const selectedTemplateIds = new Set(
    input.quests
      .filter((quest) => quest.type === target.type)
      .map((quest) => quest.templateId)
  );
  const templates = target.type === "daily" ? DAILY_QUEST_TEMPLATES : WEEKLY_QUEST_TEMPLATES;
  const candidateTemplates = templates.filter(
    (template) => !selectedTemplateIds.has(template.templateId)
  );

  if (candidateTemplates.length === 0) {
    return { success: false, reason: "no_candidate", quests: input.quests };
  }

  const pickedIndex = Math.max(
    0,
    Math.min(candidateTemplates.length - 1, Math.floor(random() * candidateTemplates.length))
  );
  const pickedTemplate = candidateTemplates[pickedIndex];
  const replacement = createQuestInstanceFromTemplate(pickedTemplate, target.cycleKey);

  const nextQuests = [...input.quests];
  nextQuests[targetIndex] = replacement;

  return {
    success: true,
    quests: nextQuests,
    oldTemplateId: target.templateId,
    newTemplateId: pickedTemplate.templateId,
    type: target.type,
  };
}
