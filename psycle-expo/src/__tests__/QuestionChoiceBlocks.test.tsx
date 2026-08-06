import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { QuestionChoiceBlocks } from "../../components/question-runtime/QuestionChoiceBlocks";
import { theme } from "../../lib/theme";
import type { Question } from "../../types/question";

jest.mock("@expo/vector-icons", () => {
  const mockReact = require("react");
  const { Text: MockText } = require("react-native");
  return {
    Ionicons: ({ color, name }: { color: string; name: string }) =>
      mockReact.createElement(
        MockText,
        { accessibilityLabel: color, testID: `icon-${name}` },
        name
      ),
  };
});

jest.mock("../../components/AnimatedButton", () => {
  const mockReact = require("react");
  const { Pressable: MockPressable } = require("react-native");
  return {
    AnimatedButton: ({ children, ...props }: { children: React.ReactNode }) =>
      mockReact.createElement(MockPressable, props, children),
  };
});

function buildQuestion(betCard: boolean): Question {
  return {
    id: "choice-test",
    type: "multiple_choice",
    question: "question",
    choices: ["actual", "guess", "other"],
    correct_index: 0,
    bet_card: betCard,
    difficulty: "medium",
    xp: 5,
  };
}

function renderChoices(betCard: boolean, selectedIndex: number) {
  const question = buildQuestion(betCard);
  return render(
    <QuestionChoiceBlocks
      onSelect={jest.fn()}
      question={question}
      questionChoices={question.choices ?? []}
      selectedIndex={selectedIndex}
      showResult
    />
  );
}

describe("QuestionChoiceBlocks multiple-choice result styling", () => {
  test("shows a bet miss as a neutral guess and a gold actual answer", () => {
    const screen = renderChoices(true, 1);
    const actualStyle = StyleSheet.flatten(screen.getByTestId("answer-choice-0").props.style);
    const guessStyle = StyleSheet.flatten(screen.getByTestId("answer-choice-1").props.style);

    expect(screen.queryByTestId("icon-close-circle")).toBeNull();
    expect(screen.getByTestId("icon-checkmark-circle").props.accessibilityLabel).toBe("#E5A93C");
    expect(screen.getByTestId("icon-radio-button-on").props.accessibilityLabel).toBe(
      theme.colors.primary
    );
    expect(actualStyle.borderColor).toBe("#E5A93C");
    expect(guessStyle.borderColor).toBe(theme.colors.primary);
    expect(actualStyle.borderColor).not.toBe(theme.colors.success);
    expect(guessStyle.borderColor).not.toBe(theme.colors.error);
  });

  test("keeps an ordinary miss red and the actual answer green", () => {
    const screen = renderChoices(false, 1);

    expect(screen.getByTestId("icon-close-circle").props.accessibilityLabel).toBe(
      theme.colors.error
    );
    expect(screen.getByTestId("icon-checkmark-circle").props.accessibilityLabel).toBe(
      theme.colors.success
    );
    expect(screen.queryByTestId("icon-radio-button-on")).toBeNull();
  });

  test("keeps a correct bet on the normal success presentation", () => {
    const screen = renderChoices(true, 0);

    expect(screen.getByTestId("icon-checkmark-circle").props.accessibilityLabel).toBe(
      theme.colors.success
    );
    expect(screen.queryByTestId("icon-close-circle")).toBeNull();
    expect(screen.queryByTestId("icon-radio-button-on")).toBeNull();
  });
});
