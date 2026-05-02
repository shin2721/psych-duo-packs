jest.mock("expo/env", () => ({}), { virtual: true });
jest.mock("expo/virtual/env", () => ({}), { virtual: true });

import React from "react";
import { render } from "@testing-library/react-native";
import { RootLayoutNav } from "../../app/_layout";
import { QuestionImage } from "../../components/QuestionMedia";

jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    { Screen: () => null }
  ),
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSegments: () => ["(tabs)"],
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../lib/state", () => ({
  AppStateProvider: ({ children }: { children: React.ReactNode }) => children,
  useBillingState: () => ({
    isSubscriptionActive: false,
    isHydrated: true,
  }),
  useEconomyState: () => ({
    energy: 5,
    maxEnergy: 5,
    lastEnergyUpdateTime: null,
    energyRefillMinutes: 30,
    isHydrated: true,
  }),
  useProgressionState: () => ({
    badgeToastQueue: [],
    comebackRewardToastQueue: [],
    streakMilestoneToastQueue: [],
    consumeNextBadgeToast: jest.fn(),
    consumeNextComebackRewardToast: jest.fn(),
    consumeNextStreakMilestoneToast: jest.fn(),
    hasPendingDailyQuests: false,
    isStateHydrated: true,
    streakRepairOffer: null,
  }),
}));

jest.mock("../../lib/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    session: { user: { id: "user-1" } },
    isLoading: false,
  }),
}));

jest.mock("../../lib/OnboardingContext", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => children,
  useOnboarding: () => ({
    hasSeenOnboarding: true,
    isLoading: false,
  }),
}));

jest.mock("../../lib/LocaleContext", () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocale: () => ({
    locale: "en",
    isReady: true,
  }),
}));

jest.mock("../../components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock("../../components/AppErrorBoundary", () => ({
  AppErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../lib/notifications", () => ({
  registerNotificationResponseHandler: jest.fn(() => jest.fn()),
  syncDailyReminders: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    setUserId: jest.fn(),
    trackAppOpen: jest.fn(),
    trackAppReady: jest.fn(),
    trackSessionStart: jest.fn(),
    track: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../lib/badges", () => ({
  BADGES: [],
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

jest.mock("../../lib/sounds", () => ({
  sounds: {
    play: jest.fn(),
  },
}));

jest.mock("../../lib/haptics", () => ({
  hapticFeedback: {
    success: jest.fn(),
  },
}));

describe("root/media logging", () => {
  test("RootLayoutNav mount does not emit nav debug logs", () => {
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    render(<RootLayoutNav />);

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  test("QuestionImage render does not emit URI debug logs", () => {
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    render(<QuestionImage uri="https://example.com/test.png" caption="caption" />);

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});
