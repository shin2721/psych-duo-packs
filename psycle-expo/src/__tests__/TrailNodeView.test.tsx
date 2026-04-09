import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { TrailNodeView } from "../../components/trail/TrailNodeView";
import type { TrailNode } from "../../components/trail/types";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, name);
  },
  glyphMap: {
    sparkles: 1,
    leaf: 1,
    star: 1,
    planet: 1,
    "lock-closed": 1,
    checkmark: 1,
    ellipse: 1,
  },
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, params?: { number?: number }) => `${key}:${params?.number ?? ""}`,
  },
}));

function renderNode(node: TrailNode, onPress = jest.fn()) {
  return render(
    <TrailNodeView
      node={node}
      x={120}
      y={180}
      isMilestone={false}
      onPress={onPress}
      nodeIndex={0}
    />
  );
}

describe("TrailNodeView", () => {
  test("renders current, locked and done node states with stable test ids", () => {
    const current = renderNode({ id: "current", icon: "sparkles", status: "current" });
    expect(current.getByTestId("lesson-node-current")).toBeTruthy();

    const locked = renderNode({ id: "locked", icon: "star", status: "locked", isLocked: true });
    expect(locked.getByTestId("lesson-node-locked")).toBeTruthy();

    const done = renderNode({ id: "done", icon: "leaf", status: "done" });
    expect(done.getByTestId("lesson-node-done")).toBeTruthy();
  });

  test("dispatches locked and current node presses through the shared handler", () => {
    const onLockedPress = jest.fn();
    const locked = renderNode({ id: "locked", icon: "star", status: "locked", isLocked: true }, onLockedPress);
    fireEvent.press(locked.getByTestId("lesson-node-locked"));
    expect(onLockedPress).toHaveBeenCalledTimes(1);

    const onStart = jest.fn();
    const current = renderNode({ id: "current", icon: "sparkles", status: "current" }, onStart);
    fireEvent.press(current.getByTestId("lesson-node-current"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
