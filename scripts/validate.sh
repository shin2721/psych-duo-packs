#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob
fail=0
files=( *.json mental/*.json money/*.json work/*.json )
for f in "${files[@]}"; do
  echo "check: $f"
  if ! jq -e . "$f" >/dev/null; then echo "❌ invalid JSON: $f"; fail=1; continue; fi
  case "$f" in
    */manifest.json|manifest.json)
      jq -e 'has("packIds") and (.packIds|type=="array") and (has("totalPacks"))' "$f" >/dev/null || { echo "❌ manifest schema: $f"; fail=1; }
      ;;
    *)
      jq -e 'has("id") and ((has("cards") and (.cards|type=="array")) or has("skills"))' "$f" >/dev/null || { echo "❌ pack schema (id/cards|skills): $f"; fail=1; }
      ;;
  esac
done
exit $fail
