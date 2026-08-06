import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { CourseWorldHero } from "../../components/CourseWorldHero";
import type { CourseWorldViewModel } from "../../lib/courseWorld";

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

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: "Light",
    Medium: "Medium",
    Heavy: "Heavy",
  },
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: {
      View,
    },
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withTiming: (value: unknown) => value,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View: MockView } = require("react-native");
    return mockReact.createElement(MockView, null, children);
  },
  Defs: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View: MockView } = require("react-native");
    return mockReact.createElement(MockView, null, children);
  },
  Circle: () => null,
  Line: () => null,
  Ellipse: () => null,
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View: MockView } = require("react-native");
    return mockReact.createElement(MockView, null, children);
  },
  Path: () => null,
  RadialGradient: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View: MockView } = require("react-native");
    return mockReact.createElement(MockView, null, children);
  },
  Stop: () => null,
}));

jest.mock("../../components/course-world/CourseWorldBackdrop", () => {
  const mockReact = require("react");
  const { View: MockView } = require("react-native");
  const MockBackdropPart = () => mockReact.createElement(MockView, null);

  return {
    CLOCK_FIREFLY_CONFIGS: [],
    CourseWorldBackdrop: MockBackdropPart,
    Fireflies: MockBackdropPart,
    HERO_FIREFLY_CONFIGS: [],
    HeroRing: MockBackdropPart,
  };
});

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const model: CourseWorldViewModel = {
  currentLesson: {
    accessibilityLabel: "Current node L3",
    body: "Turn one stuck thought into motion.",
    icon: "sparkles",
    id: "l3",
    isInteractive: true,
    label: "L3",
    levelNumber: 3,
    lessonFile: "mental_l03",
    meta: "7 questions • +38 XP",
    nodeType: "lesson",
    status: "current",
    title: "Anxiety Reframe",
  },
  genreId: "mental",
  primaryAction: {
    label: "Open lesson 3",
    mode: "lesson",
    targetLessonFile: "mental_l03",
    targetNodeId: "l3",
  },
  progressLabel: "3 / 6",
  reviewNode: {
    accessibilityLabel: "Review node BH",
    icon: "planet",
    id: "bh1",
    isInteractive: false,
    label: "BH",
    levelNumber: 5,
    nodeType: "review_blackhole",
    status: "locked",
  },
  routeNodes: [
    {
      accessibilityLabel: "Done node L2",
      icon: "flower",
      id: "l2",
      isInteractive: false,
      label: "L2",
      levelNumber: 2,
      nodeType: "lesson",
      status: "done",
    },
    {
      accessibilityLabel: "Locked node L4",
      icon: "star",
      id: "l4",
      isInteractive: false,
      label: "L4",
      levelNumber: 4,
      nodeType: "lesson",
      status: "locked",
    },
  ],
  summaryLabel: "2 done • 3 left",
  supportMoment: {
    accessibilityHint: "Restore hint",
    body: "Restore your streak before it expires.",
    ctaLabel: "Restore",
    kind: "streakRepair",
    title: "Streak Repair",
  },
  themeColor: "#ec4899",
  unitLabel: "メンタル",
};

describe("CourseWorldHero", () => {
  test("renders current lesson, route labels, review label, and support states together", () => {
    const screen = render(
      <CourseWorldHero
        model={model}
        onNodePress={jest.fn()}
        onPrimaryPress={jest.fn()}
        onSupportPress={jest.fn()}
        primaryTestID="hero-primary"
        supportTestID="hero-support"
        testID="hero-root"
      />
    );

    expect(screen.getByLabelText("L3、Anxiety Reframe")).toBeTruthy();
    expect(screen.getByText("L2")).toBeTruthy();
    expect(screen.getAllByText("L3").length).toBeGreaterThan(0);
    expect(screen.getByText("L4")).toBeTruthy();
    expect(screen.getByText("BH")).toBeTruthy();
    expect(screen.getByTestId("hero-support")).toBeTruthy();
    expect(screen.getByTestId("hero-primary")).toBeTruthy();
    expect(screen.getByText("Anxiety Reframe")).toBeTruthy();
    expect(screen.getByText("Turn one stuck thought into motion.")).toBeTruthy();
    expect(screen.getByText("7 questions • +38 XP")).toBeTruthy();
    expect(screen.queryByText("Current lesson")).toBeNull();
    expect(screen.queryByText("Current review")).toBeNull();
    expect(screen.queryByText("2 done • 3 left")).toBeNull();
  });

  test("routes current node, support CTA and primary CTA through callbacks", () => {
    const onNodePress = jest.fn();
    const onSupportPress = jest.fn();
    const onPrimaryPress = jest.fn();

    const screen = render(
      <CourseWorldHero
        model={model}
        onNodePress={onNodePress}
        onPrimaryPress={onPrimaryPress}
        onSupportPress={onSupportPress}
        primaryTestID="hero-primary"
        supportTestID="hero-support"
        testID="hero-root"
      />
    );

    fireEvent(
      screen.getByTestId("hero-root-orb"),
      "accessibilityAction",
      { nativeEvent: { actionName: "decrement" } }
    );
    fireEvent.press(screen.getByTestId("hero-support"));
    fireEvent.press(screen.getByTestId("hero-primary"));

    expect(onNodePress).toHaveBeenCalledWith("l2");
    expect(onSupportPress).toHaveBeenCalled();
    expect(onPrimaryPress).toHaveBeenCalled();
  });

  test("ring-and-theme presentation keeps only the ring and selected theme copy", () => {
    const onNodePress = jest.fn();
    const onPrimaryPress = jest.fn();
    const screen = render(
      <CourseWorldHero
        model={model}
        onNodePress={onNodePress}
        onPrimaryPress={onPrimaryPress}
        onSupportPress={jest.fn()}
        onUnitPress={jest.fn()}
        presentation="ring_theme"
        showPrimaryAction={false}
        habitSummary={{ dailyGoal: 10, dailyXP: 5, streak: 4 }}
        primaryTestID="hero-primary"
        supportTestID="hero-support"
      />
    );

    expect(screen.getByTestId("hero-root-orb")).toBeTruthy();
    expect(screen.getByText("Anxiety Reframe")).toBeTruthy();
    expect(screen.queryByText("Turn one stuck thought into motion.")).toBeNull();
    expect(screen.queryByText("7 questions • +38 XP")).toBeNull();
    expect(screen.queryByText("メンタル")).toBeNull();
    expect(screen.queryByText("STREAK")).toBeNull();
    expect(screen.queryByText("GOAL")).toBeNull();
    expect(screen.queryByTestId("hero-support")).toBeNull();
    expect(screen.queryByTestId("hero-primary")).toBeNull();

    fireEvent(
      screen.getByTestId("hero-root-orb"),
      "accessibilityAction",
      { nativeEvent: { actionName: "activate" } }
    );
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });
});
