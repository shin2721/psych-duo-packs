import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { LessonCompletionView } from "../../components/lesson/LessonCompletionView";
import { theme } from "../../lib/theme";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

jest.mock("../../components/StarBackground", () => ({
  StarBackground: () => null,
}));

jest.mock("../../components/VictoryConfetti", () => ({
  VictoryConfetti: () => null,
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: { success: jest.fn() },
}));

jest.mock("../../lib/sounds", () => ({
  sounds: { play: jest.fn() },
}));

describe("LessonCompletionView", () => {
  test("keeps course continuation visually primary over the double XP offer", () => {
    const screen = render(
      <LessonCompletionView
        completionBottomInset={0}
        currentLesson={null}
        feltBetterSubmitted={false}
        lastShownInterventionId={null}
        listSeparator="・"
        originalQuestions={[]}
        onDismissDoubleXpNudge={jest.fn()}
        onPressFeltBetter={jest.fn()}
        onPressPurchaseDoubleXp={jest.fn()}
        setShowResearchDetails={jest.fn()}
        showDoubleXpNudge
        showResearchDetails={false}
      />
    );

    const courseContinuationStyle = StyleSheet.flatten(
      screen.getByTestId("lesson-complete-habit-loop").props.style
    );
    const doubleXpStyle = StyleSheet.flatten(
      screen.getByTestId("lesson-double-xp-cta").props.style
    );
    const courseContinuationTitleStyle = StyleSheet.flatten(
      screen.getByTestId("lesson-complete-habit-loop-title").props.style
    );

    expect(courseContinuationStyle).toMatchObject({
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    });
    expect(doubleXpStyle).toMatchObject({
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.accent,
      borderWidth: 1,
    });
    expect(courseContinuationTitleStyle.color).toBe(theme.colors.bg);
    expect(screen.queryByTestId("lesson-complete-continue")).toBeNull();
    expect(doubleXpStyle.backgroundColor).not.toBe(
      courseContinuationStyle.backgroundColor
    );
  });
});
