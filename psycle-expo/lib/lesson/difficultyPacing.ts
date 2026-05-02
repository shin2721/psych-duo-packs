import type { Question } from "../../types/question";
import { getDifficultyRating } from "../difficultyMapping";

export type DifficultyPacingMode = "first_session" | "support" | "steady" | "stretch";

export type DifficultyPacingDecision = {
  mode: DifficultyPacingMode;
  questionCount: number;
  targetDifficulty: "easy" | "medium" | "hard";
};

export type DifficultyPacingInput = {
  baseLessonSize: number;
  firstLessonCompleted: boolean;
  firstSessionLessonSize: number;
  isIntroLesson: boolean;
  maxQuestionCount: number;
  optimalPMax: number;
  optimalPMin: number;
  questionsAnswered: number;
  recentAccuracy: number;
  skillConfidence: number;
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeProbability(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

export function resolveDifficultyPacing(input: DifficultyPacingInput): DifficultyPacingDecision {
  const maxQuestionCount = Math.max(1, Math.floor(input.maxQuestionCount));
  const baseLessonSize = clampInt(input.baseLessonSize, 1, maxQuestionCount);

  if (!input.firstLessonCompleted && input.isIntroLesson) {
    return {
      mode: "first_session",
      questionCount: clampInt(input.firstSessionLessonSize, 1, maxQuestionCount),
      targetDifficulty: "easy",
    };
  }

  const recentAccuracy = normalizeProbability(input.recentAccuracy, 0.7);
  const hasEnoughSignal = input.questionsAnswered >= 5;
  if (!hasEnoughSignal) {
    return {
      mode: "steady",
      questionCount: baseLessonSize,
      targetDifficulty: "medium",
    };
  }

  if (recentAccuracy < input.optimalPMin) {
    return {
      mode: "support",
      questionCount: clampInt(baseLessonSize - 2, 1, maxQuestionCount),
      targetDifficulty: "easy",
    };
  }

  if (recentAccuracy > input.optimalPMax && input.skillConfidence >= 0.2) {
    return {
      mode: "stretch",
      questionCount: clampInt(baseLessonSize + 2, 1, maxQuestionCount),
      targetDifficulty: "hard",
    };
  }

  return {
    mode: "steady",
    questionCount: baseLessonSize,
    targetDifficulty: "medium",
  };
}

export function applyDifficultyPacing(
  questions: Question[],
  decision: DifficultyPacingDecision
): Question[] {
  const targetRating = getDifficultyRating(decision.targetDifficulty);
  return [...questions]
    .map((question, index) => ({
      index,
      question,
      distance: Math.abs(getDifficultyRating(question.difficulty) - targetRating),
    }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, Math.min(decision.questionCount, questions.length))
    .map((entry) => entry.question);
}
