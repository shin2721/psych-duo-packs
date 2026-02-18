# CLAUDE.md

This file provides workspace-level guidance for Claude Code in this repository.

## Always Use Latest Psycle Branch

Always sync the repository from the current session's working tree.
Do not force a fixed absolute path, because Claude/Codex sessions often run in worktrees.

At the start of every session, run:

```bash
./tools/sync_psycle_latest.sh
```

If needed, you may pass a branch name explicitly:

```bash
./tools/sync_psycle_latest.sh ゲーミフィケーション
```

If sync fails, stop and report the exact error before editing files.
