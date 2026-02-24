# CLAUDE.md

This file provides workspace-level guidance for Claude Code in this repository.

## 応答言語

すべての応答は日本語で行うこと。コミットメッセージやPRタイトルなど、英語が慣習的に使われる箇所は英語のままでよい。

## 実行ルール

- ユーザーの明示的な許可なくコマンドやスクリプトを実行しないこと。必ず事前に確認を取る。
- 実行が許可された場合、変更が発生したらその場でコミットとプッシュまで一連で行うこと。

## Always Use Latest Psycle Branch

Always sync the repository from the current session's working tree.
Do not force a fixed absolute path, because Claude/Codex sessions often run in worktrees.

At the start of every session, run:

```bash
./tools/sync_psycle_latest.sh
```

This script is **main-only**. Branch arguments are not allowed.

If sync fails, stop and report the exact error before editing files.

## Required Freshness Check

For every review/fix request, do this before reading or editing code.
Do not proceed unless all checks pass:

1. Run `./tools/sync_psycle_latest.sh`
2. Confirm current branch is exactly `main`:
   - `git branch --show-current`
3. Confirm local and remote hashes match:
   - `git rev-parse --short HEAD`
   - `git rev-parse --short origin/main`
4. Confirm worktree is clean:
   - `git status --short`
5. Confirm there are no unpushed commits on main:
   - `git rev-list --count origin/main..main`
   - Must be `0` before review (if not, run `git push origin main`)

If any check fails, do not continue analysis. Report the failure and resolve sync first.

## Branch / PR Policy

- Work only on `main`.
- Do not create or switch to `claude/*` branches.
- Do not create PRs for routine sync/review replies.
