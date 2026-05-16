const fs = require("fs");
const path = require("path");

const PROGRESS_PATH = path.join(__dirname, "..", "docs", "NORTH_STAR_PROGRESS.md");
const LOG_HEADING = "## Update Log";

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  printUsage();
  process.exit(0);
}

const summary = first(args.summary);
if (!summary) {
  printUsage();
  throw new Error("--summary is required.");
}

const today = new Date().toISOString().slice(0, 10);
const entry = [
  `### ${today} - ${summary}`,
  "",
  `- Changed: ${first(args.changed) || "Not specified."}`,
  `- Verified: ${first(args.verified) || "Not specified."}`,
  `- Remaining: ${first(args.remaining) || "Not specified."}`,
  ...(first(args.next) ? [`- Next: ${first(args.next)}`] : []),
  "",
].join("\n");

const current = fs.readFileSync(PROGRESS_PATH, "utf8");
const next = insertLogEntry(current, entry);

if (args["dry-run"]) {
  console.log(entry);
} else {
  fs.writeFileSync(PROGRESS_PATH, next);
  console.log(`Updated ${path.relative(process.cwd(), PROGRESS_PATH)}`);
}

function insertLogEntry(content, logEntry) {
  const headingIndex = content.indexOf(LOG_HEADING);
  if (headingIndex === -1) {
    return `${content.trimEnd()}\n\n${LOG_HEADING}\n\n${logEntry}`;
  }

  const afterHeadingIndex = content.indexOf("\n", headingIndex);
  if (afterHeadingIndex === -1) {
    return `${content.trimEnd()}\n\n${logEntry}`;
  }

  let insertAt = afterHeadingIndex + 1;
  while (content[insertAt] === "\n") {
    insertAt += 1;
  }

  return `${content.slice(0, afterHeadingIndex + 1)}\n${logEntry}\n${content.slice(insertAt)}`;
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = rawArgs[index + 1];
    const value = !next || next.startsWith("--") ? true : next;
    if (value !== true) index += 1;

    if (!parsed[key]) parsed[key] = [];
    parsed[key].push(value);
  }
  return parsed;
}

function first(value) {
  if (!Array.isArray(value) || value.length === 0) return "";
  const item = value[0];
  return typeof item === "string" ? item.trim() : "";
}

function printUsage() {
  console.log(`Usage:
  npm run progress:north-star:note -- \\
    --summary "Short update" \\
    --changed "What changed" \\
    --verified "What passed" \\
    --remaining "What still needs work"

Optional:
  --next "Suggested next step"
  --dry-run`);
}
