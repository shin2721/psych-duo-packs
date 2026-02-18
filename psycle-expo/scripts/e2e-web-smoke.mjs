import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";

const cwd = process.cwd();
const port = String(process.env.PSYCLE_WEB_PORT || "19007");
const baseUrl = `http://127.0.0.1:${port}`;
const e2eEmail = process.env.E2E_TEST_EMAIL || "";
const e2ePassword = process.env.E2E_TEST_PASSWORD || "";
const smokeMode = e2eEmail && e2ePassword ? "authenticated" : "unauthenticated";
const expoArgs = [
  "./node_modules/expo/bin/cli",
  "start",
  "--port",
  port,
  "--localhost",
];

const logs = [];
let expoProcess;
let usingExistingServer = false;

function pushLog(prefix, chunk) {
  const text = chunk.toString("utf8");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    logs.push(`${prefix}${line}`);
    if (logs.length > 120) logs.shift();
  }
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // wait and retry
    }
    await delay(1000);
  }
  const tail = logs.slice(-20).join("\n");
  throw new Error(`Expo web server did not start within ${timeoutMs}ms.\nRecent logs:\n${tail}`);
}

async function isServerRunning(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function stopExpo() {
  if (usingExistingServer || !expoProcess || expoProcess.killed) return;
  expoProcess.kill("SIGINT");
  await delay(1500);
  if (!expoProcess.killed) {
    expoProcess.kill("SIGTERM");
  }
}

const LOCALE_SMOKE_CASES = [
  {
    locale: "en-US",
    onboardingSubtitle: "Build mental strength in just 3 minutes a day.",
    interestsTitle: "What do you want to learn?",
    questionRegex: /[A-Za-z]/,
  },
  {
    locale: "ja-JP",
    onboardingSubtitle: "1日3分で、心を強くする。",
    interestsTitle: "何を学びたいですか？",
    questionRegex: /[\u3040-\u30ff\u3400-\u9fff]/,
  },
];

async function runLocaleSmokeCase(browser, testCase) {
  const context = await browser.newContext({ locale: testCase.locale });
  const page = await context.newPage();

  if (smokeMode === "unauthenticated") {
    await runUnauthenticatedLocaleSmokeCase(page, testCase);
    await context.close();
    return;
  }

  await page.goto(baseUrl);

  const entrySurface = await detectEntrySurface(page);
  if (entrySurface === "onboarding") {
    await expect(page.locator('[data-testid="onboarding-subtitle"]')).toContainText(testCase.onboardingSubtitle, {
      timeout: 30_000,
    });
    await page.locator('[data-testid="onboarding-start"]').click();
    await expect(page.locator('[data-testid="onboarding-interests-title"]')).toContainText(testCase.interestsTitle, {
      timeout: 30_000,
    });
    await page.locator('[data-testid="onboarding-genre-mental"]').click();
    await page.locator('[data-testid="onboarding-finish"]').click();
  } else if (entrySurface === "unknown") {
    throw new Error(`Could not detect onboarding/auth/tabs entry surface for locale ${testCase.locale}.`);
  }

  await signInIfNeeded(page);

  const firstLessonNode = page.locator('[data-testid="lesson-node-m1"]');
  await expect(firstLessonNode).toBeVisible({ timeout: 30_000 });
  await firstLessonNode.click({ force: true });

  await page.locator('[data-testid="modal-primary-button"]').click();

  const progress = page.locator('[data-testid="lesson-progress"]');
  await expect(progress).toContainText("1 / 10", { timeout: 30_000 });

  const questionText = page.locator('[data-testid="question-text"]').first();
  await expect(questionText).toBeVisible();
  const text = (await questionText.textContent()) ?? "";
  if (!testCase.questionRegex.test(text)) {
    throw new Error(`Expected ${testCase.locale} question text, got: ${text}`);
  }

  await page.locator('[data-testid="answer-choice-0"]').first().click();
  await page.locator('[data-testid="question-continue"]').click();
  await expect(progress).toContainText("2 / 10");

  await context.close();
}

async function runUnauthenticatedLocaleSmokeCase(page, testCase) {
  await page.goto(`${baseUrl}/onboarding`);
  await expect(page.locator('[data-testid="onboarding-subtitle"]')).toContainText(testCase.onboardingSubtitle, {
    timeout: 30_000,
  });
  await page.locator('[data-testid="onboarding-start"]').click();
  await expect(page.locator('[data-testid="onboarding-interests-title"]')).toContainText(testCase.interestsTitle, {
    timeout: 30_000,
  });
  await page.locator('[data-testid="onboarding-genre-mental"]').click();
  await page.locator('[data-testid="onboarding-finish"]').click();
  await assertAuthGate(page);
}

async function detectEntrySurface(page) {
  const onboardingStart = page.locator('[data-testid="onboarding-start"]');
  const signInButton = page.locator('[data-testid="auth-sign-in"]');
  const courseTab = page.locator('[data-testid="tab-course"]');

  return Promise.race([
    onboardingStart.waitFor({ state: "visible", timeout: 30_000 }).then(() => "onboarding"),
    signInButton.waitFor({ state: "visible", timeout: 30_000 }).then(() => "auth"),
    courseTab.waitFor({ state: "visible", timeout: 30_000 }).then(() => "tabs"),
  ]).catch(() => "unknown");
}

async function assertAuthGate(page) {
  const authEmail = page.locator('[data-testid="auth-email"]');
  const authPassword = page.locator('[data-testid="auth-password"]');
  const courseTab = page.locator('[data-testid="tab-course"]');

  const surface = await Promise.race([
    authEmail.waitFor({ state: "visible", timeout: 30_000 }).then(() => "auth"),
    courseTab.waitFor({ state: "visible", timeout: 30_000 }).then(() => "tabs"),
  ]).catch(() => "unknown");

  if (surface === "tabs") {
    return;
  }

  if (surface === "auth") {
    await expect(authPassword).toBeVisible({ timeout: 30_000 });
    const signInButton = page.locator('[data-testid="auth-sign-in"]');
    if ((await signInButton.count()) > 0) {
      await expect(signInButton).toBeVisible({ timeout: 30_000 });
    }
    return;
  }

  const url = page.url();
  const bodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "")
    .slice(0, 280)
    .replace(/\n/g, " | ");
  throw new Error(`Could not confirm auth gate. url=${url} body=${bodySnippet}`);
}

async function signInIfNeeded(page) {
  const signInButton = page.locator('[data-testid="auth-sign-in"]');
  const courseTab = page.locator('[data-testid="tab-course"]');
  const landed = await Promise.race([
    signInButton.waitFor({ state: "visible", timeout: 25_000 }).then(() => "auth"),
    courseTab.waitFor({ state: "visible", timeout: 25_000 }).then(() => "tabs"),
  ]).catch(() => "unknown");

  if (landed === "tabs") {
    return;
  }

  if (!e2eEmail || !e2ePassword) {
    throw new Error("E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required when auth screen is shown.");
  }

  await page.locator('[data-testid="auth-email"]').fill(e2eEmail);
  await page.locator('[data-testid="auth-password"]').fill(e2ePassword);
  await signInButton.click();
  await expect(courseTab).toBeVisible({ timeout: 45_000 });
}

async function run() {
  usingExistingServer = await isServerRunning(baseUrl);
  if (!usingExistingServer) {
    expoProcess = spawn(process.execPath, expoArgs, {
      cwd,
      env: { ...process.env, EXPO_NO_TELEMETRY: "1", CI: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    expoProcess.stdout.on("data", (chunk) => pushLog("[expo] ", chunk));
    expoProcess.stderr.on("data", (chunk) => pushLog("[expo] ", chunk));
    expoProcess.on("exit", (code) => {
      if (code && code !== 0) {
        logs.push(`[expo] process exited with code ${code}`);
      }
    });
    await waitForServer(baseUrl, 180_000);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const testCase of LOCALE_SMOKE_CASES) {
      await runLocaleSmokeCase(browser, testCase);
    }

    await browser.close();
    console.log(`Web smoke passed (${smokeMode})`);
  } catch (error) {
    await browser.close();
    throw error;
  }
}

run()
  .catch((error) => {
    console.error(error);
    if (logs.length > 0) {
      console.error("Recent Expo logs:");
      console.error(logs.slice(-20).join("\n"));
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopExpo();
  });
