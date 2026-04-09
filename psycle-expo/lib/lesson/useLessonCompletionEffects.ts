import { useCallback, useEffect, useRef, useState } from "react";
import { logFeltBetter, logInterventionInteraction, hasLoggedShownThisSession, markShownLogged } from "../dogfood";
import { evaluateLessonCompleteDoubleXpNudge, markLessonNudgeExposure } from "./lessonCompletion";
import { getLocalDateKey } from "../doubleXpNudge";
import { shouldAwardFeltBetterXp } from "../questProgressRules";
import { XP_REWARDS } from "../streaks";
import type { Question } from "../../types/question";
import {
  trackDoubleXpNudgeShown,
  trackFeltBetterXpAwarded,
  trackLessonNudgeExperimentConverted,
  trackLessonNudgeExperimentExposed,
} from "./lessonAnalytics";
import { warnDev } from "../devLog";

interface UseLessonCompletionEffectsParams {
  addXp: (xp: number) => void;
  currentQuestion: Question | null;
  dailyShowLimit: number;
  enabled: boolean;
  fileParam?: string;
  gems: number;
  isComplete: boolean;
  isDoubleXpActive: boolean;
  minGems: number;
  nudgeStorageUserId: string;
  requireInactiveBoost: boolean;
}

export function useLessonCompletionEffects(
  params: UseLessonCompletionEffectsParams
) {
  const [feltBetterSubmitted, setFeltBetterSubmitted] = useState(false);
  const [lastShownInterventionId, setLastShownInterventionId] = useState<string | null>(null);
  const [showDoubleXpNudge, setShowDoubleXpNudge] = useState(false);
  const nudgeEvaluatedRef = useRef(false);
  const nudgeExperimentRef = useRef<{
    experimentId: string;
    variantId: string;
  } | null>(null);

  useEffect(() => {
    if (!params.isComplete || nudgeEvaluatedRef.current) return;

    const evaluateNudge = async () => {
      const today = getLocalDateKey();
      const result = await evaluateLessonCompleteDoubleXpNudge({
        dailyShowLimit: params.dailyShowLimit,
        enabled: params.enabled,
        isComplete: params.isComplete,
        isDoubleXpActive: params.isDoubleXpActive,
        gems: params.gems,
        minGems: params.minGems,
        requireInactiveBoost: params.requireInactiveBoost,
        nudgeStorageUserId: params.nudgeStorageUserId,
        today,
      });

      if (!result.shouldShow) {
        setShowDoubleXpNudge(false);
        nudgeExperimentRef.current = null;
        nudgeEvaluatedRef.current = true;
        return;
      }

      nudgeExperimentRef.current = result.assignment;
      setShowDoubleXpNudge(true);
      nudgeEvaluatedRef.current = true;
      trackDoubleXpNudgeShown({
        gems: params.gems,
        dailyRemainingAfterShow: result.dailyRemainingAfterShow,
      });

      await markLessonNudgeExposure({
        assignment: result.assignment,
        nudgeStorageUserId: params.nudgeStorageUserId,
        today,
        onExpose: (assignment) => {
          trackLessonNudgeExperimentExposed(assignment);
        },
      });
    };

    evaluateNudge().catch((error) => {
      warnDev("[DoubleXpNudge] Failed to evaluate:", error);
      nudgeEvaluatedRef.current = true;
    });
  }, [
    params.dailyShowLimit,
    params.enabled,
    params.gems,
    params.isComplete,
    params.isDoubleXpActive,
    params.minGems,
    params.nudgeStorageUserId,
    params.requireInactiveBoost,
  ]);

  useEffect(() => {
    const currentQuestion = params.currentQuestion;
    if (!currentQuestion || !params.fileParam) return;

    const details = currentQuestion.expanded_details;
    const questionId = currentQuestion.id;
    if (details?.claim_type === "intervention" && questionId) {
      if (!hasLoggedShownThisSession(questionId)) {
        markShownLogged(questionId);
        logInterventionInteraction(
          params.fileParam,
          questionId,
          {
            id: details.variant?.id ?? "original",
            label: details.variant?.label ?? "original",
          },
          "shown"
        );
        setLastShownInterventionId(questionId);
      }
    }
  }, [params.currentQuestion, params.fileParam]);

  useEffect(() => {
    setFeltBetterSubmitted(false);
    setLastShownInterventionId(null);
    setShowDoubleXpNudge(false);
    nudgeEvaluatedRef.current = false;
    nudgeExperimentRef.current = null;
  }, [params.fileParam]);

  const submitFeltBetter = useCallback(
    async (value: -2 | -1 | 0 | 1 | 2) => {
      if (!params.fileParam || !lastShownInterventionId || feltBetterSubmitted) {
        return;
      }

      setFeltBetterSubmitted(true);

      if (shouldAwardFeltBetterXp(value)) {
        params.addXp(XP_REWARDS.FELT_BETTER_POSITIVE);
        trackFeltBetterXpAwarded({
          lessonId: params.fileParam,
          interventionId: lastShownInterventionId,
          feltBetterValue: value,
          xpAwarded: XP_REWARDS.FELT_BETTER_POSITIVE,
        });
      }

      try {
        await logFeltBetter(params.fileParam, lastShownInterventionId, value);
      } catch (error) {
        warnDev("[Dogfood] Failed to log felt_better:", error);
      }
    },
    [feltBetterSubmitted, lastShownInterventionId, params]
  );

  return {
    feltBetterSubmitted,
    lastShownInterventionId,
    nudgeExperimentRef,
    setShowDoubleXpNudge,
    showDoubleXpNudge,
    submitFeltBetter,
    trackNudgeConverted: () => {
      if (nudgeExperimentRef.current) {
        trackLessonNudgeExperimentConverted(nudgeExperimentRef.current);
      }
    },
  };
}
