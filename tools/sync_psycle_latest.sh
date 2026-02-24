#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="main"
if [[ "$#" -gt 0 ]]; then
  echo "sync failed: branch arguments are not allowed (main-only)"
  echo "usage: ./tools/sync_psycle_latest.sh"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "sync failed: current directory is not inside a git repository"
  exit 1
fi

cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "sync failed: working tree has local changes at $REPO_ROOT"
  echo "commit or stash changes before syncing"
  exit 1
fi

git fetch origin

if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_BRANCH"; then
  :
else
  echo "sync failed: remote branch origin/$TARGET_BRANCH not found"
  exit 1
fi

if git switch "$TARGET_BRANCH" >/dev/null 2>&1; then
  :
elif git switch -c "$TARGET_BRANCH" --track "origin/$TARGET_BRANCH" >/dev/null 2>&1; then
  :
else
  echo "sync failed: cannot switch to '$TARGET_BRANCH'"
  echo "fix worktree/branch state and retry"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo "sync failed: current branch is '$CURRENT_BRANCH' (expected '$TARGET_BRANCH')"
  exit 1
fi

git pull --ff-only origin "$TARGET_BRANCH"

LOCAL_HEAD="$(git rev-parse --short HEAD)"
REMOTE_HEAD="$(git rev-parse --short "origin/$TARGET_BRANCH")"
WORKTREE_STATE="$(git status --porcelain)"
AHEAD_COUNT="$(git rev-list --count "origin/$TARGET_BRANCH..HEAD")"
BEHIND_COUNT="$(git rev-list --count "HEAD..origin/$TARGET_BRANCH")"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  if [[ "$AHEAD_COUNT" -gt 0 ]]; then
    echo "sync failed: local branch '$TARGET_BRANCH' has $AHEAD_COUNT unpushed commit(s)"
    echo "push first so other sessions can see latest:"
    echo "  git push origin $TARGET_BRANCH"
    echo "hashes: local=$LOCAL_HEAD remote=$REMOTE_HEAD"
    exit 1
  fi

  if [[ "$BEHIND_COUNT" -gt 0 ]]; then
    echo "sync failed: local branch '$TARGET_BRANCH' is behind origin/$TARGET_BRANCH by $BEHIND_COUNT commit(s)"
    echo "rerun sync after resolving branch state"
    echo "hashes: local=$LOCAL_HEAD remote=$REMOTE_HEAD"
    exit 1
  fi

  echo "sync failed: local=$LOCAL_HEAD remote=$REMOTE_HEAD branch=$TARGET_BRANCH"
  exit 1
fi

if [[ -n "$WORKTREE_STATE" ]]; then
  echo "sync failed: working tree is not clean after sync"
  echo "$WORKTREE_STATE"
  exit 1
fi

echo "psycle latest synced: repo=$REPO_ROOT branch=$TARGET_BRANCH local=$LOCAL_HEAD remote=$REMOTE_HEAD clean=true"
