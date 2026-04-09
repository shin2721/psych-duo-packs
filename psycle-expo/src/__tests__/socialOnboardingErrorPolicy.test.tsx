import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/devLog", () => ({
  warnDev: jest.fn(),
}));

import { Analytics } from "../../lib/analytics";
import { warnDev } from "../../lib/devLog";
import { OnboardingProvider, useOnboarding } from "../../lib/OnboardingContext";

function Probe() {
  const { hasSeenOnboarding, isLoading, completeOnboarding } = useOnboarding();

  return (
    <>
      <Text testID="status">{String(hasSeenOnboarding)}</Text>
      <Text testID="loading">{String(isLoading)}</Text>
      <Pressable testID="complete" onPress={() => void completeOnboarding()}>
        <Text>complete</Text>
      </Pressable>
    </>
  );
}

describe("social/onboarding error policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("source routes recoverable social and onboarding failures through warnDev", () => {
    const friendChallenges = require("node:fs").readFileSync(
      "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/friendChallenges.ts",
      "utf8"
    );
    const social = require("node:fs").readFileSync(
      "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/social.ts",
      "utf8"
    );
    const onboarding = require("node:fs").readFileSync(
      "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/lib/OnboardingContext.tsx",
      "utf8"
    );

    expect(friendChallenges).toContain('warnDev("[FriendChallenge] Failed to fetch claim state:", error);');
    expect(friendChallenges).toContain('warnDev("[FriendChallenge] Failed to fetch friendships:", friendshipError);');
    expect(friendChallenges).toContain('warnDev("[FriendChallenge] Failed to fetch league member data:", memberError);');
    expect(friendChallenges).toContain('warnDev("[FriendChallenge] Failed to build weekly challenge:", error);');
    expect(friendChallenges).not.toContain("console.warn(");

    expect(social).toContain("warnDev('Error fetching leaderboard profiles:', error);");
    expect(social).not.toContain("console.error('Error fetching leaderboard profiles:");

    expect(onboarding).toContain('warnDev("Failed to check onboarding status:", error);');
    expect(onboarding).toContain('warnDev("Failed to complete onboarding:", error);');
    expect(onboarding).not.toContain('console.error("Failed to check onboarding status:');
    expect(onboarding).not.toContain('console.error("Failed to complete onboarding:');
  });

  test("onboarding read failure falls back to false and clears loading", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("read failed"));

    const screen = render(
      <OnboardingProvider>
        <Probe />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").props.children).toBe("false");
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });

    expect(warnDev).toHaveBeenCalledWith("Failed to check onboarding status:", expect.any(Error));
  });

  test("onboarding write failure does not throw and skips analytics", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValueOnce("false");
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("write failed"));

    const screen = render(
      <OnboardingProvider>
        <Probe />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });

    fireEvent.press(screen.getByTestId("complete"));

    await waitFor(() => {
      expect(warnDev).toHaveBeenCalledWith("Failed to complete onboarding:", expect.any(Error));
    });

    expect(Analytics.track).not.toHaveBeenCalledWith("onboarding_complete");
  });
});
