#!/usr/bin/env bash
set -euo pipefail

DAYS=7
LIVE_MODE=false
LIMIT=100

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      DAYS="${2:-7}"
      shift 2
      ;;
    --live)
      LIVE_MODE=true
      shift
      ;;
    --limit)
      LIMIT="${2:-100}"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if ! command -v stripe >/dev/null 2>&1; then
  echo "stripe CLI is required" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi
if ! [[ "$DAYS" =~ ^[0-9]+$ ]]; then
  echo "--days must be integer" >&2
  exit 1
fi
if ! [[ "$LIMIT" =~ ^[0-9]+$ ]]; then
  echo "--limit must be integer" >&2
  exit 1
fi

SINCE_EPOCH="$(node -e "const d=${DAYS}; console.log(Math.floor(Date.now()/1000)-(d*86400));")"

fetch_json() {
  if [[ "$LIVE_MODE" == "true" ]]; then
    stripe "$@" --live
  else
    stripe "$@"
  fi
}

SESSIONS_JSON="$(fetch_json checkout sessions list --limit "$LIMIT" -d "created[gte]=$SINCE_EPOCH")"
CHARGES_JSON="$(fetch_json charges list --limit "$LIMIT" -d "created[gte]=$SINCE_EPOCH")"
REFUNDS_JSON="$(fetch_json refunds list --limit "$LIMIT" -d "created[gte]=$SINCE_EPOCH")"
SUBS_JSON="$(fetch_json subscriptions list --limit "$LIMIT" -d "created[gte]=$SINCE_EPOCH")"

NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

jq -n \
  --arg generatedAt "$NOW_ISO" \
  --arg mode "$( [[ "$LIVE_MODE" == "true" ]] && echo live || echo test )" \
  --argjson days "$DAYS" \
  --argjson since "$SINCE_EPOCH" \
  --argjson sessions "$SESSIONS_JSON" \
  --argjson charges "$CHARGES_JSON" \
  --argjson refunds "$REFUNDS_JSON" \
  --argjson subs "$SUBS_JSON" \
  '
  def by_count(stream; field):
    (stream | map(field) | group_by(.) | map({key:(.[0] // "unknown"), count:length}));

  {
    generatedAt: $generatedAt,
    mode: $mode,
    window: {
      days: $days,
      sinceEpoch: $since
    },
    checkoutSessions: {
      total: ($sessions.data | length),
      byStatus: by_count($sessions.data; .status),
      byMode: by_count($sessions.data; .mode)
    },
    charges: {
      total: ($charges.data | length),
      paid: ($charges.data | map(select(.paid == true)) | length),
      failed: ($charges.data | map(select(.paid == false)) | length),
      refundedFlagged: ($charges.data | map(select(.refunded == true)) | length)
    },
    refunds: {
      total: ($refunds.data | length),
      byStatus: by_count($refunds.data; .status)
    },
    subscriptions: {
      total: ($subs.data | length),
      byStatus: by_count($subs.data; .status),
      cancelAtPeriodEnd: ($subs.data | map(select(.cancel_at_period_end == true)) | length)
    }
  }
  '
