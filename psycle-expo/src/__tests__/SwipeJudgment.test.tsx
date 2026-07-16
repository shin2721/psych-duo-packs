import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SwipeJudgment } from "../../components/question-types/SwipeJudgment";

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

  test("disables tap alternatives after answering", () => {
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

    fireEvent.press(screen.getByTestId("answer-swipe-left"));
    fireEvent.press(screen.getByTestId("answer-swipe-right"));
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
