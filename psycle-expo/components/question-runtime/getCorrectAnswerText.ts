import i18n from "../../lib/i18n";
import type { ExpandedDetails, Question } from "../../types/question";

export function getQuestionExpandedDetails(
  question: Question
): ExpandedDetails | undefined {
  return question.expanded_details;
}

export function getCorrectAnswerText(question: Question): string {
  const choices = question.choices ?? [];

  if (
    (question.type === "multiple_choice" ||
      question.type === "fill_blank_tap" ||
      question.type === "conversation" ||
      question.type === "quick_reflex" ||
      question.type === "swipe_judgment" ||
      question.type === "consequence_scenario" ||
      question.type === "interactive_practice") &&
    typeof question.correct_index === "number"
  ) {
    return choices[question.correct_index] ?? "";
  }

  if (question.type === "select_all" && question.correct_answers) {
    return question.correct_answers
      .map((index) => choices[index])
      .filter((choice): choice is string => typeof choice === "string")
      .join(i18n.t("questionRenderer.listSeparator"));
  }

  if (question.type === "swipe_judgment" && question.swipe_labels) {
    return question.is_true
      ? `→ ${question.swipe_labels.right}`
      : `← ${question.swipe_labels.left}`;
  }

  if (question.type === "sort_order" && question.correct_order) {
    return question.correct_order.join(" → ");
  }

  if (question.type === "consequence_scenario") {
    return question.consequence_type === "positive"
      ? i18n.t("questionRenderer.consequencePositive")
      : i18n.t("questionRenderer.consequenceNegative");
  }

  if (question.type === "matching") {
    return i18n.t("questionRenderer.matchingCorrectAnswer");
  }

  return "";
}

export function getCorrectAnswerLabel(question: Question): string {
  if (
    question.type === "conversation" ||
    question.type === "consequence_scenario" ||
    question.type === "swipe_judgment"
  ) {
    return i18n.t("questionRenderer.recommendedLabel");
  }

  return i18n.t("questionRenderer.correctLabel");
}
