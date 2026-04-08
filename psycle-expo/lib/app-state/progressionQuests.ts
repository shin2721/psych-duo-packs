import {
  createMonthlyFixedQuestInstances,
  getQuestTemplateNeed,
  type QuestInstance,
  type QuestMetric,
} from "../questDefinitions";
import { buildQuestBoardForCycles, type QuestRotationSelection } from "../questRotation";
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
