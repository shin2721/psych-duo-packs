# UX Native Agent

Persistent iOS simulator control surface for Psycle UI exploration.

The agent runs as a single Detox test (`e2e/ux-agent.e2e.ts`) and exposes file-based IPC commands under `/tmp/ux-agent/`. This is useful when you want interactive navigation without re-running a full end-to-end suite for each action.

`scripts/native-agent/launch` now brings up the command loop first, then completes dev-client open, onboarding, and guest login through the same IPC command surface. This avoids the old startup stall where the persistent agent could hang before writing `/tmp/ux-agent/ready`.

## Start

From [`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo`](/Users/mashitashinji/dev/psych-duo-packs/psycle-expo):

```bash
npm run ux:launch
```

For faster iteration on an already-prepared simulator state:

```bash
npm run ux:launch -- --skip-reset
```

Default launch behavior:

- resets simulator content/settings
- installs the debug build
- launches the app
- waits for the persistent command loop to write `/tmp/ux-agent/ready`
- opens the dev-client URL through IPC when needed
- completes onboarding if needed
- signs in with guest auth if needed
- waits until `tab-course` is visible

## Commands

All commands return JSON on stdout.

```bash
npm run ux:tap -- lesson-node-m1
npm run ux:tap-text -- "はじめる"
npm run ux:tap-label -- Back
npm run ux:swipe -- settings-scroll up fast 0.7
npm run ux:scroll -- settings-scroll down 300
npm run ux:scroll-to -- settings-scroll open-analytics-debug 8 up
npm run ux:type -- edit-profile-username psycle
npm run ux:replace-text -- edit-profile-username psycle2
npm run ux:clear -- edit-profile-username
npm run ux:visible -- tab-course 3000
npm run ux:visible-text -- "設定" 3000
npm run ux:wait-for -- settings-scroll 10000
npm run ux:dump-ids -- tab-course tab-shop tab-profile
npm run ux:open-url -- psycle://settings
npm run ux:screenshot -- settings-state
npm run ux:dismiss-alerts
npm run ux:relaunch
npm run ux:quit
```

## Files

- command queue: `/tmp/ux-agent/cmd-<reqId>.json`
- responses: `/tmp/ux-agent/result-<reqId>.json`
- readiness marker: `/tmp/ux-agent/ready`
- screenshots: `/tmp/ux-agent/screenshots/`
- background log: `/tmp/ux-agent/agent.log`

## Notes

- Use `ux:type` only when the input is empty. Use `ux:replace-text` for prefilled fields.
- `ux:relaunch` launches a fresh app instance, but does not reset simulator content/settings.
- If a command times out, inspect `/tmp/ux-agent/agent.log` first.
- If the persistent agent is not responding, the command wrappers fall back to a one-shot Detox run for that single action.
- The agent depends on Detox primary context APIs exposed by `detox/runners/jest/testEnvironment`. Do not reintroduce a custom environment wrapper in `e2e/init.js`.
