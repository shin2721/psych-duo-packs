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
            ],
        ),
        (
            "screen_shells",
            [
                "app/(tabs)/",
                "app/auth.tsx",
                "app/lesson.tsx",
                "app/mistakes-hub.tsx",
                "app/review.tsx",
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
                "lib/analytics",
                "lib/remoteContent",
                "lib/lessons.ts",
                "lib/lesson-data/",
                "lib/gamificationConfig",
                "lib/courseWorld",
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
                "public/",
            ],
        ),
    ]
)


def bucket_for(path: str) -> str:
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
        status = raw_line[:3].rstrip()
        path = raw_line[3:].strip()
        grouped[bucket_for(path)].append((status, path))

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
