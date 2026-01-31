jest.mock("expo-av", () => ({ Audio: {} }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../lib/HapticFeedback", () => ({
  HapticFeedback: {
    success: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));
jest.mock("../../lib/state", () => ({ useAppState: () => ({}) }));
jest.mock("../../lib/sounds", () => ({ sounds: { play: jest.fn() } }));
jest.mock("../../components/AnimatedButton", () => ({
  AnimatedButton: () => null,
}));
jest.mock("../../components/QuestionTypes", () => ({
  QuickReflex: () => null,
  SelectAll: () => null,
  FillBlankTap: () => null,
  SwipeJudgment: () => null,
  Conversation: () => null,
  Matching: () => null,
  MicroInput: () => null,
  ConsequenceScenario: () => null,
  SortOrder: () => null,
}));
jest.mock("../../components/XPGainAnimation", () => ({
  XPGainAnimation: () => null,
}));

import {
  areSelectAllAnswersCorrect,
  getQuestionChoices,
  getQuestionText,
  isChoiceCorrect,
} from "../../components/QuestionRenderer";
import type { Question } from "../../types/question";

const baseQuestion: Question = {
  id: "q1",
  type: "multiple_choice",
  question: "質問の本文",
  text: "問題文",
  choices: ["選択肢A", "選択肢B", "選択肢C"],
  correct_index: 1,
  difficulty: "easy",
  xp: 10,
};

describe("QuestionRenderer helpers", () => {
  test("問題文はtext優先で取得される", () => {
    expect(getQuestionText(baseQuestion)).toBe("問題文");

    const fallbackQuestion: Question = {
      ...baseQuestion,
      text: undefined,
      question: "fallback",
    };
    expect(getQuestionText(fallbackQuestion)).toBe("fallback");

    const emptyQuestion: Question = {
      ...baseQuestion,
      text: undefined,
      question: undefined,
    };
    expect(getQuestionText(emptyQuestion)).toBe("");
  });

  test("選択肢は配列として取得される", () => {
    expect(getQuestionChoices(baseQuestion)).toEqual(["選択肢A", "選択肢B", "選択肢C"]);

    const noChoicesQuestion: Question = {
      ...baseQuestion,
      choices: undefined,
    };
    expect(getQuestionChoices(noChoicesQuestion)).toEqual([]);
  });

  test("選択肢の正誤判定が一致する", () => {
    expect(isChoiceCorrect(baseQuestion, 1)).toBe(true);
    expect(isChoiceCorrect(baseQuestion, 0)).toBe(false);
    expect(isChoiceCorrect(baseQuestion, null)).toBe(false);

    const noCorrectIndex: Question = {
      ...baseQuestion,
      correct_index: undefined,
    };
    expect(isChoiceCorrect(noCorrectIndex, 1)).toBe(false);
  });

  test("select_allは正解配列と一致した時のみ正解", () => {
    const selectAllQuestion: Question = {
      ...baseQuestion,
      type: "select_all",
      correct_answers: [0, 2],
    };

    expect(areSelectAllAnswersCorrect(selectAllQuestion, [2, 0])).toBe(true);
    expect(areSelectAllAnswersCorrect(selectAllQuestion, [0, 1])).toBe(false);
  });
});
