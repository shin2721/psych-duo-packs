import { Stack } from "expo-router";
import { AppStateProvider } from "../lib/state";

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppStateProvider>
  );
}
