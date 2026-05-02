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
  - `npm run metro:agent:install`
  - `npm run metro:agent:status`
  - `npm run ios:repair:native`
- Local dev bundle id:
  - `com.s6n2j9.psycle`

## Build / Native

- iOS native repair and detached build recovery:
  - `docs/IOS_NATIVE_REPAIR_PLAYBOOK.md`

## Runtime Verification

- Release smoke gate:
  - `npm run e2e:ios:psycle:smoke:build`
  - Builds Release, then runs Analytics v1.3 and full-touch Release Detox checks against the Psycle simulator.
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

## Engagement / Growth

- Top-level engagement principles:
  - `docs/ENGAGEMENT_PRINCIPLES.md`
- XP and study progression:
  - `docs/XP_UNIT_SPEC.md`
- Energy experiment gates:
  - `docs/ENERGY_EXPERIMENT_GATES.md`
- League operations:
  - `docs/LEAGUE_OPS.md`
- Measurement cadence:
  - `docs/DATA_COLLECTION_PLAYBOOK.md`

## Content / Operations

- Runtime and billing / notification / content operations:
  - `docs/OPERATIONS.md`
- Content authoring and quality rules:
  - `docs/LESSON_AUTHORING.md`
  - `docs/QUALITY_CONSTITUTION.md`
  - `docs/CONTENT_SYSTEM_SPEC.md`

## Navigation Rule

- `docs/START_HERE.md` is the docs entrypoint.
- Review fact-check guard lives in `docs/REVIEW_FACTCHECK_GUARD.md`.
- Individual playbooks remain the detailed source of truth for each domain.
