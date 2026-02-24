import { Stack, useRouter, useSegments } from "expo-router";
import { AppStateProvider, useAppState } from "../lib/state";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { OnboardingProvider, useOnboarding } from "../lib/OnboardingContext";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Analytics } from "../lib/analytics";
import { LocaleProvider, useLocale } from "../lib/LocaleContext";
import { registerNotificationResponseHandler, syncDailyReminders } from "../lib/notifications";
import { BADGES } from "../lib/badges";
import i18n from "../lib/i18n";
import { InlineToast } from "../components/InlineToast";

// Suppress network errors during development
LogBox.ignoreLogs([
  "TypeError: Network request failed",
  "AuthRetryableFetchError",
  "Network request failed",
]);

function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { locale, isReady: localeReady } = useLocale();
  const segments = useSegments();
  const router = useRouter();

  const isLoading = authLoading || onboardingLoading || !localeReady;

  useEffect(() => {
    if (__DEV__) console.log("[RootLayoutNav] Effect triggered", { isLoading, hasSeenOnboarding, session: !!session, segment: segments[0] });
    if (isLoading || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboardingGroup = segments[0] === "onboarding";

    // Priority 1: If user hasn't seen onboarding, show it
    if (!hasSeenOnboarding && !inOnboardingGroup) {
      router.replace("/onboarding");
    }
    // Priority 2: If no session and not in auth, redirect to auth
    else if (!session && !inAuthGroup && hasSeenOnboarding) {
      router.replace("/auth");
    }
    // Priority 3: If session exists and in auth group, go to main app
    else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [session, isLoading, segments, hasSeenOnboarding]);

  useEffect(() => {
    Analytics.setUserId(session?.user?.id ?? null);
  }, [session?.user?.id]);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppStateProvider>
      <ReminderBootstrap />
      <BadgeToastBridge />
      <Stack key={`locale-${locale}`} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </AppStateProvider>
  );
}

function ReminderBootstrap() {
  const { session } = useAuth();
  const { isStateHydrated, hasPendingDailyQuests } = useAppState();
  const router = useRouter();

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
    }).catch((error) => {
      console.error("[Notifications] Failed to sync reminders:", error);
    });
  }, [session?.user?.id, isStateHydrated, hasPendingDailyQuests]);

  return null;
}

function BadgeToastBridge() {
  const { badgeToastQueue, consumeNextBadgeToast } = useAppState();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message || badgeToastQueue.length === 0) return;

    const badgeId = consumeNextBadgeToast();
    if (!badgeId) return;

    const badgeName = BADGES.find((badge) => badge.id === badgeId)?.name || badgeId;
    setMessage(String(i18n.t("common.badgeUnlocked", { badgeName })));
  }, [badgeToastQueue, message, consumeNextBadgeToast]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return <InlineToast message={message} />;
}

export default function RootLayout() {
  // Analytics初期化（アプリ起動時に1回のみ）
  useEffect(() => {
    // 先に撃つ（lazy-initがキューするので初期化タイミングに依存しない）
    Analytics.trackSessionStart();
    Analytics.trackAppOpen(); // Promiseだけど待たなくてOK（内部でガードあり）

    (async () => {
      try {
        await Analytics.initialize();
        // app_readyは「初期化成功の証拠」なので成功時のみ
        Analytics.trackAppReady();
      } catch (error) {
        console.error('[Analytics] Initialization failed:', error);
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OnboardingProvider>
          <LocaleProvider>
            <RootLayoutNav />
          </LocaleProvider>
        </OnboardingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
