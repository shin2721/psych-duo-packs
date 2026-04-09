import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockShowToast = jest.fn();
const mockTrack = jest.fn();
const mockPurchaseStreakRepair = jest.fn();
const mockGetLastWeekResult = jest.fn();
const mockIsLessonLocked = jest.fn();
const mockShouldShowPaywall = jest.fn();

let mockCompletedLessons = new Set<string>();
let mockStreakRepairOffer: {
  active: boolean;
  costGems: number;
  expiresAtMs: number;
  previousStreak: number;
} | null = null;
let mockComebackRewardOffer: {
  active: boolean;
  daysSinceStudy: number;
  expiresAtMs: number;
  rewardEnergy: number;
  rewardGems: number;
} | null = null;

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
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

jest.mock("../../components/GlobalHeader", () => ({
  GlobalHeader: () => null,
}));

jest.mock("../../components/trail", () => ({
  Trail: ({
    onLockedPress,
    onStart,
  }: {
    onLockedPress?: () => void;
    onStart?: (nodeId: string) => void;
  }) => {
    const mockReact = require("react");
    const { Pressable, Text, View } = require("react-native");

    return (
      <View>
        <Pressable onPress={() => onStart?.("m1")} testID="trail-start">
          <Text>trail-start</Text>
        </Pressable>
        <Pressable onPress={onLockedPress} testID="trail-locked">
          <Text>trail-locked</Text>
        </Pressable>
      </View>
    );
  },
}));

jest.mock("../../components/Modal", () => ({
  Modal: ({
    onCancel,
    onPrimary,
    visible,
  }: {
    onCancel: () => void;
    onPrimary: () => void;
    visible: boolean;
  }) => {
    const mockReact = require("react");
    const { Pressable, Text, View } = require("react-native");
    if (!visible) return null;

    return (
      <View testID="start-lesson-modal">
        <Pressable onPress={onPrimary} testID="start-lesson-primary">
          <Text>start-primary</Text>
        </Pressable>
        <Pressable onPress={onCancel} testID="start-lesson-cancel">
          <Text>start-cancel</Text>
        </Pressable>
      </View>
    );
  },
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

jest.mock("../../components/PaywallModal", () => ({
  PaywallModal: ({ visible }: { visible: boolean }) => {
    const mockReact = require("react");
    const { Text } = require("react-native");
    return visible ? mockReact.createElement(Text, null, "paywall-visible") : null;
  },
}));

jest.mock("../../components/LeagueResultModal", () => ({
  LeagueResultModal: () => null,
}));

jest.mock("../../components/ToastProvider", () => ({
  useToast: () => ({
    showToast: (...args: unknown[]) => mockShowToast(...args),
  }),
}));

jest.mock("../../lib/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user_1" },
  }),
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock("../../lib/leagueReward", () => ({
  getLastWeekResult: (...args: unknown[]) => mockGetLastWeekResult(...args),
}));

jest.mock("../../lib/paywall", () => ({
  isLessonLocked: (...args: unknown[]) => mockIsLessonLocked(...args),
  shouldShowPaywall: (...args: unknown[]) => mockShouldShowPaywall(...args),
}));

jest.mock("../../lib/state", () => ({
  useProgressionState: () => ({
    comebackRewardOffer: mockComebackRewardOffer,
    completedLessons: mockCompletedLessons,
    purchaseStreakRepair: (...args: unknown[]) => mockPurchaseStreakRepair(...args),
    selectedGenre: "mental",
    streakRepairOffer: mockStreakRepairOffer,
  }),
  useBillingState: () => ({
    hasProAccess: false,
  }),
  useEconomyState: () => ({
    setGemsDirectly: jest.fn(),
  }),
}));

jest.mock("../../lib/data", () => ({
  genres: [{ id: "mental", label: "Mental" }],
  trailsByGenre: {
    mental: [
      { icon: "leaf", id: "m1", lessonFile: "mental_l01" },
      { icon: "flower", id: "m2", lessonFile: "mental_l02" },
      { icon: "sparkles", id: "m3", lessonFile: "mental_l03" },
    ],
  },
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const CourseScreen = require("../../app/(tabs)/course").default;

describe("CourseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompletedLessons = new Set();
    mockStreakRepairOffer = null;
    mockComebackRewardOffer = null;
    mockGetLastWeekResult.mockResolvedValue({ hasReward: false });
    mockIsLessonLocked.mockReturnValue(false);
    mockShouldShowPaywall.mockReturnValue(true);
  });

  test("next-step CTA opens the start modal and starts the lesson", async () => {
    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-next-step-cta"));
    expect(screen.getByTestId("start-lesson-modal")).toBeTruthy();

    fireEvent.press(screen.getByTestId("start-lesson-primary"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");

    await waitFor(() => {
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
  });

  test("rendering and lesson navigation do not emit development console logs", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      const screen = render(React.createElement(CourseScreen));

      fireEvent.press(screen.getByTestId("course-next-step-cta"));
      fireEvent.press(screen.getByTestId("start-lesson-primary"));

      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
    }
  });

  test("locked next-step opens the paywall instead of navigating", () => {
    mockIsLessonLocked.mockImplementation((genreId: string, level: number) => genreId === "mental" && level === 1);

    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-next-step-cta"));

    expect(screen.getByText("paywall-visible")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("streak repair CTA preserves the existing purchase logic", () => {
    mockStreakRepairOffer = {
      active: true,
      costGems: 50,
      expiresAtMs: Date.now() + 60 * 60 * 1000,
      previousStreak: 14,
    };
    mockPurchaseStreakRepair.mockReturnValue({ success: true });

    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByLabelText("course.streakRepair.cta"));

    expect(mockPurchaseStreakRepair).toHaveBeenCalled();
  });

  test("comeback reward CTA starts the current lesson", () => {
    mockComebackRewardOffer = {
      active: true,
      daysSinceStudy: 8,
      expiresAtMs: Date.now() + 60 * 60 * 1000,
      rewardEnergy: 2,
      rewardGems: 10,
    };

    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByLabelText("course.comebackReward.cta"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");
  });
});
