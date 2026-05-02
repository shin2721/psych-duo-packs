import {
  getBlockedDebugRouteRedirect,
  isDebugRoute,
} from "../../lib/navigation/debugRouteGuard";

describe("debug route guard", () => {
  test("identifies expo-router and web debug paths", () => {
    expect(isDebugRoute(["debug"])).toBe(true);
    expect(isDebugRoute(["(tabs)"], "/debug/analytics")).toBe(true);
    expect(isDebugRoute(["(tabs)"], "/settings")).toBe(false);
  });

  test("blocks production debug deep links before auth bypass", () => {
    expect(
      getBlockedDebugRouteRedirect({
        canAccessDebugRoutes: false,
        hasSeenOnboarding: true,
        hasSession: false,
        inDebugGroup: true,
      })
    ).toBe("/auth");
    expect(
      getBlockedDebugRouteRedirect({
        canAccessDebugRoutes: false,
        hasSeenOnboarding: true,
        hasSession: true,
        inDebugGroup: true,
      })
    ).toBe("/");
    expect(
      getBlockedDebugRouteRedirect({
        canAccessDebugRoutes: false,
        hasSeenOnboarding: false,
        hasSession: false,
        inDebugGroup: true,
      })
    ).toBe("/onboarding");
  });

  test("allows debug routes only for dev or explicit E2E builds", () => {
    expect(
      getBlockedDebugRouteRedirect({
        canAccessDebugRoutes: true,
        hasSeenOnboarding: true,
        hasSession: false,
        inDebugGroup: true,
      })
    ).toBeNull();
    expect(
      getBlockedDebugRouteRedirect({
        canAccessDebugRoutes: false,
        hasSeenOnboarding: true,
        hasSession: false,
        inDebugGroup: false,
      })
    ).toBeNull();
  });
});
