import type { Question } from "../../types/question";
import {
  getCorrectAnswerLabel,
  getCorrectAnswerText,
  getQuestionExpandedDetails,
} from "./getCorrectAnswerText";

export interface QuestionRuntimeState {
  consequenceSelection: boolean | null;
  currentOrder: number[];
  inputText: string;
  selectedIndex: number | null;
  selectedIndexes: number[];
  selectedPairs: number[][];
  selectedResponse: number | null;
  swipeDirection: "left" | "right" | null;
}

export interface QuestionRuntime {
  correctAnswerLabel: string;
  correctAnswerText: string;
  expandedDetails: ReturnType<typeof getQuestionExpandedDetails>;
  explanationText: string;
  hasEvidence: boolean;
  isCorrect: boolean;
  isSurveyMode: boolean;
}

const sortNumberArray = (values: number[]) => [...values].sort((a, b) => a - b);

const sortPairArray = (pairs: number[][]) =>
  [...pairs]
    .map((pair) => [...pair])
    .sort((left, right) => {
      if (left[0] !== right[0]) return left[0] - right[0];
      return left[1] - right[1];
    });

export function createQuestionRuntime(
  question: Question,
  state: QuestionRuntimeState
): QuestionRuntime {
  const isSurveyMode = question.type === "select_all" && !question.correct_answers;
  const conversationCorrectIndex =
    typeof question.recommended_index === "number"
      ? question.recommended_index
      : question.correct_index;
  const isConversationSurvey =
    question.type === "conversation" && typeof conversationCorrectIndex !== "number";
  const isNeutralSurveyMode = isSurveyMode || isConversationSurvey;
  const expandedDetails = getQuestionExpandedDetails(question);
  const hasEvidence = Boolean(
    expandedDetails?.claim_type || expandedDetails?.evidence_type
  );

  const isCorrect = (() => {
    if (question.type === "quick_reflex") {
      return state.selectedIndex === question.correct_index;
    }

    if (question.type === "micro_input") {
      return state.inputText.trim() === question.input_answer?.trim();
    }

    if (question.type === "term_card") {
      return true;
    }

    if (question.type === "select_all") {
      if (!question.correct_answers) return true;
      return (
        JSON.stringify(sortNumberArray(state.selectedIndexes)) ===
        JSON.stringify(sortNumberArray(question.correct_answers))
      );
    }

    if (question.type === "sort_order" && question.items) {
      const currentItems = state.currentOrder.map((index) => question.items![index]);
      return JSON.stringify(currentItems) === JSON.stringify(question.correct_order);
    }

    if (question.type === "fill_blank_tap") {
      return state.selectedIndex === question.correct_index;
    }

    if (question.type === "swipe_judgment") {
      const correctDirection = question.is_true ? "right" : "left";
      return state.swipeDirection === correctDirection;
    }

    if (question.type === "conversation") {
      if (typeof conversationCorrectIndex !== "number") {
        return state.selectedResponse !== null;
      }
      return state.selectedResponse === conversationCorrectIndex;
    }

    if (question.type === "matching" && question.correct_pairs) {
      return (
        JSON.stringify(sortPairArray(state.selectedPairs)) ===
        JSON.stringify(sortPairArray(question.correct_pairs))
      );
    }

    if (question.type === "consequence_scenario") {
      const isPositive = question.consequence_type === "positive";
      return state.consequenceSelection === isPositive;
    }

    return state.selectedIndex === question.correct_index;
  })();

  const explanationText = (() => {
    if (typeof question.explanation === "string") {
      return question.explanation;
    }

    if (typeof question.explanation === "object" && question.explanation) {
      const mainExplanation = question.explanation.correct || "";
      if (isCorrect) {
        return mainExplanation;
      }

      let specificFeedback = "";
      if (question.type === "swipe_judgment" && state.swipeDirection) {
        specificFeedback =
          question.explanation.incorrect?.[state.swipeDirection] ||
          question.explanation.incorrect?.default ||
          "";
      } else {
        const indexKey = String(state.selectedIndex ?? 0);
        specificFeedback =
          question.explanation.incorrect?.[indexKey] ||
          question.explanation.incorrect?.default ||
          question.explanation.incorrect?.["1"] ||
          question.explanation.incorrect?.["0"] ||
          "";
      }

      return specificFeedback || mainExplanation;
    }

    return "";
  })();

  return {
    correctAnswerLabel: getCorrectAnswerLabel(question),
    correctAnswerText: isNeutralSurveyMode ? "" : getCorrectAnswerText(question),
    expandedDetails,
    explanationText,
    hasEvidence,
    isCorrect,
    isSurveyMode: isNeutralSurveyMode,
  };
}
