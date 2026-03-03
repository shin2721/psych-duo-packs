#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

pass_count=0
warn_count=0
fail_count=0

log_info() { echo -e "${BLUE}[INFO]${RESET} $*"; }
log_pass() { echo -e "${GREEN}[PASS]${RESET} $*"; pass_count=$((pass_count + 1)); }
log_warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; warn_count=$((warn_count + 1)); }
log_fail() { echo -e "${RED}[FAIL]${RESET} $*"; fail_count=$((fail_count + 1)); }

load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    # shellcheck disable=SC1090
    set -a && source "$file" && set +a
    log_info "Loaded $file"
  fi
}

extract_project_ref() {
  if [[ -n "${EXPO_PUBLIC_SUPABASE_FUNCTION_URL:-}" ]]; then
    echo "$EXPO_PUBLIC_SUPABASE_FUNCTION_URL" | sed -E 's#https?://([^.]+)\.functions\.supabase\.co/?#\1#'
    return 0
  fi
  if [[ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]]; then
    echo "$EXPO_PUBLIC_SUPABASE_URL" | sed -E 's#https?://([^.]+)\.supabase\.co/?#\1#'
    return 0
  fi
  echo ""
}

check_command() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    log_pass "Command available: $cmd"
  else
    log_fail "Command missing: $cmd"
  fi
}

check_http_reachability() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$url" || true)"
  if [[ "$code" =~ ^(200|401|403|404)$ ]]; then
    log_pass "$name reachable ($code): $url"
  else
    log_fail "$name unreachable ($code): $url"
  fi
}

check_supabase_secrets() {
  local project_ref="$1"
  if ! command -v supabase >/dev/null 2>&1; then
    log_fail "supabase CLI not installed"
    return
  fi

  local out_file
  out_file="$(mktemp)"
  local err_file
  err_file="$(mktemp)"

  if supabase secrets list --project-ref "$project_ref" >"$out_file" 2>"$err_file"; then
    log_pass "Supabase secrets readable for project $project_ref"

    for key in STRIPE_PRICE_PRO SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
      if grep -q "$key" "$out_file"; then
        log_pass "Secret present: $key"
      else
        log_warn "Secret missing: $key"
      fi
    done

    for key in STRIPE_PRICE_PRO_YEARLY STRIPE_PRICE_PRO_MONTHLY_V2; do
      if grep -q "$key" "$out_file"; then
        log_pass "Optional rollout secret present: $key"
      else
        log_warn "Optional rollout secret not set yet: $key"
      fi
    done
  else
    log_fail "Cannot read Supabase secrets for $project_ref"
    sed 's/[[:space:]]\+/ /g' "$err_file" | head -5 | sed 's/^/        /'
  fi

  rm -f "$out_file" "$err_file"
}

check_posthog_query_scope() {
  local host="${POSTHOG_HOST:-}"
  local token="${POSTHOG_PERSONAL_API_KEY:-}"
  local project_id="${POSTHOG_PROJECT_ID:-}"

  if [[ -z "$host" || -z "$token" || -z "$project_id" ]]; then
    log_warn "PostHog credentials incomplete (need POSTHOG_HOST, POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID)"
    return
  fi

  local body_file
  body_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$body_file" -w "%{http_code}" \
    -X POST "$host/api/projects/$project_id/query/" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"query":{"kind":"HogQLQuery","query":"SELECT 1"}}' || true)"

  if [[ "$status" == "200" ]]; then
    log_pass "PostHog query API accessible (query:read OK)"
  else
    if grep -q "query:read" "$body_file"; then
      local insights_status
      insights_status="$(curl -sS -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$host/api/projects/$project_id/insights/?limit=1" || true)"
      if [[ "$insights_status" == "200" ]]; then
        log_warn "PostHog token lacks query:read, but insights read is available (monitoring fallback active)"
      else
        log_fail "PostHog token missing query:read and insights read fallback failed (HTTP $insights_status)"
      fi
    else
      log_fail "PostHog query API failed (HTTP $status)"
      head -1 "$body_file" | sed 's/^/        /'
    fi
  fi

  rm -f "$body_file"
}

main() {
  log_info "Checking assistant data access from $ROOT_DIR"

  load_env_file ".env.local"
  load_env_file ".env"

  check_command "curl"
  check_command "node"
  check_command "supabase"

  local project_ref
  project_ref="$(extract_project_ref)"
  if [[ -z "$project_ref" ]]; then
    log_fail "Could not derive PROJECT_REF from EXPO_PUBLIC_SUPABASE_FUNCTION_URL / EXPO_PUBLIC_SUPABASE_URL"
  else
    log_pass "Derived PROJECT_REF: $project_ref"
    check_http_reachability "Supabase API" "https://${project_ref}.supabase.co"
    check_http_reachability "Supabase Functions" "https://${project_ref}.functions.supabase.co"
    check_supabase_secrets "$project_ref"
  fi

  check_posthog_query_scope

  echo
  log_info "Summary: pass=$pass_count warn=$warn_count fail=$fail_count"

  if [[ "$fail_count" -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
