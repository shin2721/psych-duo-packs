import React from "react";
import { render } from "@testing-library/react-native";
import { QuestionResultView } from "../../components/question-runtime/QuestionResultView";
import type { QuestionRuntime } from "../../components/question-runtime/createQuestionRuntime";
import type { Question } from "../../types/question";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: { light: jest.fn() },
}));

const question: Question = {
  id: "result-recap",
  type: "multiple_choice",
  question: "この場面で、まだ確定していないものは？",
  choices: ["身体反応", "外部の結果"],
  correct_index: 1,
  explanation: "外部の結果はまだ確定していません。",
  difficulty: "easy",
  xp: 5,
};

const runtime: QuestionRuntime = {
  correctAnswerLabel: "正解",
  correctAnswerText: "外部の結果",
  expandedDetails: null,
  explanationText: "外部の結果はまだ確定していません。",
  hasEvidence: false,
  isCorrect: true,
  isSurveyMode: false,
};

describe("QuestionResultView", () => {
  test("keeps the full question visible beside the answer feedback", () => {
    const screen = render(
      <QuestionResultView
        question={question}
        runtime={runtime}
        showExplanationDetails={false}
        onContinue={jest.fn()}
        onOpenEvidence={jest.fn()}
        onToggleExplanationDetails={jest.fn()}
      />
    );

    expect(screen.getByTestId("question-result-prompt")).toHaveTextContent(
      question.question
    );
  });
});
