#!/bin/bash

# Analytics v1.3 E2E Test Runner
# Builds and runs the E2E test suite for Analytics validation

set -e

echo "🚀 Starting Analytics v1.3 E2E Test Suite"
echo "=========================================="

# Check if iOS Simulator is available
if ! command -v xcrun &> /dev/null; then
    echo "❌ Error: Xcode command line tools not found"
    echo "Please install Xcode and command line tools"
    exit 1
fi

# Check if Detox is installed
if ! command -v detox &> /dev/null; then
    echo "❌ Error: Detox CLI not found"
    echo "Installing Detox CLI globally..."
    npm install -g detox-cli
fi

# Create artifacts directory
mkdir -p artifacts

echo "📱 Building iOS app for testing..."
npm run e2e:build:ios

echo "🧪 Running Analytics E2E tests..."
npm run e2e:ios

echo "📊 E2E Test completed!"
echo "Check artifacts/ directory for test reports:"
echo "  - analytics_e2e_report.json"
echo "  - analytics_e2e_report.txt"

if [ -f "artifacts/analytics_e2e_report.json" ]; then
    echo ""
    echo "📄 Test Result Summary:"
    cat artifacts/analytics_e2e_report.txt | grep -E "(Overall Result|Status|anonId)" || echo "Report file not found or incomplete"
fi