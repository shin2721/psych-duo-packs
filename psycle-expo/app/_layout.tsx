import { Stack, useRouter, useSegments } from "expo-router";
import {
  AppStateProvider,
  useBillingState,
  useEconomyState,
  useProgressionState,
} from "../lib/state";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { OnboardingProvider, useOnboarding } from "../lib/OnboardingContext";
import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Analytics } from "../lib/analytics";
import { LocaleProvider, useLocale } from "../lib/LocaleContext";
import { registerNotificationResponseHandler, syncDailyReminders } from "../lib/notifications";
import { BADGES } from "../lib/badges";
import i18n from "../lib/i18n";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { ToastProvider, useToast } from "../components/ToastProvider";
import { sounds } from "../lib/sounds";
import { hapticFeedback } from "../lib/haptics";
import { getBlockedDebugRouteRedirect, isDebugRoute } from "../lib/navigation/debugRouteGuard";

const APP_STARTUP_STARTED_AT_MS = Date.now();

// Suppress network errors during development
LogBox.ignoreLogs([
  "TypeError: Network request failed",
  "AuthRetryableFetchError",
  "Network request failed",
]);

export function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { locale, isReady: localeReady } = useLocale();
  const segments = useSegments();
  const router = useRouter();
  const startupPerformanceTrackedRef = useRef(false);

  const isLoading = authLoading || onboardingLoading || !localeReady;

  useEffect(() => {
    if (isLoading || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboardingGroup = segments[0] === "onboarding";
    const pathname = typeof window !== "undefined" ? window.location?.pathname : undefined;
    const inDebugGroup = isDebugRoute(segments, pathname);
    const canAccessDebugRoutes = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";
    const blockedDebugRedirect = getBlockedDebugRouteRedirect({
      canAccessDebugRoutes,
      hasSeenOnboarding,
      hasSession: Boolean(session),
      inDebugGroup,
    });

    if (blockedDebugRedirect) {
      router.replace(blockedDebugRedirect);
      return;
    }

    // Skip auth/onboarding for debug routes only in dev or explicit E2E builds.
    if (canAccessDebugRoutes && inDebugGroup) return;

    // Priority 1: If user hasn't seen onboarding, show it
    if (!hasSeenOnboarding && !inOnboardingGroup) {
      router.replace("/onboarding");
    }
    // Priority 2: If no session and not in auth, redirect to auth
    else if (!session && !inAuthGroup && !inDebugGroup && hasSeenOnboarding) {
      router.replace("/auth");
    }
    // Priority 3: If session exists and in auth group, go to main app
    else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [session, isLoading, segments, hasSeenOnboarding, router]);

  useEffect(() => {
    Analytics.setUserId(session?.user?.id ?? null);
  }, [session?.user?.id]);

  useEffect(() => {
    if (isLoading || hasSeenOnboarding === null || startupPerformanceTrackedRef.current) {
      return;
    }

    startupPerformanceTrackedRef.current = true;
    Analytics.track("app_startup_performance", {
      durationMs: Math.max(0, Date.now() - APP_STARTUP_STARTED_AT_MS),
      source: "root_layout_ready",
    });
  }, [isLoading, hasSeenOnboarding]);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={String(i18n.t("common.loading"))}
      >
        <ActivityIndicator size="large" accessibilityLabel={String(i18n.t("common.loading"))} />
      </View>
    );
  }

  return (
    <AppStateProvider>
      <ToastProvider>
        <ReminderBootstrap />
        <GamificationToastBridge />
        <Stack key={`locale-${locale}`} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </ToastProvider>
    </AppStateProvider>
  );
}

function ReminderBootstrap() {
  const { session } = useAuth();
  const {
    hasPendingDailyQuests,
    streakRepairOffer,
    isStateHydrated: isProgressionHydrated,
  } = useProgressionState();
  const {
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    isHydrated: isEconomyHydrated,
  } = useEconomyState();
  const {
    isSubscriptionActive,
    isHydrated: isBillingHydrated,
  } = useBillingState();
  const router = useRouter();
  const isStateHydrated = isProgressionHydrated && isEconomyHydrated && isBillingHydrated;

  useEffect(() => {
    const unsubscribe = registerNotificationResponseHandler((path) => {
      router.push(path);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !isStateHydrated) return;

    syncDailyReminders({
      userId,
      hasPendingDailyQuests,
      streakRepairOffer,
      energy,
      maxEnergy,
      lastEnergyUpdateTime,
      energyRefillMinutes,
      isSubscriptionActive,
    }).catch((error) => {
      console.error("[Notifications] Failed to sync reminders:", error);
    });
  }, [
    session?.user?.id,
    isStateHydrated,
    hasPendingDailyQuests,
    streakRepairOffer,
    energy,
    maxEnergy,
    lastEnergyUpdateTime,
    energyRefillMinutes,
    isSubscriptionActive,
  ]);

  return null;
}

function GamificationToastBridge() {
  const { showToast } = useToast();
  const {
    badgeToastQueue,
    consumeNextBadgeToast,
    streakMilestoneToastQueue,
    consumeNextStreakMilestoneToast,
    comebackRewardToastQueue,
    consumeNextComebackRewardToast,
  } = useProgressionState();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) return;

    if (badgeToastQueue.length > 0) {
      const badgeId = consumeNextBadgeToast();
      if (!badgeId) return;

      void sounds.play("levelUp");
      void hapticFeedback.success();

      const badgeName = BADGES.find((badge) => badge.id === badgeId)?.name || badgeId;
      setMessage(String(i18n.t("common.badgeUnlocked", { badgeName })));
      return;
    }

    if (streakMilestoneToastQueue.length > 0) {
      const toastItem = consumeNextStreakMilestoneToast();
      if (!toastItem) return;

      void sounds.play("levelUp");
      void hapticFeedback.success();

      setMessage(
        String(
          i18n.t("common.streakMilestoneRewarded", {
            day: toastItem.day,
            gems: toastItem.gems,
          })
        )
      );
      return;
    }

    if (comebackRewardToastQueue.length > 0) {
      const toastItem = consumeNextComebackRewardToast();
      if (!toastItem) return;

      void sounds.play("levelUp");
      void hapticFeedback.success();

      setMessage(
        String(
          i18n.t("common.comebackRewardClaimed", {
            energy: toastItem.rewardEnergy,
            gems: toastItem.rewardGems,
          })
        )
      );
    }
  }, [
    badgeToastQueue,
    streakMilestoneToastQueue,
    comebackRewardToastQueue,
    message,
    consumeNextBadgeToast,
    consumeNextStreakMilestoneToast,
    consumeNextComebackRewardToast,
  ]);

  useEffect(() => {
    if (!message) return;
    showToast(message, "success");
    const timer = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [message, showToast]);

  return null;
}

export default function RootLayout() {
  // Analytics初期化（アプリ起動時に1回のみ）
  useEffect(() => {
    // 先に撃つ（lazy-initがキューするので初期化タイミングに依存しない）
    Analytics.trackSessionStart();
    Analytics.trackAppOpen(); // Promiseだけど待たなくてOK（内部でガードあり）

    void Analytics.initialize()
      .then(() => {
        // app_readyは「初期化成功の証拠」なので成功時のみ
        Analytics.trackAppReady();
      })
      .catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <AuthProvider>
          <OnboardingProvider>
            <LocaleProvider>
              <RootLayoutNav />
            </LocaleProvider>
          </OnboardingProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
