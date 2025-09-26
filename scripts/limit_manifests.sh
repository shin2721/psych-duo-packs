#!/usr/bin/env bash
set -euo pipefail
N="${1:-2}"                       # keep last N
tracks=(mental money work)
for t in "${tracks[@]}"; do
  mf="$t/manifest.json"
  [ -f "$mf" ] || { echo "skip $t (no manifest)"; continue; }
  tmp="$(mktemp)"
  # packIds を wNN の数値でソートして末尾N件だけ残す
  jq --arg t "$t" --argjson n "$N" '
    .packIds as $ids
    | ($ids
       | map({id:., n:(capture(".*_w(?<w>\\d+)").w|tonumber)})
       | sort_by(.n)
       | (if (length > $n) then .[-$n:] else . end)
       | map(.id)) as $kept
    | .packIds = $kept
    | .totalPacks = ($kept|length)
  ' "$mf" > "$tmp" && mv "$tmp" "$mf"
  echo "kept last $N → $mf"
done
