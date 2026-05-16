const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = runGit(["rev-parse", "--show-toplevel"]).trim();
const PROGRESS_FILE = "psycle-expo/docs/NORTH_STAR_PROGRESS.md";

const WATCHED_PATTERNS = [
  /^psycle-expo\/docs\/PRINCIPLES\.md$/,
  /^psycle-expo\/docs\/CONTENT_SYSTEM_SPEC\.md$/,
  /^psycle-expo\/docs\/ENGAGEMENT_PRINCIPLES\.md$/,
  /^psycle-expo\/docs\/BIGAPP_ROADMAP\.md$/,
  /^psycle-expo\/data\/content-intake\//,
  /^psycle-expo\/data\/lessons\//,
  /^psycle-expo\/lib\/lesson\//,
  /^psycle-expo\/lib\/lesson-data\//,
  /^psycle-expo\/lib\/analytics-events\//,
  /^psycle-expo\/lib\/analytics\.events\.ts$/,
  /^psycle-expo\/components\/lesson\//,
  /^psycle-expo\/app\/lesson\.tsx$/,
  /^psycle-expo\/config\/gamification\.json$/,
  /^psycle-expo\/scripts\/content-intake\.js$/,
  /^psycle-expo\/scripts\/append-north-star-progress\.js$/,
  /^psycle-expo\/scripts\/check-north-star-progress\.js$/,
  /^AGENTS\.md$/,
];

const changedFiles = getChangedFiles();
const progressChanged = changedFiles.includes(PROGRESS_FILE);
const relevantFiles = changedFiles.filter(
  (file) => file !== PROGRESS_FILE && WATCHED_PATTERNS.some((pattern) => pattern.test(file))
);

if (relevantFiles.length > 0 && !progressChanged && process.env.ALLOW_STALE_NORTH_STAR_PROGRESS !== "1") {
  console.error("NORTH_STAR_PROGRESS.md may be stale.");
  console.error("");
  console.error("Relevant changed files:");
  relevantFiles.forEach((file) => console.error(`- ${file}`));
  console.error("");
  console.error("Update the handoff with:");
  console.error(
    'npm run progress:north-star:note -- --summary "..." --changed "..." --verified "..." --remaining "..."'
  );
  console.error("");
  console.error("If this is intentionally unrelated, rerun with ALLOW_STALE_NORTH_STAR_PROGRESS=1.");
  process.exit(1);
}

console.log("north-star progress handoff: OK");

function getChangedFiles() {
  return unique([...getStatusFiles(), ...getCiDiffFiles()]);
}

function getStatusFiles() {
  const status = runGit(["status", "--porcelain"]);
  return status
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .flatMap(parseStatusLine)
    .filter(Boolean)
    .map(normalizePath);
}

function getCiDiffFiles() {
  const diffRange = resolveCiDiffRange();
  if (!diffRange) return [];

  const result = spawnSync("git", ["diff", "--name-only", diffRange], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    console.warn(`WARN: could not inspect CI diff range ${diffRange}: ${result.stderr.trim()}`);
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function resolveCiDiffRange() {
  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}...HEAD`;
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return "";

  try {
    const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    if (event.before && event.after && !/^0+$/.test(event.before)) {
      return `${event.before}..${event.after}`;
    }
  } catch (error) {
    console.warn(`WARN: could not parse GITHUB_EVENT_PATH: ${error.message}`);
  }

  return "";
}

function parseStatusLine(line) {
  const file = line.slice(3);
  if (file.includes(" -> ")) {
    return file.split(" -> ").map((part) => part.trim());
  }
  return [file.trim()];
}

function normalizePath(file) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("../")) {
    return path.relative(REPO_ROOT, path.resolve(PROJECT_DIR, normalized)).replace(/\\/g, "/");
  }
  if (path.isAbsolute(normalized)) {
    return path.relative(REPO_ROOT, normalized).replace(/\\/g, "/");
  }
  if (!normalized.startsWith("psycle-expo/") && normalized !== "AGENTS.md") {
    const fromProject = path.relative(REPO_ROOT, path.resolve(PROJECT_DIR, normalized)).replace(/\\/g, "/");
    if (fromProject.startsWith("psycle-expo/")) return fromProject;
  }
  return normalized;
}

function unique(items) {
  return [...new Set(items)];
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: PROJECT_DIR,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}
