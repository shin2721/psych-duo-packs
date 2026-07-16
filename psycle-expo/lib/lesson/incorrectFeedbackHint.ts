import type { Question } from "../../types/question";

export function resolveIncorrectFeedbackHint(
  question: Question,
  fallbackHint: string | null
): string | null {
  const authoredHint = question.feedback_prompt?.trim();
  return authoredHint || fallbackHint;
}
