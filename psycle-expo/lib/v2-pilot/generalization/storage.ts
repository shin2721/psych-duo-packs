import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  V2_GENERALIZATION_CAPTURE_STEP_IDS,
  V2_GENERALIZATION_CONTENT_VERSION,
  V2_GENERALIZATION_SCHEMA_VERSION,
  V2_GENERALIZATION_SCORED_STEP_IDS,
  V2_GENERALIZATION_STEP_IDS,
  type V2GeneralizationAnswers,
  type V2GeneralizationAttempt,
  type V2GeneralizationInteractiveStepId,
  type V2GeneralizationLessonDefinition,
  type V2GeneralizationLessonId,
  type V2GeneralizationScoredProgress,
  type V2GeneralizationScoredProgressByStep,
  type V2GeneralizationScoredStepId,
  type V2GeneralizationSnapshot,
  type V2GeneralizationStepId,
} from "../../../types/v2GeneralizationPilot";
import {
  assertValidV2GeneralizationLessonDefinition,
  createInitialV2GeneralizationSnapshot,
  getV2GeneralizationStep,
} from "./flow";

export const V2_GENERALIZATION_STORAGE_KEY_PREFIX =
  "psycle:v2-owner-pilot:generalization:v1";

const STEP_IDS = new Set<string>(V2_GENERALIZATION_STEP_IDS);
const INTERACTIVE_STEP_IDS: readonly V2GeneralizationInteractiveStepId[] = [
  ...V2_GENERALIZATION_CAPTURE_STEP_IDS,
  ...V2_GENERALIZATION_SCORED_STEP_IDS,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

function normalizeNow(nowIso?: string): string {
  return normalizeIsoTimestamp(nowIso) ?? new Date().toISOString();
}

function optionExists(
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationInteractiveStepId,
  optionId: string
): boolean {
  const step = getV2GeneralizationStep(lesson, stepId);
  if (step.kind !== "capture" && step.kind !== "scored") return false;
  return step.options.some((option) => option.id === optionId);
}

function optionIsCorrect(
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationScoredStepId,
  optionId: string
): boolean {
  const step = getV2GeneralizationStep(lesson, stepId);
  return step.kind === "scored" && step.correctOptionId === optionId;
}

function normalizeAnswers(
  value: unknown,
  lesson: V2GeneralizationLessonDefinition
): V2GeneralizationAnswers | null {
  if (!isRecord(value)) return null;
  const answers = {} as V2GeneralizationAnswers;
  for (const stepId of INTERACTIVE_STEP_IDS) {
    const rawAnswer = value[stepId];
    if (rawAnswer === null) {
      answers[stepId] = null;
      continue;
    }
    if (
      typeof rawAnswer !== "string" ||
      !optionExists(lesson, stepId, rawAnswer)
    ) {
      return null;
    }
    answers[stepId] = rawAnswer;
  }
  return answers;
}

function normalizeAttempt(
  value: unknown,
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationScoredStepId
): V2GeneralizationAttempt | null {
  if (!isRecord(value)) return null;
  const optionId = value.optionId;
  const correct = value.correct;
  const attemptedAt = normalizeIsoTimestamp(value.attemptedAt);
  if (
    typeof optionId !== "string" ||
    !optionExists(lesson, stepId, optionId) ||
    typeof correct !== "boolean" ||
    correct !== optionIsCorrect(lesson, stepId, optionId) ||
    !attemptedAt
  ) {
    return null;
  }
  return { optionId, correct, attemptedAt };
}

function normalizeScoredProgress(
  value: unknown,
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationScoredStepId
): V2GeneralizationScoredProgress | null {
  if (!isRecord(value) || !Array.isArray(value.attempts)) return null;
  const attempts: V2GeneralizationAttempt[] = [];
  for (const rawAttempt of value.attempts) {
    const attempt = normalizeAttempt(rawAttempt, lesson, stepId);
    if (!attempt) return null;
    attempts.push(attempt);
  }

  const firstOptionId = value.firstOptionId;
  const firstCorrect = value.firstCorrect;
  if (attempts.length === 0) {
    if (firstOptionId !== null || firstCorrect !== null) return null;
    return { firstOptionId: null, firstCorrect: null, attempts };
  }

  const firstAttempt = attempts[0];
  if (
    firstOptionId !== firstAttempt.optionId ||
    firstCorrect !== firstAttempt.correct
  ) {
    return null;
  }
  return {
    firstOptionId: firstAttempt.optionId,
    firstCorrect: firstAttempt.correct,
    attempts,
  };
}

function normalizeScored(
  value: unknown,
  lesson: V2GeneralizationLessonDefinition
): V2GeneralizationScoredProgressByStep | null {
  if (!isRecord(value)) return null;
  const scored = {} as V2GeneralizationScoredProgressByStep;
  for (const stepId of V2_GENERALIZATION_SCORED_STEP_IDS) {
    const progress = normalizeScoredProgress(value[stepId], lesson, stepId);
    if (!progress) return null;
    scored[stepId] = progress;
  }
  return scored;
}

function isScoredStepEmpty(
  answers: V2GeneralizationAnswers,
  scored: V2GeneralizationScoredProgressByStep,
  stepId: V2GeneralizationScoredStepId
): boolean {
  const progress = scored[stepId];
  return (
    answers[stepId] === null &&
    progress.firstOptionId === null &&
    progress.firstCorrect === null &&
    progress.attempts.length === 0
  );
}

function isScoredStepComplete(
  answers: V2GeneralizationAnswers,
  scored: V2GeneralizationScoredProgressByStep,
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationScoredStepId
): boolean {
  const answer = answers[stepId];
  const attempts = scored[stepId].attempts;
  const latest = attempts[attempts.length - 1];
  return Boolean(
    answer &&
      latest &&
      latest.correct &&
      attempts.slice(0, -1).every((attempt) => !attempt.correct) &&
      latest.optionId === answer &&
      optionIsCorrect(lesson, stepId, answer)
  );
}

function isCurrentScoredStepValid(
  answers: V2GeneralizationAnswers,
  scored: V2GeneralizationScoredProgressByStep,
  stepId: V2GeneralizationScoredStepId
): boolean {
  const answer = answers[stepId];
  const attempts = scored[stepId].attempts;
  if (attempts.some((attempt) => attempt.correct)) return false;
  if (attempts.length === 0) return true;
  const latest = attempts[attempts.length - 1];
  if (!latest || latest.correct) return false;

  // The current answer may be the submitted wrong answer (feedback state),
  // null after retry, or a newly selected option before the next submit.
  return answer === null || typeof answer === "string";
}

function hasValidStepProgression(
  currentStep: V2GeneralizationStepId,
  answers: V2GeneralizationAnswers,
  scored: V2GeneralizationScoredProgressByStep,
  lesson: V2GeneralizationLessonDefinition
): boolean {
  const predictionDone = answers.prediction !== null;
  const updateDone = answers.update !== null;
  const boundaryEmpty = isScoredStepEmpty(answers, scored, "boundary");
  const retrievalEmpty = isScoredStepEmpty(answers, scored, "retrieval");
  const transferEmpty = isScoredStepEmpty(answers, scored, "transfer");
  const boundaryDone = isScoredStepComplete(
    answers,
    scored,
    lesson,
    "boundary"
  );
  const retrievalDone = isScoredStepComplete(
    answers,
    scored,
    lesson,
    "retrieval"
  );
  const transferDone = isScoredStepComplete(
    answers,
    scored,
    lesson,
    "transfer"
  );

  switch (currentStep) {
    case "prediction":
      return answers.update === null && boundaryEmpty && retrievalEmpty && transferEmpty;
    case "evidence":
      return predictionDone && answers.update === null && boundaryEmpty && retrievalEmpty && transferEmpty;
    case "update":
      return predictionDone && boundaryEmpty && retrievalEmpty && transferEmpty;
    case "boundary":
      return (
        predictionDone &&
        updateDone &&
        isCurrentScoredStepValid(answers, scored, "boundary") &&
        retrievalEmpty &&
        transferEmpty
      );
    case "retrieval":
      return (
        predictionDone &&
        updateDone &&
        boundaryDone &&
        isCurrentScoredStepValid(answers, scored, "retrieval") &&
        transferEmpty
      );
    case "transfer":
      return (
        predictionDone &&
        updateDone &&
        boundaryDone &&
        retrievalDone &&
        isCurrentScoredStepValid(answers, scored, "transfer")
      );
    case "complete":
      return (
        predictionDone &&
        updateDone &&
        boundaryDone &&
        retrievalDone &&
        transferDone
      );
  }
}

export function getV2GeneralizationStorageKey(
  lessonId: V2GeneralizationLessonId,
  userId?: string | null,
  contentVersion: string = V2_GENERALIZATION_CONTENT_VERSION
): string {
  const keyParts = [
    V2_GENERALIZATION_STORAGE_KEY_PREFIX,
    encodeURIComponent(contentVersion),
    encodeURIComponent(lessonId),
  ];
  if (userId === null || userId === undefined) {
    return [...keyParts, "anonymous"].join(":");
  }
  if (userId.length === 0) {
    return [...keyParts, "authenticated", "empty"].join(":");
  }
  return [...keyParts, "authenticated", "id", encodeURIComponent(userId)].join(
    ":"
  );
}

export function normalizeV2GeneralizationSnapshot(
  value: unknown,
  lesson: V2GeneralizationLessonDefinition,
  nowIso?: string
): V2GeneralizationSnapshot {
  assertValidV2GeneralizationLessonDefinition(lesson);
  const initial = createInitialV2GeneralizationSnapshot(lesson, nowIso);
  if (!isRecord(value)) return initial;
  if (value.schemaVersion !== V2_GENERALIZATION_SCHEMA_VERSION) return initial;
  if (value.contentVersion !== lesson.contentVersion) return initial;
  if (value.lessonId !== lesson.id) return initial;

  const rawStep = value.currentStep;
  if (typeof rawStep !== "string" || !STEP_IDS.has(rawStep)) return initial;
  const currentStep = rawStep as V2GeneralizationStepId;
  const answers = normalizeAnswers(value.answers, lesson);
  const scored = normalizeScored(value.scored, lesson);
  const startedAt = normalizeIsoTimestamp(value.startedAt);
  const updatedAt = normalizeIsoTimestamp(value.updatedAt);
  if (!answers || !scored || !startedAt || !updatedAt) return initial;

  if (!hasValidStepProgression(currentStep, answers, scored, lesson)) {
    return initial;
  }

  const storedCompletedAt = normalizeIsoTimestamp(value.completedAt);
  if (currentStep === "complete") {
    if (!storedCompletedAt) return initial;
    const transferAnswer = answers.transfer;
    if (
      !transferAnswer ||
      !optionIsCorrect(lesson, "transfer", transferAnswer) ||
      scored.transfer.attempts.length === 0 ||
      scored.transfer.attempts[scored.transfer.attempts.length - 1]?.correct !== true
    ) {
      return initial;
    }
  } else if (value.completedAt !== null) {
    return initial;
  }

  return {
    schemaVersion: V2_GENERALIZATION_SCHEMA_VERSION,
    contentVersion: lesson.contentVersion,
    lessonId: lesson.id,
    currentStep,
    answers,
    scored,
    startedAt,
    updatedAt,
    completedAt: currentStep === "complete" ? storedCompletedAt : null,
  };
}

export async function loadV2GeneralizationSnapshot(
  lesson: V2GeneralizationLessonDefinition,
  userId?: string | null,
  nowIso?: string
): Promise<V2GeneralizationSnapshot> {
  const raw = await AsyncStorage.getItem(
    getV2GeneralizationStorageKey(lesson.id, userId, lesson.contentVersion)
  );
  if (!raw) return createInitialV2GeneralizationSnapshot(lesson, nowIso);
  try {
    return normalizeV2GeneralizationSnapshot(JSON.parse(raw), lesson, nowIso);
  } catch {
    return createInitialV2GeneralizationSnapshot(lesson, nowIso);
  }
}

export async function saveV2GeneralizationSnapshot(
  lesson: V2GeneralizationLessonDefinition,
  userId: string | null | undefined,
  snapshot: V2GeneralizationSnapshot,
  nowIso?: string
): Promise<V2GeneralizationSnapshot> {
  const updatedAt = normalizeNow(nowIso);
  const candidate = {
    ...snapshot,
    updatedAt,
    completedAt:
      snapshot.currentStep === "complete"
        ? normalizeIsoTimestamp(snapshot.completedAt)
        : null,
  };
  const normalized = normalizeV2GeneralizationSnapshot(
    candidate,
    lesson,
    updatedAt
  );
  await AsyncStorage.setItem(
    getV2GeneralizationStorageKey(lesson.id, userId, lesson.contentVersion),
    JSON.stringify(normalized)
  );
  return normalized;
}

export async function resetV2GeneralizationSnapshot(
  lesson: V2GeneralizationLessonDefinition,
  userId?: string | null
): Promise<void> {
  await AsyncStorage.removeItem(
    getV2GeneralizationStorageKey(lesson.id, userId, lesson.contentVersion)
  );
}
