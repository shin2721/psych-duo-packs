export type QuestType = "daily" | "weekly" | "monthly";
export type QuestMetric = "lesson_complete" | "streak5_milestone";
export type QuestChestState = "closed" | "opening" | "opened";

export interface QuestTemplate {
  templateId: string;
  type: QuestType;
  metric: QuestMetric | null;
  need: number;
  rewardXp: number;
  title: string;
  titleKey?: string;
}

export interface QuestInstance {
  id: string;
  templateId: string;
  type: QuestType;
  metric: QuestMetric | null;
  need: number;
  progress: number;
  rewardXp: number;
  claimed: boolean;
  chestState: QuestChestState;
  title: string;
  titleKey?: string;
  cycleKey: string;
}

export {
  DAILY_QUEST_TEMPLATES,
  DAILY_ROTATION_COUNT,
  MONTHLY_FIXED_QUEST_TEMPLATES,
  WEEKLY_QUEST_TEMPLATES,
  WEEKLY_ROTATION_COUNT,
} from "./questTemplates";

export {
  createMonthlyFixedQuestInstances,
  createQuestInstanceFromTemplate,
  getQuestTemplateNeed,
} from "./questFactory";
