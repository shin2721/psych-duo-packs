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

export const DAILY_ROTATION_COUNT = 3;
export const WEEKLY_ROTATION_COUNT = 2;

export const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    templateId: "qd_lessons_2",
    type: "daily",
    metric: "lesson_complete",
    need: 2,
    rewardXp: 20,
    title: "レッスンを2回完了",
    titleKey: "quests.templates.daily.lessons2",
  },
  {
    templateId: "qd_lessons_3",
    type: "daily",
    metric: "lesson_complete",
    need: 3,
    rewardXp: 30,
    title: "レッスンを3回完了",
    titleKey: "quests.templates.daily.lessons3",
  },
  {
    templateId: "qd_lessons_5",
    type: "daily",
    metric: "lesson_complete",
    need: 5,
    rewardXp: 45,
    title: "レッスンを5回完了",
    titleKey: "quests.templates.daily.lessons5",
  },
  {
    templateId: "qd_streak5_1",
    type: "daily",
    metric: "streak5_milestone",
    need: 1,
    rewardXp: 25,
    title: "5問連続正解を1回達成",
    titleKey: "quests.templates.daily.streak5x1",
  },
  {
    templateId: "qd_streak5_2",
    type: "daily",
    metric: "streak5_milestone",
    need: 2,
    rewardXp: 40,
    title: "5問連続正解を2回達成",
    titleKey: "quests.templates.daily.streak5x2",
  },
];

export const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    templateId: "qw_lessons_8",
    type: "weekly",
    metric: "lesson_complete",
    need: 8,
    rewardXp: 80,
    title: "週に8レッスン完了",
    titleKey: "quests.templates.weekly.lessons8",
  },
  {
    templateId: "qw_lessons_10",
    type: "weekly",
    metric: "lesson_complete",
    need: 10,
    rewardXp: 100,
    title: "週に10レッスン完了",
    titleKey: "quests.templates.weekly.lessons10",
  },
  {
    templateId: "qw_lessons_15",
    type: "weekly",
    metric: "lesson_complete",
    need: 15,
    rewardXp: 130,
    title: "週に15レッスン完了",
    titleKey: "quests.templates.weekly.lessons15",
  },
  {
    templateId: "qw_streak5_5",
    type: "weekly",
    metric: "streak5_milestone",
    need: 5,
    rewardXp: 120,
    title: "5問連続正解を5回達成",
    titleKey: "quests.templates.weekly.streak5x5",
  },
];

export const MONTHLY_FIXED_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    templateId: "q_monthly_50pts",
    type: "monthly",
    metric: "lesson_complete",
    need: 50,
    rewardXp: 150,
    title: "月に50レッスン完了",
  },
  {
    templateId: "q_monthly_breathTempo",
    type: "monthly",
    metric: null,
    need: 60,
    rewardXp: 120,
    title: "呼吸ゲームで60秒達成",
  },
  {
    templateId: "q_monthly_echoSteps",
    type: "monthly",
    metric: null,
    need: 3,
    rewardXp: 100,
    title: "エコーステップ3回クリア",
  },
  {
    templateId: "q_monthly_balance",
    type: "monthly",
    metric: null,
    need: 5,
    rewardXp: 110,
    title: "バランスゲーム5回クリア",
  },
  {
    templateId: "q_monthly_budget",
    type: "monthly",
    metric: null,
    need: 3,
    rewardXp: 150,
    title: "予算ゲームでパーフェクト達成",
  },
];

export function createQuestInstanceFromTemplate(template: QuestTemplate, cycleKey: string): QuestInstance {
  return {
    id: `${template.templateId}__${cycleKey}`,
    templateId: template.templateId,
    type: template.type,
    metric: template.metric,
    need: template.need,
    progress: 0,
    rewardXp: template.rewardXp,
    claimed: false,
    chestState: "closed",
    title: template.title,
    titleKey: template.titleKey,
    cycleKey,
  };
}

export function createMonthlyFixedQuestInstances(cycleKey: string): QuestInstance[] {
  return MONTHLY_FIXED_QUEST_TEMPLATES.map((template) => ({
    ...createQuestInstanceFromTemplate(template, cycleKey),
    id: template.templateId,
  }));
}
