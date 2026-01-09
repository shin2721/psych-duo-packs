import { Stack, useRouter, useSegments } from "expo-router";
import { AppStateProvider } from "../lib/state";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { OnboardingProvider, useOnboarding } from "../lib/OnboardingContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

function RootLayoutNav() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
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

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppStateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </AppStateProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootLayoutNav />
      </OnboardingProvider>
    </AuthProvider>
  );
}
