# CLAUDE.md

This file provides workspace-level guidance for Claude Code in this repository.

## Always Use Latest Psycle Branch

Default working tree must be:

- `/Users/mashitashinji/dev/psych-duo-packs`

Do not use `/.claude/worktrees/*` unless the user explicitly asks to work on a PR branch.

At the start of every session, run:

```bash
cd /Users/mashitashinji/dev/psych-duo-packs
./tools/sync_psycle_latest.sh
```

If sync fails, stop and report the exact error before editing files.

