import {
  createModelUsageSummary,
  extractUsageMetadata,
  recordModelUsage,
} from "../../scripts/content-generator/src/metrics";

describe("content-generator metrics usage tracking", () => {
  test("extracts usage metadata when response contains token counts", () => {
    const usage = extractUsageMetadata({
      usageMetadata: {
        promptTokenCount: 120,
        candidatesTokenCount: 45,
        totalTokenCount: 165,
      },
    });

    expect(usage).toEqual({
      inputTokens: 120,
      outputTokens: 45,
      totalTokens: 165,
    });
  });

  test("returns zero usage when usage metadata is missing", () => {
    const usage = extractUsageMetadata({});
    expect(usage).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
  });

  test("accumulates multi-stage usage with request counts", () => {
    const summary = createModelUsageSummary({
      relevance: "gemini-2.5-flash",
      extractor: "gemini-2.5-flash",
      generator: "gemini-3-flash-preview",
      critic: "gemini-2.0-flash",
    });

    recordModelUsage(summary, "relevance", "gemini-2.5-flash", {
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
    });
    recordModelUsage(summary, "relevance", "gemini-2.5-flash", {
      inputTokens: 7,
      outputTokens: 1,
      totalTokens: 8,
    });
    recordModelUsage(summary, "generator", "gemini-3-flash-preview", {
      inputTokens: 100,
      outputTokens: 40,
      totalTokens: 140,
    });

    expect(summary.relevance.requests).toBe(2);
    expect(summary.relevance.inputTokens).toBe(17);
    expect(summary.relevance.outputTokens).toBe(3);
    expect(summary.relevance.totalTokens).toBe(20);

    expect(summary.generator.requests).toBe(1);
    expect(summary.generator.totalTokens).toBe(140);
    expect(summary.extractor.requests).toBe(0);
    expect(summary.critic.requests).toBe(0);
  });
});
