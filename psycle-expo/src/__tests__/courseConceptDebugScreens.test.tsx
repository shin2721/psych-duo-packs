import React from "react";
import { render } from "@testing-library/react-native";
import CourseConceptFinalScreen from "../../app/debug/course-concept-final";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const mockReact = require("react");
    const { Text } = require("react-native");
    return mockReact.createElement(Text, null, name);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../components/StarBackground", () => ({
  StarBackground: () => null,
}));

jest.mock("../../components/provisional/CourseHeroFinal", () => ({
  CourseHeroFinal: ({ testID }: { testID?: string }) => {
    const mockReact = require("react");
    const { View } = require("react-native");
    return mockReact.createElement(View, { testID });
  },
}));

describe("course concept debug screens", () => {
  test("final preview renders a single concept screen without compare labels", () => {
    const screen = render(<CourseConceptFinalScreen />);

    expect(screen.getByTestId("course-concept-final-screen")).toBeTruthy();
    expect(screen.getByTestId("course-concept-final-hero")).toBeTruthy();
    expect(screen.queryByText("継承案")).toBeNull();
    expect(screen.queryByText("独自案")).toBeNull();
    expect(screen.queryByText("Route")).toBeNull();
    expect(screen.queryByText("Poster")).toBeNull();
    expect(screen.queryByText("Map")).toBeNull();
    expect(screen.queryByText("Minimal")).toBeNull();
    expect(screen.queryByText("Claude")).toBeNull();
    expect(screen.queryByTestId("course-concept-final-mode-inherited")).toBeNull();
    expect(screen.queryByTestId("course-concept-final-mode-auteur")).toBeNull();
  });
});
