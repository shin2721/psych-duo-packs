import type { QuestMetric } from "./questDefinitions";

export type StreakQuestMetricIncrement = {
  metric: "streak5_milestone";
  step: 1;
};

export type LessonCompletionQuestMetricIncrement = {
  metric: "lesson_complete";
  step: 1;
};

const LESSON_COMPLETION_METRIC_INCREMENTS: LessonCompletionQuestMetricIncrement[] = [
  { metric: "lesson_complete", step: 1 },
];

export function getStreakQuestIncrement(nextStreak: number): StreakQuestMetricIncrement | null {
  if (!Number.isFinite(nextStreak)) return null;
  const safeStreak = Math.max(0, Math.floor(nextStreak));
  if (safeStreak > 0 && safeStreak % 5 === 0) {
    return { metric: "streak5_milestone", step: 1 };
  }
  return null;
}

export function getLessonCompletionQuestIncrements(): LessonCompletionQuestMetricIncrement[] {
  return [...LESSON_COMPLETION_METRIC_INCREMENTS];
}

export function shouldAwardFeltBetterXp(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isSupportedQuestMetric(metric: string): metric is QuestMetric {
  return metric === "lesson_complete" || metric === "streak5_milestone";
}
