/**
 * Analytics v1.3 E2E Test Suite
 * 
 * Automated validation of Analytics system with PASS/FAIL judgment.
 * Tests both initial launch and second launch scenarios.
 */

import { device, element, by, waitFor } from 'detox';
import { expect as jestExpect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.setTimeout(900000);

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');
const REPORT_FILE = path.join(ARTIFACTS_DIR, 'analytics_e2e_report.json');
const REPORT_TEXT_FILE = path.join(ARTIFACTS_DIR, 'analytics_e2e_report.txt');
const USE_DEV_CLIENT_BOOTSTRAP = process.env.E2E_BOOTSTRAP_DEV_CLIENT === '1';
const DEV_SERVER_URL = withDevMenuOnboardingDisabled(resolveDevServerUrl());
const DEV_CLIENT_URL = `psycle://expo-development-client/?url=${encodeURIComponent(DEV_SERVER_URL)}`;

// Ensure artifacts directory exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

describe('Analytics v1.3 E2E', () => {
  let initialScenarioReport: any = null;
  let initialScenarioValidated = false;
  let secondScenarioReport: any = null;
  let secondScenarioValidated = false;

  beforeAll(async () => {
    // Reset device to clean state
    await device.resetContentAndSettings();
    await device.installApp();
  });

  afterEach(async () => {
    // Take screenshot on failure
    const jasmineState = (global as any).jasmine;
    if (jasmineState?.currentSpec?.result?.failedExpectations?.length > 0) {
      await device.takeScreenshot(`analytics-failure-${Date.now()}`);
    }
  });

  describe('Scenario A: Initial Launch (初回起動)', () => {
    let initialReport: any;

    it('should complete full E2E flow and validate analytics', async () => {
      console.log('🚀 Starting Scenario A: Initial Launch');

      // Step 1: Launch app (triggers app_open, session_start, app_ready)
      await device.launchApp({
        newInstance: true,
        permissions: {
          notifications: 'YES',
        },
      });
      await device.disableSynchronization();
      await sleep(1000);
      if (USE_DEV_CLIENT_BOOTSTRAP) {
        await bootstrapDevClientToApp();
      }
      
      // Wait for app to fully initialize
      const entryPoint = await waitForAnyVisibleById(
        ['onboarding-start', 'onboarding-interests-title', 'auth-guest-login', 'tab-course'],
        90000
      );
      console.log(`ℹ️ app entry point: ${entryPoint}`);

      // Step 2: Complete onboarding (if shown)
      if (entryPoint === 'onboarding-start') {
        await element(by.id('onboarding-start')).tap();
        await waitFor(element(by.id('onboarding-interests-title'))).toBeVisible().withTimeout(10000);
        await element(by.id('onboarding-genre-mental')).tap();
        await finishOnboardingInterests('onboarding-genre-mental');
      } else if (entryPoint === 'onboarding-interests-title') {
        await element(by.id('onboarding-genre-mental')).tap();
        await finishOnboardingInterests('onboarding-genre-mental');
      } else {
        console.log('ℹ️ onboarding-start not visible, continuing without onboarding flow');
      }

      // Step 3: Wait for post-onboarding routing and sign in when needed.
      // Depending on stored session, app may go directly to tabs or stop at auth.
      const postOnboardingEntry = await waitForAnyVisibleById(
        ['auth-guest-login', 'tab-course'],
        45000
      );
      if (postOnboardingEntry === 'auth-guest-login') {
        await element(by.id('auth-guest-login')).tap();
        await sleep(2000);
      }
      await dismissBlockingSystemAlerts();

      // Step 4: Navigate to first lesson
      await waitFor(element(by.id('tab-course'))).toBeVisible().withTimeout(45000);
      await dismissBlockingSystemAlerts();
      await element(by.id('tab-course')).tap();
      
      // Wait for course screen to load
      await sleep(1000);
      
      // Start the current lesson. Course world no longer exposes the legacy node ID in every mode.
      const lessonStartControl = await waitForAnyVisibleById(
        ['course-world-primary', 'hero-root-orb', 'course-world-support', 'course-next-step-cta', 'lesson-node-m1'],
        45000
      );
      await element(by.id(lessonStartControl)).tap();

      // Legacy course opens a modal first; course-world starts directly.
      if (await isVisibleById('modal-primary-button', 5000)) {
        await tapModalPrimaryUntilLessonOpens();
      }
      
      // Wait for lesson_start event
      await sleep(1000);

      // Wait for lesson screen to load
      await waitFor(element(by.id('lesson-screen'))).toBeVisible().withTimeout(60000);
      await sleep(1000);

      // Step 5: Complete lesson through the real question UI so lesson_complete is measured.
      await completeCurrentLesson();
      await waitForAnyVisibleById(['lesson-complete-recap', 'lesson-complete-habit-loop'], 30000);
      await device.takeScreenshot(`analytics-lesson-complete-${Date.now()}`);
      await element(by.id('lesson-complete-habit-loop')).tap();
      await waitFor(element(by.id('tab-course'))).toBeVisible().withTimeout(30000);
      await sleep(1000);

      // Step 6: Access Analytics Debug screen
      await navigateToAnalyticsDebug();

      // Step 7: Read and validate analytics state
      initialReport = await readAnalyticsDebugState();
      initialScenarioReport = initialReport;
      
      console.log('📊 Initial Launch Report:', JSON.stringify(initialReport, null, 2));

      // Validate initial launch expectations
      validateInitialLaunch(initialReport);
      initialScenarioValidated = true;
    });

    function validateInitialLaunch(report: any) {
      // Expected events for initial launch. The E2E flow now completes the first lesson.
      const exactlyOnceEvents = [
        'app_open',
        'session_start',
        'app_ready',
        'onboarding_start',
        'onboarding_complete',
        'onboarding_first_lesson_completed',
        'lesson_start',
        'lesson_complete',
      ];
      const requiredPresentEvents = [
        'engagement_primary_action_shown',
        'engagement_primary_action_started',
      ];
      // Check required events fired exactly once
      exactlyOnceEvents.forEach(eventName => {
        const count = report.counters[eventName] || 0;
        jestExpect(count).toBe(1);
      });

      requiredPresentEvents.forEach(eventName => {
        const count = report.counters[eventName] || 0;
        jestExpect(count).toBeGreaterThanOrEqual(1);
      });

      // Check anonId is not unknown
      jestExpect(report.anonId).not.toBe('unknown');
      jestExpect(report.anonId).not.toContain('unknown');
      jestExpect(report.anonId.length).toBeGreaterThan(8);

      // Check overall status
      jestExpect(report.passed).toBe(true);
    }
  });

  describe('Scenario B: Second Launch (2回目起動)', () => {
    let secondReport: any;

    it('should validate second launch behavior', async () => {
      console.log('🔄 Starting Scenario B: Second Launch');

      // Step 1: Enable Second Launch Mode in debug screen
      await navigateToAnalyticsDebug();
      await waitFor(element(by.id('analytics-second-launch-toggle'))).toBeVisible().withTimeout(10000);
      await element(by.id('analytics-second-launch-toggle')).tap();
      await sleep(500);

      // Step 2: Restart app (simulates second launch)
      await device.reloadReactNative();
      await sleep(1000);
      
      // Wait for app to fully initialize
      await sleep(3000);

      // Step 3: Access Analytics Debug screen again
      await navigateToAnalyticsDebug();

      // Step 4: Read and validate analytics state
      secondReport = await readAnalyticsDebugState();
      secondScenarioReport = secondReport;
      
      console.log('📊 Second Launch Report:', JSON.stringify(secondReport, null, 2));

      // Validate second launch expectations
      validateSecondLaunch(secondReport);
      secondScenarioValidated = true;
    });

    function validateSecondLaunch(report: any) {
      // For second launch, only session_start and app_ready should fire
      jestExpect(report.counters['session_start']).toBe(1);
      jestExpect(report.counters['app_ready']).toBe(1);
      
      // app_open should NOT fire on second launch
      jestExpect(report.counters['app_open'] || 0).toBe(0);

      // anonId should be consistent with first launch
      jestExpect(report.anonId).not.toBe('unknown');
      jestExpect(report.anonId).not.toContain('unknown');

      // Check overall status
      jestExpect(report.passed).toBe(true);
    }
  });

  describe('Report Generation', () => {
    it('should generate comprehensive test report', async () => {
      // Access debug screen one final time to get complete report
      await navigateToAnalyticsDebug();
      
      // Copy report to clipboard and extract
      await element(by.id('analytics-copy-report')).tap();
      
      // Get final state
      const finalReport = await readAnalyticsDebugState();
      const initialReportForOutput = initialScenarioReport ?? buildMissingScenarioReport(
        'initialLaunch did not reach Analytics Debug state capture'
      );
      const secondReportForOutput = secondScenarioReport ?? buildMissingScenarioReport(
        'secondLaunch did not reach Analytics Debug state capture'
      );
      
      // Generate comprehensive report
      const testReport = {
        timestamp: new Date().toISOString(),
        testSuite: 'Analytics v1.3 E2E',
        scenarios: {
          initialLaunch: {
            status: initialScenarioReport
              ? initialScenarioValidated
                ? 'completed'
                : 'failed_validation'
              : 'failed_before_debug_read',
            events: initialReportForOutput.counters,
            anonId: initialReportForOutput.anonId,
            passed: initialReportForOutput.passed && initialScenarioValidated,
            failures: initialScenarioValidated
              ? initialReportForOutput.failures
              : [...initialReportForOutput.failures, 'initialLaunch failed Jest validation']
          },
          secondLaunch: {
            status: secondScenarioReport
              ? secondScenarioValidated
                ? 'completed'
                : 'failed_validation'
              : 'failed_before_debug_read',
            events: secondReportForOutput.counters,
            secondLaunchMode: secondReportForOutput.secondLaunchMode,
            passed: secondReportForOutput.passed && secondScenarioValidated,
            failures: secondScenarioValidated
              ? secondReportForOutput.failures
              : [...secondReportForOutput.failures, 'secondLaunch failed Jest validation']
          }
        },
        overallResult:
          initialScenarioValidated &&
          secondScenarioValidated &&
          initialReportForOutput.passed &&
          secondReportForOutput.passed &&
          finalReport.passed
            ? 'PASS'
            : 'FAIL',
        summary: {
          totalEvents:
            Object.values(initialReportForOutput.counters).reduce((sum: number, count: any) => sum + count, 0) +
            Object.values(secondReportForOutput.counters).reduce((sum: number, count: any) => sum + count, 0),
          uniqueAnonId:
            initialReportForOutput.anonId !== 'unknown' &&
            !initialReportForOutput.anonId.includes('unknown') &&
            secondReportForOutput.anonId === initialReportForOutput.anonId,
          noMultipleFires:
            initialReportForOutput.counters['session_start'] <= 1 &&
            initialReportForOutput.counters['app_ready'] <= 1 &&
            secondReportForOutput.counters['session_start'] <= 1 &&
            secondReportForOutput.counters['app_ready'] <= 1,
          secondLaunchCorrect: secondReportForOutput.secondLaunchMode
            ? (secondReportForOutput.counters['app_open'] || 0) === 0
            : true
        }
      };

      // Save JSON report
      fs.writeFileSync(REPORT_FILE, JSON.stringify(testReport, null, 2));
      
      // Save text report
      const textReport = generateTextReport(testReport);
      fs.writeFileSync(REPORT_TEXT_FILE, textReport);
      
      console.log('📄 Test reports saved to:', ARTIFACTS_DIR);
      console.log('📊 Overall Result:', testReport.overallResult);
      
      // Final assertion
      jestExpect(testReport.overallResult).toBe('PASS');
    });
  });
});

// Helper Functions

async function navigateToAnalyticsDebug(): Promise<void> {
  try {
    if (await isVisibleById('analytics-status', 2500)) {
      return;
    }

    if (await isVisibleById('auth-guest-login', 2500)) {
      await element(by.id('auth-guest-login')).tap();
      await sleep(2000);
      await dismissBlockingSystemAlerts();
    }
    
    // Navigate to profile tab
    await waitFor(element(by.id('tab-profile'))).toBeVisible().withTimeout(15000);
    await element(by.id('tab-profile')).tap();
    await sleep(1000);
    await dismissBlockingSystemAlerts();

    // Open settings screen
    await openSettingsFromProfile();

    // In E2E release builds the debug row should be visible directly, but it may be off-screen.
    // If not found, fallback to the legacy 5-tap unlock path and retry.
    await waitFor(element(by.id('settings-title-tap'))).toBeVisible().withTimeout(10000);
    let openedFromSettings = await openAnalyticsDebugFromSettings();
    if (!openedFromSettings && !(await isVisibleById('analytics-status', 2500))) {
      for (let i = 0; i < 5; i++) {
        await element(by.id('settings-title-tap')).tap();
        await sleep(220);
      }
      openedFromSettings = await openAnalyticsDebugFromSettings();
    }

    if (!openedFromSettings && !(await isVisibleById('analytics-status', 3000))) {
      throw new Error('Could not open analytics debug from settings');
    }
    
    // Wait for debug screen to load (with retry taps for flaky transitions).
    for (let i = 0; i < 10; i++) {
      if (await isVisibleById('analytics-status', 2500)) {
        await sleep(500);
        return;
      }
      if (await isVisibleById('open-analytics-debug', 2000)) {
        await element(by.id('open-analytics-debug')).tap();
      }
      await sleep(900);
    }
    await device.takeScreenshot(`analytics-debug-open-failed-${Date.now()}`);
    throw new Error('Analytics debug screen did not become visible');
  } catch (error) {
    console.error('Failed to navigate to Analytics Debug:', error);
    throw error;
  }
}

async function readAnalyticsDebugState(): Promise<any> {
  try {
    // Read status
    const statusElement = element(by.id('analytics-status-text'));
    const statusText = readTextFromAttributes(await statusElement.getAttributes());
    const passed = statusText.includes('PASS');

    // Read anonId
    const anonIdElement = element(by.id('analytics-anonid'));
    const anonId = readTextFromAttributes(await anonIdElement.getAttributes()) || 'unknown';

    // Read event counters
    const counters: Record<string, number> = {};
    const eventNames = [
      'app_open',
      'session_start',
      'app_ready',
      'app_startup_performance',
      'onboarding_start',
      'onboarding_complete',
      'onboarding_genres_selected',
      'onboarding_first_lesson_targeted',
      'onboarding_first_lesson_completed',
      'lesson_start',
      'lesson_load_performance',
      'lesson_complete',
      'engagement_primary_action_shown',
      'engagement_primary_action_started',
      'engagement_return_reason_shown',
      'checkout_start',
      'checkout_failed',
    ];
    
    for (const eventName of eventNames) {
      try {
        const counterElement = element(by.id(`count-${eventName}`));
        const counterText = readTextFromAttributes(await counterElement.getAttributes());
        counters[eventName] = parseInt(counterText || '0', 10);
      } catch (e) {
        counters[eventName] = 0;
      }
    }

    // Read failures (if any)
    let failures: string[] = [];
    try {
      const failuresElement = element(by.id('analytics-failures'));
      const failuresText = readTextFromAttributes(await failuresElement.getAttributes());
      if (failuresText) {
        failures = failuresText.split('\n').filter((f: string) => f.trim().length > 0);
      }
    } catch (e) {
      // No failures element visible, which is good
    }

    // Read second launch mode switch value
    let secondLaunchMode = false;
    try {
      const toggleElement = element(by.id('analytics-second-launch-toggle'));
      const attrs = await toggleElement.getAttributes();
      secondLaunchMode = Boolean((attrs as any)?.value);
    } catch (e) {
      // Ignore if unavailable
    }

    return {
      passed,
      anonId,
      counters,
      failures,
      secondLaunchMode
    };
  } catch (error) {
    console.error('Failed to read analytics debug state:', error);
    throw error;
  }
}

function buildMissingScenarioReport(reason: string): any {
  return {
    passed: false,
    anonId: 'unknown',
    counters: {},
    failures: [reason],
    secondLaunchMode: false,
  };
}

function readTextFromAttributes(attributes: any): string {
  if (!attributes) {
    return '';
  }

  if (typeof attributes.text === 'string') {
    return attributes.text;
  }

  if (typeof attributes.label === 'string') {
    return attributes.label;
  }

  if (Array.isArray(attributes.elements) && attributes.elements.length > 0) {
    const first = attributes.elements[0] as any;
    if (typeof first?.text === 'string') {
      return first.text;
    }
    if (typeof first?.label === 'string') {
      return first.label;
    }
  }

  return '';
}

async function isVisibleById(testID: string, timeout = 2000): Promise<boolean> {
  try {
    await waitFor(element(by.id(testID))).toBeVisible().withTimeout(timeout);
    return true;
  } catch (e) {
    return false;
  }
}

async function finishOnboardingInterests(genreTestID: string, timeoutMs = 20000): Promise<void> {
  await waitFor(element(by.id('onboarding-finish'))).toBeVisible().withTimeout(10000);

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!(await isElementEnabledById('onboarding-finish'))) {
      await element(by.id(genreTestID)).tap();
      await sleep(300);
    }

    await element(by.id('onboarding-finish')).tap();
    await sleep(400);

    if (!(await isVisibleById('onboarding-interests-title', 900))) {
      await sleep(800);
      return;
    }
  }

  try {
    const attrs = await element(by.id('onboarding-finish')).getAttributes();
    console.log(`ℹ️ onboarding-finish attrs: ${JSON.stringify(attrs)}`);
  } catch (e) {
    console.log('ℹ️ onboarding-finish attrs unavailable');
  }
  await device.takeScreenshot(`onboarding-interests-stuck-${Date.now()}`);
  throw new Error('Timed out completing onboarding interests');
}

async function isElementEnabledById(testID: string): Promise<boolean> {
  try {
    const attrs = await element(by.id(testID)).getAttributes();
    const rawEnabled = (attrs as any)?.enabled;
    if (typeof rawEnabled === 'boolean') {
      return rawEnabled;
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tapModalPrimaryUntilLessonOpens(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    if (await isVisibleById('lesson-screen', 1200)) {
      return;
    }

    if (await isVisibleById('tab-shop', 1200)) {
      throw new Error('Navigation went to shop (likely energy-blocked) before lesson screen');
    }

    if (await isVisibleById('modal-primary-button', 1200)) {
      await element(by.id('modal-primary-button')).tap();
    }

    await sleep(1200);
  }
}

async function completeCurrentLesson(maxSteps = 14): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    if (await isVisibleById('lesson-complete-screen', 900)) {
      return;
    }

    const visibleControl = await waitForLessonControl();

    if (visibleControl.startsWith('lesson-complete-')) {
      return;
    }

    if (visibleControl === 'question-continue') {
      await element(by.id('question-continue')).tap();
      await sleep(900);
      continue;
    }

    if (visibleControl === 'answer-swipe-card') {
      await element(by.id('answer-swipe-card')).swipe('right', 'fast', 0.75);
      await tapQuestionContinue();
      continue;
    }

    await element(by.id('answer-choice-0')).tap();
    await tapQuestionContinue();
  }

  await device.takeScreenshot(`analytics-lesson-complete-timeout-${Date.now()}`);
  throw new Error(`Lesson did not complete within ${maxSteps} E2E answer steps`);
}

async function tapQuestionContinue(): Promise<void> {
  await waitForLessonControl(['question-continue'], 15000);
  await element(by.id('question-continue')).tap();
  await sleep(900);
}

async function waitForLessonControl(
  testIDs = [
    'lesson-complete-recap',
    'lesson-complete-habit-loop',
    'question-continue',
    'answer-swipe-card',
    'answer-choice-0',
  ],
  timeoutMs = 20000
): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const id of testIDs) {
      if (await isVisibleById(id, 600)) {
        return id;
      }
    }

    if (await isVisibleById('question-scroll', 600)) {
      try {
        await element(by.id('question-scroll')).swipe('up', 'fast', 0.55);
      } catch {
        // The screen can transition while we are polling; retry until the timeout.
      }
    }
    await sleep(350);
  }

  await device.takeScreenshot(`analytics-lesson-control-missing-${Date.now()}`);
  throw new Error(`Timed out waiting for lesson control: ${testIDs.join(', ')}`);
}

async function openAnalyticsDebugFromSettings(): Promise<boolean> {
  await scrollUntilVisibleById('settings-scroll', 'open-analytics-debug', 8);
  if (await isVisibleById('open-analytics-debug', 5000)) {
    await element(by.id('open-analytics-debug')).tap();
    await sleep(900);
    return true;
  }
  await device.takeScreenshot(`analytics-debug-row-missing-${Date.now()}`);
  return false;
}

async function openSettingsFromProfile(): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await waitFor(element(by.id('profile-open-settings'))).toBeVisible().withTimeout(15000);
    await sleep(700);

    try {
      await element(by.id('profile-open-settings')).tap();
    } catch (error) {
      if (attempt === 2) {
        await device.takeScreenshot(`analytics-settings-open-failed-${Date.now()}`);
        throw error;
      }
    }

    if (await isVisibleById('settings-scroll', 6000)) {
      return;
    }

    await sleep(1000);
    if (attempt < 2) {
      await element(by.id('tab-profile')).tap();
      await sleep(1000);
      await dismissBlockingSystemAlerts();
    }
  }

  await device.takeScreenshot(`analytics-settings-open-missing-${Date.now()}`);
  throw new Error('Could not open settings from profile');
}

async function scrollUntilVisibleById(anchorTestID: string, targetTestID: string, maxSwipes = 6): Promise<void> {
  for (let i = 0; i < maxSwipes; i++) {
    if (await isVisibleById(targetTestID, 800)) {
      return;
    }
    await element(by.id(anchorTestID)).swipe('up', 'fast', 0.7);
    await sleep(300);
  }
}

async function bootstrapDevClientToApp(): Promise<void> {
  const entryTestIDs = ['onboarding-start', 'onboarding-interests-title', 'auth-guest-login', 'tab-course'];

  // If app UI already visible, no bootstrap needed.
  if (await isAnyVisibleById(entryTestIDs, 1500)) {
    return;
  }

  // Expo Dev Launcher first-run hints may require pressing Continue.
  await tapFirstVisibleText(['Continue', '続行', '続ける'], 5000);

  // Trigger opening the Dev Client URL.
  await device.openURL({ url: DEV_CLIENT_URL });

  // iOS may show a confirmation alert: `"psycle-expo"で開きますか?`
  await tapFirstVisibleText(['開く', 'Open'], 10000);

  // Dev menu overlay can appear after the app surface loads and hide Detox-visible IDs.
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45000) {
    await tapFirstVisibleText(['Continue', '続行', '続ける', 'Close', '閉じる'], 1200);
    await tapFirstVisibleText(['開く', 'Open'], 1200);
    if (await isAnyVisibleById(entryTestIDs, 900)) {
      return;
    }
    await sleep(500);
  }

  await sleep(1500);
}

async function waitForAnyVisibleById(testIDs: string[], timeoutMs: number): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const id of testIDs) {
      if (await isVisibleById(id, 750)) {
        return id;
      }
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for any visible element: ${testIDs.join(', ')}`);
}

async function isAnyVisibleById(testIDs: string[], timeout = 1000): Promise<boolean> {
  for (const id of testIDs) {
    if (await isVisibleById(id, timeout)) {
      return true;
    }
  }
  return false;
}

async function isVisibleByText(text: string, timeout = 1500): Promise<boolean> {
  try {
    await waitFor(element(by.text(text))).toBeVisible().withTimeout(timeout);
    return true;
  } catch (e) {
    return false;
  }
}

async function isVisibleByLabel(label: string, timeout = 1500): Promise<boolean> {
  try {
    await waitFor(element(by.label(label))).toBeVisible().withTimeout(timeout);
    return true;
  } catch (e) {
    return false;
  }
}

async function tapFirstVisibleText(texts: string[], timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const text of texts) {
      if (await isVisibleByText(text, 700)) {
        console.log(`ℹ️ tapping visible text: ${text}`);
        try {
          await element(by.text(text)).tap();
          return true;
        } catch (error) {
          console.log(`ℹ️ visible text was not hittable: ${text}`);
        }
      }
      if (await isVisibleByLabel(text, 700)) {
        console.log(`ℹ️ tapping visible label: ${text}`);
        try {
          await element(by.label(text)).tap();
          return true;
        } catch (error) {
          console.log(`ℹ️ visible label was not hittable: ${text}`);
        }
      }
    }
    await sleep(250);
  }
  return false;
}

async function dismissBlockingSystemAlerts(): Promise<void> {
  // Common iOS permission/system dialog actions (ja/en).
  const dismissTexts = [
    '許可しない',
    '許可',
    'OK',
    '閉じる',
    '今はしない',
    '後で',
    "Don’t Allow",
    "Don't Allow",
    'Allow',
    'Not Now',
    'Later',
    'Close',
  ];

  for (let i = 0; i < 3; i++) {
    const tapped = await tapFirstVisibleText(dismissTexts, 1200);
    if (!tapped) return;
    await sleep(400);
  }
}

function resolveDevServerUrl(): string {
  if (process.env.E2E_DEV_SERVER_URL) {
    return process.env.E2E_DEV_SERVER_URL;
  }

  if (process.env.E2E_PREFER_LAN_DEV_SERVER !== '1') {
    return 'http://127.0.0.1:8082';
  }

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return `http://${entry.address}:8082`;
      }
    }
  }

  return 'http://127.0.0.1:8082';
}

function withDevMenuOnboardingDisabled(urlString: string): string {
  const url = new URL(urlString);
  url.searchParams.set('disableOnboarding', '1');
  return url.toString();
}

function generateTextReport(report: any): string {
  const lines = [
    '=== Analytics v1.3 E2E Test Report ===',
    '',
    `Timestamp: ${report.timestamp}`,
    `Overall Result: ${report.overallResult}`,
    '',
    '--- Initial Launch Scenario ---',
    `Status: ${report.scenarios.initialLaunch.status}`,
    `Passed: ${report.scenarios.initialLaunch.passed}`,
    `anonId: ${report.scenarios.initialLaunch.anonId}`,
    '',
    'Event Counters:',
  ];

  Object.entries(report.scenarios.initialLaunch.events).forEach(([event, count]) => {
    lines.push(`  ${event}: ${count}`);
  });

  if (report.scenarios.initialLaunch.failures.length > 0) {
    lines.push('', 'Failures:');
    report.scenarios.initialLaunch.failures.forEach((failure: string, i: number) => {
      lines.push(`  ${i + 1}. ${failure}`);
    });
  }

  lines.push(
    '',
    '--- Second Launch Scenario ---',
    `Status: ${report.scenarios.secondLaunch.status}`,
    `Passed: ${report.scenarios.secondLaunch.passed}`,
    `Second Launch Mode: ${report.scenarios.secondLaunch.secondLaunchMode}`,
    '',
    'Event Counters:',
  );

  Object.entries(report.scenarios.secondLaunch.events).forEach(([event, count]) => {
    lines.push(`  ${event}: ${count}`);
  });

  if (report.scenarios.secondLaunch.failures.length > 0) {
    lines.push('', 'Failures:');
    report.scenarios.secondLaunch.failures.forEach((failure: string, i: number) => {
      lines.push(`  ${i + 1}. ${failure}`);
    });
  }

  lines.push(
    '',
    '--- Summary ---',
    `Total Events Tracked: ${report.summary.totalEvents}`,
    `Unique anonId: ${report.summary.uniqueAnonId ? 'YES' : 'NO'}`,
    `No Multiple Fires: ${report.summary.noMultipleFires ? 'YES' : 'NO'}`,
    `Second Launch Correct: ${report.summary.secondLaunchCorrect ? 'YES' : 'NO'}`,
    '',
    '=== End of Report ==='
  );

  return lines.join('\n');
}
