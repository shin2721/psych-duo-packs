#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import dotenv from "dotenv";

const DEFAULT_HOST = "https://app.posthog.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.posthog.local");

function readExistingEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  try {
    const raw = fs.readFileSync(ENV_PATH, "utf8");
    return dotenv.parse(raw);
  } catch {
    return {};
  }
}

function envLiteral(value) {
  return JSON.stringify(value);
}

async function main() {
  const existing = readExistingEnv();
  const rl = createInterface({ input, output });

  console.log("PostHog credentials setup (saved once for this project)");
  console.log(`File: ${ENV_PATH}`);

  const keyDefault = existing.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_PERSONAL_API_KEY || "";
  const projectDefault = existing.POSTHOG_PROJECT_ID || process.env.POSTHOG_PROJECT_ID || "";
  const hostDefault = existing.POSTHOG_HOST || process.env.POSTHOG_HOST || DEFAULT_HOST;

  const keyPrompt = keyDefault
    ? "POSTHOG_PERSONAL_API_KEY (Enterで既存値を維持): "
    : "POSTHOG_PERSONAL_API_KEY: ";
  const projectPrompt = projectDefault
    ? "POSTHOG_PROJECT_ID (Enterで既存値を維持): "
    : "POSTHOG_PROJECT_ID: ";
  const hostPrompt = `POSTHOG_HOST (default: ${hostDefault}): `;

  const keyInput = (await rl.question(keyPrompt)).trim();
  const projectInput = (await rl.question(projectPrompt)).trim();
  const hostInput = (await rl.question(hostPrompt)).trim();

  rl.close();

  const token = keyInput || keyDefault;
  const projectId = projectInput || projectDefault;
  const host = hostInput || hostDefault || DEFAULT_HOST;

  if (!token || !projectId) {
    console.error("POSTHOG_PERSONAL_API_KEY と POSTHOG_PROJECT_ID は必須です。");
    process.exit(1);
  }

  const content = [
    "# Local PostHog credentials for analytics scripts",
    "# This file is gitignored and safe to keep on your machine.",
    `POSTHOG_PERSONAL_API_KEY=${envLiteral(token)}`,
    `POSTHOG_PROJECT_ID=${envLiteral(projectId)}`,
    `POSTHOG_HOST=${envLiteral(host)}`,
    "",
  ].join("\n");

  fs.writeFileSync(ENV_PATH, content, "utf8");

  console.log("\nSaved.");
  console.log("You can now run without export:");
  console.log("- npm run analytics:posthog:dashboard:dry");
  console.log("- npm run analytics:posthog:kpi-report");
}

main().catch((error) => {
  console.error("Failed to setup PostHog env.");
  console.error(error?.message || error);
  process.exit(1);
});
