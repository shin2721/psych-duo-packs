import React from "react";
import { AccessibilityInfo, Animated, ScrollView } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import L1AssumptionGapPilot from "../../components/provisional/L1AssumptionGapPilot";

const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const mockReact = require("react");
    const { Text: MockText } = require("react-native");
    return mockReact.createElement(MockText, null, name);
  },
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View: MockView } = require("react-native");
    return mockReact.createElement(MockView, null, children);
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const mockReact = require("react");
  const { View: MockView } = require("react-native");
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(MockView, null, children),
    useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
  };
});

jest.mock("../../components/StarBackground", () => ({
  StarBackground: () => null,
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
  },
}));

describe("L1AssumptionGapPilot", () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(jest.fn());
  const scrollToSpy = jest
    .spyOn(ScrollView.prototype, "scrollTo")
    .mockImplementation(jest.fn());
  const timingSpy = jest.spyOn(Animated, "timing").mockImplementation(() => ({
    reset: jest.fn(),
    start: (callback?: (result: { finished: boolean }) => void) =>
      callback?.({ finished: true }),
    stop: jest.fn(),
  }));

  beforeEach(() => {
    mockBack.mockClear();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(false);
    mockReplace.mockClear();
    announceSpy.mockClear();
    scrollToSpy.mockClear();
  });

  afterAll(() => {
    announceSpy.mockRestore();
    scrollToSpy.mockRestore();
    timingSpy.mockRestore();
  });

  test("falls back to home when a direct deep link has no back history", () => {
    const screen = render(<L1AssumptionGapPilot />);

    fireEvent.press(screen.getByTestId("close-l1-pilot"));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  test("uses back navigation when the pilot has navigation history", () => {
    mockCanGoBack.mockReturnValue(true);
    const screen = render(<L1AssumptionGapPilot />);

    fireEvent.press(screen.getByTestId("close-l1-pilot"));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("allows a provisional discovery choice to be corrected", () => {
    const screen = render(<L1AssumptionGapPilot />);

    fireEvent.press(screen.getByTestId("discovery-choice-少し呆れている"));
    expect(screen.getByTestId("reselect-discovery")).toBeTruthy();
    expect(screen.queryByTestId("discovery-choice-助けようとした")).toBeNull();

    fireEvent.press(screen.getByTestId("reselect-discovery"));
    fireEvent.press(screen.getByTestId("discovery-choice-助けようとした"));

    expect(screen.getByText(/上司は、/)).toBeTruthy();
    expect(
      screen.getByTestId("discovery-choice-助けようとした").props
        .accessibilityState
    ).toEqual({
      selected: true,
    });
    expect(screen.getByTestId("l1-pilot-primary").props.accessibilityState).toEqual({
      disabled: false,
    });
  });

  test("announces and scrolls to the start on screen and recheck transitions", async () => {
    const screen = render(<L1AssumptionGapPilot />);

    fireEvent.press(screen.getByTestId("discovery-choice-少し呆れている"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    await waitFor(() => {
      expect(announceSpy).toHaveBeenCalledWith(
        "自分の生活へ。今日、近かったのは？"
      );
      expect(scrollToSpy).toHaveBeenLastCalledWith({ animated: false, y: 0 });
    });

    fireEvent.press(screen.getByTestId("scene-reply"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("first-choice-行きたくなくなった"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    announceSpy.mockClear();
    scrollToSpy.mockClear();
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    await waitFor(() => {
      expect(announceSpy).toHaveBeenCalledWith(
        "2回目。空欄を外したまま、もう一度"
      );
      expect(scrollToSpy).toHaveBeenLastCalledWith({ animated: false, y: 0 });
    });
  });

  test("keeps the interpretation ungraded and reuses the same scene after removing a premise", () => {
    const screen = render(<L1AssumptionGapPilot />);

    expect(screen.getByText("この一文、何に見えた？")).toBeTruthy();
    expect(screen.getByTestId("l1-pilot-primary").props.accessibilityState).toEqual({
      disabled: true,
    });

    fireEvent.press(screen.getByTestId("discovery-choice-少し呆れている"));

    expect(screen.getByTestId("discovery-reveal")).toBeTruthy();
    expect(screen.getByText(/この一文は元の画面にはない/)).toBeTruthy();

    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("scene-reply"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    expect(
      screen.getByText("昨夜送った「明日どうする？」に、昼になっても返信がない。")
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("first-choice-行きたくなくなった"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    expect(screen.getByTestId("premise-card")).toBeTruthy();
    expect(
      screen.getAllByText("返信がない理由は、あなたとの予定にある").length
    ).toBeGreaterThan(0);

    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    expect(screen.getByTestId("removed-premise")).toBeTruthy();
    expect(
      screen.getByText("昨夜送った「明日どうする？」に、昼になっても返信がない。")
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("second-choice-行きたくなくなった"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    expect(screen.getByTestId("result-delta")).toBeTruthy();
    expect(screen.getByText("結論は同じ。それでも、分けられた")).toBeTruthy();
    expect(screen.getByText("返信が来て、その内容を読んだ時")).toBeTruthy();
  });

  test("makes the next-day check optional and session-only", () => {
    const screen = render(<L1AssumptionGapPilot />);

    fireEvent.press(screen.getByTestId("discovery-choice-助けようとした"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("scene-example"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("first-choice-助けようとした"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));
    fireEvent.press(screen.getByTestId("second-choice-まだ決めない"));
    fireEvent.press(screen.getByTestId("l1-pilot-primary"));

    expect(screen.queryByTestId("tomorrow-check")).toBeNull();
    fireEvent.press(screen.getByTestId("record-practice"));
    expect(screen.getByTestId("tomorrow-check")).toBeTruthy();

    fireEvent.press(screen.getByTestId("tomorrow-not-yet"));
    expect(screen.getByText("空欄はまだ空欄。未確認のまま残せます。")).toBeTruthy();
    expect(screen.getByText("試作のため今すぐ表示。保存・通知はしません。")).toBeTruthy();
  });
});
