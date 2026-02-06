import { spawn } from "node:child_process";
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
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl);

    await page.locator('[data-testid="onboarding-start"]').click();
    await page.locator('[data-testid="onboarding-genre-mental"]').click();
    await page.locator('[data-testid="onboarding-finish"]').click();
    await page.locator('[data-testid="auth-guest-login"]').click();

    const firstLessonNode = page.locator('[data-testid="lesson-node-m1"]');
    await expect(firstLessonNode).toBeVisible({ timeout: 30_000 });
    await firstLessonNode.click({ force: true });

    await page.locator('[data-testid="modal-primary-button"]').click();

    const progress = page.locator('[data-testid="lesson-progress"]');
    await expect(progress).toContainText("1 / 10", { timeout: 30_000 });

    const questionText = page.locator('[data-testid="question-text"]').first();
    await expect(questionText).toBeVisible();
    const text = (await questionText.textContent()) ?? "";
    if (!/[A-Za-z]/.test(text)) {
      throw new Error(`Expected EN question text, got: ${text}`);
    }

    await page.locator('[data-testid="answer-choice-0"]').first().click();
    await page.locator('[data-testid="question-continue"]').click();
    await expect(progress).toContainText("2 / 10");

    await browser.close();
    console.log("Web smoke passed: onboarding -> guest login -> lesson progression.");
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
