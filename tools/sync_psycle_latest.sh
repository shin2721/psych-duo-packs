#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="main"
AUTO_STASH=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --autostash)
      AUTO_STASH=1
      shift
      ;;
    --no-autostash)
      AUTO_STASH=0
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./tools/sync_psycle_latest.sh [--autostash|--no-autostash] [branch]

Defaults:
  branch: main
  mode:   --autostash
EOF
      exit 0
      ;;
    *)
      TARGET_BRANCH="$1"
      shift
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "sync failed: current directory is not inside a git repository"
  exit 1
fi

cd "$REPO_ROOT"

AUTO_STASH_REF=""
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  if [[ "$AUTO_STASH" -eq 1 ]]; then
    STASH_MSG="sync_psycle_latest_autostash_$(date +%Y%m%d_%H%M%S)"
    git stash push -u -m "$STASH_MSG" >/dev/null
    AUTO_STASH_REF="$(git stash list | head -n 1 | cut -d: -f1)"
  else
    echo "sync failed: working tree has local changes at $REPO_ROOT"
    echo "rerun with --autostash, or commit/stash changes before syncing"
    exit 1
  fi
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
  if ! git pull --ff-only origin "$TARGET_BRANCH" >/dev/null 2>&1; then
    # If fast-forward is not possible (local branch diverged/ahead), prefer latest remote snapshot.
    git checkout --detach "origin/$TARGET_BRANCH" >/dev/null 2>&1 || {
      echo "sync failed: cannot fast-forward or detach to origin/$TARGET_BRANCH"
      exit 1
    }
    SYNC_MODE="detached_from_diverged_branch"
  fi
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
  # Always converge to remote head for review freshness.
  git checkout --detach "origin/$TARGET_BRANCH" >/dev/null 2>&1 || {
    echo "sync failed: local=$LOCAL_HEAD remote=$REMOTE_HEAD branch=$TARGET_BRANCH"
    exit 1
  }
  SYNC_MODE="detached_remote_exact"
  LOCAL_HEAD="$(git rev-parse --short HEAD)"
  AHEAD_COUNT="$(git rev-list --count "origin/$TARGET_BRANCH..HEAD")"
  BEHIND_COUNT="$(git rev-list --count "HEAD..origin/$TARGET_BRANCH")"
fi

if [[ -n "$WORKTREE_STATE" ]]; then
  echo "sync failed: working tree is not clean after sync"
  echo "$WORKTREE_STATE"
  exit 1
fi

echo "psycle latest synced: repo=$REPO_ROOT branch=$TARGET_BRANCH mode=$SYNC_MODE local=$LOCAL_HEAD remote=$REMOTE_HEAD clean=true"
if [[ -n "$AUTO_STASH_REF" ]]; then
  echo "autostash saved: $AUTO_STASH_REF"
  echo "restore (optional): git stash pop $AUTO_STASH_REF"
fi
echo "freshness: ahead=$AHEAD_COUNT behind=$BEHIND_COUNT"
