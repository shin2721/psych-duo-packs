import type { MasteryThemeState } from "./types";

const DEFAULT_MAX_ACTIVE_MASTERY_SLOTS = 3;
const MASTERY_VARIANT_ID_PATTERN = /^(.*)_m\d+$/;

export function createEmptyMasteryThemeState(args: {
  themeId: string;
  parentUnitId?: string | null;
  maxActiveSlots?: number;
}): MasteryThemeState {
  const normalizedMaxSlots =
    typeof args.maxActiveSlots === "number" && Number.isFinite(args.maxActiveSlots)
      ? Math.max(1, Math.floor(args.maxActiveSlots))
      : DEFAULT_MAX_ACTIVE_MASTERY_SLOTS;
  return {
    themeId: args.themeId,
    parentUnitId: args.parentUnitId ?? args.themeId,
    maxActiveSlots: normalizedMaxSlots,
    activeVariantIds: [],
    retiredVariantIds: [],
    sceneIdsCleared: [],
    scenesClearedCount: 0,
    attemptCount: 0,
    transferImprovement: false,
    repeatWithoutDropoff: false,
    newLearningValueDelta: 1,
    transferGainSlope: 0,
    repetitionRisk: 0,
    graduationState: "learning",
    masteryCeilingState: "open",
    lastEvaluatedAt: null,
  };
}

export function isMasteryVariantId(variantId: string): boolean {
  return MASTERY_VARIANT_ID_PATTERN.test(variantId);
}

export function getThemeIdFromMasteryVariantId(variantId: string): string | null {
  const match = variantId.match(MASTERY_VARIANT_ID_PATTERN);
  return match?.[1] ?? null;
}

export function evaluateMasteryGraduationState(state: MasteryThemeState): MasteryThemeState["graduationState"] {
  const hasSceneGeneralization = state.scenesClearedCount >= 3;
  const hasTransferEvidence = state.transferImprovement;
  const hasRepeatStability = state.repeatWithoutDropoff;
  const hasEnoughAttempts = state.attemptCount >= 3;

  if (hasEnoughAttempts && hasRepeatStability && (hasTransferEvidence || hasSceneGeneralization)) {
    return "graduated";
  }

  return "learning";
}

export function evaluateMasteryCeilingState(state: MasteryThemeState): MasteryThemeState["masteryCeilingState"] {
  const lowNewValue = state.newLearningValueDelta <= 0.15;
  const flatTransferGain = state.transferGainSlope <= 0;
  const highRepetitionRisk = state.repetitionRisk >= 0.75;

  if (highRepetitionRisk && (lowNewValue || flatTransferGain)) {
    return "ceiling_reached";
  }

  return "open";
}

export function canAddMasteryVariant(state: MasteryThemeState): boolean {
  if (state.masteryCeilingState === "ceiling_reached") return false;
  return state.activeVariantIds.length < state.maxActiveSlots;
}

export function registerMasteryVariant(
  state: MasteryThemeState,
  variantId: string
): MasteryThemeState {
  if (
    !variantId ||
    state.activeVariantIds.includes(variantId) ||
    state.retiredVariantIds.includes(variantId) ||
    !canAddMasteryVariant(state)
  ) {
    return state;
  }

  const next: MasteryThemeState = {
    ...state,
    activeVariantIds: [...state.activeVariantIds, variantId],
  };
  return reevaluateMasteryThemeState(next);
}

export function retireMasteryVariant(
  state: MasteryThemeState,
  variantId: string
): MasteryThemeState {
  if (!variantId) {
    return state;
  }

  const next: MasteryThemeState = {
    ...state,
    activeVariantIds: state.activeVariantIds.filter((candidate) => candidate !== variantId),
    retiredVariantIds: state.retiredVariantIds.includes(variantId)
      ? state.retiredVariantIds
      : [...state.retiredVariantIds, variantId],
  };
  return reevaluateMasteryThemeState(next);
}

function retireAllActiveMasteryVariants(state: MasteryThemeState): MasteryThemeState {
  if (state.activeVariantIds.length === 0) {
    return state;
  }

  const retiredVariantIds = [...state.retiredVariantIds];
  state.activeVariantIds.forEach((variantId) => {
    if (!retiredVariantIds.includes(variantId)) {
      retiredVariantIds.push(variantId);
    }
  });

  return reevaluateMasteryThemeState({
    ...state,
    activeVariantIds: [],
    retiredVariantIds,
  });
}

export function reevaluateMasteryThemeState(state: MasteryThemeState): MasteryThemeState {
  const normalizedState: MasteryThemeState = {
    ...state,
    scenesClearedCount: state.sceneIdsCleared.length,
  };
  return {
    ...normalizedState,
    graduationState: evaluateMasteryGraduationState(normalizedState),
    masteryCeilingState: evaluateMasteryCeilingState(normalizedState),
    lastEvaluatedAt: Date.now(),
  };
}

export function recordMasteryThemeEvidence(
  state: MasteryThemeState,
  args: {
    attemptDelta?: number;
    sceneId?: string | null;
    transferImprovement?: boolean;
    repeatWithoutDropoff?: boolean;
    newLearningValueDelta?: number;
    transferGainSlope?: number;
    repetitionRisk?: number;
  }
): MasteryThemeState {
  const nextSceneIds = args.sceneId && !state.sceneIdsCleared.includes(args.sceneId)
    ? [...state.sceneIdsCleared, args.sceneId]
    : state.sceneIdsCleared;
  const next: MasteryThemeState = {
    ...state,
    attemptCount: state.attemptCount + Math.max(0, Math.floor(args.attemptDelta ?? 0)),
    sceneIdsCleared: nextSceneIds,
    scenesClearedCount: nextSceneIds.length,
    transferImprovement: args.transferImprovement ?? state.transferImprovement,
    repeatWithoutDropoff: args.repeatWithoutDropoff ?? state.repeatWithoutDropoff,
    newLearningValueDelta:
      typeof args.newLearningValueDelta === "number"
        ? Math.max(0, Math.min(1, args.newLearningValueDelta))
        : state.newLearningValueDelta,
    transferGainSlope:
      typeof args.transferGainSlope === "number" ? args.transferGainSlope : state.transferGainSlope,
    repetitionRisk:
      typeof args.repetitionRisk === "number"
        ? Math.max(0, Math.min(1, args.repetitionRisk))
        : state.repetitionRisk,
  };

  return reevaluateMasteryThemeState(next);
}

export function completeMasteryVariant(
  state: MasteryThemeState,
  args: {
    variantId: string;
    completionCount?: number;
    abandonmentCount?: number;
    transferImprovement?: boolean;
    repeatWithoutDropoff?: boolean;
    newLearningValueDelta?: number;
    transferGainSlope?: number;
    repetitionRisk?: number;
  }
): MasteryThemeState {
  if (!args.variantId) {
    return state;
  }

  const completionCount = Math.max(1, Math.floor(args.completionCount ?? 1));
  const abandonmentCount = Math.max(0, Math.floor(args.abandonmentCount ?? 0));
  const nextRepeatWithoutDropoff =
    args.repeatWithoutDropoff ?? abandonmentCount <= Math.max(1, completionCount);
  const nextNewLearningValueDelta =
    typeof args.newLearningValueDelta === "number"
      ? args.newLearningValueDelta
      : completionCount <= 1
        ? 0.75
        : 0.2;
  const nextTransferGainSlope =
    typeof args.transferGainSlope === "number"
      ? args.transferGainSlope
      : args.transferImprovement
        ? 0.4
        : state.transferGainSlope > 0
          ? state.transferGainSlope
          : 0.1;
  const nextRepetitionRisk =
    typeof args.repetitionRisk === "number"
      ? args.repetitionRisk
      : abandonmentCount > 0
        ? Math.min(1, 0.35 + abandonmentCount * 0.2)
        : Math.min(1, Math.max(0.1, (completionCount - 1) * 0.3));

  const withEvidence = recordMasteryThemeEvidence(state, {
    attemptDelta: 1,
    sceneId: args.variantId,
    transferImprovement: args.transferImprovement,
    repeatWithoutDropoff: nextRepeatWithoutDropoff,
    newLearningValueDelta: nextNewLearningValueDelta,
    transferGainSlope: nextTransferGainSlope,
    repetitionRisk: nextRepetitionRisk,
  });
  const retiredCurrent = retireMasteryVariant(withEvidence, args.variantId);

  if (
    retiredCurrent.graduationState === "graduated" ||
    retiredCurrent.masteryCeilingState === "ceiling_reached"
  ) {
    return retireAllActiveMasteryVariants(retiredCurrent);
  }

  return retiredCurrent;
}

export function syncMasteryThemeSupply(
  state: MasteryThemeState,
  args: {
    availableVariantIds: string[];
  }
): MasteryThemeState {
  const availableVariantIds = [...new Set(args.availableVariantIds.filter(Boolean))].sort();
  const sanitizedActiveVariantIds = state.activeVariantIds.filter(
    (variantId) =>
      availableVariantIds.includes(variantId) && !state.retiredVariantIds.includes(variantId)
  );

  let nextState = reevaluateMasteryThemeState({
    ...state,
    activeVariantIds: sanitizedActiveVariantIds,
  });

  if (
    nextState.graduationState === "graduated" ||
    nextState.masteryCeilingState === "ceiling_reached"
  ) {
    return nextState;
  }

  for (const variantId of availableVariantIds) {
    if (!canAddMasteryVariant(nextState)) break;
    if (nextState.activeVariantIds.includes(variantId)) continue;
    if (nextState.retiredVariantIds.includes(variantId)) continue;
    nextState = registerMasteryVariant(nextState, variantId);
  }

  return nextState;
}
