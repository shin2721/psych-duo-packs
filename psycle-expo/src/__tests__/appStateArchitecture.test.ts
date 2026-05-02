import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ReviewScreen from "../../app/review";
import { BillingStateProvider } from "../../lib/app-state/billing";
import { getUserStorageKey } from "../../lib/app-state/persistence";
import { getPlanChangeSnapshotKey } from "../../lib/planChangeTracking";
import {
  AppStateProvider,
  useAppState,
  useBillingState,
  useEconomyState,
  usePracticeState,
  useProgressionState,
} from "../../lib/state";

let mockUser: { id: string; email?: string } | null = null;
let mockProfilePlanId = "free";
let mockProfileActiveUntil: string | null = null;
let mockProfileXp = 0;
let mockProfileStreak = 0;

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../../lib/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: jest.fn(),
  }),
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../lib/league", () => ({
  addWeeklyXp: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

jest.mock("../../lib/lessons", () => ({
  getQuestionFromId: jest.fn(() => ({
    id: "q1",
    source_id: "q1",
    type: "multiple_choice",
  })),
}));

jest.mock("../../components/QuestionRenderer", () => ({
  QuestionRenderer: ({ onContinue }: { onContinue: (isCorrect: boolean, xp: number) => void }) => {
    const ReactLocal = require("react");
    const { Pressable: PressableLocal, Text: TextLocal } = require("react-native");
    return ReactLocal.createElement(
      PressableLocal,
      { testID: "mock-question-continue", onPress: () => onContinue(true, 5) },
      ReactLocal.createElement(TextLocal, null, "Continue")
    );
  },
}));

jest.mock("../../components/XPGainAnimation", () => ({
  XPGainAnimation: () => null,
}));

const { Analytics } = require("../../lib/analytics");

function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

async function renderWithHydratedEffects(element: React.ReactElement) {
  const screen = render(element);
  await act(async () => {
    await flushMicrotasks();
    await flushMicrotasks();
  });
  return screen;
}

type QueryState = {
  table: string;
  selected?: { columns: unknown; options?: unknown };
  updatePayload?: unknown;
};

function buildSupabaseQuery(table: string) {
  const state: QueryState = { table };
  const query: any = {
    select: jest.fn((columns: unknown, options?: unknown) => {
      state.selected = { columns, options };
      return query;
    }),
    update: jest.fn((payload: unknown) => {
      state.updatePayload = payload;
      return query;
    }),
    insert: jest.fn(async () => ({ data: null, error: null })),
    upsert: jest.fn(async () => ({ data: null, error: null })),
    eq: jest.fn(() => query),
    or: jest.fn((..._args: unknown[]) => Promise.resolve({ count: 0, data: null, error: null })),
    gt: jest.fn((..._args: unknown[]) => Promise.resolve({ count: 0, data: null, error: null })),
    gte: jest.fn((..._args: unknown[]) => Promise.resolve({ data: [], error: null })),
    single: jest.fn(async () => {
      if (table === "profiles" && state.selected?.columns === "plan_id, active_until") {
        return {
          data: { plan_id: mockProfilePlanId, active_until: mockProfileActiveUntil },
          error: null,
        };
      }

      if (table === "profiles" && state.selected?.columns === "xp, streak") {
        return {
          data: { xp: mockProfileXp, streak: mockProfileStreak },
          error: null,
        };
      }

      return { data: null, error: null };
    }),
    then: (resolve: (value: any) => any) => {
      if (table === "user_badges") {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      }
      if (table === "friendships") {
        return Promise.resolve({ count: 0, data: null, error: null }).then(resolve);
      }
      if (table === "profiles" && state.selected?.options && typeof state.selected.options === "object") {
        return Promise.resolve({ count: 0, data: null, error: null }).then(resolve);
      }
      if (state.updatePayload) {
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
      if (table === "streak_history") {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    },
    finally: (callback: () => void) => Promise.resolve().finally(callback),
  };

  return query;
}

const mockSupabaseFrom = jest.fn((table: string) => buildSupabaseQuery(table));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: (...args: [string]) => mockSupabaseFrom(...args),
  },
}));

function AppStateProbe() {
  const state = useAppState();
  return React.createElement(
    Text,
    { testID: "app-state-probe" },
    JSON.stringify({
      hasPlanId: typeof state.planId === "string",
      hasAddXp: typeof state.addXp === "function",
      hasGems: typeof state.gems === "number",
      hasReviewEvents: Array.isArray(state.reviewEvents),
      isHydrated: state.isStateHydrated,
    })
  );
}

function DomainHookProbe() {
  const progression = useProgressionState();
  const economy = useEconomyState();
  const billing = useBillingState();
  const practice = usePracticeState();

  return React.createElement(
    Text,
    { testID: "domain-hook-probe" },
    JSON.stringify({
      progression: typeof progression.addXp === "function",
      economy: typeof economy.addGems === "function",
      billing: typeof billing.setPlanId === "function",
      practice: typeof practice.addReviewEvent === "function",
    })
  );
}

function BillingProbe() {
  const { planId, activeUntil, isSubscriptionActive } = useBillingState();
  return React.createElement(
    Text,
    { testID: "billing-probe" },
    JSON.stringify({ planId, activeUntil, isSubscriptionActive })
  );
}

function OutsideBillingHook() {
  useBillingState();
  return null;
}

function OutsideEconomyHook() {
  useEconomyState();
  return null;
}

function OutsideProgressionHook() {
  useProgressionState();
  return null;
}

function OutsidePracticeHook() {
  usePracticeState();
  return null;
}

describe("app state architecture", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUser = null;
    mockProfilePlanId = "free";
    mockProfileActiveUntil = null;
    mockProfileXp = 0;
    mockProfileStreak = 0;
    mockSupabaseFrom.mockClear();
    await AsyncStorage.clear();
  });

  test("compatibility facade still exposes existing app state fields", async () => {
    mockUser = {
      id: "user_1",
      email: "user@example.com",
    };

    const screen = await renderWithHydratedEffects(
      React.createElement(AppStateProvider, null, React.createElement(AppStateProbe))
    );

    await waitFor(() => {
      const parsed = JSON.parse(screen.getByTestId("app-state-probe").props.children);
      expect(parsed.hasPlanId).toBe(true);
      expect(parsed.hasAddXp).toBe(true);
      expect(parsed.hasGems).toBe(true);
      expect(parsed.hasReviewEvents).toBe(true);
      expect(parsed.isHydrated).toBe(true);
    });
  });

  test("domain hooks throw outside their providers", () => {
    expect(() => render(React.createElement(OutsideBillingHook))).toThrow("useBillingState must be used within BillingStateProvider");
    expect(() => render(React.createElement(OutsideEconomyHook))).toThrow("useEconomyState must be used within EconomyStateProvider");
    expect(() => render(React.createElement(OutsideProgressionHook))).toThrow(
      "useProgressionState must be used within ProgressionStateProvider"
    );
    expect(() => render(React.createElement(OutsidePracticeHook))).toThrow("usePracticeState must be used within PracticeStateProvider");
  });

  test("domain hooks return usable shapes inside AppStateProvider", async () => {
    mockUser = {
      id: "user_1",
      email: "user@example.com",
    };

    const screen = await renderWithHydratedEffects(
      React.createElement(AppStateProvider, null, React.createElement(DomainHookProbe))
    );

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("domain-hook-probe").props.children)).toEqual({
        progression: true,
        economy: true,
        billing: true,
        practice: true,
      });
    });
  });

  test("persistence key format stays stable and billing sync updates plan snapshot fields", async () => {
    expect(getUserStorageKey("xp", "user_1")).toBe("xp_user_1");
    expect(getUserStorageKey("questCycleKeys", "user_1")).toBe("quest_cycle_keys_user_1");
    expect(getUserStorageKey("reviewEvents", "user_1")).toBe("review_events_user_1");

    mockUser = {
      id: "user_1",
      email: "user@example.com",
    };
    mockProfilePlanId = "pro";
    mockProfileActiveUntil = "2099-01-01T00:00:00.000Z";

    const screen = await renderWithHydratedEffects(
      React.createElement(BillingStateProvider, null, React.createElement(BillingProbe))
    );

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("billing-probe").props.children)).toEqual({
        planId: "pro",
        activeUntil: "2099-01-01T00:00:00.000Z",
        isSubscriptionActive: true,
      });
    });

    await expect(
      AsyncStorage.getItem(getPlanChangeSnapshotKey("user_1"))
    ).resolves.toBe(
      JSON.stringify({
        planId: "pro",
        activeUntil: "2099-01-01T00:00:00.000Z",
      })
    );
  });

  test("billing provider tolerates malformed stored snapshots and only tracks plan changes when needed", async () => {
    mockUser = {
      id: "user_1",
      email: "user@example.com",
    };
    mockProfilePlanId = "free";
    mockProfileActiveUntil = null;

    await AsyncStorage.setItem(getPlanChangeSnapshotKey("user_1"), "{bad-json");

    const screen = await renderWithHydratedEffects(
      React.createElement(BillingStateProvider, null, React.createElement(BillingProbe))
    );

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("billing-probe").props.children)).toEqual({
        planId: "free",
        activeUntil: null,
        isSubscriptionActive: false,
      });
    });

    expect(Analytics.track).not.toHaveBeenCalledWith(
      "plan_changed",
      expect.objectContaining({ source: "profile_sync" })
    );
  });

  test("review screen still renders and completes a simple session under AppStateProvider", async () => {
    jest.useFakeTimers();
    mockUser = {
      id: "user_1",
      email: "user@example.com",
    };

    await AsyncStorage.setItem(
      getUserStorageKey("mistakes", "user_1"),
      JSON.stringify([
        {
          id: "q1",
          lessonId: "lesson_1",
          timestamp: Date.now(),
          questionType: "multiple_choice",
          box: 1,
          nextReviewDate: Date.now() - 1000,
          interval: 0,
        },
      ])
    );
    await AsyncStorage.setItem(getUserStorageKey("reviewEvents", "user_1"), JSON.stringify([]));

    const screen = await renderWithHydratedEffects(
      React.createElement(AppStateProvider, null, React.createElement(ReviewScreen))
    );

    await waitFor(() => {
      expect(screen.getByText("review.startButton")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("review.startButton"));
    fireEvent.press(await screen.findByTestId("mock-question-continue"));

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("mock-question-continue")).toBeNull();
      expect(
        screen.queryByText("review.doneTitle") ?? screen.queryByText("review.emptyTitle")
      ).toBeTruthy();
    });
  });
});
