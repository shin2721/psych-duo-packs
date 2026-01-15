#!/usr/bin/env npx ts-node
/**
 * Batch Critic Runner
 * Runs critic on all lesson files and generates WARN/WEAK pattern report
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { evaluateQuestion } from "./critic";
import { evaluateQuestionLocal } from "./local_critic"; // Integrated Local Critic
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const LESSONS_DIR = path.join(__dirname, "../../../data/lessons");

interface WarnPattern {
    type: string;
    count: number;
    examples: string[];
}

// Quality Critic: Lesson-level checks
interface QualityCriticResult {
    pacing_ok: boolean;
    ui_consistency_ok: boolean;
    warnings: string[];
}

function runQualityCritic(questions: any[]): QualityCriticResult {
    const warnings: string[] = [];
    let pacing_ok = true;
    let ui_consistency_ok = true;

    // Level 2: Pacing Check
    // Check difficulty progression
    const difficulties = questions.map((q, i) => ({ index: i, difficulty: q.difficulty }));
    const easyCount = difficulties.filter(d => d.difficulty === "easy").length;
    const hardCount = difficulties.filter(d => d.difficulty === "hard").length;

    // First 2 questions should be easy (導入)
    if (questions.length >= 2) {
        if (questions[0].difficulty !== "easy" || questions[1].difficulty !== "easy") {
            pacing_ok = false;
            warnings.push("[PACING] First 2 questions should be 'easy' (導入)");
        }
    }

    // Last 2 questions should be easy (振り返り)
    if (questions.length >= 10) {
        const last2 = questions.slice(-2);
        if (last2.some((q: any) => q.difficulty === "hard")) {
            pacing_ok = false;
            warnings.push("[PACING] Last 2 questions should not be 'hard' (振り返り)");
        }
    }

    // Intervention clustering check (介入は3問目以降)
    const interventions = questions.map((q, i) => ({
        index: i,
        isIntervention: q.expanded_details?.claim_type === "intervention"
    }));
    const earlyInterventions = interventions.filter(i => i.index < 2 && i.isIntervention);
    if (earlyInterventions.length > 0) {
        pacing_ok = false;
        warnings.push("[PACING] Interventions in Q1-Q2 (should start from Q3)");
    }

    // Level 5: UI Consistency Check
    // claim_type と evidence_type の整合性
    const CLAIM_EVIDENCE_MAP: Record<string, string[]> = {
        "theory": ["theoretical"],
        "observation": ["direct", "indirect"],
        "intervention": ["direct", "indirect"]
    };

    for (const q of questions) {
        const details = q.expanded_details || {};
        const claimType = details.claim_type;
        const evidenceType = details.evidence_type;

        if (claimType && evidenceType && CLAIM_EVIDENCE_MAP[claimType]) {
            if (!CLAIM_EVIDENCE_MAP[claimType].includes(evidenceType)) {
                ui_consistency_ok = false;
                warnings.push(`[UI整合] ${q.id}: claim_type="${claimType}" と evidence_type="${evidenceType}" が不整合`);
            }
        }
    }

    return { pacing_ok, ui_consistency_ok, warnings };
}

// Gold Rubric Scoring System (0-100)
interface GoldRubricScore {
    clarity: number;       // 0-25
    actionability: number; // 0-25
    safety: number;        // 0-25
    learning_design: number; // 0-25
    total: number;         // 0-100 (Rubric Only)
    final_score?: number;  // 0-100 (Adjusted by Execution Rate)
    diagnosis?: string[];  // Next Action logic
    details: string[];
}

interface ExecutionStats {
    shown: number;
    attempted: number;
    executed: number;
    felt_better_avg?: number;  // Phase 10: 効果感平均
}

// Phase 10: 勝ち介入セット
interface WinningInterventions {
    version: string;
    generated_at: string;
    criteria: {
        shown: number;
        attempt_rate: number;
        execute_rate: number;
        felt_better_avg: number;
        final_score: number;
    };
    winners: string[];
    improvement_candidates: string[];  // 低ER/低felt_better
}

const WINNER_CRITERIA = {
    shown: 20,
    attempt_rate: 0.2,
    execute_rate: 0.3,
    felt_better_avg: 0.3,
    final_score: 75
};

function calculateGoldRubricScore(questions: any[], executionStats?: ExecutionStats): GoldRubricScore {
    const details: string[] = [];
    let clarity = 25;
    let actionability = 25;
    let safety = 25;
    let learning_design = 25;

    // === CLARITY (25点) ===
    // 文字数レンジチェック (Relaxed: Q max 130)
    const CHAR_RANGES = {
        question: { min: 35, max: 130 },
        explanation: { min: 60, max: 180 }
    };
    const VAGUE_WORDS = ["かなり", "すごく", "とても", "非常に", "ものすごく"];
    const REDUNDANT_PHRASES = [
        "ということになります",
        "することができる",
        "ことが可能です",
        "と言われています",
        "基本的に",
        "とりあえず",
        "実際"
    ];

    let charRangeViolations = 0;
    let vagueWordCount = 0;
    let redundantPhraseCount = 0;

    for (const q of questions) {
        const qLen = (q.question || "").length;
        const eLen = (typeof q.explanation === "string" ? q.explanation : "").length;

        if (qLen < CHAR_RANGES.question.min || qLen > CHAR_RANGES.question.max) {
            charRangeViolations++;
        }
        if (eLen > 0 && (eLen < CHAR_RANGES.explanation.min || eLen > CHAR_RANGES.explanation.max)) {
            charRangeViolations++;
        }

        const textToScan = `${q.question} ${q.explanation || ""}`;
        for (const word of VAGUE_WORDS) {
            if (textToScan.includes(word)) vagueWordCount++;
        }
        for (const phrase of REDUNDANT_PHRASES) {
            if (textToScan.includes(phrase)) redundantPhraseCount++;
        }
    }

    clarity -= charRangeViolations * 2;
    clarity -= vagueWordCount * 3;
    clarity -= redundantPhraseCount * 3;
    clarity = Math.max(0, clarity);
    if (charRangeViolations > 0) details.push(`[CLARITY] 文字数レンジ違反: ${charRangeViolations}件`);
    if (vagueWordCount > 0) details.push(`[CLARITY] 曖昧語使用: ${vagueWordCount}件`);
    if (redundantPhraseCount > 0) details.push(`[CLARITY] 冗長語使用: ${redundantPhraseCount}件`);

    // === ACTIONABILITY (25点) ===
    const TEN_SEC_CATEGORIES = ["言語化", "呼吸", "身体", "認知", "フレーズ", "確認", "待つ", "開く", "置く"];
    const interventions = questions.filter(q => q.expanded_details?.claim_type === "intervention");
    const fourSetComplete = interventions.filter(q => {
        const d = q.expanded_details || {};
        return d.try_this && d.tiny_metric && d.comparator && d.fallback;
    }).length;

    if (interventions.length > 0) {
        const completionRate = fourSetComplete / interventions.length;
        actionability = Math.round(25 * completionRate);
        if (completionRate < 1) {
            details.push(`[ACTION] 介入4点セット完備率: ${Math.round(completionRate * 100)}%`);
        }
    }

    // === SAFETY (25点) ===
    const RISKY_PATTERNS = [
        { pattern: /必ず(?!しも)/, penalty: 5 },
        { pattern: /絶対/, penalty: 5 },
        { pattern: /証明された/, penalty: 4 },
        { pattern: /治る/, penalty: 8 },
        { pattern: /稼げる/, penalty: 8 },
        { pattern: /確実に/, penalty: 5 }
    ];

    let safetyPenalty = 0;
    for (const q of questions) {
        const text = `${q.question} ${q.explanation || ""} ${q.actionable_advice || ""}`;
        for (const { pattern, penalty } of RISKY_PATTERNS) {
            if (pattern.test(text)) {
                const isDebunking = q.type === "swipe_judgment" && q.is_true === false;
                if (!isDebunking) safetyPenalty += penalty;
            }
        }
    }
    safety = Math.max(0, 25 - safetyPenalty);
    if (safetyPenalty > 0) details.push(`[SAFETY] リスク表現ペナルティ: -${safetyPenalty}点`);

    // === LEARNING DESIGN (25点) ===
    const explanations = questions.map(q => q.explanation || "");
    const uniqueExplanations = new Set(explanations);
    const duplicateRate = 1 - (uniqueExplanations.size / explanations.length);

    const difficulties = questions.map(q => q.difficulty);
    const difficultyOrder = difficulties.map(d => d === "easy" ? 0 : d === "medium" ? 1 : 2);
    let curveScore = 25;

    if (difficultyOrder[0] > 0 || difficultyOrder[1] > 0) curveScore -= 5;
    if (difficultyOrder.length >= 10 && (difficultyOrder[8] > 1 || difficultyOrder[9] > 1)) curveScore -= 5;

    learning_design = Math.max(0, curveScore - Math.round(duplicateRate * 10));
    if (duplicateRate > 0.1) details.push(`[DESIGN] 説明重複率: ${Math.round(duplicateRate * 100)}%`);

    const total = clarity + actionability + safety + learning_design;

    // === EXECUTION RATE ADJUSTMENT & DIAGNOSIS ===
    let final_score = total;
    const diagnosis: string[] = [];

    if (executionStats) {
        const { shown, attempted, executed } = executionStats;

        // Gate: shown < 20 or attempted < 5 -> Skip adjustment
        if (shown < 20 || attempted < 5) {
            details.push(`[EXECUTION] Skip Gate: shown=${shown}, attempted=${attempted} (Need >=20/5)`);
        } else {
            const attemptRate = attempted / shown;
            const executeRate = executed / attempted;

            // Score Correction
            const ern = Math.min(1, executeRate / 0.2);
            final_score = Math.round(total * (0.7 + 0.3 * ern));
            details.push(`[EXECUTION] Rate: ${Math.round(executeRate * 100)}% (ERN: ${ern.toFixed(2)}) -> Adj: ${final_score}`);

            // Diagnosis
            // Priority 1: UI/CTA (AttemptRate < 20%)
            if (attemptRate < 0.2) {
                const severity = (0.2 - attemptRate).toFixed(2);
                diagnosis.push(`🚨 導線改善 (Severity: ${severity}): CTA/配置/導入の見直し`);
            }
            // Priority 2: Content (ExecuteRate < 30%)
            else if (executeRate < 0.3) {
                const severity = (0.3 - executeRate).toFixed(2);
                diagnosis.push(`⚠️ 内容改善 (Severity: ${severity}): 手順簡易化/抵抗点除去`);
            }
            // Priority 3: Star Candidate
            else {
                diagnosis.push(`✨ 横展開候補: テンプレート化推奨`);
            }
        }
    }

    return { clarity, actionability, safety, learning_design, total, final_score, diagnosis, details };
}

async function main() {
    const args = process.argv.slice(2);

    // Parse --feedback argument first to exclude it from domain detection
    const feedbackIdx = args.indexOf("--feedback");
    const feedbackFile = (feedbackIdx !== -1 && args[feedbackIdx + 1]) ? args[feedbackIdx + 1] : "";

    // Parse --emit-winners argument
    const emitWinnersIdx = args.indexOf("--emit-winners");
    const emitWinnersFile = (emitWinnersIdx !== -1 && args[emitWinnersIdx + 1]) ? args[emitWinnersIdx + 1] : "";

    const targetDomain = args.find(a => !a.startsWith("--") && a !== feedbackFile && a !== emitWinnersFile) || "";
    const localOnly = args.includes("--local");
    const showReport = args.includes("--report");

    // Only require API key if not local-only
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey && !localOnly) {
        console.warn("⚠️ GEMINI_API_KEY not set. Defaulting to --local mode.");
    }
    const shouldUseApi = !!apiKey && !localOnly;

    const genAI = shouldUseApi ? new GoogleGenerativeAI(apiKey!) : null;

    const warnPatterns: Record<string, WarnPattern> = {};
    const failedQuestions: { id: string; reason: string }[] = [];

    // Phase 10: Winner/Improvement tracking
    const winners: string[] = [];
    const improvementCandidates: string[] = [];
    let feedbackData: Record<string, ExecutionStats> = {};

    // Load feedback data for winner evaluation
    if (feedbackFile) {
        try {
            feedbackData = JSON.parse(fs.readFileSync(feedbackFile, "utf-8"));
            console.log(`📊 Loaded feedback from: ${feedbackFile}`);
        } catch (e) {
            console.warn(`⚠️ Failed to load feedback file: ${(e as any).message}`);
        }
    }

    // Intervention-level report data
    const interventionReport: {
        lesson_id: string;
        intervention_id: string;
        try_this: string;
        has_fallback: boolean;
        has_tiny_metric: boolean;
    }[] = [];

    console.log(`🎯 Target Domain: ${targetDomain || "ALL"}`);
    if (emitWinnersFile) console.log(`🏆 Emit Winners: ${emitWinnersFile}`);
    console.log(`🛠 Mode: ${shouldUseApi ? "Full (Local + API)" : "Local Only (Structural)"}`);
    if (showReport) console.log(`📊 Report Mode: ON (Intervention-level)`);

    // Find all lesson files
    const domains = fs.readdirSync(LESSONS_DIR).filter(d =>
        fs.statSync(path.join(LESSONS_DIR, d)).isDirectory() &&
        (!targetDomain || d.includes(targetDomain))
    );

    console.log("🔍 批評分析開始...\n");

    for (const domain of domains) {
        const domainPath = path.join(LESSONS_DIR, domain);
        const files = fs.readdirSync(domainPath).filter(f => f.endsWith(".json"));

        for (const file of files) {
            const filePath = path.join(domainPath, file);
            console.log(`📄 ${domain}/${file}`);

            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const questions = JSON.parse(content);

                // Run Quality Critic (lesson-level checks)
                const qualityCriticResult = runQualityCritic(questions);
                for (const warning of qualityCriticResult.warnings) {
                    console.log(`  ⚠️ ${warning}`);
                    // Track in warnPatterns
                    const warnType = warning.startsWith("[PACING]") ? "pacing" : "ui_consistency";
                    if (!warnPatterns[warnType]) {
                        warnPatterns[warnType] = { type: warnType, count: 0, examples: [] };
                    }
                    warnPatterns[warnType].count++;
                    if (warnPatterns[warnType].examples.length < 3) {
                        warnPatterns[warnType].examples.push(`${domain}/${file}`);
                    }
                }

                // Run Gold Rubric Scoring (--score flag)
                const showScore = args.includes("--score");
                if (showScore) {
                    // Load feedback if provided
                    const feedbackIdx = args.indexOf("--feedback");
                    let executionStats: ExecutionStats | undefined;

                    if (feedbackIdx !== -1 && args[feedbackIdx + 1]) {
                        try {
                            const feedbackPath = args[feedbackIdx + 1];
                            const feedbackData = JSON.parse(fs.readFileSync(feedbackPath, "utf-8"));
                            // Expected format: { "domain/file.json": { shown: 100, attempted: 20, executed: 10 } }
                            const key = `${domain}/${file}`;
                            if (feedbackData[key]) {
                                executionStats = feedbackData[key];
                            }
                        } catch (e) {
                            console.warn(`  ⚠️ Failed to load feedback: ${(e as any).message}`);
                        }
                    }

                    const score = calculateGoldRubricScore(questions, executionStats);

                    // Use final_score if available, otherwise total
                    const displayScore = score.final_score ?? score.total;
                    const gradeEmoji = displayScore >= 90 ? "🏆" : displayScore >= 75 ? "✅" : displayScore >= 60 ? "⚠️" : "❌";

                    console.log(`  ${gradeEmoji} Score: ${displayScore}/100 (C:${score.clarity} A:${score.actionability} S:${score.safety} D:${score.learning_design})`);
                    if (score.final_score !== undefined) {
                        console.log(`    (Rubric Base: ${score.total})`);
                    }

                    if (score.diagnosis && score.diagnosis.length > 0) {
                        console.log(`    💡 診断:`);
                        for (const diag of score.diagnosis) {
                            console.log(`      ${diag}`);
                        }
                    }

                    for (const detail of score.details) {
                        console.log(`    ${detail}`);
                    }
                }

                // Extract interventions for --report
                if (showReport) {
                    const lessonId = file.replace(".ja.json", "").replace(".json", "");
                    for (const q of questions) {
                        if (q.expanded_details?.claim_type === "intervention") {
                            interventionReport.push({
                                lesson_id: lessonId,
                                intervention_id: q.id,
                                try_this: q.expanded_details?.try_this || "(missing)",
                                has_fallback: !!q.expanded_details?.fallback,
                                has_tiny_metric: !!q.expanded_details?.tiny_metric
                            });

                            // Phase 10: Winner evaluation
                            if (emitWinnersFile && feedbackData[q.id]) {
                                const stats = feedbackData[q.id];
                                const attemptRate = stats.shown > 0 ? stats.attempted / stats.shown : 0;
                                const executeRate = stats.attempted > 0 ? stats.executed / stats.attempted : 0;
                                const feltBetterAvg = stats.felt_better_avg ?? 0;

                                // Calculate intervention-level score (simplified)
                                const hasFullSet = q.expanded_details?.try_this &&
                                    q.expanded_details?.fallback &&
                                    q.expanded_details?.tiny_metric &&
                                    q.expanded_details?.comparator;
                                const structuralScore = hasFullSet ? 80 : 60;

                                // Winner criteria check
                                if (
                                    stats.shown >= WINNER_CRITERIA.shown &&
                                    attemptRate >= WINNER_CRITERIA.attempt_rate &&
                                    executeRate >= WINNER_CRITERIA.execute_rate &&
                                    feltBetterAvg >= WINNER_CRITERIA.felt_better_avg &&
                                    structuralScore >= WINNER_CRITERIA.final_score
                                ) {
                                    if (!winners.includes(q.id)) {
                                        winners.push(q.id);
                                        console.log(`  🏆 Winner: ${q.id} (AR:${Math.round(attemptRate * 100)}% ER:${Math.round(executeRate * 100)}% FB:${feltBetterAvg.toFixed(1)})`);
                                    }
                                } else if (stats.shown >= WINNER_CRITERIA.shown) {
                                    // Has data but doesn't meet criteria
                                    if (!improvementCandidates.includes(q.id)) {
                                        improvementCandidates.push(q.id);
                                    }
                                }
                            }
                        }
                    }
                }

                // Helper functions for rate limiting
                const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

                function jitter(ms: number) {
                    return Math.round(ms * (0.8 + Math.random() * 0.4)); // ±20%
                }

                function getRetryAfterMs(err: any) {
                    const ra = err?.response?.headers?.get?.("retry-after")
                        ?? err?.headers?.["retry-after"]
                        ?? err?.retryAfter;
                    const sec = Number(ra);
                    return Number.isFinite(sec) ? sec * 1000 : null;
                }

                // Config to allow stopping from inner loop
                const config = { stopError: null as Error | null };

                async function withRateLimitRetry<T>(fn: () => Promise<T>, max = 8) {
                    let base = 60_000;          // Start with 1 minute wait
                    let cap = 10 * 60_000;     // Max 10 minutes wait

                    for (let i = 0; i < max; i++) {
                        try {
                            return await fn();
                        } catch (err: any) {
                            if (!err.message?.includes("429")) throw err;

                            // Check for hard quota limits
                            const msg = String(err?.message ?? "");
                            if (msg.includes("insufficient_quota") || msg.includes("quota") || msg.includes("billing")) {
                                console.error("🚫 Quota/Billing limit reached. Stopping.");
                                throw config.stopError || new Error("QUOTA_EXCEEDED");
                            }

                            const ra = getRetryAfterMs(err);
                            const wait = ra ?? Math.min(cap, base * (2 ** i));
                            const w = jitter(wait);

                            console.warn(`⏳ Rate limit (429). Retry in ${Math.round(w / 1000)}s (attempt ${i + 1}/${max})`);
                            await sleep(w);
                            continue;
                        }
                    }
                    throw new Error("429 persists after retries. Stopping.");
                }

                for (const q of questions) {
                    try {
                        let finalResult;

                        // 1. Run Local Critic First (Structural Check)
                        const localResult = evaluateQuestionLocal(q);

                        if (!localResult.passed) {
                            // Fail fast on structural violations
                            finalResult = localResult;
                        } else if (shouldUseApi && genAI) {
                            // 2. Run API Critic (only if local passed and API available)
                            // Use robust retry wrapper
                            finalResult = await withRateLimitRetry(async () => {
                                return await evaluateQuestion(genAI, q);
                            });
                        } else {
                            // Local passed, skipping API
                            finalResult = localResult;
                        }

                        // Track failures
                        if (!finalResult.passed) {
                            failedQuestions.push({
                                id: q.id,
                                reason: finalResult.feedback
                            });
                            console.log(`  ❌ ${q.id}: ${finalResult.feedback.split('\n')[0]}`);
                        }

                        // Track warnings
                        if (finalResult.warnings) {
                            for (const [key, value] of Object.entries(finalResult.warnings)) {
                                if (value === true) {
                                    if (!warnPatterns[key]) {
                                        warnPatterns[key] = { type: key, count: 0, examples: [] };
                                    }
                                    warnPatterns[key].count++;
                                    if (warnPatterns[key].examples.length < 3) {
                                        warnPatterns[key].examples.push(q.id);
                                    }
                                }
                            }
                        }

                        // Rate limit wait only if we used API
                        if (shouldUseApi && localResult.passed) {
                            await sleep(1000);
                        }

                    } catch (e: any) {
                        if (e.message === "QUOTA_EXCEEDED" || e.message?.includes("QUOTA_EXCEEDED")) {
                            console.log("\n🛑 Aborting due to quota exceeded.");
                            process.exit(1);
                        }
                        console.log(`  ⚠️ ${q.id}: Error - ${e.message}`);
                    }
                }
            } catch (e) {
                console.log(`  ❌ Parse error`);
            }
        }
    }

    // Generate report
    console.log("\n" + "=".repeat(50));
    console.log("📊 WARN/WEAK パターン分析\n");

    const sorted = Object.values(warnPatterns).sort((a, b) => b.count - a.count);
    for (const p of sorted) {
        console.log(`${p.type}: ${p.count}件`);
        console.log(`  例: ${p.examples.join(", ")}`);
    }

    if (failedQuestions.length > 0) {
        console.log("\n🚨 FAIL Questions (Total: " + failedQuestions.length + "):");
        for (const f of failedQuestions) {
            console.log(`  ${f.id}: ${f.reason.substring(0, 100)}...`);
        }
    }

    // Intervention Report (--report flag)
    if (showReport && interventionReport.length > 0) {
        console.log("\n" + "=".repeat(50));
        console.log("📋 介入レポート (Intervention-level)\n");
        console.log("| lesson_id | intervention_id | try_this | fallback | tiny_metric |");
        console.log("|---|---|---|---|---|");
        for (const r of interventionReport) {
            const tryThisShort = r.try_this.length > 30 ? r.try_this.substring(0, 30) + "..." : r.try_this;
            console.log(`| ${r.lesson_id} | ${r.intervention_id} | ${tryThisShort} | ${r.has_fallback ? "✅" : "❌"} | ${r.has_tiny_metric ? "✅" : "❌"} |`);
        }
        console.log(`\n介入数: ${interventionReport.length}`);
    }

    // Phase 10: Emit Winners JSON
    if (emitWinnersFile) {
        const winningInterventions: WinningInterventions = {
            version: "v1",
            generated_at: new Date().toISOString().split("T")[0],
            criteria: WINNER_CRITERIA,
            winners,
            improvement_candidates: improvementCandidates
        };

        try {
            fs.writeFileSync(emitWinnersFile, JSON.stringify(winningInterventions, null, 2));
            console.log(`\n🏆 勝ち介入ファイル出力: ${emitWinnersFile}`);
            console.log(`   Winners: ${winners.length}件, 改善候補: ${improvementCandidates.length}件`);
        } catch (e) {
            console.error(`❌ Failed to write winners file: ${(e as any).message}`);
        }
    }

    console.log("\n✅ 分析完了");
}

main().catch(console.error);
