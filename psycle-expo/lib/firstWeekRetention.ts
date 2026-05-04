import i18n from "./i18n";

export type FirstWeekRetentionReason =
  | "first_week_next_skill"
  | "first_week_goal_complete";

export interface FirstWeekRetentionCue {
  accessibilityHint: string;
  body: string;
  ctaLabel: string;
  dayNumber: number;
  reason: FirstWeekRetentionReason;
  title: string;
}

function normalizeCopy(value: string | null | undefined, fallback: string): string {
  const trimmed = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!trimmed) return fallback;
  return trimmed.length > 42 ? `${trimmed.slice(0, 41).trimEnd()}…` : trimmed;
}

export function buildFirstWeekRetentionCue(args: {
  completedLessonCount: number;
  dailyGoal: number;
  dailyXP: number;
  nextLessonBody?: string | null;
  nextLessonTitle?: string | null;
}): FirstWeekRetentionCue | null {
  const completedLessonCount = Math.max(0, Math.floor(args.completedLessonCount));
  if (completedLessonCount < 1 || completedLessonCount >= 7) return null;

  const dayNumber = Math.min(7, completedLessonCount + 1);
  const dailyGoal = Math.max(0, Math.floor(args.dailyGoal));
  const dailyXP = Math.max(0, Math.floor(args.dailyXP));
  const remainingXp = Math.max(0, dailyGoal - dailyXP);
  const nextLessonTitle = normalizeCopy(args.nextLessonTitle, String(i18n.t("course.world.weekOneFallbackTitle")));
  const nextLessonBody = normalizeCopy(args.nextLessonBody, String(i18n.t("course.world.weekOneFallbackAction")));

  if (dailyGoal > 0 && remainingXp === 0) {
    return {
      accessibilityHint: String(i18n.t("course.world.weekOneAccessibilityHint")),
      body: String(i18n.t("course.world.weekOneCompleteBody", { lesson: nextLessonTitle })),
      ctaLabel: String(i18n.t("course.world.weekOneCompleteCta")),
      dayNumber,
      reason: "first_week_goal_complete",
      title: String(i18n.t("course.world.weekOneCompleteTitle", { day: dayNumber })),
    };
  }

  return {
    accessibilityHint: String(i18n.t("course.world.weekOneAccessibilityHint")),
    body: String(i18n.t("course.world.weekOneNextBody", { action: nextLessonBody })),
    ctaLabel: String(i18n.t("course.world.weekOneNextCta")),
    dayNumber,
    reason: "first_week_next_skill",
    title: String(i18n.t("course.world.weekOneNextTitle", { day: dayNumber, xp: remainingXp })),
  };
}
