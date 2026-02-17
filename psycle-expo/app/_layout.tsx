import { Stack, useRouter, useSegments } from "expo-router";
import { AppStateProvider } from "../lib/state";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { OnboardingProvider, useOnboarding } from "../lib/OnboardingContext";
import { useEffect } from "react";
import { View, ActivityIndicator, LogBox, Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Analytics } from "../lib/analytics";
import { LocaleProvider, useLocale } from "../lib/LocaleContext";

// Suppress network errors during development
LogBox.ignoreLogs([
  "TypeError: Network request failed",
  "AuthRetryableFetchError",
  "Network request failed",
]);

function resolveDeepLinkRoute(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "psycle:") return null;

    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/^\/+/, "").toLowerCase();
    const target = path || host;

    switch (target) {
      case "quests":
        return "/(tabs)/quests";
      case "course":
        return "/(tabs)/course";
      case "leaderboard":
        return "/(tabs)/leaderboard";
      case "friends":
        return "/(tabs)/friends";
      case "shop":
        return "/(tabs)/shop";
      case "profile":
        return "/(tabs)/profile";
      default:
        return null;
    }
  } catch {
    return null;
  }
}

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
    if (isLoading || hasSeenOnboarding === null) return;

    const applyDeepLink = (url: string | null | undefined) => {
      if (!url) return;
      const route = resolveDeepLinkRoute(url);
      if (!route) return;

      // Preserve existing auth/onboarding guards.
      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
        return;
      }
      if (!session) {
        router.replace("/auth");
        return;
      }
      router.replace(route);
    };

    let active = true;
    Linking.getInitialURL()
      .then((url) => {
        if (!active) return;
        applyDeepLink(url);
      })
      .catch(() => { });

    const sub = Linking.addEventListener("url", ({ url }) => applyDeepLink(url));
    return () => {
      active = false;
      sub.remove();
    };
  }, [isLoading, hasSeenOnboarding, session, router]);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppStateProvider>
      <Stack key={`locale-${locale}`} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </AppStateProvider>
  );
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
