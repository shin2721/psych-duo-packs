#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const LESSON_ROOT = path.join(process.cwd(), "data", "lessons");
const DEFAULT_LOCALE = "ja";
const SUPPORTED_LOCALES = ["ja", "en", "fr", "es", "de", "ko", "pt", "zh"];

function parseArgs(argv) {
  const args = {
    allLocales: false,
    locale: DEFAULT_LOCALE,
    check: false,
    json: false,
  };

  for (const arg of argv) {
    if (arg === "--all-locales") args.allLocales = true;
    if (arg === "--check") args.check = true;
    if (arg === "--json") args.json = true;
    if (arg.startsWith("--locale=")) args.locale = arg.slice("--locale=".length);
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getLessonFiles(locale) {
  if (!fs.existsSync(LESSON_ROOT)) {
    throw new Error(`Lesson root not found: ${LESSON_ROOT}`);
  }

  const files = [];
  for (const dirName of fs.readdirSync(LESSON_ROOT)) {
    if (!dirName.endsWith("_units")) continue;
    const dirPath = path.join(LESSON_ROOT, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    for (const fileName of fs.readdirSync(dirPath)) {
      if (fileName.endsWith(`.${locale}.json`)) {
        files.push(path.join(dirPath, fileName));
      }
    }
  }

  return files.sort();
}

function hasTextArray(value) {
  return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim());
}

function hasInterventionFourSet(expandedDetails) {
  return Boolean(
    expandedDetails?.try_this &&
      expandedDetails?.tiny_metric?.before_prompt &&
      expandedDetails?.tiny_metric?.after_prompt &&
      expandedDetails?.tiny_metric?.success_rule &&
      expandedDetails?.tiny_metric?.stop_rule &&
      expandedDetails?.comparator?.baseline &&
      expandedDetails?.comparator?.cost &&
      expandedDetails?.fallback?.when &&
      expandedDetails?.fallback?.next
  );
}

function auditQuestion(question) {
  const expandedDetails = question.expanded_details ?? {};
  const missing = [];

  if (!question.source_id) missing.push("source_id");
  if (!question.evidence_grade) missing.push("evidence_grade");
  if (!expandedDetails.claim_type) missing.push("claim_type");
  if (!expandedDetails.evidence_type) missing.push("evidence_type");
  if (!expandedDetails.citation_role) missing.push("citation_role");
  if (!hasTextArray(expandedDetails.best_for)) missing.push("best_for");
  if (!hasTextArray(expandedDetails.limitations)) missing.push("limitations");

  if (expandedDetails.claim_type === "intervention" && !hasInterventionFourSet(expandedDetails)) {
    missing.push("intervention_four_set");
  }

  return missing;
}

function auditLesson(filePath) {
  const questions = readJson(filePath);
  if (!Array.isArray(questions)) {
    throw new Error(`Lesson file must be an array: ${filePath}`);
  }

  const questionIssues = questions
    .map((question) => ({
      id: question.id ?? "(missing id)",
      missing: auditQuestion(question),
    }))
    .filter((issue) => issue.missing.length > 0);

  return {
    lesson: path.relative(process.cwd(), filePath),
    total: questions.length,
    issue_count: questionIssues.length,
    issues: questionIssues,
  };
}

function printTextReport(results, locale) {
  console.log(`Lesson perspective audit (${locale})`);
  console.log("================================");

  for (const result of results) {
    const status = result.issue_count === 0 ? "PASS" : "FAIL";
    console.log(`${status} ${result.lesson} (${result.issue_count}/${result.total} questions with gaps)`);

    for (const issue of result.issues) {
      console.log(`  - ${issue.id}: ${issue.missing.join(", ")}`);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
const locales = args.allLocales ? SUPPORTED_LOCALES : [args.locale];
const results = locales.flatMap((locale) =>
  getLessonFiles(locale).map((filePath) => ({
    locale,
    ...auditLesson(filePath),
  }))
);
const failed = results.filter((result) => result.issue_count > 0);

if (args.json) {
  console.log(
    JSON.stringify(
      {
        locales,
        failed_count: failed.length,
        results,
      },
      null,
      2
    )
  );
} else {
  for (const locale of locales) {
    printTextReport(
      results.filter((result) => result.locale === locale),
      locale
    );
    if (locales.length > 1) console.log("");
  }
}

if (args.check && failed.length > 0) {
  process.exit(1);
}
