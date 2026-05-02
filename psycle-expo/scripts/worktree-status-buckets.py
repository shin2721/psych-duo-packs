#!/usr/bin/env python3
import subprocess
from collections import OrderedDict

BUCKETS = OrderedDict(
    [
        (
            "hygiene_tooling",
            [
                ".gitignore",
                "docs/",
                "scripts/ios/",
                "scripts/native-agent/",
                "scripts/review-factcheck.sh",
                "scripts/worktree-status-buckets.py",
            ],
        ),
        (
            "release_config",
            [
                "app.config.js",
                "eas.json",
                "config/",
                "package.json",
                "package-lock.json",
                "scripts/check-launch-",
                "scripts/run-release-smoke-e2e.sh",
                "scripts/metro/",
                "e2e/",
                "lib/supabase",
                "lib/supabaseConfig",
                "lib/navigation/",
            ],
        ),
        (
            "screen_shells",
            [
                "app/_layout.tsx",
                "app/(tabs)/",
                "app/auth.tsx",
                "app/lesson.tsx",
                "app/mistakes-hub.tsx",
                "app/review.tsx",
                "app/onboarding/",
                "app/settings/",
                "components/course/",
                "components/friends/",
                "components/leaderboard/",
                "components/lesson/",
                "components/profile/",
                "components/quests/",
                "components/review/",
                "components/settings/",
                "components/shop/",
            ],
        ),
        (
            "ui_foundation",
            [
                "components/AppErrorBoundary",
                "components/CourseWorldHero",
                "components/CustomIcons",
                "components/GlobalHeader",
                "components/LeagueResultModal",
                "components/StreakCalendar",
                "components/course-world/",
                "components/ui",
                "lib/theme",
            ],
        ),
        (
            "question_runtime",
            [
                "components/QuestionRenderer",
                "components/QuestionTypes",
                "components/question-runtime/",
                "components/question-types/",
                "types/question.ts",
            ],
        ),
        (
            "app_state",
            [
                "lib/app-state/",
                "lib/badges.ts",
                "lib/streaks.ts",
            ],
        ),
        (
            "analytics_content_config",
            [
                "components/AnalyticsDebug",
                "components/analyticsDebugSections",
                "lib/analytics",
                "lib/remoteContent",
                "lib/lessons.ts",
                "lib/lesson-data/",
                "lib/gamificationConfig",
                "lib/courseWorld",
                "data/themes/",
                "lib/themeManifestRuntime",
                "scripts/check-theme-readiness.js",
            ],
        ),
        (
            "lesson_runtime",
            [
                "lib/lesson/",
                "lib/lessonContinuity",
                "lib/lessonOperational",
                "lib/mastery",
                "lib/onboardingSelection",
                "types/lesson",
                "config/gamification.json",
            ],
        ),
        (
            "billing_shop",
            [
                "lib/billing",
                "lib/checkoutPolicy",
                "lib/shop/",
            ],
        ),
        (
            "content_generation_pipeline",
            [
                "scripts/README_AUTO_GENERATE.md",
                "scripts/auto_generate_problems.mjs",
                "scripts/audit-lesson-perspectives.mjs",
                "scripts/check-content-package.js",
                "scripts/content-generator/",
                "scripts/content-preflight.js",
                "scripts/expand_",
                "scripts/generate-evidence-scaffold.js",
                "scripts/lib/",
                "scripts/promote-staged-lesson.sh",
                "scripts/sync-",
                "scripts/validate-lessons.ts",
            ],
        ),
        (
            "social_league_quest",
            [
                "lib/friend",
                "lib/social.ts",
                "lib/league",
                "lib/quest",
                "lib/notifications",
            ],
        ),
        (
            "generated_data",
            [
                "data/lessons/",
                "lib/locales/",
                "scripts/gen-lesson-locale-index.js",
            ],
        ),
        (
            "preview_debug",
            [
                "design-previews/",
                "app/debug/",
                "components/provisional/",
                "lib/debug/",
                "lib/settings/settingsDebugRoutes",
                "public/",
            ],
        ),
        (
            "test_contracts",
            [
                "src/__tests__/",
            ],
        ),
    ]
)


def bucket_for(path: str, status: str) -> str:
    if status == "D" and "/" not in path and path.endswith(".md"):
        return "hygiene_tooling"
    for name, prefixes in BUCKETS.items():
        if any(path.startswith(prefix) for prefix in prefixes):
            return name
    return "other"


def main() -> int:
    proc = subprocess.run(
        ["git", "status", "--short"],
        cwd="/Users/mashitashinji/dev/psych-duo-packs/psycle-expo",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True,
    )
    grouped = OrderedDict((name, []) for name in list(BUCKETS.keys()) + ["other"])
    for raw_line in proc.stdout.splitlines():
        if not raw_line.strip():
            continue
        status = raw_line[:3].strip()
        path = raw_line[3:].strip()
        grouped[bucket_for(path, status)].append((status, path))

    for bucket, items in grouped.items():
        if not items:
            continue
        print(f"[{bucket}] {len(items)}")
        for status, path in items:
            print(f"  {status:2} {path}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
