import { useCallback } from "react";
import type { InlineToastTone } from "../../components/InlineToast";
import i18n from "../i18n";
import { trackDoubleXpNudgeClicked } from "./lessonAnalytics";
import { useLessonCompletionEffects } from "./useLessonCompletionEffects";

interface UseLessonPostCompletionParams {
  addXp: (xp: number) => void;
  buyDoubleXP: (source?: "shop_item" | "lesson_complete_nudge") => {
    success: boolean;
    reason?: "insufficient_gems" | "already_active";
  };
  currentQuestion: Parameters<typeof useLessonCompletionEffects>[0]["currentQuestion"];
  dailyShowLimit: number;
  enabled: boolean;
  fileParam?: string;
  gems: number;
  isComplete: boolean;
  isDoubleXpActive: boolean;
  minGems: number;
  nudgeStorageUserId: string;
  requireInactiveBoost: boolean;
  showToast: (message: string, variant?: InlineToastTone) => void;
}

export function useLessonPostCompletion(params: UseLessonPostCompletionParams) {
  const completionEffects = useLessonCompletionEffects({
    addXp: params.addXp,
    currentQuestion: params.currentQuestion,
    dailyShowLimit: params.dailyShowLimit,
    enabled: params.enabled,
    fileParam: params.fileParam,
    gems: params.gems,
    isComplete: params.isComplete,
    isDoubleXpActive: params.isDoubleXpActive,
    minGems: params.minGems,
    nudgeStorageUserId: params.nudgeStorageUserId,
    requireInactiveBoost: params.requireInactiveBoost,
  });

  const handleDoubleXpNudgePurchase = useCallback(() => {
    trackDoubleXpNudgeClicked(params.gems);
    const result = params.buyDoubleXP("lesson_complete_nudge");
    if (result.success) {
      completionEffects.trackNudgeConverted();
      completionEffects.setShowDoubleXpNudge(false);
      params.showToast(String(i18n.t("lesson.doubleXpNudge.purchased")), "success");
      return;
    }

    if (result.reason === "already_active") {
      params.showToast(String(i18n.t("shop.errors.doubleXpAlreadyActive")), "error");
      return;
    }

    params.showToast(String(i18n.t("shop.errors.notEnoughGems")), "error");
  }, [completionEffects, params]);

  return {
    ...completionEffects,
    handleDoubleXpNudgePurchase,
    showFeltBetterPrompt: !completionEffects.feltBetterSubmitted && Boolean(completionEffects.lastShownInterventionId),
  };
}
