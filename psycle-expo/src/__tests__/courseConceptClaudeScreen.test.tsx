import React from "react";
import { render } from "@testing-library/react-native";
import CourseConceptClaudeScreen from "../../app/debug/course-concept-claude";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
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

jest.mock("react-native-webview", () => ({
  WebView: ({ testID }: { testID?: string }) => {
    const mockReact = require("react");
    const { View } = require("react-native");
    return mockReact.createElement(View, { testID });
  },
}));

describe("course concept claude screen", () => {
  test("renders the claude preview webview route", () => {
    const screen = render(<CourseConceptClaudeScreen />);

    expect(screen.getByText("Claude Preview")).toBeTruthy();
    expect(screen.getByTestId("course-concept-claude-back")).toBeTruthy();
    expect(screen.getByTestId("course-concept-claude-webview")).toBeTruthy();
  });
});
