import { getQuestionTypeForPhase, isSupportedDomain, isValidPhase } from "./phasePolicy";
import type { GeneratedQuestion } from "./types";

export type DeterministicGateResult = {
  passed: boolean;
  hardViolations: string[];
  warnings: string[];
};

export type DeterministicGateContext = {
  expectedDomain?: unknown;
  questionDomain?: unknown;
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

  return {
    passed: hardViolations.length === 0,
    hardViolations,
    warnings,
  };
}
