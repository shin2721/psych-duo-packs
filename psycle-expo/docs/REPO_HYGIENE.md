# Repo Hygiene

Use this file to keep the Psycle workspace workable while large refactors and UI experiments are in flight.

## Keep

- `app/`, `components/`, `lib/`, `types/`
- `app/debug/`
- `components/provisional/`
- `design-previews/`
- `public/*.html`

These are allowed to stay because they contain active product code, debug routes, or Claude-generated temporary UI that should not be deleted by cleanup work.

## Ignore As Local

- `.claude/`
- `.agent/`
- `.kiro/`
- `.vscode/`
- `_artifacts/`
- `artifacts/`
- `logs/`
- `.expo/`
- generated native build outputs under `ios/` and `android/`

These surfaces are local tooling state, machine output, or verification residue. Cleanup should prefer `.gitignore` over manual deletion unless disk space is the problem.

## Worktree Cleanup Rule

Before calling the repo "organized", check all three:

1. `git status --short` is understandable by feature area.
2. local-only artifacts are ignored instead of appearing as noise.
3. debug/provisional surfaces are either wired and intentional, or clearly documented as retained experiments.
4. preview surfaces from Claude/Codex are preserved unless explicitly retired.

## Verification Rule

Structural cleanup is not enough. After major shell/compression work, run:

- `npm run typecheck`
- narrow Jest suites for the touched area
- runtime smoke when UI or native behavior matters

If runtime smoke is blocked, report the blocker explicitly rather than calling the work verified.
