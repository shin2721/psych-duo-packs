import type { Question } from "../../types/question";

export interface LessonAdvanceDecision {
  mode: "complete" | "next" | "start_review";
  nextIndex?: number;
}

export function appendReviewQuestion(
  reviewQueue: Question[],
  question: Question
): Question[] {
  if (!question.id) return [...reviewQueue, question];
  if (reviewQueue.some((queued) => queued.id === question.id)) return reviewQueue;
  return [...reviewQueue, question];
}

export function decideLessonAdvance(params: {
  currentIndex: number;
  isReviewRound: boolean;
  originalQuestionCount: number;
  questionCount: number;
  reviewQueueLength: number;
}): LessonAdvanceDecision {
  const totalInRound = params.isReviewRound ? params.questionCount : params.originalQuestionCount;

  if (params.currentIndex < totalInRound - 1) {
    return {
      mode: "next",
      nextIndex: params.currentIndex + 1,
    };
  }

  if (params.reviewQueueLength > 0 && !params.isReviewRound) {
    return { mode: "start_review" };
  }

  return { mode: "complete" };
}
