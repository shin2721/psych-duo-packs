import { existsSync, readFileSync } from "fs";
import gamification from "../../config/gamification.json";

function read(path: string): string {
  return readFileSync(`${process.cwd()}/${path}`, "utf8");
}

describe("launch readiness contracts", () => {
  test("first activation, accessibility, and recoverable fallbacks stay wired", () => {
    const onboardingInterests = read("app/onboarding/interests.tsx");
    const courseScreen = read("app/(tabs)/course.tsx");
    const courseNodeColumn = read("components/course-world/CourseWorldNodeColumn.tsx");
    const lessonCompletionView = read("components/lesson/LessonCompletionView.tsx");
    const appLayout = read("app/_layout.tsx");
    const analyticsCore = read("lib/analyticsCore.ts");
    const analyticsDebug = read("lib/analyticsDebugCore.ts");
    const errorBoundary = read("components/AppErrorBoundary.tsx");
    const difficultyPacing = read("lib/lesson/difficultyPacing.ts");
    const lessonBundle = read("lib/lesson/loadLessonBundle.ts");
    const lessonFlow = read("lib/lesson/useLessonFlow.ts");
    const lessonScreen = read("app/lesson.tsx");
    const perspectiveAudit = read("scripts/audit-lesson-perspectives.mjs");
    const packageJson = JSON.parse(read("package.json"));

    expect(onboardingInterests).toContain("setSelectedGenre(primaryGenreId)");
    expect(courseScreen).toContain("loadPrimaryOnboardingGenre");
    expect(courseScreen).toContain("onboarding_primary_genre_applied");
    expect(onboardingInterests).toContain('accessibilityRole="button"');
    expect(onboardingInterests).toContain("accessibilityState");
    expect(courseNodeColumn).toContain("supportAccessibilityLabel");
    expect(courseNodeColumn).toContain("momentumAccessibilityLabel");
    expect(lessonCompletionView).toContain('testID="lesson-complete-recap"');
    expect(lessonCompletionView).toContain("completionRecap.nextPromise");
    expect(lessonCompletionView).toContain("accessibilityLabel={String(item.label)}");
    expect(appLayout).toContain('accessibilityRole="progressbar"');
    expect(errorBoundary).toContain('testID="app-error-boundary-retry"');
    expect(appLayout).toContain("void Analytics.initialize()");
    expect(appLayout).toContain("app_startup_performance");
    expect(analyticsDebug).toContain("app_startup_performance");
    expect(analyticsDebug).toContain("lesson_load_performance");
    expect(analyticsDebug).toContain("PERFORMANCE_BUDGETS");
    expect(analyticsDebug).toContain("evaluatePerformanceDebugHealth");
    expect(analyticsCore).toContain("E2E_ANALYTICS_DEBUG_BUILD");
    expect(analyticsCore).toContain("PostHog send skipped for E2E analytics debug build");
    expect(packageJson.detox.apps["ios.release"].build).toContain(
      "EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1"
    );
    expect(lessonFlow).toContain("lesson_load_performance");
    expect(appLayout).toContain(".catch(() => undefined)");
    expect(difficultyPacing).toContain("resolveDifficultyPacing");
    expect(lessonBundle).toContain("applyDifficultyPacing");
    expect(lessonScreen).toContain("recentAccuracy");
    expect(lessonScreen).toContain("questionsAnswered");
    expect(perspectiveAudit).toContain("SUPPORTED_LOCALES");
    expect(perspectiveAudit).toContain("--all-locales");
    expect(packageJson.scripts["audit:lesson-perspectives:all"]).toContain("--all-locales");
  });

  test("release, privacy, billing, and error-state gates stay explicit", () => {
    const launchEnv = read("scripts/check-launch-env.mjs");
    const checkoutPolicy = read("lib/checkoutPolicy.ts");
    const billing = read("lib/billing.ts");
    const lessonLoader = read("lib/lesson/useLessonLoader.ts");

    expect(existsSync(`${process.cwd()}/ios/Psycle/PrivacyInfo.xcprivacy`)).toBe(true);
    expect(launchEnv).toContain("NSPrivacyTracking");
    expect(launchEnv).toContain("NSPrivacyCollectedDataTypes");
    expect(gamification.notifications.default_enabled).toBe(false);
    expect(launchEnv).toContain("production Expo config must not include expo-dev-client");
    expect(launchEnv).toContain("production ATS must not include NSAllowsLocalNetworking");
    expect(checkoutPolicy).toContain("IOS_EXTERNAL_CHECKOUT_DISABLED_REASON");
    expect(billing).toContain("isExternalCheckoutBlockedForCurrentPlatform");
    expect(lessonLoader).toContain("lesson.loadFailed");
    expect(lessonLoader).toContain("showToast");
  });
});
