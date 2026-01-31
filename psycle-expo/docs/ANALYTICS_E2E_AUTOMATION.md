# Analytics v1.3 E2E Automation

## Overview

Automated end-to-end testing system for Analytics v1.3 validation using Detox framework. Tests both initial launch and second launch scenarios with comprehensive PASS/FAIL judgment.

## Features

### 🤖 Automated Test Scenarios

**Scenario A: Initial Launch (初回起動)**
- App launch → onboarding start → onboarding complete → lesson start → (lesson complete)
- Validates: `app_open`, `session_start`, `app_ready`, `onboarding_start`, `onboarding_complete`, `lesson_start`
- Expected: Each event fires exactly once, anonId is not 'unknown'

**Scenario B: Second Launch (2回目起動)**  
- App restart with Second Launch Mode enabled
- Validates: `session_start`, `app_ready` fire once, `app_open` does NOT fire
- Expected: anonId remains consistent with first launch

### 📊 Analytics Debug Screen

Self-test UI accessible via Settings screen (tap 5 times):

- **Real-time Status**: PASS/FAIL judgment with failure reasons
- **Event Counters**: Live count for each tracked event
- **Event History**: Ring buffer of last 100 events with timestamps
- **anonId Display**: Current anonymous ID for consistency verification
- **Second Launch Mode**: Toggle for testing second launch behavior
- **Reset Function**: Clear all debug data for fresh E2E test
- **Copy Report**: Export comprehensive test report to clipboard

### 🎯 PASS/FAIL Criteria

**FAIL Conditions:**
- anonId is 'unknown' or contains 'unknown'
- `session_start` fires more than once in same session
- `app_ready` fires more than once in same session  
- `app_ready` was queued (should fire after initialize)
- `app_open` fires in Second Launch Mode

**PASS Condition:**
- All above conditions are false

## Usage

### Quick Start

```bash
# Run complete E2E test suite
npm run e2e:analytics

# Or run individual steps
npm run e2e:build:ios
npm run e2e:ios
```

### Manual Testing

1. **Access Debug Screen**:
   - Go to Settings → Tap "設定" title 5 times → Tap "Analytics Debug"

2. **Initial Launch Test**:
   - Reset Analytics state → Restart app
   - Complete onboarding → Start lesson
   - Check debug screen for PASS status

3. **Second Launch Test**:
   - Enable "Second Launch Mode" → Restart app
   - Check that `app_open` count is 0

### Test Reports

Automated tests generate reports in `artifacts/`:

- `analytics_e2e_report.json`: Structured test results
- `analytics_e2e_report.txt`: Human-readable summary

## Implementation Details

### Test IDs Added

| Component | testID | Purpose |
|-----------|--------|---------|
| `app/onboarding/index.tsx` | `onboarding-start` | Onboarding start button |
| `app/onboarding/interests.tsx` | `onboarding-finish` | Onboarding completion |
| `components/trail.tsx` | `lesson-node-{id}` | Lesson selection nodes |
| `components/Modal.tsx` | `modal-primary-button` | Lesson start confirmation |
| `app/lessons/[id].tsx` | `lesson-complete` | Lesson completion button |
| `app/settings/index.tsx` | `open-analytics-debug` | Debug screen access |
| `components/AnalyticsDebug.tsx` | Multiple | Debug UI elements |

### Files Modified

**E2E Framework:**
- `package.json`: Detox dependencies and scripts
- `e2e/jest.config.js`: Jest configuration for Detox
- `e2e/init.js`: Detox environment setup
- `e2e/analytics.v1_3.e2e.ts`: Main test suite

**Debug System:**
- `components/AnalyticsDebug.tsx`: Debug UI component
- `lib/analytics-debug.ts`: Debug state management
- `app/settings/index.tsx`: Hidden debug access

**Test Infrastructure:**
- `scripts/run-analytics-e2e.sh`: Test runner script
- `artifacts/`: Test report output directory

## Architecture

### Debug State Management

```typescript
type DebugState = {
  anonId: string;
  events: DebugEvent[];           // Ring buffer (last 100)
  counters: Record<string, number>; // Event counts
  failures: string[];            // PASS/FAIL reasons
  passed: boolean;               // Overall status
  secondLaunchMode: boolean;      // Test mode flag
};
```

### Event Tracking

Events are recorded with status:
- `queued`: Event queued before initialization
- `sent`: Event successfully sent to PostHog
- `failed`: Event send failed
- `system`: System events (initialization, etc.)

### Lazy Initialization Support

The debug system properly handles lazy initialization:
- Events can be queued before Analytics.initialize()
- Queue is flushed after successful initialization
- `app_ready` should never appear as 'queued' (FAIL condition)

## Troubleshooting

### Common Issues

**"Could not find lesson completion button"**
- Lesson requires answering questions before completion
- E2E test focuses on event tracking, not full lesson flow

**"Analytics Debug screen not accessible"**
- Ensure you're in DEV mode (`__DEV__ === true`)
- Tap Settings title exactly 5 times

**"Second Launch Mode not working"**
- Toggle the switch in Analytics Debug screen
- Restart app after enabling the mode

### Debug Commands

```bash
# Check Detox setup
detox test --configuration ios.sim.debug --loglevel verbose

# Build iOS app for testing
npm run e2e:build:ios

# Run specific test file
detox test e2e/analytics.v1_3.e2e.ts --configuration ios.sim.debug
```

## Future Enhancements

- [ ] Android E2E support
- [ ] CI/CD integration
- [ ] Performance metrics tracking
- [ ] Network failure simulation
- [ ] Batch event testing

## Related Documentation

- [Analytics TestFlight Validation](./ANALYTICS_TESTFLIGHT_VALIDATION.md)
- [Analytics v1.3 Status](./ANALYTICS_V1.3_STATUS.md)
- [Analytics Measurement Guide](./ANALYTICS_MEASUREMENT_GUIDE.md)