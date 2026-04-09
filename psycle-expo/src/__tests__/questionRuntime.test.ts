import { createQuestionRuntime } from "../../components/question-runtime/createQuestionRuntime";
import { getCorrectAnswerText } from "../../components/question-runtime/getCorrectAnswerText";
import type { Question } from "../../types/question";

const baseQuestion: Question = {
  id: "q1",
  type: "multiple_choice",
  question: "質問",
  choices: ["A", "B", "C"],
  correct_index: 1,
  difficulty: "easy",
  xp: 10,
};

describe("question runtime helpers", () => {
  test("multiple choice と micro input の正誤を判定する", () => {
    expect(
      createQuestionRuntime(baseQuestion, {
        consequenceSelection: null,
        currentOrder: [],
        inputText: "",
        selectedIndex: 1,
        selectedIndexes: [],
        selectedPairs: [],
        selectedResponse: null,
        swipeDirection: null,
      }).isCorrect
    ).toBe(true);

    const microInputQuestion: Question = {
      ...baseQuestion,
      type: "micro_input",
      input_answer: "hello",
    };

    expect(
      createQuestionRuntime(microInputQuestion, {
        consequenceSelection: null,
        currentOrder: [],
        inputText: "hello",
        selectedIndex: null,
        selectedIndexes: [],
        selectedPairs: [],
        selectedResponse: null,
        swipeDirection: null,
      }).isCorrect
    ).toBe(true);
  });

  test("select_all survey mode は常に neutral 扱いになる", () => {
    const surveyQuestion: Question = {
      ...baseQuestion,
      type: "select_all",
      correct_answers: undefined,
    };

    const runtime = createQuestionRuntime(surveyQuestion, {
      consequenceSelection: null,
      currentOrder: [],
      inputText: "",
      selectedIndex: null,
      selectedIndexes: [0, 2],
      selectedPairs: [],
      selectedResponse: null,
      swipeDirection: null,
    });

    expect(runtime.isSurveyMode).toBe(true);
    expect(runtime.isCorrect).toBe(true);
    expect(runtime.correctAnswerText).toBe("");
  });

  test("sort_order, matching, conversation の正誤を判定する", () => {
    const sortQuestion: Question = {
      ...baseQuestion,
      type: "sort_order",
      items: ["A", "B", "C"],
      correct_order: ["A", "B", "C"],
    };
    expect(
      createQuestionRuntime(sortQuestion, {
        consequenceSelection: null,
        currentOrder: [0, 1, 2],
        inputText: "",
        selectedIndex: null,
        selectedIndexes: [],
        selectedPairs: [],
        selectedResponse: null,
        swipeDirection: null,
      }).isCorrect
    ).toBe(true);

    const matchingQuestion: Question = {
      ...baseQuestion,
      type: "matching",
      left_items: ["A"],
      right_items: ["1"],
      correct_pairs: [[0, 0]],
    };
    expect(
      createQuestionRuntime(matchingQuestion, {
        consequenceSelection: null,
        currentOrder: [],
        inputText: "",
        selectedIndex: null,
        selectedIndexes: [],
        selectedPairs: [[0, 0]],
        selectedResponse: null,
        swipeDirection: null,
      }).isCorrect
    ).toBe(true);

    const conversationQuestion: Question = {
      ...baseQuestion,
      type: "conversation",
    };
    expect(
      createQuestionRuntime(conversationQuestion, {
        consequenceSelection: null,
        currentOrder: [],
        inputText: "",
        selectedIndex: null,
        selectedIndexes: [],
        selectedPairs: [],
        selectedResponse: 1,
        swipeDirection: null,
      }).isCorrect
    ).toBe(true);
  });

  test("correct answer text を question type ごとに生成する", () => {
    expect(getCorrectAnswerText(baseQuestion)).toBe("B");

    const selectAllQuestion: Question = {
      ...baseQuestion,
      type: "select_all",
      correct_answers: [0, 2],
    };
    expect(getCorrectAnswerText(selectAllQuestion)).toBe("A、C");

    const matchingQuestion: Question = {
      ...baseQuestion,
      type: "matching",
      left_items: ["A"],
      right_items: ["1"],
      correct_pairs: [[0, 0]],
    };
    expect(getCorrectAnswerText(matchingQuestion)).toBe("上の緑色のペアが正解");
  });
});
