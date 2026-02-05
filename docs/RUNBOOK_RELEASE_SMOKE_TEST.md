# Release Smoke Test Runbook

## Purpose
Provide a fixed, minimal manual smoke test before release.

## Scope
This runbook validates language switching (JA/EN), lesson loading, progression, and the results screen.

## Preconditions
1. You can run the app locally (dev client or simulator).
2. You have a clean working tree.
3. You know the commit SHA you are validating.

## Quick Start
```bash
cd psycle-expo
npm ci
# pick one
npm run ios
# or
npm run android
```

## Smoke Test Steps
1. Launch the app and verify the home screen renders without errors.
2. Switch language to English (EN) from the in-app language setting.
3. Open a lesson and verify content loads in English.
4. Answer a few questions and complete the lesson.
5. Verify the progress/summary and results screen render.
6. Switch language back to Japanese (JA).
7. Repeat steps 3–5 in Japanese.

## Pass/Fail Criteria
- Pass if both languages load lessons, allow progression, and show results without errors.
- Fail if any step crashes, blocks progression, or renders empty/mismatched content.

## Record Keeping
Capture the following in the release note or QA log:
- Commit SHA
- Device/simulator + OS version
- Run date/time
- Any issues observed (with screenshots if possible)
