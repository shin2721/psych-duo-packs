import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SwipeJudgment } from "../../components/question-types/SwipeJudgment";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("react-native/Libraries/Interaction/PanResponder", () => ({
  __esModule: true,
  default: {
    create: (callbacks: any) => ({
      panHandlers: {
        onMoveShouldSetResponder: callbacks.onMoveShouldSetPanResponder,
        onMoveShouldSetResponderCapture: callbacks.onMoveShouldSetPanResponderCapture,
        onResponderGrant: callbacks.onPanResponderGrant,
        onResponderMove: callbacks.onPanResponderMove,
        onResponderRelease: callbacks.onPanResponderRelease,
        onResponderTerminate: callbacks.onPanResponderTerminate,
        onResponderTerminationRequest: callbacks.onPanResponderTerminationRequest,
      },
    }),
  },
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
    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenLastCalledWith("left");

    fireEvent.press(screen.getByTestId("answer-swipe-right"));
    expect(onSwipe).toHaveBeenCalledTimes(2);
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

  test("leaves vertical movement to the parent scroll view", () => {
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer={null}
        correctAnswer="left"
        showResult={false}
        onSwipe={jest.fn()}
      />
    );
    const card = screen.getByTestId("answer-swipe-card");

    expect(
      card.props.onMoveShouldSetResponder({}, { dx: 12, dy: 20, vx: 0.1 })
    ).toBe(false);
    expect(
      card.props.onMoveShouldSetResponderCapture({}, { dx: 12, dy: 20, vx: 0.1 })
    ).toBe(false);
  });

  test("starts one drag and restores scrolling after a short release", () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const onSwipe = jest.fn();
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer={null}
        correctAnswer="left"
        showResult={false}
        onSwipe={onSwipe}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
    const card = screen.getByTestId("answer-swipe-card");
    const gesture = { dx: -20, dy: 1, vx: -0.1 };

    expect(card.props.onMoveShouldSetResponder({}, gesture)).toBe(true);
    card.props.onResponderGrant({}, gesture);
    card.props.onResponderGrant({}, gesture);
    card.props.onResponderRelease({}, gesture);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  test("restores scrolling after responder termination", () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const onSwipe = jest.fn();
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer={null}
        correctAnswer="left"
        showResult={false}
        onSwipe={onSwipe}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
    const card = screen.getByTestId("answer-swipe-card");
    const gesture = { dx: 8, dy: 1, vx: 0.1 };

    card.props.onResponderGrant({}, gesture);
    card.props.onResponderTerminate({}, gesture);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  test("commits one drag answer and restores scrolling once", () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const onSwipe = jest.fn();
    const screen = render(
      <SwipeJudgment
        statement="statement"
        selectedAnswer={null}
        correctAnswer="left"
        showResult={false}
        onSwipe={onSwipe}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
    const card = screen.getByTestId("answer-swipe-card");
    const gesture = { dx: -48, dy: 4, vx: -0.1 };

    card.props.onResponderGrant({}, gesture);
    card.props.onResponderRelease({}, gesture);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledWith("left");
  });

  test("restores scrolling when results appear mid-drag without sending an answer", () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const onSwipe = jest.fn();
    const baseProps = {
      statement: "statement",
      selectedAnswer: null,
      correctAnswer: "left",
      onSwipe,
      onDragStart,
      onDragEnd,
    } as const;
    const screen = render(<SwipeJudgment {...baseProps} showResult={false} />);
    const gesture = { dx: -48, dy: 4, vx: -0.1 };

    screen.getByTestId("answer-swipe-card").props.onResponderGrant({}, gesture);
    screen.rerender(<SwipeJudgment {...baseProps} showResult />);
    screen.getByTestId("answer-swipe-card").props.onResponderRelease({}, gesture);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
