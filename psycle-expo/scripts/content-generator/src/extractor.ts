import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import {
    Lane,
    LaneSchema,
    LessonLoadScore,
    LessonLoadScoreSchema,
    LessonWorthinessScore,
    LessonWorthinessScoreSchema,
    MasteryNoveltyReason,
    MasteryNoveltyReasonSchema,
    RefreshValueReason,
    Seed,
    SeedSchema,
} from "./types";
import { normalizeDomain } from "./phasePolicy";
import { CONTENT_MODELS } from "./modelConfig";
import { extractUsageMetadata, UsageTokens } from "./metrics";
import {
    deriveLane,
    finalizeLessonLoad,
    finalizeLessonWorthiness,
    normalizeReviewDate,
} from "./lessonDesign";

export interface RawNewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
    snippet: string;
}

export interface RelevanceResult {
    isRelevant: boolean;
    reason: string;
    psychologyScore: number; // 0-10
}

export interface ExtractedSeed extends Seed {
    originalLink: string;
    extractionConfidence: number; // 0-1
    lane: Lane;
    lessonWorthiness: LessonWorthinessScore;
    lessonLoad: LessonLoadScore;
    lessonJob?: string;
    targetShift?: string;
    doneCondition?: string;
    takeawayAction?: string;
    counterfactual?: string;
    interventionPath?: string;
    noveltyReason?: MasteryNoveltyReason;
    refreshValueReason?: RefreshValueReason;
    forbiddenMoves?: string[];
    reviewDate: string;
}

export type LLMUsageCallbackOptions = {
    onUsage?: (usage: UsageTokens) => void;
};

export const RelevanceResultSchema = z.object({
    isRelevant: z.boolean(),
    reason: z.string(),
    psychologyScore: z.number().min(0).max(10),
});

const ExtractedSeedPayloadSchema = SeedSchema.omit({
    id: true,
    suggested_question_types: true,
    domain: true,
}).extend({
    domain: z.string().min(1),
    source_type: SeedSchema.shape.source_type.optional(),
    extractionConfidence: z.number().min(0).max(1).optional(),
    lane: LaneSchema.optional(),
    lessonWorthiness: LessonWorthinessScoreSchema.partial().optional(),
    lessonLoad: LessonLoadScoreSchema.partial().optional(),
    lessonJob: z.string().min(1).optional(),
    targetShift: z.string().min(1).optional(),
    doneCondition: z.string().min(1).optional(),
    takeawayAction: z.string().min(1).optional(),
    counterfactual: z.string().min(1).optional(),
    interventionPath: z.string().min(1).optional(),
    noveltyReason: MasteryNoveltyReasonSchema.optional(),
    refreshValueReason: z.enum([
        "explanation_update",
        "intervention_update",
        "boundary_update",
        "safety_update",
        "scene_update",
        "evidence_strength_update",
    ]).optional(),
    forbiddenMoves: z.array(z.string()).optional(),
    reviewDate: z.string().optional(),
});

export type ExtractedSeedPayload = z.infer<typeof ExtractedSeedPayloadSchema>;

export function parseRelevanceResult(raw: unknown): RelevanceResult | null {
    const parsed = RelevanceResultSchema.safeParse(raw);
    if (!parsed.success) {
        return null;
    }
    return parsed.data;
}

export function parseExtractedSeedPayload(raw: unknown, originalLink: string): ExtractedSeed | null {
    const payloadResult = ExtractedSeedPayloadSchema.safeParse(raw);
    if (!payloadResult.success) {
        console.warn("[extractor] invalid payload:", payloadResult.error.issues.map((issue) => issue.message).join("; "));
        return null;
    }

    const normalizedDomain = normalizeDomain(payloadResult.data.domain);
    if (!normalizedDomain) {
        console.warn("[extractor] invalid domain:", payloadResult.data.domain);
        return null;
    }

    const payload = payloadResult.data;
    const generatedId = `extracted_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const lessonWorthiness = finalizeLessonWorthiness(payload.lessonWorthiness, payload.evidence_grade);
    const lessonLoad = finalizeLessonLoad(payload.lessonLoad);
    const lane = deriveLane(payload.lane, lessonWorthiness);
    const reviewDate = normalizeReviewDate(payload.reviewDate);

    return {
        id: generatedId,
        domain: normalizedDomain as Seed["domain"],
        core_principle: payload.core_principle,
        core_principle_en: payload.core_principle_en,
        counter_intuitive_insight: payload.counter_intuitive_insight,
        common_misconception: payload.common_misconception,
        actionable_tactic: payload.actionable_tactic,
        academic_reference: payload.academic_reference,
        source_type:
            payload.source_type ??
            (payload.evidence_grade === "gold"
                ? "systematic_review"
                : payload.evidence_grade === "silver"
                  ? "rct"
                  : "observational_study"),
        evidence_grade: payload.evidence_grade,
        suggested_question_types: [],
        cultural_notes: payload.cultural_notes,
        originalLink,
        extractionConfidence: payload.extractionConfidence ?? 0.7,
        lane,
        lessonWorthiness,
        lessonLoad,
        lessonJob: payload.lessonJob,
        targetShift: payload.targetShift,
        doneCondition: payload.doneCondition,
        takeawayAction: payload.takeawayAction,
        counterfactual: payload.counterfactual,
        interventionPath: payload.interventionPath,
        noveltyReason: payload.noveltyReason,
        refreshValueReason: payload.refreshValueReason,
        forbiddenMoves: payload.forbiddenMoves,
        reviewDate,
    };
}

const RELEVANCE_PROMPT = `あなたはPsycleアプリのコンテンツキュレーターです。
以下のニュース記事が「人間の心理・行動・意思決定」に関連する内容かどうかを判定してください。

## 判定基準
- 「行動経済学」「認知バイアス」「社会心理学」「動機付け」「習慣形成」「ストレス管理」などに関連する → 高スコア
- 「神経科学」「脳の構造」でも、日常の行動変容に応用可能 → 中スコア
- 「物理学」「工学」「材料科学」「気象学」などの技術的なもの → 低スコア（関連なし）
- 「動物実験」でも、人間の行動に示唆があるなら → 中〜高スコア

## 出力形式 (JSON)
{
  "isRelevant": true,
  "reason": "この研究は〇〇に関するもので、人間の△△に応用できる",
  "psychologyScore": 8
}

## スコア基準
- 8-10: 直接的に人間の心理・行動に関する研究
- 5-7: 間接的だが、日常の行動変容に応用可能
- 1-4: 心理学との関連が薄い、または技術的な話題
- 0: 完全に無関係（物理学、天文学など）

5点以上を「関連あり」と判定してください。`;

const EXTRACTOR_PROMPT = `あなたはPsycleアプリの「抽出エージェント」です。
ニュース記事から、アプリで使える「心理学の種（Seed）」を抽出してください。

## Seedの構造
{
  "core_principle": "核心原理（日本語、20文字以内）",
  "core_principle_en": "Core Principle (English, for ID)",
  "counter_intuitive_insight": "直感に反する洞察（一般常識と逆のポイント、50文字以内）",
  "common_misconception": "よくある誤解（多くの人が信じている間違い、30文字以内）",
  "actionable_tactic": "具体的アクション（今日からできること、30文字以内）",
  "academic_reference": "出典（著者名 + 年 + 大学/ジャーナル）",
  "source_type": "umbrella_review | systematic_review | meta_analysis | guideline | rct | replication_study | longitudinal_study | observational_study | qualitative_study | narrative_review | expert_summary | preprint",
  "domain": "social | mental | money | health | work | study (alias: productivity, relationships)",
  "evidence_grade": "gold | silver | bronze",
  "cultural_notes": "日本文化での注意点（あれば）",
  "extractionConfidence": 0.8,
  "lane": "core | mastery | refresh",
  "lessonWorthiness": {
    "pain": 1-3,
    "recurrence": 1-3,
    "actionability": 1-3,
    "evidence_strength": 1-3,
    "novelty": 1-3
  },
  "lessonLoad": {
    "cognitive": 1-3,
    "emotional": 1-3,
    "behavior_change": 1-3
  },
  "lessonJob": "このlessonが担う仕事を1文で",
  "targetShift": "ユーザーを何から何へ移すかを1文で",
  "doneCondition": "lesson終了時にユーザーができるようになることを1文で",
  "takeawayAction": "lesson後に持ち帰る1アクションを短く",
  "counterfactual": "何もしない/誤解に従うと何が起きやすいかを短く",
  "interventionPath": "どうやってbetter choiceに移すかを短く",
  "noveltyReason": "scene_change | judgment_change | intervention_change | transfer_context | relapse_context",
  "refreshValueReason": "explanation_update | intervention_update | boundary_update | safety_update | scene_update | evidence_strength_update",
  "forbiddenMoves": ["避けるべき失敗パターン"],
  "reviewDate": "YYYY-MM-DD"
}

## Evidence Grade 判定
- gold: メタ分析、複数のRCT、Cochrane
- silver: 単一のRCT、大規模調査
- bronze: パイロット研究、観察研究、動物実験

## Source Type 判定
- umbrella_review / systematic_review / meta_analysis / guideline を最優先
- 単一研究なら rct / replication_study / longitudinal_study / observational_study で区別
- narrative_review / expert_summary / preprint は弱い source として明示

## 品質基準
- 「意外性」がなければ価値がない。当たり前のことは書かない。
- 「今日できるアクション」がなければ使えない。抽象論はNG。
- 無理に抽出せず、本当に使えるものだけを返す。
- lessonWorthiness は「lesson にする価値」を5軸で採点する。
- lessonLoad は「認知負荷 / 感情負荷 / 行動転換負荷」を採点する。
- lane は recurring な困りごとなら core、同テーマを別 scene / 別判断 / 別応用で深めるなら mastery、新しい知見で既存lessonを更新する用途なら refresh。
- lane が mastery の場合は noveltyReason を必ず入れる。
- lane が refresh の場合は refreshValueReason を必ず入れる。
- counterfactual と interventionPath は、scene だけ差し替えた薄い lesson を避けるために具体的に書く。
- doneCondition は「終わった時に何ができれば十分か」を書く。
- takeawayAction は lesson 後に持ち帰る1アクションを書く。

使えない（抽出できない）場合は、"extractable": false を返してください。`;

export async function checkRelevance(
    genAI: GoogleGenerativeAI,
    newsItem: RawNewsItem,
    options: LLMUsageCallbackOptions = {}
): Promise<RelevanceResult> {
    const model = genAI.getGenerativeModel({
        model: CONTENT_MODELS.relevance,
        systemInstruction: RELEVANCE_PROMPT,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
        },
    });

    const userPrompt = `以下のニュース記事を判定してください：

タイトル: ${newsItem.title}
概要: ${newsItem.snippet}
ソース: ${newsItem.source}`;

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    options.onUsage?.(extractUsageMetadata(response));
    const content = response.text();

    if (!content) {
        return { isRelevant: false, reason: "No response", psychologyScore: 0 };
    }

    const parsed = parseRelevanceResult(JSON.parse(content));
    if (!parsed) {
        console.warn("[extractor] invalid relevance payload");
        return { isRelevant: false, reason: "Invalid relevance payload", psychologyScore: 0 };
    }
    return parsed;
}

export async function extractSeedFromNews(
    genAI: GoogleGenerativeAI,
    newsItem: RawNewsItem,
    options: LLMUsageCallbackOptions = {}
): Promise<ExtractedSeed | null> {
    const model = genAI.getGenerativeModel({
        model: CONTENT_MODELS.extractor,
        systemInstruction: EXTRACTOR_PROMPT,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
        },
    });

    const userPrompt = `以下のニュース記事から、Psycleで使える「心理学の種」を抽出してください：

タイトル: ${newsItem.title}
概要: ${newsItem.snippet}
リンク: ${newsItem.link}
ソース: ${newsItem.source}
公開日: ${newsItem.pubDate}`;

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    options.onUsage?.(extractUsageMetadata(response));
    const content = response.text();

    if (!content) {
        return null;
    }

    const parsed = JSON.parse(content);

    if (parsed.extractable === false) {
        return null;
    }

    return parseExtractedSeedPayload(parsed, newsItem.link);
}
