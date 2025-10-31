#!/bin/bash
# Auto-fetch script for Psycle
set -euo pipefail

REPO_DIR="$HOME/dev/psych-duo-packs/psycle-expo"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/fetch-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$LOG_DIR"

echo "=== Psycle Auto-fetch started at $(date) ===" >> "$LOG_FILE"
cd "$REPO_DIR"

# Fetch new sources
node scripts/fetch_sources.mjs >> "$LOG_FILE" 2>&1

# Generate new questions  
node scripts/generate_questions.mjs >> "$LOG_FILE" 2>&1

echo "=== Completed at $(date) ===" >> "$LOG_FILE"

# Keep only last 30 logs
find "$LOG_DIR" -name "fetch-*.log" -mtime +30 -delete 2>/dev/null || true
