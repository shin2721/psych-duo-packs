import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";

const cwd = process.cwd();
const port = String(process.env.PSYCLE_WEB_PORT || "19007");
const baseUrl = `http://127.0.0.1:${port}`;
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
const e2eEmail = process.env.E2E_TEST_EMAIL?.trim() || "";
const e2ePassword = process.env.E2E_TEST_PASSWORD?.trim() || "";
const runAuthenticatedFlow = Boolean(e2eEmail && e2ePassword);
const entitlements = JSON.parse(
  readFileSync(new URL("../config/entitlements.json", import.meta.url), "utf8")
);

function normalizePositiveInt(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

const defaultLessonSize = normalizePositiveInt(entitlements.defaults?.lesson_size, 10);
const firstSessionLessonSize = normalizePositiveInt(
  entitlements.defaults?.first_session_lesson_size,
  Math.min(5, defaultLessonSize)
);

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

// Locale policy (config/locales.json): ja is the source; other locales are
// generated and switched on through `active`. A browser set to a language that
// is NOT active must still get a coherent ja UI — the fallback cases prove that.
// When a locale is activated, drop it from the fallback set here and add a real
// case with that locale's copy.
const localeConfig = JSON.parse(readFileSync(new URL("../config/locales.json", import.meta.url), "utf8"));

const JA_COPY = {
  onboardingSubtitle: "1日3分で、心を強くする。",
  interestsTitle: "今日、少し軽くしたいことは？",
  questionRegex: /[\u3040-\u30ff\u3400-\u9fff]/,
};

// Browser locale tags for the generation targets (used only while they are inactive).
const FALLBACK_BROWSER_LOCALES = { en: "en-US", es: "es-ES", zh: "zh-CN", fr: "fr-FR", de: "de-DE", ko: "ko-KR", pt: "pt-BR" };
const inactiveFallbackCases = localeConfig.targets
  .filter((locale) => !localeConfig.active.includes(locale) && FALLBACK_BROWSER_LOCALES[locale])
  .slice(0, 1) // one inactive language is enough to prove the fallback
  .map((locale) => ({ locale: FALLBACK_BROWSER_LOCALES[locale], ...JA_COPY }));

const LOCALE_SMOKE_CASES = [
  ...inactiveFallbackCases,
  { locale: "ja-JP", ...JA_COPY },
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

  const authInputs = page.locator('input');
  await expect(authInputs.nth(0)).toBeVisible();
  await expect(authInputs.nth(1)).toBeVisible();

  if (!runAuthenticatedFlow) {
    await context.close();
    return;
  }

  await authInputs.nth(0).fill(e2eEmail);
  await authInputs.nth(1).fill(e2ePassword);
  await page.locator('button').first().click();

  const firstLessonNode = page.locator('[data-testid="lesson-node-m1"]');
  await expect(firstLessonNode).toBeVisible({ timeout: 30_000 });
  await firstLessonNode.click({ force: true });

  await page.locator('[data-testid="modal-primary-button"]').click();

  const progress = page.locator('[data-testid="lesson-progress"]');
  await expect(progress).toContainText(`1 / ${firstSessionLessonSize}`, { timeout: 30_000 });

  const questionText = page.locator('[data-testid="question-text"]').first();
  await expect(questionText).toBeVisible();
  const text = (await questionText.textContent()) ?? "";
  if (!testCase.questionRegex.test(text)) {
    throw new Error(`Expected ${testCase.locale} question text, got: ${text}`);
  }

  await page.locator('[data-testid="answer-choice-0"]').first().click();
  await page.locator('[data-testid="question-continue"]').click();
  await expect(progress).toContainText(`2 / ${firstSessionLessonSize}`);

  await context.close();
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
    if (runAuthenticatedFlow) {
      console.log("Web smoke passed (authenticated): ja onboarding (en-US falls back to ja) -> sign in -> lesson progression.");
    } else {
      console.log("Web smoke passed (unauthenticated): ja onboarding (en-US falls back to ja) -> auth screen visible.");
    }
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
