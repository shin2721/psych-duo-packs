import { ModelUsageSummary, ModelUsageStage, StageModelUsage } from "./metrics";

export type ModelTokenRateJpy = {
  inputPerMillionJpy: number;
  outputPerMillionJpy: number;
};

// Update this table when provider pricing changes.
export const MODEL_TOKEN_RATE_JPY: Record<string, ModelTokenRateJpy> = {
  "gemini-3-flash-preview": { inputPerMillionJpy: 45, outputPerMillionJpy: 150 },
  "gemini-2.5-flash": { inputPerMillionJpy: 45, outputPerMillionJpy: 150 },
  "gemini-2.0-flash": { inputPerMillionJpy: 15, outputPerMillionJpy: 60 },
};

export type StageCostBreakdown = Record<ModelUsageStage, { model: string; costJpy: number; unknownModel: boolean }>;

export type RunCostEstimate = {
  estimatedCostJpy: number;
  costPerSavedQuestionJpy: number | null;
  unknownModelRate: number;
  byStage: StageCostBreakdown;
};

function estimateStageCostJpy(usage: StageModelUsage): { costJpy: number; unknownModel: boolean } {
  const rate = MODEL_TOKEN_RATE_JPY[usage.model];
  if (!rate) {
    return { costJpy: 0, unknownModel: usage.requests > 0 };
  }

  const inputCost = (usage.inputTokens / 1_000_000) * rate.inputPerMillionJpy;
  const outputCost = (usage.outputTokens / 1_000_000) * rate.outputPerMillionJpy;
  return { costJpy: inputCost + outputCost, unknownModel: false };
}

export function estimateRunCostJpy(modelUsage: ModelUsageSummary, savedQuestions: number): RunCostEstimate {
  let estimatedCostJpy = 0;
  let totalRequests = 0;
  let unknownRequests = 0;

  const byStage: StageCostBreakdown = {
    relevance: { model: modelUsage.relevance.model, costJpy: 0, unknownModel: false },
    extractor: { model: modelUsage.extractor.model, costJpy: 0, unknownModel: false },
    generator: { model: modelUsage.generator.model, costJpy: 0, unknownModel: false },
    critic: { model: modelUsage.critic.model, costJpy: 0, unknownModel: false },
  };

  (Object.keys(modelUsage) as ModelUsageStage[]).forEach((stage) => {
    const usage = modelUsage[stage];
    totalRequests += usage.requests;

    const stageCost = estimateStageCostJpy(usage);
    byStage[stage] = {
      model: usage.model,
      costJpy: stageCost.costJpy,
      unknownModel: stageCost.unknownModel,
    };

    if (stageCost.unknownModel) {
      unknownRequests += usage.requests;
    }
    estimatedCostJpy += stageCost.costJpy;
  });

  return {
    estimatedCostJpy,
    costPerSavedQuestionJpy: savedQuestions > 0 ? estimatedCostJpy / savedQuestions : null,
    unknownModelRate: totalRequests > 0 ? unknownRequests / totalRequests : 0,
    byStage,
  };
}
