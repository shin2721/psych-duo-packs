#!/usr/bin/env bash
set -euo pipefail
source scripts/ops.sh
TRACK="${1:?usage: auto_publish.sh <track>}"
QFILE="$(ls -1 "queue/${TRACK}"/*.json 2>/dev/null | head -n1 || true)"
[ -n "${QFILE}" ] || { echo "no queued content for ${TRACK}"; exit 0; }
THEME="$(jq -r '.meta.theme // "Auto Pack"' "${QFILE}")"
ARC="$(jq -r '.meta.arc // ("'${TRACK}'入門（全4週）")' "${QFILE}")"
ID="$(gen_next_for_track "${TRACK}" "${THEME}" "${ARC}")"
inject_cards "${ID}" "${QFILE}"
validate_all
commit_push "feat: auto publish ${ID}"
pages_rebuild_and_check "${TRACK}/manifest" "${TRACK}/${ID}"
mkdir -p "history/${TRACK}"
git mv "${QFILE}" "history/${TRACK}/${ID}.json" 2>/dev/null || mv "${QFILE}" "history/${TRACK}/${ID}.json"
commit_push "chore: archive source for ${ID}"
