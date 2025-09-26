#!/usr/bin/env bash
set -euo pipefail
# 使い方:
#   scripts/watermark_shift.sh money/money_w01.json
#   または: for f in money/money_w*.json; do scripts/watermark_shift.sh "$f"; done
f="${1:?usage: watermark_shift.sh <pack.json>}"
tmp="$(mktemp)"
jq '
  .id as $pid
  | ( ($pid | capture(".*_w(?<n>\\d+)").n | tonumber) ) as $pn
  | .cards = ( [ range(0; (.cards|length)) as $i
      | .cards[$i] as $c
      | ($pn + $i) % 4 as $k
      | ($c.choices|length) as $m
      | $c
        | .choices = ( ($c.choices[$k:] + $c.choices[:$k]) )
        | .answerIndex = (( ($c.answerIndex - $k + $m) % $m ))
    ] )
' "$f" > "$tmp" && mv "$tmp" "$f"
echo "shifted: $f"
