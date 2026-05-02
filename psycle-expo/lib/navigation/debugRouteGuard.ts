type DebugRouteRedirectArgs = {
  canAccessDebugRoutes: boolean;
  hasSeenOnboarding: boolean | null;
  hasSession: boolean;
  inDebugGroup: boolean;
};

export function isDebugRoute(
  segments: readonly string[],
  pathname?: string
): boolean {
  return segments[0] === "debug" || pathname?.startsWith("/debug") === true;
}

export function getBlockedDebugRouteRedirect({
  canAccessDebugRoutes,
  hasSeenOnboarding,
  hasSession,
  inDebugGroup,
}: DebugRouteRedirectArgs): "/" | "/auth" | "/onboarding" | null {
  if (!inDebugGroup || canAccessDebugRoutes) return null;
  if (!hasSeenOnboarding) return "/onboarding";
  return hasSession ? "/" : "/auth";
}
