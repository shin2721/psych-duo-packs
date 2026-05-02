import { useCallback, useEffect, useRef, useState } from "react";
import type { Lesson } from "../lessons";
import type { Question } from "../../types/question";
import type { QuestInstance, QuestMetric } from "../questDefinitions";
import type { StreakRepairOffer } from "../streakRepair";
import { Analytics } from "../analytics";
import { XP_REWARDS } from "../streaks";
import { computeComboBonusXp } from "../comboXp";
import { getStreakQuestIncrement } from "../questProgressRules";
import { loadLessonBundle } from "./loadLessonBundle";
import {
  trackComboXpBonusApplied,
  trackLessonStart,
  trackQuestionIncorrect,
} from "./lessonAnalytics";
import { completeLessonSession } from "./lessonFlowCompletion";
import {
  getLessonReminderSyncPayload,
  resolveLessonAnswerTransition,
} from "./lessonFlowHelpers";

export { getLessonReminderSyncPayload, resolveLessonAnswerTransition } from "./lessonFlowHelpers";

interface UseLessonFlowParams {
  addQuestionXp: (xp: number) => void;
  addReviewEvent: (event: {
    itemId: string;
    lessonId: string;
    result: "correct" | "incorrect";
  }) => void;
  claimComebackRewardOnLessonComplete: () => void;
  comboBonusCapPerLesson: number;
  comboXpConfig: Parameters<typeof computeComboBonusXp>[0]["config"];
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

export function useLessonFlow(params: UseLessonFlowParams) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [xpAnimation, setXpAnimation] = useState({
    visible: false,
    amount: 0,
    key: 0,
  });

  const hasLoadedRef = useRef<string | null>(null);
  const lessonCompleteTrackedRef = useRef<string | null>(null);
  const lessonStartTrackedRef = useRef<string | null>(null);
  const usedComboBonusXpRef = useRef(0);
  const xpAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLessonCompleteRef = useRef(false);
  const recordLessonSessionAbandonRef = useRef(params.recordLessonSessionAbandon);

  useEffect(() => {
    recordLessonSessionAbandonRef.current = params.recordLessonSessionAbandon;
  }, [params.recordLessonSessionAbandon]);

  const fileParam = params.fileParam;
  const currentQuestion = questions[currentIndex] ?? null;

  const loadLesson = useCallback(async () => {
    if (!fileParam) {
      return;
    }

    const loadStartedAt = Date.now();

    try {
      setLoading(true);
      setActiveLessonId(null);
      setCurrentIndex(0);
      setCurrentLesson(null);
      setCorrectCount(0);
      setCorrectStreak(0);
      setIsComplete(false);
      setIsReviewRound(false);
      setOriginalQuestions([]);
      setQuestions([]);
      setReviewQueue([]);

      const firstLessonCompleted = await hasCompletedFirstLesson();
      const lessonBundle = loadLessonBundle({
        difficultyPacing: params.difficultyPacing,
        fileParam,
        firstLessonCompleted,
        firstSessionLessonSize: params.firstSessionLessonSize,
        lessonSize: params.lessonSize,
      });
      const runtimeLessonId = lessonBundle.lessonId;

      const hasEnoughEnergy = params.consumeEnergy(params.lessonEnergyCost);
      if (!hasEnoughEnergy) {
        setLoading(false);
        Analytics.track("lesson_load_performance", {
          durationMs: Math.max(0, Date.now() - loadStartedAt),
          genreId: lessonBundle.genreId,
          lessonId: runtimeLessonId,
          pacingMode: lessonBundle.pacing.mode,
          questionCount: lessonBundle.effectiveQuestions.length,
          requestedLessonId: lessonBundle.requestedLessonId,
          source: "lesson_runtime",
          status: "energy_blocked",
          targetDifficulty: lessonBundle.pacing.targetDifficulty,
        });
        params.onEnergyBlocked(runtimeLessonId, lessonBundle.genreId);
        return;
      }

      usedComboBonusXpRef.current = 0;
      setActiveLessonId(runtimeLessonId);
      setCurrentLesson(lessonBundle.lesson);
      setOriginalQuestions(lessonBundle.effectiveQuestions);
      setQuestions(lessonBundle.effectiveQuestions);
      setLoading(false);
      Analytics.track("lesson_load_performance", {
        durationMs: Math.max(0, Date.now() - loadStartedAt),
        genreId: lessonBundle.genreId,
        lessonId: runtimeLessonId,
        pacingMode: lessonBundle.pacing.mode,
        questionCount: lessonBundle.effectiveQuestions.length,
        requestedLessonId: lessonBundle.requestedLessonId,
        source: "lesson_runtime",
        status: "loaded",
        targetDifficulty: lessonBundle.pacing.targetDifficulty,
      });
      isLessonCompleteRef.current = false;
      params.recordLessonSessionStart(
        runtimeLessonId,
        lessonBundle.effectiveQuestions
          .map((question) => question.source_id || question.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      );

      if (lessonStartTrackedRef.current !== runtimeLessonId) {
        lessonStartTrackedRef.current = runtimeLessonId;
        trackLessonStart(runtimeLessonId);
      }
    } catch (error) {
      setActiveLessonId(null);
      setLoading(false);
      Analytics.track("lesson_load_performance", {
        durationMs: Math.max(0, Date.now() - loadStartedAt),
        requestedLessonId: fileParam,
        source: "lesson_runtime",
        status: "failed",
      });
      const message = error instanceof Error ? error.message : String(error);
      params.onLoadFailed(message);
    }
  }, [
    fileParam,
    params.consumeEnergy,
    params.difficultyPacing,
    params.firstSessionLessonSize,
    params.lessonEnergyCost,
    params.lessonSize,
    params.onEnergyBlocked,
    params.onLoadFailed,
  ]);

  useEffect(() => {
    if (fileParam && fileParam !== hasLoadedRef.current) {
      hasLoadedRef.current = fileParam;
      void loadLesson();
    }
  }, [fileParam, loadLesson]);

  useEffect(() => {
    return () => {
      if (xpAnimationTimeoutRef.current) {
        clearTimeout(xpAnimationTimeoutRef.current);
      }
      if (activeLessonId && !isLessonCompleteRef.current) {
        recordLessonSessionAbandonRef.current(activeLessonId);
      }
    };
  }, [activeLessonId]);

  const handleAnswer = useCallback(
    async (isCorrect: boolean, _xp: number) => {
      if (!activeLessonId) return;

      const questionInHandler = questions[currentIndex];
      if (!questionInHandler) return;

      const itemId = questionInHandler.source_id || questionInHandler.id;
      if (typeof itemId === "string" && itemId.length > 0) {
        params.addReviewEvent({
          itemId,
          lessonId: activeLessonId,
          result: isCorrect ? "correct" : "incorrect",
        });
      }

      if (!isCorrect) {
        trackQuestionIncorrect({
          lessonId: activeLessonId,
          questionId: questionInHandler.id || `unknown_${currentIndex}`,
          questionType: questionInHandler.type || "unknown",
          questionIndex: currentIndex,
          isReviewRound,
        });
      }

      if (isCorrect) {
        const baseXp = XP_REWARDS.CORRECT_ANSWER;
        setCorrectCount((prev) => prev + 1);
        const nextStreak = correctStreak + 1;
        setCorrectStreak(nextStreak);

        const comboBonus = computeComboBonusXp({
          baseXp,
          streak: nextStreak,
          usedBonusXp: usedComboBonusXpRef.current,
          cap: params.comboBonusCapPerLesson,
          config: params.comboXpConfig,
        });
        usedComboBonusXpRef.current = comboBonus.nextUsedBonusXp;
        const awardedXp = baseXp + comboBonus.bonusXp;
        params.addQuestionXp(awardedXp);

        if (xpAnimationTimeoutRef.current) {
          clearTimeout(xpAnimationTimeoutRef.current);
        }
        setXpAnimation((prev) => ({
          visible: true,
          amount: awardedXp,
          key: prev.key + 1,
        }));
        xpAnimationTimeoutRef.current = setTimeout(() => {
          setXpAnimation((prev) => ({ ...prev, visible: false }));
        }, 1400);

        if (comboBonus.bonusXp > 0) {
          trackComboXpBonusApplied({
            lessonId: activeLessonId,
            questionId: questionInHandler.id || `unknown_${currentIndex}`,
            streak: nextStreak,
            baseXp,
            bonusXp: comboBonus.bonusXp,
            multiplier: comboBonus.multiplier,
            usedBonusXp: comboBonus.nextUsedBonusXp,
            capBonusXp: params.comboBonusCapPerLesson,
          });
        }

        const streakQuestIncrement = getStreakQuestIncrement(nextStreak);
        if (streakQuestIncrement) {
          params.incrementQuestMetric(
            streakQuestIncrement.metric,
            streakQuestIncrement.step
          );
        }

        if (nextStreak % 5 === 0) {
          params.tryTriggerStreakEnergyBonus(nextStreak);
        }
      } else {
        setCorrectStreak(0);
      }

      const transition = resolveLessonAnswerTransition({
        currentIndex,
        isCorrect,
        isReviewRound,
        originalQuestions,
        question: questionInHandler,
        questions,
        reviewQueue,
      });

      if (!transition.shouldComplete) {
        setCurrentIndex(transition.nextCurrentIndex);
        setIsReviewRound(transition.nextIsReviewRound);
        setQuestions(transition.nextQuestions);
        setReviewQueue(transition.nextReviewQueue);
        return;
      }

      await completeLessonSession({
        claimComebackRewardOnLessonComplete:
          params.claimComebackRewardOnLessonComplete,
        completeLesson: params.completeLesson,
        energy: params.energy,
        energyRefillMinutes: params.energyRefillMinutes,
        fileParam: activeLessonId,
        incrementQuestMetric: params.incrementQuestMetric,
        isSubscriptionActive: params.isSubscriptionActive,
        lastEnergyUpdateTime: params.lastEnergyUpdateTime,
        lessonCompleteTrackedRef,
        maxEnergy: params.maxEnergy,
        quests: params.quests,
        setIsComplete,
        streakRepairOffer: params.streakRepairOffer,
        userId: params.userId,
      });
      params.recordLessonSessionComplete(activeLessonId);
      isLessonCompleteRef.current = true;
    },
    [
      activeLessonId,
      correctStreak,
      currentIndex,
      isReviewRound,
      originalQuestions,
      params,
      questions,
      reviewQueue,
    ]
  );

  return {
    activeLessonId,
    correctCount,
    currentIndex,
    currentLesson,
    currentQuestion,
    handleAnswer,
    isComplete,
    isReviewRound,
    loading,
    originalQuestions,
    questions,
    reviewQueue,
    setCurrentIndex,
    setIsReviewRound,
    setQuestions,
    setReviewQueue,
    xpAnimation,
  };
}

async function hasCompletedFirstLesson() {
  return (await import("../onboarding")).hasCompletedFirstLesson();
}
