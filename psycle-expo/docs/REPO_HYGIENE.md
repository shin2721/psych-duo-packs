# Repo Hygiene

Use this file to keep the Psycle workspace workable while large refactors and UI experiments are in flight.

## Keep

- `app/`, `components/`, `lib/`, `types/`
- `app/debug/`
- `components/provisional/`
- `design-previews/`

These are allowed to stay only when they contain active product code, wired debug routes, or retained experiments with a current owner.

## Ignore As Local

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
4. preview surfaces are preserved only when explicitly retained; retired tool-specific experiments and unreferenced static mockups should be deleted or renamed to neutral product terms.

## Verification Rule

Structural cleanup is not enough. After major shell/compression work, run:

- `npm run typecheck`
- narrow Jest suites for the touched area
- runtime smoke when UI or native behavior matters

If runtime smoke is blocked, report the blocker explicitly rather than calling the work verified.
