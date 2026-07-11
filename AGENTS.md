# AGENTS.md

This file provides workspace-level guidance for Codex and other AI coding agents in this repository.

## Response Language

Respond to the user in Japanese by default. English is acceptable for commit messages, PR titles, command names, code identifiers, and other places where English is the project convention.

## Psycle Simulator / UI Verification Rules

- For non-trivial Psycle product, UI, content, launch-readiness, or repo-hygiene work, read the relevant project docs first:
  - `psycle-expo/docs/PRINCIPLES.md`
  - `psycle-expo/docs/CONTENT_SYSTEM_SPEC.md`
  - `psycle-expo/docs/NORTH_STAR_PROGRESS.md`
  - `psycle-expo/docs/REPO_HYGIENE.md`
  - `psycle-expo/docs/AI_MODEL_OPERATING_MODEL.md`
- For Psycle product-direction, lesson-design, research, evidence, analytics, or gamification work, preserve the `Psycle North Star` section in `psycle-expo/docs/PRINCIPLES.md`:
  - Paleo-like research discovery and evidence critique.
  - D-Lab-like daily life improvement through small usable lessons.
  - Duolingo-like continuity and gamification that supports transfer, repeat, and long-term learning.
- When a Psycle task changes North-Star-relevant behavior, content operations, evidence/research flow, lesson quality measurement, or gamification, update `psycle-expo/docs/NORTH_STAR_PROGRESS.md` before finishing.
  - Prefer `npm run progress:north-star:note -- --summary "..." --changed "..." --verified "..." --remaining "..."`.
  - Run `npm run check:north-star-progress` to catch stale handoffs.
- Do not make broad Psycle changes without checking the relevant docs and the current git diff first.
- For Psycle UI work, inspect the Simulator directly with Computer Use first when it is available.
- Do not judge UI only from saved screenshots. Use screenshots mainly as evidence after direct inspection.
- Simulator reload is `Cmd+R` while the Simulator is focused. Metro terminal reload is `r` while the Metro terminal is focused.
- If UI changes do not appear, first verify which app is running.
  - Current bundle identifier: `com.shin27.psycle` for both dev-client and release builds.
  - Identify the build by its dev-client/Metro state, not by bundle identifier alone.
- Use the dev-client for normal UI iteration.
- Do not use the release app for ordinary design or layout checks unless the user explicitly asks for release-style verification.
- Installing a dev-client or release build replaces the other build with the same bundle identifier; verify the installed build before assuming reload is broken.
- When the user asks for a specific layout or visual fix, change only the requested area.
- Do not change unrelated motion, background effects, colors, copy, CTA behavior, or navigation.
- Before making taste-based UI edits, verify the current screen state in Simulator and keep the change narrowly scoped.

## Psycle No-Repeat Rule

The recent Psycle failure mode was: weak lesson quality triggered more rules,
more audits, UI/runtime edits, and generated lesson churn in the same worktree.
Do not repeat that.

- If a lesson feels weak, do not add another rule first.
  - First write or revise a raw pilot.
  - Then judge the lesson experience in Simulator.
  - Only after the experience is worth preserving should docs, audits, runtime,
    or generated data be changed.
- Do not mix these in one uncommitted worktree:
  - North Star / quality-system docs
  - audit scripts
  - lesson UI/runtime
  - generated lesson JSON / locale output
  - broad test rewrites
- Before staging Psycle work, run:
  - `python3 psycle-expo/scripts/worktree-status-buckets.py`
  - stage one bucket at a time
  - keep generated lesson data unstaged until the matching runtime and
    Simulator experience are verified
- Machine audit success is not product success.
  - Audit pass only proves regression coverage.
  - Simulator playthrough and human taste review decide whether the lesson is
    meaningful.
- If the worktree starts to become hard to explain, stop feature work and
  organize it before adding more changes.
