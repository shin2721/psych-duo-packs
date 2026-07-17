import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SwipeJudgment } from "../../components/question-types/SwipeJudgment";
import { theme } from "../../lib/theme";
import { de } from "../../lib/locales/de";
import { en } from "../../lib/locales/en";
import { es } from "../../lib/locales/es";
import { fr } from "../../lib/locales/fr";
import { ja } from "../../lib/locales/ja";
import { ko } from "../../lib/locales/ko";
import { pt } from "../../lib/locales/pt";
import { zh } from "../../lib/locales/zh";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: { medium: jest.fn() },
}));

describe("SwipeJudgment", () => {
  test("offers explicit tap alternatives for both directions", () => {
    const onSwipe = jest.fn();
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer={null}
        correctAnswer="left"
        showResult={false}
        onSwipe={onSwipe}
        labels={{ left: "解釈もある", right: "出来事だけ" }}
      />
    );

    fireEvent.press(screen.getByTestId("answer-swipe-left"));
    expect(onSwipe).toHaveBeenLastCalledWith("left");

    fireEvent.press(screen.getByTestId("answer-swipe-right"));
    expect(onSwipe).toHaveBeenLastCalledWith("right");
  });

  test("replaces tap alternatives with the selected judgment after answering", () => {
    const onSwipe = jest.fn();
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer="left"
        correctAnswer="left"
        showResult
        onSwipe={onSwipe}
        labels={{ left: "解釈もある", right: "出来事だけ" }}
      />
    );

    expect(screen.queryByTestId("answer-swipe-left")).toBeNull();
    expect(screen.queryByTestId("answer-swipe-right")).toBeNull();
    expect(screen.getByTestId("swipe-selected-answer")).toHaveTextContent(
      "あなたの回答：解釈もある"
    );
    expect(onSwipe).not.toHaveBeenCalled();
  });

  test("keeps the statement neutral and marks the selected judgment as correct", () => {
    const screen = render(
      <SwipeJudgment
        statement="身体の警報が強いほど、悪い結果まで確定する"
        selectedAnswer="left"
        correctAnswer="left"
        showResult
        onSwipe={jest.fn()}
        labels={{ left: "判決はまだ", right: "結果も確定" }}
      />
    );

    const statementStyle = StyleSheet.flatten(
      screen.getByTestId("answer-swipe-card").props.style
    );
    const selectedAnswerStyle = StyleSheet.flatten(
      screen.getByTestId("swipe-selected-answer").props.style
    );

    expect(statementStyle.backgroundColor).toBe("#1e293b");
    expect(statementStyle.borderColor).not.toBe(theme.colors.success);
    expect(screen.getByTestId("swipe-selected-answer")).toHaveTextContent(
      "あなたの回答：判決はまだ"
    );
    expect(selectedAnswerStyle.borderColor).toBe(theme.colors.success);
  });

  test("localizes the full selected-answer sentence in every supported locale", () => {
    for (const locale of [de, en, es, fr, ja, ko, pt, zh]) {
      expect(locale.questionTypes.swipeYourAnswer).toContain("%{answer}");
    }
  });
});
