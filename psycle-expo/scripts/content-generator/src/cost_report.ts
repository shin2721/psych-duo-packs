import { estimateRunCostJpy } from "./costConfig";
import { readPatrolRuns, ModelUsageStage } from "./metrics";

type ModelAggregate = {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostJpy: number;
};

function main(): void {
  const args = process.argv.slice(2);
  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 30;
  const rows = readPatrolRuns(Number.isFinite(days) ? days : 30);

  if (rows.length === 0) {
    console.log("No patrol metrics found in the selected window.");
    return;
  }

  let totalSaved = 0;
  let totalCost = 0;
  let totalUnknownRate = 0;

  const byModel = new Map<string, ModelAggregate>();

  for (const row of rows) {
    totalSaved += row.savedQuestions;

    const runCost = estimateRunCostJpy(row.modelUsage, row.savedQuestions);
    totalCost += runCost.estimatedCostJpy;
    totalUnknownRate += runCost.unknownModelRate;

    (Object.keys(row.modelUsage) as ModelUsageStage[]).forEach((stage) => {
      const usage = row.modelUsage[stage];
      const stageCost = runCost.byStage[stage].costJpy;

      const current = byModel.get(usage.model) || {
        model: usage.model,
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostJpy: 0,
      };

      current.requests += usage.requests;
      current.inputTokens += usage.inputTokens;
      current.outputTokens += usage.outputTokens;
      current.totalTokens += usage.totalTokens;
      current.estimatedCostJpy += stageCost;
      byModel.set(usage.model, current);
    });
  }

  const sorted = [...byModel.values()].sort((a, b) => b.estimatedCostJpy - a.estimatedCostJpy);
  const unknownRateAvg = rows.length > 0 ? totalUnknownRate / rows.length : 0;

  console.log(`Psycle cost summary (last ${Number.isFinite(days) ? days : 30} days)`);
  console.log("============================================================");
  console.log(`Runs: ${rows.length}`);
  console.log(`Estimated API cost (JPY): ¥${totalCost.toFixed(2)}`);
  console.log(`Saved questions: ${totalSaved}`);
  console.log(`Cost per saved question (JPY): ${totalSaved > 0 ? `¥${(totalCost / totalSaved).toFixed(2)}` : "N/A"}`);
  console.log(`Average unknown_model_rate: ${(unknownRateAvg * 100).toFixed(2)}%`);

  if (unknownRateAvg > 0) {
    console.warn("[cost] unknown_model_rate detected. Update costConfig.ts for missing model rates.");
  }

  console.log("\nModel breakdown:");
  for (const row of sorted) {
    console.log(
      `- ${row.model}: requests=${row.requests}, input=${row.inputTokens}, output=${row.outputTokens}, total=${row.totalTokens}, cost=¥${row.estimatedCostJpy.toFixed(2)}`
    );
  }
}

main();
