#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-main}"

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

SYNC_MODE="branch"
if git switch "$TARGET_BRANCH" >/dev/null 2>&1; then
  :
elif git switch -c "$TARGET_BRANCH" --track "origin/$TARGET_BRANCH" >/dev/null 2>&1; then
  :
else
  # In worktrees, target branch can already be checked out elsewhere.
  # Fall back to detached mode so any worktree can still sync to latest commit.
  git checkout --detach "origin/$TARGET_BRANCH" >/dev/null 2>&1 || {
    echo "sync failed: cannot switch or detach to origin/$TARGET_BRANCH"
    exit 1
  }
  SYNC_MODE="detached"
fi

if [[ "$SYNC_MODE" == "branch" ]]; then
  git pull --ff-only origin "$TARGET_BRANCH"
else
  # In detached mode, re-checkout the remote ref to move HEAD to latest commit.
  git checkout --detach "origin/$TARGET_BRANCH" >/dev/null 2>&1 || {
    echo "sync failed: cannot refresh detached HEAD to origin/$TARGET_BRANCH"
    exit 1
  }
fi

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

echo "psycle latest synced: repo=$REPO_ROOT branch=$TARGET_BRANCH mode=$SYNC_MODE local=$LOCAL_HEAD remote=$REMOTE_HEAD clean=true"
