#!/usr/bin/env node
import fs from "node:fs";

const checks = [];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function json(path) {
  return JSON.parse(read(path));
}

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
}

function contains(path, needle) {
  return read(path).includes(needle);
}

function fileExists(path) {
  return fs.existsSync(path);
}

const gamification = json("config/gamification.json");
const appLayout = read("app/_layout.tsx");
const onboardingInterests = read("app/onboarding/interests.tsx");
const courseScreen = read("app/(tabs)/course.tsx");
const courseNodeColumn = read("components/course-world/CourseWorldNodeColumn.tsx");
const lessonCompletionView = read("components/lesson/LessonCompletionView.tsx");
const difficultyPacing = read("lib/lesson/difficultyPacing.ts");
const analyticsCore = read("lib/analyticsCore.ts");
const analyticsDebug = read("lib/analyticsDebugCore.ts");
const errorBoundary = read("components/AppErrorBoundary.tsx");
const billing = read("lib/billing.ts");
const checkoutPolicy = read("lib/checkoutPolicy.ts");
const lessonLoader = read("lib/lesson/useLessonLoader.ts");
const lessonScreen = read("app/lesson.tsx");
const lessonBundle = read("lib/lesson/loadLessonBundle.ts");
const lessonPerspectiveAudit = read("scripts/audit-lesson-perspectives.mjs");
const launchEnv = read("scripts/check-launch-env.mjs");
const packageJson = json("package.json");

check(
  "onboarding primary genre is applied before first lesson",
  onboardingInterests.includes("setSelectedGenre(primaryGenreId)") &&
    courseScreen.includes("loadPrimaryOnboardingGenre") &&
    courseScreen.includes("onboarding_primary_genre_applied"),
  "selected interests must route the first course/lesson"
);

check(
  "onboarding finish button has accessibility contract",
  onboardingInterests.includes('accessibilityRole="button"') &&
    onboardingInterests.includes("accessibilityHint") &&
    onboardingInterests.includes("accessibilityState"),
  "first activation CTA must be usable with VoiceOver"
);

check(
  "course support and habit cards expose accessibility labels",
  courseNodeColumn.includes("supportAccessibilityLabel") &&
    courseNodeColumn.includes("momentumAccessibilityLabel") &&
    courseNodeColumn.includes("accessibilityLabel={supportAccessibilityLabel}"),
  "course world support moments must not be visual-only"
);

check(
  "lesson completion closes the success loop",
  lessonCompletionView.includes('testID="lesson-complete-recap"') &&
    lessonCompletionView.includes('testID="lesson-complete-habit-loop"') &&
    lessonCompletionView.includes("completionRecap.nextPromise") &&
    lessonCompletionView.includes('sounds.play("levelUp")') &&
    lessonCompletionView.includes("hapticFeedback.success()") &&
    lessonCompletionView.includes("accessibilityLabel={String(item.label)}"),
  "completion should explain what was trained, reward the moment, and keep feedback accessible"
);

check(
  "app loading state and crash fallback are recoverable",
  appLayout.includes('accessibilityRole="progressbar"') &&
    appLayout.includes("<AppErrorBoundary>") &&
    errorBoundary.includes('testID="app-error-boundary-retry"') &&
    errorBoundary.includes('accessibilityRole="button"'),
  "startup/crash paths need a readable fallback and retry path"
);

check(
  "startup analytics does not block initial render",
  appLayout.includes("void Analytics.initialize()") &&
    appLayout.includes("Analytics.trackSessionStart()") &&
    appLayout.includes("Analytics.trackAppOpen()") &&
    appLayout.includes("app_startup_performance") &&
    analyticsDebug.includes("app_startup_performance") &&
    appLayout.includes(".catch(() => undefined)"),
  "startup telemetry must be queued/non-blocking so slow analytics cannot freeze launch"
);

check(
  "release smoke analytics does not wait on external PostHog",
  analyticsCore.includes("E2E_ANALYTICS_DEBUG_BUILD") &&
    analyticsCore.includes("PostHog send skipped for E2E analytics debug build") &&
    packageJson.detox?.apps?.["ios.release"]?.build?.includes(
      "EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1"
    ),
  "release E2E should validate local analytics without blocking on external network idle"
);

check(
  "production debug and local-network routes are blocked",
  fileExists("src/__tests__/debugRouteGuard.test.ts") &&
    fileExists("src/__tests__/expoConfigProduction.test.ts") &&
    launchEnv.includes("production ATS must not include NSAllowsLocalNetworking") &&
    launchEnv.includes("production Expo config must not include expo-dev-client"),
  "TestFlight builds must not expose debug or dev-network paths"
);

check(
  "privacy manifest and notification opt-in are launch-gated",
  fileExists("ios/Psycle/PrivacyInfo.xcprivacy") &&
    launchEnv.includes("NSPrivacyTracking") &&
    launchEnv.includes("NSPrivacyCollectedDataTypes") &&
    gamification.notifications?.default_enabled === false,
  "privacy declaration and notification consent must stay explicit"
);

check(
  "iOS production checkout is blocked until native IAP exists",
  checkoutPolicy.includes("IOS_EXTERNAL_CHECKOUT_DISABLED_REASON") &&
    checkoutPolicy.includes('Platform.OS === "ios"') &&
    checkoutPolicy.includes('process.env.EXPO_PUBLIC_APP_ENV === "prod"') &&
    billing.includes("isExternalCheckoutBlockedForCurrentPlatform") &&
    billing.includes("checkout_failed"),
  "App Review risk: no external checkout in iOS production"
);

check(
  "lesson load failure has a user-facing recovery signal",
  lessonLoader.includes("lesson.loadFailed") && lessonLoader.includes("showToast"),
  "lesson runtime failures must surface a recoverable state"
);

check(
  "difficulty pacing uses user performance signals",
  difficultyPacing.includes("resolveDifficultyPacing") &&
    difficultyPacing.includes("recentAccuracy") &&
    difficultyPacing.includes("skillConfidence") &&
    lessonScreen.includes("questionsAnswered") &&
    lessonScreen.includes("recentAccuracy") &&
    lessonBundle.includes("applyDifficultyPacing"),
  "lesson sizing/order must react to user-level accuracy instead of only static lesson size"
);

check(
  "lesson load performance is measured for runtime tuning",
  analyticsDebug.includes("lesson_load_performance") &&
    analyticsDebug.includes("PERFORMANCE_BUDGETS") &&
    analyticsDebug.includes("evaluatePerformanceDebugHealth") &&
    lessonScreen.includes("difficultyPacing") &&
    lessonBundle.includes("pacing") &&
    read("lib/lesson/useLessonFlow.ts").includes("lesson_load_performance"),
  "launch tuning needs lesson load duration, pacing context, and budget warnings"
);

check(
  "lesson perspective audit covers supported locales",
  lessonPerspectiveAudit.includes("SUPPORTED_LOCALES") &&
    lessonPerspectiveAudit.includes("--all-locales") &&
    packageJson.scripts?.["audit:lesson-perspectives:all"]?.includes("--all-locales"),
  "content quality gates must catch missing evidence/usage metadata outside ja"
);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) {
  const status = item.pass ? "PASS" : "FAIL";
  console.log(`[launch-readiness] ${status} ${item.name}`);
  if (!item.pass) console.log(`  ${item.detail}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
} else {
  console.log("[launch-readiness] static readiness checks passed");
}
