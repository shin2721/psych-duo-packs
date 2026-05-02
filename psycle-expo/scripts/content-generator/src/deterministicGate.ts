import { getQuestionTypeForPhase, isSupportedDomain, isValidPhase } from "./phasePolicy";
import type { GeneratedQuestion } from "./types";
import {
  evaluateDuplicateLessonSignatures,
  evaluateRefreshConflictPriority,
  type ExistingLessonSignature,
} from "./evidencePolicy";

export type DeterministicGateResult = {
  passed: boolean;
  hardViolations: string[];
  warnings: string[];
};

export type DeterministicGateContext = {
  expectedDomain?: unknown;
  questionDomain?: unknown;
  requireClaimTrace?: boolean;
  existingLessonSignatures?: ExistingLessonSignature[];
  requireNoveltyCheck?: boolean;
};

const FAIL_WORDS_REGEX =
  /(治る|治療できる|確実に|絶対|100%|証明された|科学的に確定|人生が変わる|劇的に改善)/;

const PRINCIPLE_DIRECT_REGEX = /(原理とは|バイアスとは|ファラシーとは|理論とは)/;
const CONDITIONAL_FAIL_WORD_REGEX = /必ず/;

function resolveDomain(question: GeneratedQuestion, context?: DeterministicGateContext): unknown {
  const candidate = (question as { domain?: unknown }).domain;
  if (candidate !== undefined) return candidate;
  if (context?.questionDomain !== undefined) return context.questionDomain;
  return context?.expectedDomain;
}

function hasSceneSignals(questionText: string): boolean {
  const hasNumberOrTime = /(\d|分|秒|時間|日|週|ヶ月|か月|月|年|today|tomorrow|week)/i.test(questionText);
  const hasPlaceMedium =
    /(駅|ホーム|改札|LINE|既読|会議|上司|Slack|電車|バス|カフェ|職場|学校|教室|通勤|通学|メール|チャット|office|train|meeting|commute)/i.test(
      questionText
    );
  const hasQuotedDialogue = /[「」"'“”]/.test(questionText);

  const count = [hasNumberOrTime, hasPlaceMedium, hasQuotedDialogue].filter(Boolean).length;
  return count >= 2;
}

function hasActionTimeboxAndDose(actionableAdvice: string): boolean {
  const hasDose = /(\d|分|秒|回|ステップ|step|times?)/i.test(actionableAdvice);
  const hasTimebox = /(今日|明日|今週|24時間|this week|today|tomorrow|within)/i.test(actionableAdvice);
  return hasDose && hasTimebox;
}

export function evaluateDeterministicGate(
  question: GeneratedQuestion,
  context?: DeterministicGateContext
): DeterministicGateResult {
  const hardViolations: string[] = [];
  const warnings: string[] = [];

  const domain = resolveDomain(question, context);
  if (!isSupportedDomain(domain)) {
    hardViolations.push("domain_missing_or_unknown");
  }

  if (!isValidPhase(question.phase)) {
    hardViolations.push("phase_invalid");
  } else {
    const expectedType = getQuestionTypeForPhase(question.phase);
    if (question.type !== expectedType) {
      hardViolations.push("phase_type_mismatch");
    }
  }

  const questionText = String(question.question ?? "");
  const explanationText =
    typeof question.explanation === "string"
      ? question.explanation
      : `${question.explanation.correct} ${Object.values(question.explanation.incorrect || {}).join(" ")}`;
  const actionableAdvice = String(question.actionable_advice ?? "");
  const combinedText = `${questionText}\n${explanationText}\n${actionableAdvice}`;

  if (FAIL_WORDS_REGEX.test(combinedText)) {
    hardViolations.push("vocabulary_fail_words");
  }

  if (CONDITIONAL_FAIL_WORD_REGEX.test(combinedText)) {
    const isDebunkingContext = question.type === "swipe_judgment" && question.is_true === false;
    if (isDebunkingContext) {
      warnings.push("vocabulary_warn_conditional");
    } else {
      hardViolations.push("vocabulary_fail_words_conditional");
    }
  }

  const firstHalfLength = Math.max(1, Math.ceil(questionText.length / 2));
  const firstHalfQuestion = questionText.slice(0, firstHalfLength);
  if (PRINCIPLE_DIRECT_REGEX.test(firstHalfQuestion)) {
    hardViolations.push("principle_direct_naming");
  }

  if (!hasSceneSignals(questionText)) {
    warnings.push("scene_specificity_weak");
  }

  if (!hasActionTimeboxAndDose(actionableAdvice)) {
    hardViolations.push("action_timebox_or_dose_missing");
  }

  if (context?.requireClaimTrace) {
    if (typeof question.claim_id !== "string" || question.claim_id.trim().length === 0) {
      hardViolations.push("claim_id_missing");
    }
    if (typeof question.source_span !== "string" || question.source_span.trim().length === 0) {
      hardViolations.push("source_span_missing");
    }
    if (
      typeof question.review_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(question.review_date)
    ) {
      hardViolations.push("review_date_missing_or_invalid");
    }
    if (!question.expanded_details?.citation_role?.trim()) {
      hardViolations.push("citation_role_missing");
    }
  }

  if (!question.lesson_blueprint?.done_condition?.trim()) {
    hardViolations.push("lesson_blueprint_done_condition_missing");
  }

  if (!question.lesson_blueprint?.takeaway_action?.trim()) {
    hardViolations.push("lesson_blueprint_takeaway_action_missing");
  }

  if (
    question.lesson_blueprint?.job?.trim() &&
    question.lesson_blueprint?.done_condition?.trim() &&
    question.lesson_blueprint.job.trim() === question.lesson_blueprint.done_condition.trim()
  ) {
    hardViolations.push("lesson_blueprint_done_condition_duplicates_job");
  }

  if (
    question.lesson_blueprint?.lane === "mastery" &&
    !question.lesson_blueprint?.novelty_reason
  ) {
    hardViolations.push("mastery_without_novelty_reason");
  }

  if (
    question.lesson_blueprint?.lane === "refresh" &&
    !question.lesson_blueprint?.refresh_value_reason
  ) {
    hardViolations.push("refresh_value_reason_missing");
  }

  if (context?.requireNoveltyCheck) {
    if (!question.lesson_blueprint?.job?.trim()) {
      hardViolations.push("lesson_blueprint_job_missing");
    }
    if (!question.lesson_blueprint?.target_shift?.trim()) {
      hardViolations.push("lesson_blueprint_target_shift_missing");
    }
    if (!question.lesson_blueprint?.counterfactual?.trim()) {
      warnings.push("lesson_blueprint_counterfactual_missing");
    }
    if (!question.lesson_blueprint?.intervention_path?.trim()) {
      warnings.push("lesson_blueprint_intervention_path_missing");
    }

    const duplicateReasons = evaluateDuplicateLessonSignatures(
      question.lesson_blueprint ?? null,
      context.existingLessonSignatures ?? []
    );
    hardViolations.push(...duplicateReasons);
    hardViolations.push(
      ...evaluateRefreshConflictPriority(
        question.lesson_blueprint ?? null,
        context.existingLessonSignatures ?? []
      )
    );
  }

  return {
    passed: hardViolations.length === 0,
    hardViolations,
    warnings,
  };
}
