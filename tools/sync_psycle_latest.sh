#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/mashitashinji/dev/psych-duo-packs"
TARGET_BRANCH="${1:-ゲーミフィケーション}"

cd "$REPO_ROOT"

git fetch origin
git checkout "$TARGET_BRANCH"
git pull --ff-only origin "$TARGET_BRANCH"

LOCAL_HEAD="$(git rev-parse --short HEAD)"
REMOTE_HEAD="$(git rev-parse --short "origin/$TARGET_BRANCH")"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  echo "sync failed: local=$LOCAL_HEAD remote=$REMOTE_HEAD branch=$TARGET_BRANCH"
  exit 1
fi

echo "psycle latest synced: branch=$TARGET_BRANCH head=$LOCAL_HEAD"
