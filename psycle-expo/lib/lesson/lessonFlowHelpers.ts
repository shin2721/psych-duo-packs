import type { Question } from "../../types/question";
import { appendReviewQuestion, decideLessonAdvance } from "./lessonSession";
import type { StreakRepairOffer } from "../streakRepair";

export interface LessonAnswerTransition {
  nextCurrentIndex: number;
  nextIsReviewRound: boolean;
  nextQuestions: Question[];
  nextReviewQueue: Question[];
  shouldComplete: boolean;
}

export function resolveLessonAnswerTransition(params: {
  currentIndex: number;
  isCorrect: boolean;
  isReviewRound: boolean;
  originalQuestions: Question[];
  question: Question;
  questions: Question[];
  reviewQueue: Question[];
}): LessonAnswerTransition {
  const nextReviewQueue =
    !params.isCorrect && !params.isReviewRound
      ? appendReviewQuestion(params.reviewQueue, params.question)
      : params.reviewQueue;

  const advanceDecision = decideLessonAdvance({
    currentIndex: params.currentIndex,
    isReviewRound: params.isReviewRound,
    originalQuestionCount: params.originalQuestions.length,
    questionCount: params.questions.length,
    reviewQueueLength: nextReviewQueue.length,
  });

  if (advanceDecision.mode === "next") {
    return {
      nextCurrentIndex: advanceDecision.nextIndex ?? params.currentIndex + 1,
      nextIsReviewRound: params.isReviewRound,
      nextQuestions: params.questions,
      nextReviewQueue,
      shouldComplete: false,
    };
  }

  if (advanceDecision.mode === "start_review") {
    return {
      nextCurrentIndex: 0,
      nextIsReviewRound: true,
      nextQuestions: nextReviewQueue,
      nextReviewQueue: [],
      shouldComplete: false,
    };
  }

  return {
    nextCurrentIndex: params.currentIndex,
    nextIsReviewRound: params.isReviewRound,
    nextQuestions: params.questions,
    nextReviewQueue,
    shouldComplete: true,
  };
}

export function getLessonReminderSyncPayload(params: {
  energy: number;
  energyRefillMinutes: number;
  hasPendingDailyQuests: boolean;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  maxEnergy: number;
  streakRepairOffer: StreakRepairOffer | null;
  userId?: string;
}) {
  if (!params.userId) {
    return null;
  }

  return {
    userId: params.userId,
    hasPendingDailyQuests: params.hasPendingDailyQuests,
    streakRepairOffer: params.streakRepairOffer,
    energy: params.energy,
    maxEnergy: params.maxEnergy,
    lastEnergyUpdateTime: params.lastEnergyUpdateTime,
    energyRefillMinutes: params.energyRefillMinutes,
    isSubscriptionActive: params.isSubscriptionActive,
  };
}
