import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { Seed, SeedSchema } from "./types";
import { normalizeDomain } from "./phasePolicy";
import { CONTENT_MODELS } from "./modelConfig";
import { extractUsageMetadata, UsageTokens } from "./metrics";

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
    extractionConfidence: z.number().min(0).max(1).optional(),
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

    return {
        id: generatedId,
        domain: normalizedDomain as Seed["domain"],
        core_principle: payload.core_principle,
        core_principle_en: payload.core_principle_en,
        counter_intuitive_insight: payload.counter_intuitive_insight,
        common_misconception: payload.common_misconception,
        actionable_tactic: payload.actionable_tactic,
        academic_reference: payload.academic_reference,
        evidence_grade: payload.evidence_grade,
        suggested_question_types: [],
        cultural_notes: payload.cultural_notes,
        originalLink,
        extractionConfidence: payload.extractionConfidence ?? 0.7,
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
  "domain": "social | mental | money | health | work | study (alias: productivity, relationships)",
  "evidence_grade": "gold | silver | bronze",
  "cultural_notes": "日本文化での注意点（あれば）",
  "extractionConfidence": 0.8
}

## Evidence Grade 判定
- gold: メタ分析、複数のRCT、Cochrane
- silver: 単一のRCT、大規模調査
- bronze: パイロット研究、観察研究、動物実験

## 品質基準
- 「意外性」がなければ価値がない。当たり前のことは書かない。
- 「今日できるアクション」がなければ使えない。抽象論はNG。
- 無理に抽出せず、本当に使えるものだけを返す。

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
