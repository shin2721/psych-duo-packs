# Repository Guidelines

## Project Structure & Module Organization
- Expo Router screens live in `app/`; shared UI stays in `components/`, data helpers in `lib/`, and static art under `assets/`.
- Use `start-dev.sh` when you need the scripted iOS simulator flow; keep it executable and update ports in one place.
- The duplicated Expo scaffold in `psycle-expo/` mirrors the root project—leave it untouched unless you are exporting a legacy bundle.

## Build, Test, and Development Commands
- `npm install` restores dependencies; rerun after syncing branches or touching either lockfile.
- `npm start` launches Metro on 8088 with cache clearing; switch to `npm run tunnel` if LAN discovery fails.
- `npm run ios`, `npm run android`, `npm run web`, and `./start-dev.sh` target specific simulators or browsers for quick smoke tests.

## Coding Style & Naming Conventions
- Prefer TypeScript function components, keep hooks near their usage, and extract shared logic into `lib/` where possible.
- Match the existing 2-space indentation, camelCase variables, PascalCase components, and trailing semicolons.
- Define styles through `StyleSheet.create`, reuse existing color tokens, and memoize derived props with `useMemo` to avoid redundant fetches.

## Testing Guidelines
- Automated tests are not wired yet; rely on manual QA through Expo Go or the iOS simulator workflow.
- Before opening a PR, run `npm start` (or `./start-dev.sh`) and verify catalog and manifest fetches end-to-end.
- Note any manual test steps or coverage gaps in the PR so reviewers can reproduce quickly.

## Commit & Pull Request Guidelines
- Follow the conventional commit style visible in history (`feat(ui): …`, `fix(runner): …`) and keep each commit focused.
- PR descriptions should summarize user impact, highlight risky areas, and link to issues or specs.
- Include testing notes—platform runs, screenshots, or screen recordings—whenever UI or WebView behavior changes.

## Configuration & Security Notes
- `app.json` holds `expo.extra.BASE_URL`; keep it pointing at the current Psycle content host and prefer HTTPS.
- Never commit secrets or long-lived tokens; rely on Expo config or secure storage and strip temporary `console.log` debugging before merge.
