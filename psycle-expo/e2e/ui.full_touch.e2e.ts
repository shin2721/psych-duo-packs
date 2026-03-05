import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

jest.setTimeout(360000);

describe('UI Full Touch Walkthrough', () => {
  beforeAll(async () => {
    await device.resetContentAndSettings();
    await device.installApp();
  });

  it('should touch core, social, monetization, settings and support routes', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
      },
    });

    await device.disableSynchronization();
    await sleep(1000);

    const entryPoint = await waitForAnyVisibleById(
      ['onboarding-start', 'onboarding-interests-title', 'auth-guest-login', 'tab-course'],
      90000
    );

    if (entryPoint === 'onboarding-start') {
      await element(by.id('onboarding-start')).tap();
      await waitFor(element(by.id('onboarding-interests-title'))).toBeVisible().withTimeout(10000);
      await finishOnboardingInterests('onboarding-genre-mental');
    } else if (entryPoint === 'onboarding-interests-title') {
      await finishOnboardingInterests('onboarding-genre-mental');
    }

    const postOnboardingEntry = await waitForAnyVisibleById(
      ['auth-guest-login', 'tab-course'],
      45000
    );
    if (postOnboardingEntry === 'auth-guest-login') {
      await element(by.id('auth-guest-login')).tap();
      await sleep(1500);
    }

    await dismissBlockingSystemAlerts();

    // Course + Lesson touch
    await waitFor(element(by.id('tab-course'))).toBeVisible().withTimeout(30000);
    await element(by.id('tab-course')).tap();
    await waitFor(element(by.id('lesson-node-m1'))).toBeVisible().withTimeout(20000);
    await element(by.id('lesson-node-m1')).tap();
    await waitFor(element(by.id('modal-primary-button'))).toBeVisible().withTimeout(10000);
    await tapModalPrimaryUntilLessonOpens();
    await waitFor(element(by.id('lesson-screen'))).toBeVisible().withTimeout(30000);
    await device.takeScreenshot(`ui-touch-lesson-${Date.now()}`);

    // 최소 1回答操作
    if (await isVisibleById('answer-choice-0', 5000)) {
      await element(by.id('answer-choice-0')).tap();
      await sleep(500);
    }
    if (await isVisibleById('question-continue', 5000)) {
      await element(by.id('question-continue')).tap();
      await sleep(500);
    }

    if (await isVisibleById('lesson-e2e-exit', 5000)) {
      await element(by.id('lesson-e2e-exit')).tap();
      await sleep(1000);
    }

    // Tabs touch
    await tapTabAndCapture('tab-quests', 'ui-touch-quests');
    await tapTabAndCapture('tab-leaderboard', 'ui-touch-leaderboard');
    await tapTabAndCapture('tab-friends', 'ui-touch-friends');
    await tapTabAndCapture('tab-shop', 'ui-touch-shop');
    await tapTabAndCapture('tab-profile', 'ui-touch-profile');

    // Profile quick action touch (optional: visibility depends on current progress state)
    if (await isVisibleById('mistakes-hub-button', 3000)) {
      await device.takeScreenshot(`ui-touch-profile-actions-${Date.now()}`);
    } else {
      await device.takeScreenshot(`ui-touch-profile-actions-missing-${Date.now()}`);
    }

    // Edit profile route touch
    await waitFor(element(by.id('profile-edit-profile'))).toBeVisible().withTimeout(10000);
    await element(by.id('profile-edit-profile')).tap();
    await waitFor(element(by.id('edit-profile-username'))).toBeVisible().withTimeout(10000);
    await device.takeScreenshot(`ui-touch-edit-profile-${Date.now()}`);
    await element(by.id('edit-profile-close')).tap();
    await sleep(800);

    // Settings route touch
    if (await isVisibleById('profile-open-settings', 3000)) {
      await element(by.id('profile-open-settings')).tap();
    } else {
      await device.openURL({ url: 'psycle://settings' });
    }
    await waitFor(element(by.id('settings-scroll'))).toBeVisible().withTimeout(10000);
    await device.takeScreenshot(`ui-touch-settings-${Date.now()}`);

    // Analytics debug route touch
    await scrollUntilVisibleById('settings-scroll', 'open-analytics-debug', 8);
    await waitFor(element(by.id('open-analytics-debug'))).toBeVisible().withTimeout(10000);
    await element(by.id('open-analytics-debug')).tap();
    await sleep(800);
    if (await isVisibleById('analytics-status', 5000)) {
      await device.takeScreenshot(`ui-touch-analytics-debug-${Date.now()}`);
    } else {
      await device.takeScreenshot(`ui-touch-analytics-debug-missing-${Date.now()}`);
    }

    // Deep-link touch for review / mistakes-hub routes
    await device.openURL({ url: 'psycle://review' });
    await waitFor(element(by.id('review-screen'))).toBeVisible().withTimeout(15000);
    await device.takeScreenshot(`ui-touch-review-${Date.now()}`);

    await device.openURL({ url: 'psycle://mistakes-hub' });
    await waitFor(element(by.id('mistakes-hub-screen'))).toBeVisible().withTimeout(15000);
    if (await isVisibleById('mistakes-hub-empty', 5000)) {
      await detoxExpect(element(by.id('mistakes-hub-empty'))).toBeVisible();
    }
    await device.takeScreenshot(`ui-touch-mistakes-hub-${Date.now()}`);

    // Minimal completion assertions
    await detoxExpect(element(by.id('mistakes-hub-screen'))).toBeVisible();
  });
});

async function tapTabAndCapture(tabId: string, screenshotPrefix: string): Promise<void> {
  await waitFor(element(by.id(tabId))).toBeVisible().withTimeout(15000);
  await element(by.id(tabId)).tap();
  await sleep(800);
  await device.takeScreenshot(`${screenshotPrefix}-${Date.now()}`);
}

async function finishOnboardingInterests(genreTestID: string, timeoutMs = 20000): Promise<void> {
  await waitFor(element(by.id('onboarding-interests-title'))).toBeVisible().withTimeout(10000);
  await element(by.id(genreTestID)).tap();
  await waitFor(element(by.id('onboarding-finish'))).toBeVisible().withTimeout(10000);

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await element(by.id('onboarding-finish')).tap();
    await sleep(300);
    if (!(await isVisibleById('onboarding-interests-title', 900))) {
      await sleep(600);
      return;
    }
  }

  throw new Error('Timed out completing onboarding interests');
}

async function tapModalPrimaryUntilLessonOpens(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    if (await isVisibleById('lesson-screen', 1200)) return;

    if (await isVisibleById('tab-shop', 1200)) {
      throw new Error('Navigation went to shop before lesson screen');
    }

    if (await isVisibleById('modal-primary-button', 1200)) {
      await element(by.id('modal-primary-button')).tap();
    }
    await sleep(1000);
  }
  throw new Error('Lesson screen did not open');
}

async function scrollUntilVisibleById(anchorTestID: string, targetTestID: string, maxSwipes = 6): Promise<void> {
  for (let i = 0; i < maxSwipes; i++) {
    if (await isVisibleById(targetTestID, 800)) return;
    await element(by.id(anchorTestID)).swipe('up', 'fast', 0.7);
    await sleep(250);
  }
}

async function waitForAnyVisibleById(testIDs: string[], timeoutMs: number): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const id of testIDs) {
      if (await isVisibleById(id, 800)) return id;
    }
    await sleep(400);
  }
  throw new Error(`Timed out waiting for any visible element: ${testIDs.join(', ')}`);
}

async function isVisibleById(testID: string, timeout = 1200): Promise<boolean> {
  try {
    await waitFor(element(by.id(testID))).toBeVisible().withTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function isVisibleByText(text: string, timeout = 900): Promise<boolean> {
  try {
    await waitFor(element(by.text(text))).toBeVisible().withTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function tapFirstVisibleText(texts: string[], timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const text of texts) {
      if (await isVisibleByText(text, 700)) {
        await element(by.text(text)).tap();
        return true;
      }
    }
    await sleep(250);
  }
  return false;
}

async function dismissBlockingSystemAlerts(): Promise<void> {
  const dismissTexts = ['許可しない', '許可', 'OK', '閉じる', '今はしない', '後で', 'Don’t Allow', "Don't Allow", 'Allow', 'Not Now', 'Later', 'Close'];
  for (let i = 0; i < 3; i++) {
    const tapped = await tapFirstVisibleText(dismissTexts, 1200);
    if (!tapped) return;
    await sleep(300);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
