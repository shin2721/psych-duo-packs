#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

check_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if [[ ! -f "$file" ]]; then
    echo "[FAIL] $label :: missing file: $file"
    fail=1
    return
  fi

  if grep -nF "$pattern" "$file" >/tmp/review_factcheck_match.txt 2>/dev/null; then
    local line
    line="$(head -n 1 /tmp/review_factcheck_match.txt | cut -d: -f1)"
    echo "[PASS] $label :: $file:$line"
  else
    echo "[FAIL] $label :: pattern not found: $pattern"
    fail=1
  fi
}

echo "== Review Fact-Check Guard =="
echo "repo: $ROOT"

# Critical wiring checks that have historically been misreported.
check_contains "app/lesson.tsx" "consumeEnergy(lessonEnergyCost)" "Energy gate wired at lesson start"
check_contains "app/lesson.tsx" "Analytics.track(\"energy_blocked\"" "Energy blocked analytics wired"
check_contains "app/lesson.tsx" "reviewQueue.length > 0 && !isReviewRound" "Lesson review round wiring present"
check_contains "app/review.tsx" "addReviewEvent({" "Review session records review events"
check_contains "app/mistakes-hub.tsx" "addReviewEvent({" "MistakesHub session records review events"
check_contains "lib/state.tsx" "startMistakesHubSession:" "MistakesHub start API exposed"
check_contains "docs/REVIEW_FACTCHECK_TEMPLATE.md" "Findings Table (Mandatory)" "Review template exists"
check_contains "CLAUDE.md" "Review Fact-Check Guard" "Reviewer guard instructions present"

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "Review fact-check FAILED. Do not publish high-severity findings without evidence."
  exit 1
fi

echo
echo "Review fact-check PASSED."
