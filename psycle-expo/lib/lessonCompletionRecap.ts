import type { Question } from "../types/question";

function clean(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveCompletionRecapAction(originalQuestions: Question[], fallbackAction: string): string {
  const interventionAdvice = originalQuestions
    .map((question) =>
      question.expanded_details?.claim_type === "intervention" ? clean(question.actionable_advice) : null
    )
    .find(Boolean);

  if (interventionAdvice) {
    return interventionAdvice;
  }

  const interventionTryThis = originalQuestions
    .map((question) =>
      question.expanded_details?.claim_type === "intervention" ? clean(question.expanded_details?.try_this) : null
    )
    .find(Boolean);

  if (interventionTryThis) {
    return interventionTryThis;
  }

  const firstActionableAdvice = originalQuestions.map((question) => clean(question.actionable_advice)).find(Boolean);

  return firstActionableAdvice ?? fallbackAction;
}
