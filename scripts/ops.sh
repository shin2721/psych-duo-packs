#!/usr/bin/env bash
set -euo pipefail
ps_repo_root(){ cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; }
ps_owner(){ git remote get-url origin 2>/dev/null | sed -E 's#.*github.com[:/]([^/]+)/([^/]+)(\.git)?#\1#'; }
ps_name(){  git remote get-url origin 2>/dev/null | sed -E 's#.*github.com[:/]([^/]+)/([^/]+)(\.git)?#\2#'; }
ps_base(){  echo "https://$(ps_owner).github.io/$(ps_name)"; }
ps_code(){  curl -sS -H 'Accept: application/json' -o /dev/null -w "%{http_code}" "$1" || echo 000; }
gen_next_for_track(){
  local TRACK="${1:?track}"; local THEME="${2:?theme}"
  local ARC="${3:-${TRACK}入門（全4週）}"; local ARC_TOTAL="${4:-4}"
  ps_repo_root; mkdir -p "$TRACK"
  [ -f "$TRACK/manifest.json" ] || printf '{ "app":"psycle","track":"%s","totalPacks":0,"packIds":[] }\n' "$TRACK" > "$TRACK/manifest.json"
  local NEXT_NUM; NEXT_NUM="$(jq -r --arg t "$TRACK" '[.packIds[]? | select(test("^"+$t+"_w\\d+$")) | capture(".*_w(?<n>\\d+)").n | tonumber] | (max // 0) + 1' "$TRACK/manifest.json")"
  local ID="${TRACK}_w$(printf "%02d" "$NEXT_NUM")"; local FILE="$TRACK/${ID}.json"
  [ -f "$FILE" ] || printf '{ "id":"%s", "meta":{}, "cards":[] }\n' "$ID" > "$FILE"
  local tmp; tmp="$(mktemp)"; jq --arg t "$TRACK" --arg th "$THEME" --arg arc "$ARC" --argjson wi "$NEXT_NUM" --argjson at "$ARC_TOTAL" '.meta.track=$t | .meta.theme=$th | .meta.arc=$arc | .meta.weekIndex=$wi | .meta.arcTotal=$at' "$FILE" >"$tmp" && mv "$tmp" "$FILE"
  tmp="$(mktemp)"; jq --arg id "$ID" '(.packIds |= (.+[$id] | unique)) | .totalPacks=(.packIds|length)' "$TRACK/manifest.json" >"$tmp" && mv "$tmp" "$TRACK/manifest.json"
  echo "$ID"
}
inject_cards(){
  local PACK_ID="${1:?}"; local CARDS_JSON="${2:?}"
  ps_repo_root
  jq -e '.cards and (.cards|type=="array") and (.cards|length>=1) and all(.cards[]; .type=="mcq" and (.choices|length)==4 and (.answerIndex|type=="number" and .>=0 and .<4))' "$CARDS_JSON" >/dev/null
  local FILE="${PACK_ID%_*}/${PACK_ID}.json"
  local tmp; tmp="$(mktemp)"; jq --slurpfile C "$CARDS_JSON" '.cards=$C[0].cards' "$FILE" >"$tmp" && mv "$tmp" "$FILE"
  echo "injected -> $FILE"
}
validate_all(){ ps_repo_root; [ -x scripts/validate.sh ] && ./scripts/validate.sh || for f in *.json */*.json; do [ -f "$f" ] && jq -e . "$f" >/dev/null || { echo "❌ invalid: $f"; exit 1; }; done; }
commit_push(){ ps_repo_root; local MSG="${1:-chore:update packs}"; git add -A; if ! git diff --cached --quiet; then git commit -m "$MSG"; else echo "no changes to commit"; fi; git push -u origin main; }
pages_rebuild_and_check(){
  ps_repo_root; local BASE; BASE="$(ps_base)"; command -v gh >/dev/null 2>&1 && gh api -X POST "repos/$(ps_owner)/$(ps_name)/pages/builds" >/dev/null || true
  local ts; ts="$(date +%s)"; local ok=0
  for i in 1 2 3; do ok=1; for f in "$@"; do code="$(ps_code "$BASE/$f.json?ts=$ts")"; echo "$f.json => $code"; [ "$code" = "200" ] || ok=0; done; [ $ok -eq 1 ] && break; sleep 5; done
  echo "Catalog Demo: $BASE/public/catalog.html?ts=$ts"
}
publish_from_tmp(){
  local TRACK="${1:?}"; local THEME="${2:?}"; local ARC="${3:-${TRACK}入門（全4週）}"; local CARDS="${4:?}"
  local ID; ID="$(gen_next_for_track "$TRACK" "$THEME" "$ARC")"; inject_cards "$ID" "$CARDS"; validate_all; commit_push "feat: add ${ID} content"; pages_rebuild_and_check "$TRACK/manifest" "$TRACK/$ID"
}
