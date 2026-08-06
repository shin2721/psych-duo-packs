import { useEffect } from "react";
import type { QuestInstance, QuestMetric } from "../questDefinitions";
import type { StreakRepairOffer } from "../streakRepair";
import { resetSessionTracking } from "../dogfood";
import { resolveLessonRuntimeAvailability } from "./lessonLaunchState";
import { useLessonFlow } from "./useLessonFlow";

interface UseLessonRuntimeParams {
  addQuestionXp: (xp: number) => void;
  addReviewEvent: (event: {
    itemId: string;
    lessonId: string;
    result: "correct" | "incorrect";
  }) => void;
  claimComebackRewardOnLessonComplete: () => void;
  comboBonusCapPerLesson: number;
  comboXpConfig: Parameters<typeof import("../comboXp").computeComboBonusXp>[0]["config"];
  completeLesson: (lessonId: string) => void;
  consumeEnergy: (cost: number) => boolean;
  energy: number;
  energyRefillMinutes: number;
  fileParam?: string;
  difficultyPacing?: {
    optimalPMax: number;
    optimalPMin: number;
    questionsAnswered: number;
    recentAccuracy: number;
    skillConfidence: number;
  };
  firstSessionLessonSize: number;
  lessonSize: number;
  incrementQuestMetric: (metric: QuestMetric, step?: number) => void;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  lessonEnergyCost: number;
  maxEnergy: number;
  skipEnergyCharge?: boolean;
  onEnergyBlocked: (lessonId: string, genreId: string) => void;
  onLoadFailed: (message: string) => void;
  recordLessonSessionAbandon: (lessonId: string) => void;
  recordLessonSessionComplete: (lessonId: string) => void;
  recordLessonSessionStart: (lessonId: string, questionIds: string[]) => void;
  quests: QuestInstance[];
  streakRepairOffer: StreakRepairOffer | null;
  tryTriggerStreakEnergyBonus: (streak: number) => boolean;
  userId?: string;
}

export function useLessonRuntime(params: UseLessonRuntimeParams) {
  const lessonFlow = useLessonFlow(params);
  const availability = resolveLessonRuntimeAvailability({
    hasCurrentQuestion: Boolean(lessonFlow.currentQuestion),
    launchState: lessonFlow.launchState,
  });

  useEffect(() => {
    if (!params.fileParam) return;
    resetSessionTracking();
  }, [params.fileParam]);

  return {
    ...lessonFlow,
    ...availability,
  };
}
