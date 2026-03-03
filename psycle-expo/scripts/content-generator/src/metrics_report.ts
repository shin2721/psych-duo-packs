import { readPatrolRuns } from "./metrics";

function toPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function main(): void {
  const args = process.argv.slice(2);
  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 7;
  const rows = readPatrolRuns(Number.isFinite(days) ? days : 7);

  if (rows.length === 0) {
    console.log("No patrol metrics found in the selected window.");
    return;
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.newsFound += row.newsFound;
      acc.relevantNews += row.relevantNews;
      acc.seedsExtracted += row.seedsExtracted;
      acc.questionsGenerated += row.questionsGenerated;
      acc.deterministicPassed += row.deterministicPassed;
      acc.criticPassed += row.criticPassed;
      acc.savedQuestions += row.savedQuestions;
      acc.bundledLessons += row.bundledLessons;
      return acc;
    },
    {
      newsFound: 0,
      relevantNews: 0,
      seedsExtracted: 0,
      questionsGenerated: 0,
      deterministicPassed: 0,
      criticPassed: 0,
      savedQuestions: 0,
      bundledLessons: 0,
    }
  );

  const gateReasons: Record<string, number> = {};
  for (const row of rows) {
    for (const [reason, count] of Object.entries(row.gateFailureReasons || {})) {
      gateReasons[reason] = (gateReasons[reason] || 0) + count;
    }
  }

  const topReasons = Object.entries(gateReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log(`Psycle patrol metrics summary (last ${Number.isFinite(days) ? days : 7} days)`);
  console.log("============================================================");
  console.log(`Runs: ${rows.length}`);
  console.log(`News found: ${totals.newsFound}`);
  console.log(`Relevant: ${totals.relevantNews} (${toPercent(totals.relevantNews, totals.newsFound)})`);
  console.log(`Seeds extracted: ${totals.seedsExtracted} (${toPercent(totals.seedsExtracted, totals.relevantNews)})`);
  console.log(`Questions generated: ${totals.questionsGenerated}`);
  console.log(
    `Deterministic pass: ${totals.deterministicPassed} (${toPercent(
      totals.deterministicPassed,
      totals.questionsGenerated
    )})`
  );
  console.log(
    `Critic pass (after deterministic): ${totals.criticPassed} (${toPercent(
      totals.criticPassed,
      totals.deterministicPassed
    )})`
  );
  console.log(`Saved questions: ${totals.savedQuestions} (${toPercent(totals.savedQuestions, totals.questionsGenerated)})`);
  console.log(`Bundled lessons: ${totals.bundledLessons}`);

  if (topReasons.length > 0) {
    console.log("\nTop deterministic gate failure reasons:");
    for (const [reason, count] of topReasons) {
      console.log(`- ${reason}: ${count}`);
    }
  } else {
    console.log("\nTop deterministic gate failure reasons: none");
  }
}

main();
