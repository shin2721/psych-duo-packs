import {
  V2_GENERALIZATION_CAPTURE_STEP_IDS,
  V2_GENERALIZATION_CONTENT_VERSIONS,
  V2_GENERALIZATION_LESSON_IDS,
  V2_GENERALIZATION_SCHEMA_VERSION,
  V2_GENERALIZATION_SCORED_STEP_IDS,
  V2_GENERALIZATION_STEP_IDS,
  type V2GeneralizationAttempt,
  type V2GeneralizationInteractiveStepId,
  type V2GeneralizationLessonDefinition,
  type V2GeneralizationScoredProgress,
  type V2GeneralizationScoredStepDefinition,
  type V2GeneralizationScoredStepId,
  type V2GeneralizationSnapshot,
  type V2GeneralizationStepDefinition,
  type V2GeneralizationStepId,
} from "../../../types/v2GeneralizationPilot";

const CAPTURE_STEP_IDS = new Set<string>(V2_GENERALIZATION_CAPTURE_STEP_IDS);
const SCORED_STEP_IDS = new Set<string>(V2_GENERALIZATION_SCORED_STEP_IDS);
const LESSON_IDS = new Set<string>(V2_GENERALIZATION_LESSON_IDS);
const STEP_IDS = new Set<string>(V2_GENERALIZATION_STEP_IDS);

export type V2GeneralizationFlowStatus =
  | "selected"
  | "advanced"
  | "incorrect"
  | "completed"
  | "retried"
  | "blocked";

export type V2GeneralizationFlowBlockReason =
  | "selection_required"
  | "retry_required"
  | "invalid_option"
  | "not_interactive"
  | "not_retryable"
  | "already_complete"
  | "snapshot_identity_mismatch";

export interface V2GeneralizationFlowResult {
  snapshot: V2GeneralizationSnapshot;
  status: V2GeneralizationFlowStatus;
  feedback?: string;
  blockReason?: V2GeneralizationFlowBlockReason;
}

function normalizeTimestamp(value?: string): string {
  if (value) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function hasMatchingSnapshotIdentity(
  snapshot: V2GeneralizationSnapshot,
  lesson: V2GeneralizationLessonDefinition
): boolean {
  return (
    snapshot.schemaVersion === V2_GENERALIZATION_SCHEMA_VERSION &&
    snapshot.contentVersion === lesson.contentVersion &&
    snapshot.lessonId === lesson.id
  );
}

function identityMismatchResult(
  snapshot: V2GeneralizationSnapshot
): V2GeneralizationFlowResult {
  return {
    snapshot,
    status: "blocked",
    blockReason: "snapshot_identity_mismatch",
  };
}

function emptyScoredProgress(): V2GeneralizationScoredProgress {
  return {
    firstOptionId: null,
    firstCorrect: null,
    attempts: [],
  };
}

export function createInitialV2GeneralizationSnapshot(
  lesson: V2GeneralizationLessonDefinition,
  nowIso?: string
): V2GeneralizationSnapshot {
  assertValidV2GeneralizationLessonDefinition(lesson);
  const now = normalizeTimestamp(nowIso);
  return {
    schemaVersion: V2_GENERALIZATION_SCHEMA_VERSION,
    contentVersion: lesson.contentVersion,
    lessonId: lesson.id,
    currentStep: lesson.stepOrder[0],
    answers: {
      prediction: null,
      update: null,
      boundary: null,
      retrieval: null,
      transfer: null,
    },
    scored: {
      boundary: emptyScoredProgress(),
      retrieval: emptyScoredProgress(),
      transfer: emptyScoredProgress(),
    },
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

export function getV2GeneralizationStep(
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationStepId
): V2GeneralizationStepDefinition {
  const step = lesson.steps.find((candidate) => candidate.id === stepId);
  if (!step) {
    throw new Error(`Missing V2 generalization step: ${lesson.id}/${stepId}`);
  }
  return step;
}

function getNextStepId(
  lesson: V2GeneralizationLessonDefinition,
  currentStep: V2GeneralizationStepId
): V2GeneralizationStepId {
  const index = lesson.stepOrder.indexOf(currentStep);
  if (index < 0) {
    throw new Error(
      `Missing V2 generalization step order entry: ${lesson.id}/${currentStep}`
    );
  }
  return lesson.stepOrder[
    Math.min(index + 1, lesson.stepOrder.length - 1)
  ];
}

function isInteractiveStepId(
  stepId: V2GeneralizationStepId
): stepId is V2GeneralizationInteractiveStepId {
  return CAPTURE_STEP_IDS.has(stepId) || SCORED_STEP_IDS.has(stepId);
}

function isScoredStepId(
  stepId: V2GeneralizationStepId
): stepId is V2GeneralizationScoredStepId {
  return SCORED_STEP_IDS.has(stepId);
}

function getLatestAttempt(
  snapshot: V2GeneralizationSnapshot,
  stepId: V2GeneralizationScoredStepId
): V2GeneralizationAttempt | null {
  const attempts = snapshot.scored[stepId].attempts;
  return attempts[attempts.length - 1] ?? null;
}

export function isV2GeneralizationRetryRequired(
  snapshot: V2GeneralizationSnapshot
): boolean {
  if (!isScoredStepId(snapshot.currentStep)) return false;
  const answer = snapshot.answers[snapshot.currentStep];
  const latest = getLatestAttempt(snapshot, snapshot.currentStep);
  return Boolean(
    answer && latest && latest.optionId === answer && latest.correct === false
  );
}

export function selectV2GeneralizationOption(
  snapshot: V2GeneralizationSnapshot,
  lesson: V2GeneralizationLessonDefinition,
  optionId: string,
  nowIso?: string
): V2GeneralizationFlowResult {
  if (!hasMatchingSnapshotIdentity(snapshot, lesson)) {
    return identityMismatchResult(snapshot);
  }
  const step = getV2GeneralizationStep(lesson, snapshot.currentStep);
  if (step.kind !== "capture" && step.kind !== "scored") {
    return {
      snapshot,
      status: "blocked",
      blockReason: "not_interactive",
    };
  }
  if (!step.options.some((option) => option.id === optionId)) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "invalid_option",
    };
  }
  if (isV2GeneralizationRetryRequired(snapshot)) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "retry_required",
    };
  }

  return {
    status: "selected",
    snapshot: {
      ...snapshot,
      answers: {
        ...snapshot.answers,
        [snapshot.currentStep]: optionId,
      },
      updatedAt: normalizeTimestamp(nowIso),
    },
  };
}

export function advanceV2GeneralizationFlow(
  snapshot: V2GeneralizationSnapshot,
  lesson: V2GeneralizationLessonDefinition,
  nowIso?: string
): V2GeneralizationFlowResult {
  if (!hasMatchingSnapshotIdentity(snapshot, lesson)) {
    return identityMismatchResult(snapshot);
  }
  const step = getV2GeneralizationStep(lesson, snapshot.currentStep);
  const now = normalizeTimestamp(nowIso);

  if (step.kind === "complete") {
    return {
      snapshot,
      status: "blocked",
      blockReason: "already_complete",
    };
  }

  if (step.kind === "evidence") {
    const nextStep = getNextStepId(lesson, snapshot.currentStep);
    const completed = nextStep === "complete";
    return {
      status: completed ? "completed" : "advanced",
      snapshot: {
        ...snapshot,
        currentStep: nextStep,
        updatedAt: now,
        completedAt: completed ? now : snapshot.completedAt,
      },
    };
  }

  const selectedOptionId = snapshot.answers[step.id];
  if (!selectedOptionId) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "selection_required",
    };
  }

  if (step.kind === "capture") {
    const nextStep = getNextStepId(lesson, snapshot.currentStep);
    const completed = nextStep === "complete";
    return {
      status: completed ? "completed" : "advanced",
      snapshot: {
        ...snapshot,
        currentStep: nextStep,
        updatedAt: now,
        completedAt: completed ? now : snapshot.completedAt,
      },
    };
  }

  if (isV2GeneralizationRetryRequired(snapshot)) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "retry_required",
    };
  }

  const selectedOption = step.options.find(
    (option) => option.id === selectedOptionId
  );
  if (!selectedOption) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "invalid_option",
    };
  }

  const correct = selectedOptionId === step.correctOptionId;
  const previousProgress = snapshot.scored[step.id];
  const attempt: V2GeneralizationAttempt = {
    optionId: selectedOptionId,
    correct,
    attemptedAt: now,
  };
  const nextProgress: V2GeneralizationScoredProgress = {
    firstOptionId: previousProgress.firstOptionId ?? selectedOptionId,
    firstCorrect: previousProgress.firstCorrect ?? correct,
    attempts: [...previousProgress.attempts, attempt],
  };
  const scored = {
    ...snapshot.scored,
    [step.id]: nextProgress,
  };

  if (!correct) {
    return {
      status: "incorrect",
      feedback: selectedOption.feedback,
      snapshot: {
        ...snapshot,
        scored,
        updatedAt: now,
      },
    };
  }

  const nextStep = getNextStepId(lesson, snapshot.currentStep);
  const completed = nextStep === "complete";
  return {
    status: completed ? "completed" : "advanced",
    feedback: selectedOption.feedback,
    snapshot: {
      ...snapshot,
      scored,
      currentStep: nextStep,
      updatedAt: now,
      completedAt: completed ? now : snapshot.completedAt,
    },
  };
}

export function retryV2GeneralizationStep(
  snapshot: V2GeneralizationSnapshot,
  lesson: V2GeneralizationLessonDefinition,
  nowIso?: string
): V2GeneralizationFlowResult {
  if (!hasMatchingSnapshotIdentity(snapshot, lesson)) {
    return identityMismatchResult(snapshot);
  }
  if (!isScoredStepId(snapshot.currentStep)) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "not_retryable",
    };
  }
  if (!isV2GeneralizationRetryRequired(snapshot)) {
    return {
      snapshot,
      status: "blocked",
      blockReason: "not_retryable",
    };
  }

  return {
    status: "retried",
    snapshot: {
      ...snapshot,
      answers: {
        ...snapshot.answers,
        [snapshot.currentStep]: null,
      },
      updatedAt: normalizeTimestamp(nowIso),
    },
  };
}

export function getV2GeneralizationFirstAttemptCorrectness(
  snapshot: V2GeneralizationSnapshot
): Record<V2GeneralizationScoredStepId, boolean | null> {
  return {
    boundary: snapshot.scored.boundary.firstCorrect,
    retrieval: snapshot.scored.retrieval.firstCorrect,
    transfer: snapshot.scored.transfer.firstCorrect,
  };
}

function addMissingTextError(
  errors: string[],
  value: string,
  fieldPath: string
): void {
  if (!value.trim()) errors.push(`${fieldPath} must not be empty`);
}

export function validateV2GeneralizationLessonDefinition(
  lesson: V2GeneralizationLessonDefinition
): string[] {
  const errors: string[] = [];
  if (!LESSON_IDS.has(lesson.id)) errors.push(`unknown lesson id: ${lesson.id}`);
  if (!V2_GENERALIZATION_CONTENT_VERSIONS.includes(lesson.contentVersion)) {
    errors.push(`unsupported content version: ${lesson.contentVersion}`);
  }
  if (lesson.sharedSkillId !== "claim_boundary_transfer_v1") {
    errors.push(`unsupported shared skill: ${lesson.sharedSkillId}`);
  }
  addMissingTextError(errors, lesson.title, "title");
  addMissingTextError(errors, lesson.subtitle, "subtitle");
  addMissingTextError(errors, lesson.rawInsight, "rawInsight");

  if (lesson.sources.length === 0) errors.push("at least one source is required");
  const sourceUrls = new Set<string>();
  lesson.sources.forEach((source, index) => {
    addMissingTextError(errors, source.label, `sources[${index}].label`);
    if (!source.url.startsWith("https://")) {
      errors.push(`sources[${index}].url must use https`);
    }
    if (sourceUrls.has(source.url)) {
      errors.push(`duplicate source url: ${source.url}`);
    }
    sourceUrls.add(source.url);
  });

  if (lesson.stepOrder.length === 0) {
    errors.push("stepOrder must not be empty");
  }

  const orderedStepIds = new Set<string>();
  lesson.stepOrder.forEach((stepId, index) => {
    if (!STEP_IDS.has(stepId)) {
      errors.push(`stepOrder[${index}] has unknown step id: ${stepId}`);
    }
    if (orderedStepIds.has(stepId)) {
      errors.push(`duplicate stepOrder id: ${stepId}`);
    }
    orderedStepIds.add(stepId);
  });

  if (lesson.stepOrder.length !== lesson.steps.length) {
    errors.push(
      `stepOrder has ${lesson.stepOrder.length} entries but definitions have ${lesson.steps.length}`
    );
  }
  if (lesson.stepOrder[lesson.stepOrder.length - 1] !== "complete") {
    errors.push("stepOrder must end with complete");
  }

  const stepIds = new Set<string>();
  const optionIds = new Set<string>();
  const updateStep = lesson.steps.find(
    (candidate) => candidate.id === "update" && candidate.kind === "capture"
  );
  const updateOptionIds = new Set(
    updateStep?.kind === "capture"
      ? updateStep.options.map((option) => option.id)
      : []
  );
  lesson.steps.forEach((step, index) => {
    const expectedStepId = lesson.stepOrder[index];
    if (step.id !== expectedStepId) {
      errors.push(
        `step ${index} must be ${expectedStepId ?? "absent"}, received ${step.id}`
      );
    }
    if (stepIds.has(step.id)) errors.push(`duplicate step id: ${step.id}`);
    stepIds.add(step.id);

    if (step.kind === "capture") {
      if (!CAPTURE_STEP_IDS.has(step.id)) {
        errors.push(`${step.id} is not a capture step`);
      }
      addMissingTextError(errors, step.prompt, `${step.id}.prompt`);
      if (step.eyebrow !== undefined) {
        addMissingTextError(errors, step.eyebrow, `${step.id}.eyebrow`);
      }
      if (step.helperText !== undefined) {
        addMissingTextError(errors, step.helperText, `${step.id}.helperText`);
      }
      if (step.options.length < 2) errors.push(`${step.id} needs 2+ options`);
      step.options.forEach((option) => {
        addMissingTextError(errors, option.id, `${step.id}.option.id`);
        addMissingTextError(errors, option.label, `${step.id}.${option.id}.label`);
        if (optionIds.has(option.id)) errors.push(`duplicate option id: ${option.id}`);
        optionIds.add(option.id);
      });
      return;
    }

    if (step.kind === "evidence") {
      addMissingTextError(errors, step.headline, "evidence.headline");
      addMissingTextError(errors, step.result, "evidence.result");
      addMissingTextError(errors, step.caveat, "evidence.caveat");
      Object.entries(step.frame).forEach(([key, value]) =>
        addMissingTextError(errors, value, `evidence.frame.${key}`)
      );
      step.contrast?.forEach((item, contrastIndex) => {
        addMissingTextError(
          errors,
          item.label,
          `evidence.contrast[${contrastIndex}].label`
        );
        addMissingTextError(
          errors,
          item.value,
          `evidence.contrast[${contrastIndex}].value`
        );
      });
      if (step.presentation === "compact" && (step.contrast?.length ?? 0) < 2) {
        errors.push("compact evidence needs 2+ contrast rows");
      }
      return;
    }

    if (step.kind === "scored") {
      if (!SCORED_STEP_IDS.has(step.id)) {
        errors.push(`${step.id} is not a scored step`);
      }
      addMissingTextError(errors, step.prompt, `${step.id}.prompt`);
      (
        [
          ["title", step.title],
          ["eyebrow", step.eyebrow],
          ["contextLabel", step.contextLabel],
          ["correctFeedbackTitle", step.correctFeedbackTitle],
          ["incorrectFeedbackTitle", step.incorrectFeedbackTitle],
        ] as const
      ).forEach(([field, value]) => {
        if (value !== undefined) {
          addMissingTextError(errors, value, `${step.id}.${field}`);
        }
      });
      if (step.options.length < 2) errors.push(`${step.id} needs 2+ options`);
      step.options.forEach((option) => {
        addMissingTextError(errors, option.id, `${step.id}.option.id`);
        addMissingTextError(errors, option.label, `${step.id}.${option.id}.label`);
        addMissingTextError(
          errors,
          option.feedback,
          `${step.id}.${option.id}.feedback`
        );
        if (optionIds.has(option.id)) errors.push(`duplicate option id: ${option.id}`);
        optionIds.add(option.id);
      });
      if (!step.options.some((option) => option.id === step.correctOptionId)) {
        errors.push(`${step.id} correctOptionId is missing from options`);
      }
      return;
    }

    addMissingTextError(errors, step.action, "complete.action");
    if (step.actionByOptionId) {
      Object.entries(step.actionByOptionId).forEach(([optionId, action]) => {
        addMissingTextError(errors, optionId, "complete.actionByOptionId.key");
        if (!updateOptionIds.has(optionId)) {
          errors.push(
            `complete.actionByOptionId has unknown update option: ${optionId}`
          );
        }
        addMissingTextError(
          errors,
          action,
          `complete.actionByOptionId.${optionId}`
        );
      });
    }
    addMissingTextError(errors, step.disclaimer, "complete.disclaimer");
    addMissingTextError(errors, step.nextQuestion, "complete.nextQuestion");
  });

  const firstStep = lesson.steps.find(
    (step) => step.id === lesson.stepOrder[0]
  );
  if (
    firstStep &&
    firstStep.kind !== "capture" &&
    firstStep.kind !== "scored"
  ) {
    errors.push("stepOrder must start with an interactive step");
  }

  if (
    lesson.steps.length > 0 &&
    lesson.steps[lesson.steps.length - 1]?.kind !== "complete"
  ) {
    errors.push("step definitions must end with complete");
  }

  return errors;
}

export function assertValidV2GeneralizationLessonDefinition(
  lesson: V2GeneralizationLessonDefinition
): void {
  const errors = validateV2GeneralizationLessonDefinition(lesson);
  if (errors.length > 0) {
    throw new Error(
      `Invalid V2 generalization lesson ${lesson.id}:\n${errors.join("\n")}`
    );
  }
}

export function isV2GeneralizationScoredStep(
  step: V2GeneralizationStepDefinition
): step is V2GeneralizationScoredStepDefinition {
  return step.kind === "scored";
}
