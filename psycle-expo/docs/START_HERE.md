# Docs Start Here

Use this page as the first hop into Psycle's operational docs.

## Local Dev

- Shared simulator default:
  - `Psycle Clean iPhone 17 Pro-Detox`
- Metro port:
  - `Psycle = 8082`
- Simulator dev client:
  - `http://127.0.0.1:8082`
- iPhone dev client on the same Wi-Fi:
  - `http://<your-mac-lan-ip>:8082`
- Preferred scripts:
  - `npm run start`
  - `npm run start:lan`
  - `npm run ios:repair:native`
- Local dev bundle id:
  - `com.s6n2j9.psycle`

## Build / Native

- iOS native repair and detached build recovery:
  - `docs/IOS_NATIVE_REPAIR_PLAYBOOK.md`

## Runtime Verification

- UX native agent runtime workflow:
  - `docs/UX_NATIVE_AGENT.md`
- Repo hygiene and retained experimental surface rules:
  - `docs/REPO_HYGIENE.md`
  - `docs/WORKTREE_CLEANUP.md`
  - `docs/COMMIT_HYGIENE.md`
- TestFlight validation and release gates:
  - `docs/TESTFLIGHT_PRECHECK.md`
  - `docs/TESTFLIGHT_RELEASE_CHECKLIST.md`

## Analytics

- Measurement and instrumentation guide:
  - `docs/ANALYTICS_MEASUREMENT_GUIDE.md`
- TestFlight validation:
  - `docs/ANALYTICS_TESTFLIGHT_VALIDATION.md`
- Dashboard / KPI operations:
  - `docs/ANALYTICS_GROWTH_DASHBOARD.md`

## Content / Operations

- Runtime and billing / notification / content operations:
  - `docs/OPERATIONS.md`
- Content authoring and quality rules:
  - `docs/LESSON_AUTHORING.md`
  - `docs/QUALITY_CONSTITUTION.md`
  - `docs/CONTENT_SYSTEM_SPEC.md`

## Navigation Rule

- `CLAUDE.md` is the repo entrypoint.
- `docs/START_HERE.md` is the docs entrypoint.
- Individual playbooks remain the detailed source of truth for each domain.
