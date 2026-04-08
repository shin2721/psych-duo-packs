import type { Question } from "../../types/question";

export const getQuestionText = (question: Question) =>
  question.text ?? question.question ?? "";

export const getQuestionChoices = (question: Question) => question.choices ?? [];

export const isChoiceCorrect = (
  question: Question,
  index: number | null | undefined
) => {
  if (typeof index !== "number") return false;
  if (typeof question.correct_index !== "number") return false;
  return index === question.correct_index;
};

export const areSelectAllAnswersCorrect = (
  question: Question,
  selectedIndexes: number[]
) => {
  if (!question.correct_answers) return true;
  const sortedSelected = [...selectedIndexes].sort();
  const sortedCorrect = [...question.correct_answers].sort();
  return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
};
