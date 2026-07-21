export const V2_GENERALIZATION_SCHEMA_VERSION = 1 as const;

export const V2_GENERALIZATION_CONTENT_VERSION =
  "accepted-raw-2026-07-20-v1" as const;

export const V2_WALKING_CONTENT_VERSION =
  "walking-life-use-2026-07-21-v2" as const;

export const V2_GENERALIZATION_CONTENT_VERSIONS = [
  V2_GENERALIZATION_CONTENT_VERSION,
  V2_WALKING_CONTENT_VERSION,
] as const;

export type V2GeneralizationContentVersion =
  (typeof V2_GENERALIZATION_CONTENT_VERSIONS)[number];

export const V2_GENERALIZATION_LESSON_IDS = [
  "walking-divergence-v1",
  "interleaving-boundary-v1",
  "temptation-bundling-v1",
] as const;

export type V2GeneralizationLessonId =
  (typeof V2_GENERALIZATION_LESSON_IDS)[number];

export const V2_GENERALIZATION_STEP_IDS = [
  "prediction",
  "evidence",
  "update",
  "boundary",
  "retrieval",
  "transfer",
  "complete",
] as const;

export type V2GeneralizationStepId =
  (typeof V2_GENERALIZATION_STEP_IDS)[number];

export const V2_GENERALIZATION_CAPTURE_STEP_IDS = [
  "prediction",
  "update",
] as const;

export type V2GeneralizationCaptureStepId =
  (typeof V2_GENERALIZATION_CAPTURE_STEP_IDS)[number];

export const V2_GENERALIZATION_SCORED_STEP_IDS = [
  "boundary",
  "retrieval",
  "transfer",
] as const;

export type V2GeneralizationScoredStepId =
  (typeof V2_GENERALIZATION_SCORED_STEP_IDS)[number];

export type V2GeneralizationInteractiveStepId =
  | V2GeneralizationCaptureStepId
  | V2GeneralizationScoredStepId;

export interface V2GeneralizationChoiceOption {
  id: string;
  label: string;
}

export interface V2GeneralizationScoredOption
  extends V2GeneralizationChoiceOption {
  feedback: string;
}

export interface V2GeneralizationCaptureStepDefinition {
  id: V2GeneralizationCaptureStepId;
  kind: "capture";
  eyebrow?: string;
  helperText?: string;
  scene?: string;
  prompt: string;
  options: readonly V2GeneralizationChoiceOption[];
}

export interface V2GeneralizationEvidenceFrame {
  target: string;
  comparison: string;
  result: string;
  time: string;
  setting: string;
}

export interface V2GeneralizationEvidenceStepDefinition {
  id: "evidence";
  kind: "evidence";
  presentation?: "full" | "compact";
  contrast?: readonly { label: string; value: string }[];
  headline: string;
  result: string;
  caveat: string;
  frame: V2GeneralizationEvidenceFrame;
}

export interface V2GeneralizationScoredStepDefinition {
  id: V2GeneralizationScoredStepId;
  kind: "scored";
  title?: string;
  eyebrow?: string;
  contextLabel?: string;
  correctFeedbackTitle?: string;
  incorrectFeedbackTitle?: string;
  context?: string;
  sourceClaim?: string;
  headline?: string;
  prompt: string;
  options: readonly V2GeneralizationScoredOption[];
  correctOptionId: string;
}

export interface V2GeneralizationCompleteStepDefinition {
  id: "complete";
  kind: "complete";
  action: string;
  actionByOptionId?: Readonly<Record<string, string>>;
  optionalSelfObservation?: string;
  disclaimer: string;
  nextQuestion: string;
}

export type V2GeneralizationStepDefinition =
  | V2GeneralizationCaptureStepDefinition
  | V2GeneralizationEvidenceStepDefinition
  | V2GeneralizationScoredStepDefinition
  | V2GeneralizationCompleteStepDefinition;

export interface V2GeneralizationSourceLink {
  label: string;
  url: string;
}

export interface V2GeneralizationLessonDefinition {
  id: V2GeneralizationLessonId;
  contentVersion: V2GeneralizationContentVersion;
  sharedSkillId: "claim_boundary_transfer_v1";
  title: string;
  subtitle: string;
  rawInsight: string;
  stepOrder: readonly V2GeneralizationStepId[];
  sources: readonly V2GeneralizationSourceLink[];
  steps: readonly V2GeneralizationStepDefinition[];
}

export interface V2GeneralizationAttempt {
  optionId: string;
  correct: boolean;
  attemptedAt: string;
}

export interface V2GeneralizationScoredProgress {
  firstOptionId: string | null;
  firstCorrect: boolean | null;
  attempts: V2GeneralizationAttempt[];
}

export type V2GeneralizationAnswers = Record<
  V2GeneralizationInteractiveStepId,
  string | null
>;

export type V2GeneralizationScoredProgressByStep = Record<
  V2GeneralizationScoredStepId,
  V2GeneralizationScoredProgress
>;

export interface V2GeneralizationSnapshot {
  schemaVersion: typeof V2_GENERALIZATION_SCHEMA_VERSION;
  contentVersion: V2GeneralizationContentVersion;
  lessonId: V2GeneralizationLessonId;
  currentStep: V2GeneralizationStepId;
  answers: V2GeneralizationAnswers;
  scored: V2GeneralizationScoredProgressByStep;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}
