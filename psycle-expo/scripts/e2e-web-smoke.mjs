import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";

const cwd = process.cwd();
const port = String(process.env.PSYCLE_WEB_PORT || "19007");
const baseUrl = `http://127.0.0.1:${port}`;
const e2eEmail = process.env.E2E_TEST_EMAIL || "";
const e2ePassword = process.env.E2E_TEST_PASSWORD || "";
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

  await page.goto(baseUrl);

  await expect(page.locator('[data-testid="onboarding-subtitle"]')).toContainText(testCase.onboardingSubtitle);
  await page.locator('[data-testid="onboarding-start"]').click();
  await expect(page.locator('[data-testid="onboarding-interests-title"]')).toContainText(testCase.interestsTitle);
  await page.locator('[data-testid="onboarding-genre-mental"]').click();
  await page.locator('[data-testid="onboarding-finish"]').click();
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
    console.log("Web smoke passed: EN/JA onboarding -> auth sign-in -> lesson progression.");
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
