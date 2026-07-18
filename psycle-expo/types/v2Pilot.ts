export const V2_PILOT_SCHEMA_VERSION = 1 as const;
export const V2_PILOT_UNIT_ID = "ai-diversity-v1" as const;

export type V2PilotPredictionDirection = "decrease" | "same" | "increase";

export type V2PilotQualityComparison =
  | "higher_than_expected"
  | "as_expected"
  | "lower_than_expected";

export type V2PilotDay1Step =
  | "prediction"
  | "diversity_prediction"
  | "research"
  | "quality_update"
  | "boundary"
  | "recall"
  | "complete";

export interface V2PilotPrediction {
  direction: V2PilotPredictionDirection | null;
  reason: string;
  confidence: number | null;
}

export interface V2PilotQualityUpdate {
  comparison: V2PilotQualityComparison | null;
  reason: string;
  confidence: number | null;
}

export type V2PilotBoundaryHeadlineId =
  | "headline_1"
  | "headline_2"
  | "headline_3"
  | "headline_4";

export interface V2PilotBoundaryAnswer {
  boundaryTag: string;
  note: string;
}

export interface V2PilotRecall {
  answer: string;
  confidence: number | null;
}

export interface V2PilotSnapshot {
  schemaVersion: typeof V2_PILOT_SCHEMA_VERSION;
  unitId: typeof V2_PILOT_UNIT_ID;
  currentStep: V2PilotDay1Step;
  qualityPrediction: V2PilotPrediction;
  diversityPrediction: V2PilotPrediction;
  qualityUpdate: V2PilotQualityUpdate;
  boundaryAnswers: Record<
    V2PilotBoundaryHeadlineId,
    V2PilotBoundaryAnswer | null
  >;
  recall: V2PilotRecall;
  completedAt: string | null;
  updatedAt: string;
}
