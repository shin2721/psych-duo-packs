#!/bin/bash
# E2E Smoke Test for Feedback Pipeline
# このスクリプトは verify:curated → emit-winners が正常動作することを確認

set -e

echo "🧪 E2E Smoke Test: Feedback Pipeline"
echo "======================================="

cd "$(dirname "$0")/.."

# 1. Test with sample feedback
echo ""
echo "1️⃣ Testing with sample feedback..."
npm run verify:curated -- --score --report --feedback scripts/test_feedback_sample.json --emit-winners /tmp/test_winners.json

# 2. Check winners file was created
if [ -f /tmp/test_winners.json ]; then
    echo ""
    echo "✅ Winners file created successfully"
    echo ""
    cat /tmp/test_winners.json
    rm /tmp/test_winners.json
else
    echo ""
    echo "❌ Winners file was not created"
    exit 1
fi

echo ""
echo "======================================="
echo "✅ E2E Smoke Test PASSED"
