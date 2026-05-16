export type PsycleDomain = "mental" | "money" | "work" | "health" | "social" | "study";

export type PainBacklogSource =
  | "user_interview"
  | "app_behavior"
  | "support_review"
  | "search_query"
  | "community_observation"
  | "manual_research";

export type LessonCandidateDecision =
  | "ignore"
  | "backlog"
  | "refresh_existing"
  | "mastery_variant"
  | "new_core_lesson"
  | "human_review";

export type ResearchFindingClass =
  | "new_mechanism"
  | "better_intervention"
  | "boundary_update"
  | "replication"
  | "contradiction"
  | "interesting_but_not_actionable";

export interface LessonWorthinessScore {
  pain: 1 | 2 | 3;
  recurrence: 1 | 2 | 3;
  actionability: 1 | 2 | 3;
  evidence_strength: 1 | 2 | 3;
  novelty: 1 | 2 | 3;
  total: number;
}

export interface ResearchCritique {
  finding_class: ResearchFindingClass;
  study_design: string;
  sample_size: number | null;
  control_quality: "none" | "weak" | "moderate" | "strong" | "not_applicable";
  effect_size: string;
  preregistration: "yes" | "no" | "unclear" | "not_applicable";
  confounders: string[];
  generalizability: "low" | "medium" | "high" | "unclear";
  replication_status: "none" | "mixed" | "supported" | "failed" | "not_applicable";
  hype_risk: "low" | "medium" | "high";
  safe_usage_scope: "fact" | "explanation" | "intervention" | "reflection_only";
}

export interface LessonInsightLayer {
  surprising_question: string;
  research_finding: string;
  critical_caveat: string;
  usable_scope: string;
  practice_prompt: string;
}

export interface PainBacklogItem {
  pain_id: string;
  domain: PsycleDomain;
  recurring_pain: string;
  life_scene: string;
  source: PainBacklogSource;
  observed_signal: string;
  affected_user_segment: string;
  recurrence_notes: string;
  candidate_status: "new" | "triaged" | "linked_to_candidate" | "closed";
  created_at: string;
}

export interface LessonCandidateRecord {
  candidate_id: string;
  domain: PsycleDomain;
  linked_pain_ids: string[];
  source_research_ids: string[];
  lesson_job: string;
  target_shift: string;
  takeaway_action: string;
  insight_layer: LessonInsightLayer;
  worthiness_score: LessonWorthinessScore;
  decision: LessonCandidateDecision;
  decision_reason: string;
  existing_lesson_fit?: {
    lesson_id: string;
    fit_type: "refresh" | "mastery" | "duplicate" | "none";
  };
  owner: "content_ops" | "product" | "research_review";
  created_at: string;
}

export interface ResearchRadarItem {
  research_id: string;
  domain: PsycleDomain;
  title: string;
  source_url: string;
  source_id: string;
  critique: ResearchCritique;
  psycle_decision: LessonCandidateDecision;
  decision_reason: string;
  linked_candidate_id?: string;
  reviewed_at: string;
}
