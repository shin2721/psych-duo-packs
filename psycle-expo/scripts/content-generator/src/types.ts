import { z } from "zod";

// Seed Dataset Schema
export const SeedSchema = z.object({
    id: z.string(),
    domain: z.enum(["social", "money", "mental", "health", "work", "study", "productivity", "relationships"]),
    core_principle: z.string(),
    core_principle_en: z.string(),
    counter_intuitive_insight: z.string(),
    common_misconception: z.string(),
    actionable_tactic: z.string(),
    academic_reference: z.string(),
    source_type: z.enum([
        "umbrella_review",
        "systematic_review",
        "meta_analysis",
        "guideline",
        "rct",
        "replication_study",
        "longitudinal_study",
        "observational_study",
        "qualitative_study",
        "narrative_review",
        "expert_summary",
        "preprint",
    ]),
    evidence_grade: z.enum(["gold", "silver", "bronze"]),
    suggested_question_types: z.array(z.string()),
    cultural_notes: z.string(),
});

export type Seed = z.infer<typeof SeedSchema>;

export const LaneSchema = z.enum(["core", "mastery", "refresh"]);
export type Lane = z.infer<typeof LaneSchema>;

export const MasteryNoveltyReasonSchema = z.enum([
    "scene_change",
    "judgment_change",
    "intervention_change",
    "transfer_context",
    "relapse_context",
]);
export type MasteryNoveltyReason = z.infer<typeof MasteryNoveltyReasonSchema>;

export const RefreshValueReasonSchema = z.enum([
    "explanation_update",
    "intervention_update",
    "boundary_update",
    "safety_update",
    "scene_update",
    "evidence_strength_update",
]);
export type RefreshValueReason = z.infer<typeof RefreshValueReasonSchema>;

export const LessonWorthinessScoreSchema = z.object({
    pain: z.number().int().min(1).max(3),
    recurrence: z.number().int().min(1).max(3),
    actionability: z.number().int().min(1).max(3),
    evidence_strength: z.number().int().min(1).max(3),
    novelty: z.number().int().min(1).max(3),
    total: z.number().int().min(5).max(15),
});

export type LessonWorthinessScore = z.infer<typeof LessonWorthinessScoreSchema>;

export const LessonLoadScoreSchema = z.object({
    cognitive: z.number().int().min(1).max(3),
    emotional: z.number().int().min(1).max(3),
    behavior_change: z.number().int().min(1).max(3),
    total: z.number().int().min(3).max(9),
});

export type LessonLoadScore = z.infer<typeof LessonLoadScoreSchema>;

export const LessonBlueprintSchema = z.object({
    job: z.string().min(1),
    target_shift: z.string().min(1),
    done_condition: z.string().min(1),
    takeaway_action: z.string().min(1),
    counterfactual: z.string().min(1).optional(),
    intervention_path: z.string().min(1).optional(),
    novelty_reason: MasteryNoveltyReasonSchema.optional(),
    refresh_value_reason: RefreshValueReasonSchema.optional(),
    lane: LaneSchema,
    phase: z.number().int().min(1).max(5),
    load_score: LessonLoadScoreSchema,
    question_count_range: z.object({
        min: z.number().int().min(5).max(10),
        max: z.number().int().min(5).max(10),
        target: z.number().int().min(5).max(10),
    }),
    forbidden_moves: z.array(z.string()).default([]),
});

export type LessonBlueprint = z.infer<typeof LessonBlueprintSchema>;

export const ClaimSchema = z.object({
    claim_id: z.string().min(1),
    claim_text: z.string().min(1),
    source_id: z.string().min(1),
    source_type: SeedSchema.shape.source_type,
    source_grade: z.enum(["gold", "silver", "bronze"]),
    source_span: z.string().min(1).optional(),
    review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lane: LaneSchema,
});

export type Claim = z.infer<typeof ClaimSchema>;

// Question Types
export const QuestionTypeSchema = z.enum([
    "multiple_choice",
    "swipe_judgment",
    "select_all",
    "fill_blank_tap",
    "sort_order",
    "conversation",
    "matching",
    "quick_reflex",
    "consequence_scenario",
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// Generated Question Schema
export const GeneratedQuestionSchema = z.object({
    id: z.string(),
    phase: z.number().int().min(1).max(5),
    claim_id: z.string().min(1).optional(),
    type: QuestionTypeSchema,
    question: z.string(),
    choices: z.array(z.string()).optional(),
    correct_index: z.number().optional(),
    correct_answers: z.array(z.number()).optional(),
    is_true: z.boolean().optional(),
    swipe_labels: z.object({
        left: z.string(),
        right: z.string(),
    }).optional(),
    items: z.array(z.string()).optional(),
    correct_order: z.array(z.string()).optional(),
    left_items: z.array(z.string()).optional(),
    right_items: z.array(z.string()).optional(),
    correct_pairs: z.array(z.array(z.number())).optional(),
    your_response_prompt: z.string().optional(),
    time_limit: z.number().optional(),
    consequence_type: z.enum(["positive", "negative"]).optional(),
    explanation: z.union([
        z.string(),
        z.object({
            correct: z.string(),
            incorrect: z.object({
                left: z.string().optional(),
                right: z.string().optional(),
                default: z.string().optional(),
            }).catchall(z.string()),
        }),
    ]),
    actionable_advice: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    xp: z.number(),
    source_id: z.string(),
    source_type: SeedSchema.shape.source_type.optional(),
    source_span: z.string().min(1).optional(),
    review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    lane: LaneSchema.optional(),
    lesson_blueprint: LessonBlueprintSchema.optional(),
    evidence_grade: z.enum(["gold", "silver", "bronze"]),
    // Expandable Depth (5-block structure for "詳しく見る")
    expanded_details: z.object({
        claim_type: z.enum(["observation", "theory", "intervention"]),
        evidence_type: z.enum(["direct", "indirect", "theoretical"]),
        best_for: z.array(z.string()),
        limitations: z.array(z.string()),
        citation_role: z.string(), // "what this citation supports"
        try_this: z.string().optional(), // Dose & Timebox short form
        // Source Fit
        claim_tags: z.array(z.string()).optional(), // e.g. ["rumination", "reappraisal"]
        // Tiny Metric (required for intervention)
        tiny_metric: z.object({
            before_prompt: z.string(), // e.g. "今の焦りは？（0-10）"
            after_prompt: z.string(), // e.g. "10秒後の焦りは？（0-10）"
            success_rule: z.string(), // e.g. "1だけ下がればOK"
            stop_rule: z.string(), // e.g. "変わらなければ今日は撤退でOK"
        }).optional(),
        // Comparator Required (for intervention)
        comparator: z.object({
            baseline: z.string(), // e.g. "何もしない", "反芻を続ける"
            cost: z.string(), // e.g. "10秒", "気まずさ少"
        }).optional(),
        // Countermove (fallback when try_this fails)
        fallback: z.object({
            when: z.string(), // e.g. "10秒やって逆に焦ったら"
            next: z.string(), // e.g. "呼吸に意識を戻す"
        }).optional(),
    }).optional(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

// Critic Evaluation Result
// Critic Evaluation Result (Rule Audit)
export const CriticResultSchema = z.object({
    passed: z.boolean(),
    violations: z.object({
        scientific_integrity: z.boolean(),
        ux_standards: z.boolean(),
        success_granularity: z.boolean(),
        evidence_template: z.boolean(),
        life_scene_first: z.boolean(),
        no_level_collapse: z.boolean(),
        user_can_be_right: z.boolean(),
        psychoeducation_first: z.boolean(),
        citation_reality: z.boolean(),
        mechanism_over_outcome: z.boolean(),
        claim_evidence_binding: z.boolean(),
        dose_and_timebox: z.boolean(),
        counterexample_first: z.boolean(),
        vocabulary_hygiene: z.boolean(), // FAIL words detected
    }).optional(),
    warnings: z.object({
        scene_specificity: z.boolean(),
        twist_line: z.boolean(),
        vocabulary_warn: z.boolean(), // WARN words detected
        choice_tension: z.boolean(), // lacking empathy pattern
        source_fit: z.boolean(), // source_id misaligned
        tiny_metric: z.boolean(), // intervention lacks tiny_metric
        comparator: z.boolean(), // intervention lacks comparator
        countermove: z.boolean(), // try_this lacks fallback
    }).optional(),
    citation_reality_level: z.enum(["ok", "weak", "ng"]).optional(), // 3-level citation check
    feedback: z.string(),
    // Legacy fields optional for compatibility or remove if clean break
    scores: z.any().optional(),
    total_score: z.number().optional(),
    issues: z.array(z.string()).optional(),
});

export type CriticResult = z.infer<typeof CriticResultSchema>;

// Pipeline Configuration
export interface PipelineConfig {
    seed: Seed;
    questionType: QuestionType;
    difficulty: "easy" | "medium" | "hard";
    maxRetries: number;
    minCriticScore: number;
}

// Generation Result
export interface GenerationResult {
    success: boolean;
    question?: GeneratedQuestion;
    criticResult?: CriticResult;
    attempts: number;
    error?: string;
}
