import { estimateRunCostJpy } from "../../scripts/content-generator/src/costConfig";
import { createModelUsageSummary } from "../../scripts/content-generator/src/metrics";

describe("content-generator cost estimation", () => {
  test("estimates run cost from model usage rates", () => {
    const usage = createModelUsageSummary({
      relevance: "gemini-2.5-flash",
      extractor: "gemini-2.5-flash",
      generator: "gemini-3-flash-preview",
      critic: "gemini-2.0-flash",
    });

    usage.relevance.requests = 1;
    usage.relevance.inputTokens = 1_000_000;
    usage.relevance.outputTokens = 0;
    usage.relevance.totalTokens = 1_000_000;

    usage.generator.requests = 1;
    usage.generator.inputTokens = 0;
    usage.generator.outputTokens = 1_000_000;
    usage.generator.totalTokens = 1_000_000;

    const estimate = estimateRunCostJpy(usage, 5);

    // 2.5-flash input (¥45) + 3-flash-preview output (¥150) = ¥195
    expect(estimate.estimatedCostJpy).toBeCloseTo(195, 5);
    expect(estimate.costPerSavedQuestionJpy).toBeCloseTo(39, 5);
    expect(estimate.unknownModelRate).toBe(0);
  });

  test("returns null cost per saved question when savedQuestions is zero", () => {
    const usage = createModelUsageSummary({
      relevance: "gemini-2.5-flash",
      extractor: "gemini-2.5-flash",
      generator: "gemini-3-flash-preview",
      critic: "gemini-2.0-flash",
    });
    const estimate = estimateRunCostJpy(usage, 0);
    expect(estimate.costPerSavedQuestionJpy).toBeNull();
  });

  test("unknown model is fail-open with zero cost and non-zero unknown rate", () => {
    const usage = createModelUsageSummary({
      relevance: "unknown-model-x",
      extractor: "gemini-2.5-flash",
      generator: "gemini-3-flash-preview",
      critic: "gemini-2.0-flash",
    });

    usage.relevance.requests = 2;
    usage.relevance.inputTokens = 500_000;
    usage.relevance.outputTokens = 100_000;
    usage.relevance.totalTokens = 600_000;

    const estimate = estimateRunCostJpy(usage, 2);
    expect(estimate.byStage.relevance.costJpy).toBe(0);
    expect(estimate.byStage.relevance.unknownModel).toBe(true);
    expect(estimate.unknownModelRate).toBeGreaterThan(0);
  });
});
