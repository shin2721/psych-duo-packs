import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

jest.setTimeout(240000);

describe('Course Capture', () => {
  beforeAll(async () => {
    await device.resetContentAndSettings();
    await device.installApp();
  });

  it('captures the current course entry screen', async () => {
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

    await waitFor(element(by.id('tab-course'))).toBeVisible().withTimeout(30000);
    await element(by.id('tab-course')).tap();
    await sleep(1200);
    await detoxExpect(element(by.id('tab-course'))).toBeVisible();
    await device.takeScreenshot(`course-capture-${Date.now()}`);
  });
});

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
