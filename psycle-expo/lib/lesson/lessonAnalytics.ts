import { Analytics } from "../analytics";

export function getLessonGenreId(lessonId?: string): string {
  return lessonId?.match(/^([a-z]+)_/)?.[1] || "unknown";
}

export function trackLessonStart(lessonId: string) {
  Analytics.track("lesson_start", {
    lessonId,
    genreId: getLessonGenreId(lessonId),
  });
}

export function trackLessonComplete(lessonId: string) {
  Analytics.track("lesson_complete", {
    lessonId,
    genreId: getLessonGenreId(lessonId),
  });
}

export function trackQuestionIncorrect(params: {
  isReviewRound: boolean;
  lessonId: string;
  questionId: string;
  questionIndex: number;
  questionType: string;
}) {
  Analytics.track("question_incorrect", {
    lessonId: params.lessonId,
    genreId: getLessonGenreId(params.lessonId),
    questionId: params.questionId,
    questionType: params.questionType,
    questionIndex: params.questionIndex,
    isReviewRound: params.isReviewRound,
  });
}

export function trackComboXpBonusApplied(params: {
  baseXp: number;
  bonusXp: number;
  lessonId: string;
  multiplier: number;
  questionId: string;
  streak: number;
  usedBonusXp: number;
  capBonusXp: number;
}) {
  Analytics.track("combo_xp_bonus_applied", params);
}

export function trackDoubleXpNudgeShown(params: {
  dailyRemainingAfterShow: number;
  gems: number;
}) {
  Analytics.track("double_xp_nudge_shown", {
    source: "lesson_complete",
    gems: params.gems,
    dailyRemainingAfterShow: params.dailyRemainingAfterShow,
  });
}

export function trackDoubleXpNudgeClicked(gems: number) {
  Analytics.track("double_xp_nudge_clicked", {
    source: "lesson_complete",
    gems,
  });
}

export function trackLessonNudgeExperimentExposed(params: {
  experimentId: string;
  variantId: string;
}) {
  Analytics.track("experiment_exposed", {
    experimentId: params.experimentId,
    variantId: params.variantId,
    source: "lesson_complete_nudge",
  });
}

export function trackLessonNudgeExperimentConverted(params: {
  experimentId: string;
  variantId: string;
}) {
  Analytics.track("experiment_converted", {
    experimentId: params.experimentId,
    variantId: params.variantId,
    source: "lesson_complete_nudge",
    conversion: "double_xp_purchased",
  });
}

export function trackFeltBetterXpAwarded(params: {
  feltBetterValue: number;
  interventionId: string;
  lessonId: string;
  xpAwarded: number;
}) {
  Analytics.track("felt_better_xp_awarded", params);
}
