export type StreakQuestIncrement = {
  id: "q_daily_5streak";
  step: 1;
};

export type LessonCompletionQuestIncrement = {
  id: "q_daily_3lessons" | "q_weekly_10lessons" | "q_monthly_50pts";
  step: 1;
};

const LESSON_COMPLETION_INCREMENTS: LessonCompletionQuestIncrement[] = [
  { id: "q_daily_3lessons", step: 1 },
  { id: "q_weekly_10lessons", step: 1 },
  { id: "q_monthly_50pts", step: 1 },
];

export function getStreakQuestIncrement(nextStreak: number): StreakQuestIncrement | null {
  if (!Number.isFinite(nextStreak)) return null;
  const safeStreak = Math.max(0, Math.floor(nextStreak));
  if (safeStreak > 0 && safeStreak % 5 === 0) {
    return { id: "q_daily_5streak", step: 1 };
  }
  return null;
}

export function getLessonCompletionQuestIncrements(): LessonCompletionQuestIncrement[] {
  return [...LESSON_COMPLETION_INCREMENTS];
}

export function shouldAwardFeltBetterXp(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
