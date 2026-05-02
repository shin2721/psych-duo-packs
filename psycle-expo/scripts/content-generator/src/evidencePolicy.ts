import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { GeneratedQuestion, Lane, LessonBlueprint } from "./types";

export type EvidenceTier = "A" | "B" | "C";

export type QuestionEvidencePolicyResult = {
  passed: boolean;
  hardViolations: string[];
  warnings: string[];
  tier: EvidenceTier;
  stale: boolean;
};

export type PromotionGateResult = {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
  tierSummary: EvidenceTier[];
  staleClaimIds: string[];
  missingClaimIds: string[];
};

type ClaimLike = {
  claim_id: string;
  source_type: string;
  source_grade: "gold" | "silver" | "bronze";
  review_date: string;
  lane: Lane;
  lesson_job?: string;
  target_shift?: string;
  done_condition?: string;
  takeaway_action?: string;
  counterfactual?: string;
  intervention_path?: string;
  novelty_reason?: string;
  refresh_value_reason?: string;
};

export type ExistingLessonSignature = {
  file: string;
  lane?: Lane;
  lesson_job?: string;
  target_shift?: string;
  takeaway_action?: string;
  counterfactual?: string;
  intervention_path?: string;
  novelty_reason?: string;
  refresh_value_reason?: string;
};

const REFRESH_REASON_PRIORITY: Record<string, number> = {
  safety_update: 4,
  intervention_update: 3,
  explanation_update: 2,
  scene_update: 1,
  boundary_update: 2,
  evidence_strength_update: 2,
};

const LESSONS_ROOT = join(__dirname, "..", "..", "..", "data", "lessons");

const CORE_AUTO_SOURCE_TYPES = new Set([
  "umbrella_review",
  "systematic_review",
  "meta_analysis",
  "guideline",
  "rct",
  "replication_study",
  "longitudinal_study",
]);

const REFRESH_ALLOWED_SOURCE_TYPES = new Set([
  ...CORE_AUTO_SOURCE_TYPES,
  "observational_study",
  "qualitative_study",
  "narrative_review",
  "expert_summary",
]);

export function isSourceTypeAllowedForLane(
  sourceType: string | undefined,
  lane: Lane | undefined
): boolean {
  if (!sourceType || !lane) return false;
  if (lane === "core" || lane === "mastery") return CORE_AUTO_SOURCE_TYPES.has(sourceType);
  return REFRESH_ALLOWED_SOURCE_TYPES.has(sourceType);
}

export function evidenceGradeToTier(
  grade: "gold" | "silver" | "bronze"
): EvidenceTier {
  if (grade === "gold") return "A";
  if (grade === "silver") return "B";
  return "C";
}

export function getReviewWindowDays(tier: EvidenceTier): number {
  if (tier === "A") return 365;
  if (tier === "B") return 180;
  return 90;
}

export function isReviewDateStale(
  reviewDate: string,
  tier: EvidenceTier,
  now = new Date()
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) {
    return true;
  }

  const reviewedAt = new Date(`${reviewDate}T00:00:00Z`);
  if (Number.isNaN(reviewedAt.getTime())) {
    return true;
  }

  const ageMs = now.getTime() - reviewedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > getReviewWindowDays(tier);
}

export function evaluateQuestionEvidencePolicy(
  question: GeneratedQuestion
): QuestionEvidencePolicyResult {
  const hardViolations: string[] = [];
  const warnings: string[] = [];
  const tier = evidenceGradeToTier(question.evidence_grade);
  const stale =
    typeof question.review_date === "string"
      ? isReviewDateStale(question.review_date, tier)
      : true;

  if (!question.lane) {
    hardViolations.push("lane_missing");
  }

  if (question.lane !== "refresh" && tier === "C") {
    hardViolations.push("non_refresh_requires_tier_a_or_b");
  }

  if (!question.source_type) {
    hardViolations.push("source_type_missing");
  } else if (!isSourceTypeAllowedForLane(question.source_type, question.lane)) {
    hardViolations.push("source_type_not_allowed_for_lane");
  }

  if (stale) {
    hardViolations.push("review_date_stale");
  }

  if (question.lesson_blueprint) {
    if (question.lesson_blueprint.lane !== question.lane) {
      hardViolations.push("lane_blueprint_mismatch");
    }

    const target =
      question.lesson_blueprint.question_count_range?.target ?? null;
    if (typeof target !== "number" || target < 5 || target > 10) {
      hardViolations.push("lesson_blueprint_target_invalid");
    }
    if (!question.lesson_blueprint.done_condition?.trim()) {
      hardViolations.push("lesson_blueprint_done_condition_missing");
    }
    if (!question.lesson_blueprint.takeaway_action?.trim()) {
      hardViolations.push("lesson_blueprint_takeaway_action_missing");
    }
    if (!question.lesson_blueprint.counterfactual?.trim()) {
      warnings.push("lesson_blueprint_counterfactual_missing");
    }
    if (!question.lesson_blueprint.intervention_path?.trim()) {
      warnings.push("lesson_blueprint_intervention_path_missing");
    }
    if (
      question.lesson_blueprint.lane === "mastery" &&
      !question.lesson_blueprint.novelty_reason
    ) {
      hardViolations.push("mastery_without_novelty_reason");
    }
    if (
      question.lesson_blueprint.lane === "refresh" &&
      !question.lesson_blueprint.refresh_value_reason
    ) {
      hardViolations.push("refresh_value_reason_missing");
    }
  } else {
    warnings.push("lesson_blueprint_missing");
  }

  return {
    passed: hardViolations.length === 0,
    hardViolations,
    warnings,
    tier,
    stale,
  };
}

function normalizeSignatureValue(value?: string): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeFuzzySignatureValue(value?: string): string {
  return normalizeSignatureValue(value).replace(/[「」『』"'`()\[\]{}:;,.!?/\-_|]/g, "");
}

function buildCharacterBigrams(value: string): Set<string> {
  if (value.length <= 1) return new Set(value ? [value] : []);
  const grams = new Set<string>();
  for (let index = 0; index < value.length - 1; index += 1) {
    grams.add(value.slice(index, index + 2));
  }
  return grams;
}

function computeDiceCoefficient(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftBigrams = buildCharacterBigrams(left);
  const rightBigrams = buildCharacterBigrams(right);
  if (leftBigrams.size === 0 || rightBigrams.size === 0) return 0;

  let overlap = 0;
  for (const gram of leftBigrams) {
    if (rightBigrams.has(gram)) overlap += 1;
  }

  return (2 * overlap) / (leftBigrams.size + rightBigrams.size);
}

function walkLessonFiles(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_staging") continue;
      walkLessonFiles(fullPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".ja.json")) {
      files.push(fullPath);
    }
  }
}

export function loadExistingLessonSignatures(): ExistingLessonSignature[] {
  const files: string[] = [];
  walkLessonFiles(LESSONS_ROOT, files);

  return files.flatMap((file) => {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf-8")) as {
        questions?: Array<{
          lesson_blueprint?: {
            job?: string;
            target_shift?: string;
            takeaway_action?: string;
            counterfactual?: string;
            intervention_path?: string;
            novelty_reason?: string;
            refresh_value_reason?: string;
            lane?: Lane;
          };
        }>;
      };
      const blueprint = parsed.questions?.find((question) => question.lesson_blueprint)?.lesson_blueprint;
      if (!blueprint) return [];
      return [{
        file,
        lane: blueprint.lane,
        lesson_job: blueprint.job,
        target_shift: blueprint.target_shift,
        takeaway_action: blueprint.takeaway_action,
        counterfactual: blueprint.counterfactual,
        intervention_path: blueprint.intervention_path,
        novelty_reason: blueprint.novelty_reason,
        refresh_value_reason: blueprint.refresh_value_reason,
      }];
    } catch {
      return [];
    }
  });
}

function getCurrentLessonBlueprint(
  questions: GeneratedQuestion[],
  claims: ClaimLike[]
): LessonBlueprint | null {
  for (const question of questions) {
    if (question.lesson_blueprint) return question.lesson_blueprint;
  }

  const firstClaim = claims[0];
  if (!firstClaim?.lesson_job || !firstClaim?.target_shift) return null;

  return {
    job: firstClaim.lesson_job,
    target_shift: firstClaim.target_shift,
    done_condition: firstClaim.done_condition || firstClaim.lesson_job,
    takeaway_action: firstClaim.takeaway_action || firstClaim.target_shift,
    counterfactual: firstClaim.counterfactual,
    intervention_path: firstClaim.intervention_path,
    novelty_reason: firstClaim.novelty_reason as LessonBlueprint["novelty_reason"],
    refresh_value_reason: firstClaim.refresh_value_reason,
    lane: firstClaim.lane,
    phase: 1,
    load_score: { cognitive: 2, emotional: 2, behavior_change: 2, total: 6 },
    question_count_range: { min: 5, max: 10, target: Math.min(Math.max(questions.length, 5), 10) },
    forbidden_moves: [],
  };
}

export function evaluateDuplicateLessonSignatures(
  blueprint: LessonBlueprint | null,
  existingLessons: ExistingLessonSignature[]
): string[] {
  if (!blueprint) return [];

  const reasons: string[] = [];
  const currentJob = normalizeSignatureValue(blueprint.job);
  const currentShift = normalizeSignatureValue(blueprint.target_shift);
  const currentTakeaway = normalizeSignatureValue(blueprint.takeaway_action);
  const currentJobFuzzy = normalizeFuzzySignatureValue(blueprint.job);

  for (const lesson of existingLessons) {
    const lessonJob = normalizeSignatureValue(lesson.lesson_job);
    const lessonShift = normalizeSignatureValue(lesson.target_shift);
    const lessonTakeaway = normalizeSignatureValue(lesson.takeaway_action);
    const lessonJobFuzzy = normalizeFuzzySignatureValue(lesson.lesson_job);

    if (currentJob && currentJob === lessonJob) {
      reasons.push(`duplicate_lesson_job:${lesson.file}`);
    }
    if (currentShift && currentShift === lessonShift) {
      reasons.push(`duplicate_target_shift:${lesson.file}`);
    }
    if (currentTakeaway && currentTakeaway === lessonTakeaway) {
      reasons.push(`duplicate_takeaway_action:${lesson.file}`);
    }

    const hasExactLearningValueMatch =
      currentShift &&
      currentTakeaway &&
      currentShift === lessonShift &&
      currentTakeaway === lessonTakeaway;
    const hasSceneOnlyJobVariation =
      hasExactLearningValueMatch &&
      currentJob &&
      lessonJob &&
      currentJob !== lessonJob &&
      computeDiceCoefficient(currentJobFuzzy, lessonJobFuzzy) >= 0.55;

    if (hasSceneOnlyJobVariation) {
      reasons.push(`scene_only_change:${lesson.file}`);
    }

    const isCoreishLesson = !lesson.lane || lesson.lane === "core";
    const isMasteryRewrite =
      blueprint.lane === "mastery" &&
      isCoreishLesson &&
      ((currentJob &&
        currentShift &&
        currentTakeaway &&
        currentJob === lessonJob &&
        currentShift === lessonShift &&
        currentTakeaway === lessonTakeaway) ||
        hasSceneOnlyJobVariation);

    if (isMasteryRewrite) {
      reasons.push(`mastery_is_core_rewrite:${lesson.file}`);
    }
  }

  return reasons;
}

function getRefreshReasonPriority(reason?: string): number {
  return reason ? REFRESH_REASON_PRIORITY[reason] ?? 0 : 0;
}

export function evaluateRefreshConflictPriority(
  blueprint: LessonBlueprint | null,
  existingLessons: ExistingLessonSignature[]
): string[] {
  if (!blueprint || blueprint.lane !== "refresh" || !blueprint.refresh_value_reason) {
    return [];
  }

  const reasons: string[] = [];
  const currentPriority = getRefreshReasonPriority(blueprint.refresh_value_reason);
  const currentJob = normalizeSignatureValue(blueprint.job);
  const currentShift = normalizeSignatureValue(blueprint.target_shift);
  const currentTakeaway = normalizeSignatureValue(blueprint.takeaway_action);

  for (const lesson of existingLessons) {
    if (lesson.lane !== "refresh") continue;
    const lessonPriority = getRefreshReasonPriority(lesson.refresh_value_reason);
    if (lessonPriority <= currentPriority) continue;

    const sameLearningSlot =
      (currentShift && currentShift === normalizeSignatureValue(lesson.target_shift)) ||
      (currentTakeaway && currentTakeaway === normalizeSignatureValue(lesson.takeaway_action)) ||
      (currentJob && currentJob === normalizeSignatureValue(lesson.lesson_job));

    if (sameLearningSlot) {
      reasons.push(`lower_priority_refresh_beat:${lesson.file}`);
    }
  }

  return reasons;
}

export function evaluatePromotionGate(args: {
  questions: GeneratedQuestion[];
  claims: ClaimLike[];
}): PromotionGateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const staleClaimIds: string[] = [];
  const missingClaimIds: string[] = [];

  const lanes = new Set<string>();
  const tierSummary = new Set<EvidenceTier>();
  const claimMap = new Map(args.claims.map((claim) => [claim.claim_id, claim]));

  for (const question of args.questions) {
    if (!question.claim_id) {
      reasons.push("question_claim_id_missing");
      continue;
    }
    if (!question.source_span) {
      reasons.push(`source_span_missing:${question.claim_id}`);
    }
    if (!question.review_date) {
      reasons.push(`review_date_missing:${question.claim_id}`);
    }
    if (!question.lane) {
      reasons.push(`lane_missing:${question.claim_id}`);
    } else {
      lanes.add(question.lane);
    }

    const claim = claimMap.get(question.claim_id);
    if (!claim) {
      missingClaimIds.push(question.claim_id);
      reasons.push(`claim_registry_missing:${question.claim_id}`);
      continue;
    }

    const tier = evidenceGradeToTier(claim.source_grade);
    tierSummary.add(tier);
    if (!isSourceTypeAllowedForLane(claim.source_type, claim.lane)) {
      reasons.push(`source_type_not_allowed:${claim.claim_id}`);
    }
    if (isReviewDateStale(claim.review_date, tier)) {
      staleClaimIds.push(claim.claim_id);
      reasons.push(`claim_stale:${claim.claim_id}`);
    }
    if (tier === "C") {
      reasons.push(`tier_c_not_auto_promotable:${claim.claim_id}`);
    }
  }

  if (lanes.size > 1) {
    reasons.push("mixed_lane_bundle");
  }

  if (lanes.has("refresh")) {
    reasons.push("refresh_lane_requires_manual_promotion");
  }

  if (args.questions.length < 5) {
    reasons.push("question_count_below_minimum");
  }

  const currentBlueprint = getCurrentLessonBlueprint(args.questions, args.claims);
  const existingLessons = loadExistingLessonSignatures();
  reasons.push(...evaluateDuplicateLessonSignatures(currentBlueprint, existingLessons));
  reasons.push(...evaluateRefreshConflictPriority(currentBlueprint, existingLessons));

  return {
    eligible: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    warnings: Array.from(new Set(warnings)),
    tierSummary: Array.from(tierSummary),
    staleClaimIds: Array.from(new Set(staleClaimIds)),
    missingClaimIds: Array.from(new Set(missingClaimIds)),
  };
}
