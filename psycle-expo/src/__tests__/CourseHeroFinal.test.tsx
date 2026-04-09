import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { CourseHeroFinal } from "../../components/provisional/CourseHeroFinal";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const mockReact = require("react");
    const { Text } = require("react-native");
    return mockReact.createElement(Text, null, name);
  },
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View } = require("react-native");
    return mockReact.createElement(View, null, children);
  },
}));

jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const mockReact = require("react");
    const { View } = require("react-native");
    return mockReact.createElement(View, null, children);
  },
  Circle: () => null,
  Line: () => null,
  Path: () => null,
}));

jest.mock("../../components/ui", () => ({
  Button: ({
    label,
    onPress,
    testID,
  }: {
    label: string;
    onPress: () => void;
    testID?: string;
  }) => {
    const mockReact = require("react");
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, params?: { number?: number }) => {
      if (key === "course.accessibility.nodeCompleted") return `Completed node ${params?.number}`;
      if (key === "course.accessibility.nodeLocked") return `Locked node ${params?.number}`;
      if (key === "course.accessibility.nodeCurrent") return `Current node ${params?.number}`;
      return key;
    },
  },
}));

describe("CourseHeroFinal", () => {
  const props = {
    body: "ひとつの思考の詰まりを、動ける言い換えに変える。",
    ctaAccessibilityLabel: "Open lesson 3",
    ctaLabel: "レッスン 3 を開く",
    genreIcon: "sparkles",
    meta: "7問 • +38 XP",
    nodes: [
      { id: "l1", icon: "leaf", label: "L1", levelNumber: 1, status: "done" as const },
      { id: "l2", icon: "flower", label: "L2", levelNumber: 2, status: "done" as const },
      { id: "l3", icon: "sparkles", label: "L3", levelNumber: 3, status: "current" as const },
      { id: "l4", icon: "star", label: "L4", levelNumber: 4, status: "locked" as const, isLocked: true },
      { id: "l5", icon: "heart-circle", label: "L5", levelNumber: 5, status: "locked" as const, isLocked: true },
      { id: "bh1", icon: "planet", label: "BH", levelNumber: 6, status: "locked" as const, isLocked: true },
    ],
    onNodePress: jest.fn(),
    onPrimaryPress: jest.fn(),
    progressLabel: "3 / 6",
    testID: "course-hero-final",
    themeColor: "#ec4899",
    title: "不安のリフレーム",
    unitLabel: "メンタル",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders final preview content without redundant kicker or summary", () => {
    const screen = render(<CourseHeroFinal {...props} />);

    expect(screen.getByText("不安のリフレーム")).toBeTruthy();
    expect(screen.getByText("7問 • +38 XP")).toBeTruthy();
    expect(screen.getByText("3 / 6")).toBeTruthy();
    expect(screen.getByText("レッスン 3 を開く")).toBeTruthy();
    expect(screen.getByLabelText("Current node 3")).toBeTruthy();
    expect(screen.queryByText(props.body)).toBeNull();
    expect(screen.queryByText(props.unitLabel)).toBeNull();
    expect(screen.queryByText("ひとつの思考の詰まりを、動ける言い換えに変える。")).toBeNull();
    expect(screen.queryByText("メンタル")).toBeNull();
    expect(screen.queryByText("今のレッスン")).toBeNull();
    expect(screen.queryByText("2完了")).toBeNull();
    expect(screen.queryByText("3残り")).toBeNull();
  });

  test("routes current node and CTA through callbacks", () => {
    const onNodePress = jest.fn();
    const onPrimaryPress = jest.fn();
    const screen = render(
      <CourseHeroFinal
        {...props}
        onNodePress={onNodePress}
        onPrimaryPress={onPrimaryPress}
      />
    );

    fireEvent.press(screen.getByTestId("course-hero-final-node-l3"));
    fireEvent.press(screen.getByTestId("course-hero-final-cta"));

    expect(onNodePress).toHaveBeenCalledWith("l3");
    expect(onPrimaryPress).toHaveBeenCalled();
  });
});
