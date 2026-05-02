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
const mockLoadPrimaryOnboardingGenre = jest.fn();
const mockSetSelectedGenre = jest.fn();

let mockCompletedLessons = new Set<string>();
let mockSelectedGenre = "mental";
let mockStreakRepairOffer: {
  active: boolean;
  costGems: number;
  expiresAtMs: number;
  previousStreak: number;
} | null = null;
let mockMasteryThemeState: {
  themeId: string;
  parentUnitId: string;
  maxActiveSlots: number;
  activeVariantIds: string[];
  retiredVariantIds: string[];
  sceneIdsCleared: string[];
  scenesClearedCount: number;
  attemptCount: number;
  transferImprovement: boolean;
  repeatWithoutDropoff: boolean;
  newLearningValueDelta: number;
  transferGainSlope: number;
  repetitionRisk: number;
  graduationState: "learning" | "graduated";
  masteryCeilingState: "open" | "ceiling_reached";
  lastEvaluatedAt: number | null;
} | null = null;
let mockAvailableMasteryVariantIds: string[] = [];
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

jest.mock("../../components/CourseWorldHero", () => ({
  CourseWorldHero: ({
    model,
    onPrimaryPress,
    onSupportPress,
  }: {
    model?: { supportMoment?: { ctaLabel?: string; title?: string } };
    onPrimaryPress?: () => void;
    onSupportPress?: () => void;
  }) => {
    const mockReact = require("react");
    const { Pressable, Text, View } = require("react-native");
    return (
      <View>
        <Pressable onPress={onPrimaryPress} testID="course-next-step-cta">
          <Text>course-next-step</Text>
        </Pressable>
        {model?.supportMoment ? (
          <Pressable
            onPress={onSupportPress}
            testID="course-world-support"
            accessibilityLabel={model.supportMoment.ctaLabel ?? model.supportMoment.title}
          >
            <Text>{model.supportMoment.ctaLabel ?? model.supportMoment.title}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  },
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

jest.mock("../../lib/onboardingSelection", () => {
  const getOnboardingPrimaryGenreToApply = ({
    completedLessonCount,
    primaryGenreId,
    selectedGenre,
  }: {
    completedLessonCount: number;
    primaryGenreId: string;
    selectedGenre: string;
  }) => {
    if (completedLessonCount > 0) return null;
    if (!["mental", "work"].includes(primaryGenreId)) return null;
    return primaryGenreId === selectedGenre ? null : primaryGenreId;
  };

  return {
    getOnboardingPrimaryGenreToApply,
    loadPrimaryOnboardingGenre: (...args: unknown[]) => mockLoadPrimaryOnboardingGenre(...args),
  };
});

jest.mock("../../lib/state", () => ({
  useProgressionState: () => ({
    comebackRewardOffer: mockComebackRewardOffer,
    completedLessons: mockCompletedLessons,
    purchaseStreakRepair: (...args: unknown[]) => mockPurchaseStreakRepair(...args),
    selectedGenre: mockSelectedGenre,
    setSelectedGenre: (...args: unknown[]) => mockSetSelectedGenre(...args),
    streakRepairOffer: mockStreakRepairOffer,
  }),
  useBillingState: () => ({
    hasProAccess: false,
  }),
  useEconomyState: () => ({
    setGemsDirectly: jest.fn(),
  }),
  usePracticeState: () => ({
    getLessonSupportCandidate: () => null,
    getMasteryThemeState: () => mockMasteryThemeState,
    getSupportBudgetSummary: () => ({
      weeklyBudget: 6,
      weeklyUsed: 0,
      weeklyRemaining: 6,
      weeklyKindBudget: { return: 2, adaptive: 2, refresh: 2, replay: 1 },
      weeklyKindUsed: { return: 0, adaptive: 0, refresh: 0, replay: 0 },
      weeklyKindRemaining: { return: 2, adaptive: 2, refresh: 2, replay: 1 },
    }),
    primeMasteryTheme: jest.fn(),
    recordSupportMomentSeen: jest.fn(),
    markSupportMomentStarted: jest.fn(),
    activateReviewSupportSession: jest.fn(),
    completeActiveReviewSupport: jest.fn(),
    suppressActiveReviewSupport: jest.fn(),
    startReturnSession: jest.fn(() => ({ started: false })),
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

jest.mock("../../lib/masteryInventory", () => ({
  listAvailableMasteryLessonIds: () => mockAvailableMasteryVariantIds,
}));

jest.mock("../../lib/lesson-data/lessonQuestionAdapter", () => {
  const actual = jest.requireActual("../../lib/lesson-data/lessonQuestionAdapter");
  return {
    ...actual,
    warnLessonLoadSummary: jest.fn(),
  };
});

const CourseScreen = require("../../app/(tabs)/course").default;

describe("CourseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompletedLessons = new Set();
    mockSelectedGenre = "mental";
    mockStreakRepairOffer = null;
    mockMasteryThemeState = null;
    mockAvailableMasteryVariantIds = [];
    mockComebackRewardOffer = null;
    mockGetLastWeekResult.mockResolvedValue({ hasReward: false });
    mockIsLessonLocked.mockReturnValue(false);
    mockShouldShowPaywall.mockReturnValue(true);
    mockLoadPrimaryOnboardingGenre.mockResolvedValue("mental");
  }, 20000);

  test("applies the saved onboarding primary genre before the first lesson", async () => {
    mockLoadPrimaryOnboardingGenre.mockResolvedValue("work");

    render(React.createElement(CourseScreen));

    await waitFor(() => {
      expect(mockSetSelectedGenre).toHaveBeenCalledWith("work");
    });
    expect(mockTrack).toHaveBeenCalledWith(
      "onboarding_primary_genre_applied",
      expect.objectContaining({
        previousGenreId: "mental",
        genreId: "work",
        surface: "course_world",
      })
    );
  });

  test("does not override the course genre after lesson completion", async () => {
    mockCompletedLessons = new Set(["mental_l01"]);
    mockLoadPrimaryOnboardingGenre.mockResolvedValue("work");

    render(React.createElement(CourseScreen));

    await waitFor(() => {
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
    expect(mockSetSelectedGenre).not.toHaveBeenCalled();
    expect(mockLoadPrimaryOnboardingGenre).not.toHaveBeenCalled();
  });

  test("next-step CTA launches the current lesson directly", async () => {
    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-next-step-cta"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");

    await waitFor(() => {
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
  });

  test("rendering and lesson navigation do not emit console.log noise", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const screen = render(React.createElement(CourseScreen));

      fireEvent.press(screen.getByTestId("course-next-step-cta"));

      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
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

    fireEvent.press(screen.getByTestId("course-world-support"));

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

    fireEvent.press(screen.getByTestId("course-world-support"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");
  });

  test("mastery support CTA starts the mastery lesson after core completion", async () => {
    mockCompletedLessons = new Set(["mental_l01", "mental_l02", "mental_l03"]);
    mockAvailableMasteryVariantIds = ["mental_m01"];
    mockMasteryThemeState = {
      themeId: "mental",
      parentUnitId: "mental",
      maxActiveSlots: 3,
      activeVariantIds: ["mental_m01"],
      retiredVariantIds: [],
      sceneIdsCleared: ["mental_l01", "mental_l02", "mental_l03"],
      scenesClearedCount: 3,
      attemptCount: 3,
      transferImprovement: false,
      repeatWithoutDropoff: true,
      newLearningValueDelta: 0.8,
      transferGainSlope: 0.2,
      repetitionRisk: 0.2,
      graduationState: "learning",
      masteryCeilingState: "open",
      lastEvaluatedAt: 1,
    };

    const screen = render(React.createElement(CourseScreen));

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith(
        "course_support_shown",
        expect.objectContaining({
          kind: "mastery",
          lessonId: "mental_m01",
          reason: "mastery_slot_open",
          activeSlotsRemaining: 2,
        })
      );
    });

    fireEvent.press(screen.getByTestId("course-world-support"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_m01&genre=mental");
    expect(mockTrack).toHaveBeenCalledWith(
      "course_support_started",
      expect.objectContaining({
        kind: "mastery",
        lessonId: "mental_m01",
        reason: "mastery_slot_open",
        activeSlotsRemaining: 2,
      })
    );
  });
});
