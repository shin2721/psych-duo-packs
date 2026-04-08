import AsyncStorage from "@react-native-async-storage/async-storage";
import { assignExperiment } from "../experimentEngine";
import {
  consumeDailyNudgeQuota,
  getDailyNudgeRemaining,
  normalizeDoubleXpNudgeState,
  shouldShowDoubleXpNudge,
  type DoubleXpNudgeState,
} from "../doubleXpNudge";

export interface LessonDoubleXpNudgeResult {
  assignment: { experimentId: string; variantId: string } | null;
  dailyRemainingAfterShow: number;
  shouldShow: boolean;
}

export async function evaluateLessonCompleteDoubleXpNudge(params: {
  dailyShowLimit: number;
  enabled: boolean;
  gems: number;
  isComplete: boolean;
  isDoubleXpActive: boolean;
  minGems: number;
  nudgeStorageUserId: string;
  requireInactiveBoost: boolean;
  today: string;
}): Promise<LessonDoubleXpNudgeResult> {
  const storageKey = `double_xp_nudge_state_${params.nudgeStorageUserId}`;
  let parsedState: DoubleXpNudgeState = { lastShownDate: null, shownCountToday: 0 };

  try {
    const saved = await AsyncStorage.getItem(storageKey);
    parsedState = normalizeDoubleXpNudgeState(saved ? JSON.parse(saved) : null);
  } catch (error) {
    console.error("[DoubleXpNudge] Failed to read state:", error);
  }

  const shouldShow = shouldShowDoubleXpNudge({
    enabled: params.enabled,
    isComplete: params.isComplete,
    isDoubleXpActive: params.isDoubleXpActive,
    gems: params.gems,
    minGems: params.minGems,
    requireInactiveBoost: params.requireInactiveBoost,
    dailyShowLimit: params.dailyShowLimit,
    state: parsedState,
    today: params.today,
  });

  if (!shouldShow) {
    return {
      assignment: null,
      dailyRemainingAfterShow: getDailyNudgeRemaining(parsedState, params.dailyShowLimit, params.today),
      shouldShow: false,
    };
  }

  const nextState = consumeDailyNudgeQuota(parsedState, params.today);
  const dailyRemainingAfterShow = getDailyNudgeRemaining(
    nextState,
    params.dailyShowLimit,
    params.today
  );

  const experiment = assignExperiment(
    params.nudgeStorageUserId,
    "double_xp_nudge_lesson_complete"
  );
  const assignment = experiment
    ? { experimentId: experiment.experimentId, variantId: experiment.variantId }
    : null;

  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
  } catch (error) {
    console.error("[DoubleXpNudge] Failed to persist state:", error);
  }

  return {
    assignment,
    dailyRemainingAfterShow,
    shouldShow: true,
  };
}

export async function markLessonNudgeExposure(params: {
  assignment: { experimentId: string; variantId: string } | null;
  nudgeStorageUserId: string;
  today: string;
  onExpose: (assignment: { experimentId: string; variantId: string }) => void;
}): Promise<void> {
  if (!params.assignment) return;

  const exposureKey = `experiment_exposed_${params.assignment.experimentId}_${params.nudgeStorageUserId}_${params.today}`;
  try {
    const alreadyExposed = await AsyncStorage.getItem(exposureKey);
    if (!alreadyExposed) {
      params.onExpose(params.assignment);
      await AsyncStorage.setItem(exposureKey, "1");
    }
  } catch (error) {
    console.error("[Experiment] Failed to persist exposure state:", error);
  }
}
