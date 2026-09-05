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
let mockIsStateHydrated = true;
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
let mockLessonSupportCandidate: {
  lessonId: string;
  kind: "return" | "adaptive" | "refresh" | "replay";
  questionIds: string[];
  reason: "abandonment" | "weakness" | "forgetting" | "evidence_update" | "completion_drift";
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

jest.mock("../../components/CourseWorldHero", () => ({
  CourseWorldHero: ({
    model,
    onNodePress,
    onPrimaryPress,
    presentation,
    showPrimaryAction,
  }: {
    model?: {
      currentLesson?: { id?: string; title?: string };
      supportMoment?: { ctaLabel?: string; title?: string };
    };
    onNodePress?: (nodeId: string) => void;
    onPrimaryPress?: () => void;
    presentation?: string;
    showPrimaryAction?: boolean;
  }) => {
    const mockReact = require("react");
    const { Pressable, Text, View } = require("react-native");
    return (
      <View>
        <Text testID="course-world-presentation">{presentation}</Text>
        <Text testID="course-selected-node">{model?.currentLesson?.id}</Text>
        <Text testID="course-world-theme">{model?.currentLesson?.title}</Text>
        <Pressable onPress={() => onNodePress?.("m1")} testID="course-select-l1">
          <Text>select-l1</Text>
        </Pressable>
        <Pressable onPress={() => onNodePress?.("m2")} testID="course-select-l2">
          <Text>select-l2</Text>
        </Pressable>
        <Pressable onPress={onPrimaryPress} testID="course-ring-open">
          <Text>open-selected</Text>
        </Pressable>
        {showPrimaryAction ? (
          <Pressable onPress={onPrimaryPress} testID="course-next-step-cta">
            <Text>course-next-step</Text>
          </Pressable>
        ) : null}
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

jest.mock("../../lib/onboarding", () => ({
  hasCompletedFirstLesson: () => new Promise<boolean>(() => undefined),
}));

jest.mock("../../lib/state", () => ({
  useProgressionState: () => ({
    comebackRewardOffer: mockComebackRewardOffer,
    completedLessons: mockCompletedLessons,
    dailyGoal: 10,
    dailyXP: 0,
    isStateHydrated: mockIsStateHydrated,
    purchaseStreakRepair: (...args: unknown[]) => mockPurchaseStreakRepair(...args),
    selectedGenre: mockSelectedGenre,
    setSelectedGenre: (...args: unknown[]) => mockSetSelectedGenre(...args),
    streak: 0,
    streakRepairOffer: mockStreakRepairOffer,
  }),
  useBillingState: () => ({
    hasProAccess: false,
  }),
  useEconomyState: () => ({
    setGemsDirectly: jest.fn(),
  }),
  usePracticeState: () => ({
    getLessonSupportCandidate: () => mockLessonSupportCandidate,
    getMasteryThemeState: () => mockMasteryThemeState,
    getSupportBudgetSummary: () => ({
      weeklyBudget: 6,
      weeklyUsed: 0,
      weeklyRemaining: 6,
      weeklyKindBudget: { return: 2, adaptive: 2, refresh: 2, replay: 1 },
      weeklyKindUsed: { return: 0, adaptive: 0, refresh: 0, replay: 0 },
      weeklyKindRemaining: { return: 2, adaptive: 2, refresh: 2, replay: 1 },
    }),
    learnerSkillStates: [],
    lessonSessions: [],
    primeMasteryTheme: jest.fn(),
    recordSupportMomentSeen: jest.fn(),
    markSupportMomentStarted: jest.fn(),
    activateReviewSupportSession: jest.fn(),
    completeActiveReviewSupport: jest.fn(),
    suppressActiveReviewSupport: jest.fn(),
    startReturnSession: jest.fn(() => ({ started: false })),
    supportSurfaceHistory: [],
  }),
}));

jest.mock("../../lib/data", () => ({
  genres: [{ id: "mental", label: "Mental" }],
}));

jest.mock("../../lib/courseTrail", () => ({
  buildCourseTrailInventory: () => [
    { displayLevel: 1, icon: "leaf", id: "m1", lessonFile: "mental_l01" },
    { displayLevel: 2, icon: "sparkles", id: "m2", lessonFile: "mental_l03" },
  ],
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

// CourseScreen の初回レンダーは CI の遅いランナーで 5 秒を超えることがあり、
// 最初のテストだけが既定タイムアウトで落ちていた（2026-09-05、main で 3/5 回）。
// beforeEach と同じ 20 秒をこのファイル全体に与える。
jest.setTimeout(20000);

describe("CourseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompletedLessons = new Set();
    mockIsStateHydrated = true;
    mockSelectedGenre = "mental";
    mockStreakRepairOffer = null;
    mockMasteryThemeState = null;
    mockAvailableMasteryVariantIds = [];
    mockLessonSupportCandidate = null;
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

  test("waits for progression hydration before applying or tracking course state", async () => {
    mockIsStateHydrated = false;
    mockLoadPrimaryOnboardingGenre.mockResolvedValue("work");

    render(React.createElement(CourseScreen));

    await waitFor(() => {
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
    expect(mockLoadPrimaryOnboardingGenre).not.toHaveBeenCalled();
    expect(mockSetSelectedGenre).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalled();
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

    fireEvent.press(screen.getByTestId("course-ring-open"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");

    await waitFor(() => {
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
  });

  test("after lesson one the normal CTA opens the new five-card lesson", () => {
    mockCompletedLessons = new Set(["mental_l01"]);
    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-ring-open"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l03&genre=mental");
    expect(mockIsLessonLocked).toHaveBeenCalledWith("mental", 2, false);
  });

  test("selects the completed first ring node and replays lesson one", async () => {
    mockCompletedLessons = new Set(["mental_l01"]);
    const screen = render(React.createElement(CourseScreen));

    expect(screen.getByTestId("course-world-presentation").props.children).toBe("ring_theme");
    expect(screen.getByTestId("course-selected-node").props.children).toBe("m2");

    fireEvent.press(screen.getByTestId("course-select-l1"));

    await waitFor(() => {
      expect(screen.getByTestId("course-selected-node").props.children).toBe("m1");
    });
    fireEvent.press(screen.getByTestId("course-ring-open"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l01&genre=mental");
    expect(mockTrack).toHaveBeenCalledWith(
      "engagement_primary_action_started",
      expect.objectContaining({
        source: "course_world_ring",
        lessonId: "mental_l01",
        priorityReason: "completed_node_replay",
      })
    );
  });

  test("switches back to the second ring node and opens the new lesson two", async () => {
    mockCompletedLessons = new Set(["mental_l01"]);
    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-select-l1"));
    fireEvent.press(screen.getByTestId("course-select-l2"));

    await waitFor(() => {
      expect(screen.getByTestId("course-selected-node").props.children).toBe("m2");
    });
    fireEvent.press(screen.getByTestId("course-ring-open"));

    expect(mockReplace).toHaveBeenCalledWith("/lesson?file=mental_l03&genre=mental");
  });

  test("does not surface support for a legacy lesson outside the active manifest", () => {
    mockLessonSupportCandidate = {
      lessonId: "mental_l02",
      kind: "refresh",
      questionIds: ["legacy_q1"],
      reason: "evidence_update",
    };

    const screen = render(React.createElement(CourseScreen));

    expect(screen.queryByTestId("course-world-support")).toBeNull();
    expect(mockTrack).not.toHaveBeenCalledWith(
      "course_support_shown",
      expect.objectContaining({ lessonId: "mental_l02" })
    );
  });

  test("does not show admitted support while the course uses ring-and-theme presentation", async () => {
    mockLessonSupportCandidate = {
      lessonId: "mental_l03",
      kind: "replay",
      questionIds: ["new_q1"],
      reason: "completion_drift",
    };

    const screen = render(React.createElement(CourseScreen));

    expect(screen.queryByTestId("course-world-support")).toBeNull();
    await waitFor(() => {
      expect(mockTrack).not.toHaveBeenCalledWith(
        "course_support_shown",
        expect.objectContaining({ lessonId: "mental_l03", kind: "replay" })
      );
    });
  });

  test("rendering and lesson navigation do not emit console.log noise", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const screen = render(React.createElement(CourseScreen));

      fireEvent.press(screen.getByTestId("course-ring-open"));

      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  test("locked next-step opens the paywall instead of navigating", () => {
    mockIsLessonLocked.mockImplementation((genreId: string, level: number) => genreId === "mental" && level === 1);

    const screen = render(React.createElement(CourseScreen));

    fireEvent.press(screen.getByTestId("course-ring-open"));

    expect(screen.getByText("paywall-visible")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not surface streak repair in ring-and-theme presentation", () => {
    mockStreakRepairOffer = {
      active: true,
      costGems: 50,
      expiresAtMs: Date.now() + 60 * 60 * 1000,
      previousStreak: 14,
    };
    mockPurchaseStreakRepair.mockReturnValue({ success: true });

    const screen = render(React.createElement(CourseScreen));

    expect(screen.queryByTestId("course-world-support")).toBeNull();
    expect(mockPurchaseStreakRepair).not.toHaveBeenCalled();
  });

  test("does not surface comeback reward in ring-and-theme presentation", () => {
    mockComebackRewardOffer = {
      active: true,
      daysSinceStudy: 8,
      expiresAtMs: Date.now() + 60 * 60 * 1000,
      rewardEnergy: 2,
      rewardGems: 10,
    };

    const screen = render(React.createElement(CourseScreen));

    expect(screen.queryByTestId("course-world-support")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not surface legacy mastery outside the active manifest", async () => {
    mockCompletedLessons = new Set([
      "mental_l01",
      "mental_l03",
    ]);
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
      expect(mockGetLastWeekResult).toHaveBeenCalledWith("user_1");
    });
    expect(screen.queryByTestId("course-world-support")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalledWith("/lesson?file=mental_m01&genre=mental");
  });
});
