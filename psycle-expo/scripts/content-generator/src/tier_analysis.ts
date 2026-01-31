#!/usr/bin/env npx ts-node
/**
 * Phase 9: 暫定Tier分け（構造ベース）
 * 
 * 行動データがない状態で、介入の構造的品質でTier分けを行う。
 * - Tier A（昇格候補）: 4点セット完備 + 10秒定義OK + 表現安全
 * - Tier B（保留）: 4点セット欠け1つまで
 * - Tier C（除外検討）: 欠け2つ以上 or 実行しにくい
 */
import * as fs from "fs";
import * as path from "path";

const LESSONS_DIR = path.join(__dirname, "../../../data/lessons");

interface InterventionAnalysis {
    id: string;
    lesson_id: string;
    try_this: string;
    has_fallback: boolean;
    has_tiny_metric: boolean;
    has_comparator: boolean;
    has_ten_seconds: boolean;
    is_physical_action: boolean;
    tier: "A" | "B" | "C";
    missing: string[];
}

// 10秒アクション判定用パターン
const TEN_SEC_PATTERNS = [
    /\d+秒/,
    /10秒/,
    /1回/,
    /1つ/,
    /一度/,
    /今だけ/,
    /まず/,
    /だけ/,
    /試す/
];

// 物理アクション判定用パターン
const PHYSICAL_ACTION_PATTERNS = [
    /指を離す/,
    /指を止め/,
    /閉じ/,
    /立つ/,
    /座る/,
    /開く/,
    /置く/,
    /一歩/,
    /手を/,
    /体を/,
    /吸/,
    /吐/,
    /呼吸/,
    /唱え/,
    /言う/,
    /書/
];

function analyzeIntervention(q: any, lessonId: string): InterventionAnalysis | null {
    if (q.expanded_details?.claim_type !== "intervention") {
        return null;
    }

    const details = q.expanded_details || {};
    const tryThis = details.try_this || "";

    const hasFallback = !!details.fallback && (
        typeof details.fallback === "object"
            ? Object.keys(details.fallback).length > 0
            : details.fallback.length > 10
    );
    const hasTinyMetric = !!details.tiny_metric && (
        typeof details.tiny_metric === "object"
            ? Object.keys(details.tiny_metric).length > 0
            : details.tiny_metric.length > 5
    );
    const hasComparator = !!details.comparator && (
        typeof details.comparator === "object"
            ? Object.keys(details.comparator).length > 0
            : details.comparator.length > 5
    );
    const hasTenSeconds = TEN_SEC_PATTERNS.some(p => p.test(tryThis));
    const isPhysicalAction = PHYSICAL_ACTION_PATTERNS.some(p => p.test(tryThis));

    const missing: string[] = [];
    if (!hasFallback) missing.push("fallback");
    if (!hasTinyMetric) missing.push("tiny_metric");
    if (!hasComparator) missing.push("comparator");
    if (!hasTenSeconds) missing.push("10秒定義");
    if (!isPhysicalAction) missing.push("物理アクション");

    // Tier判定
    let tier: "A" | "B" | "C";
    const fourSetComplete = hasFallback && hasTinyMetric && hasComparator;

    if (fourSetComplete && hasTenSeconds) {
        tier = "A";
    } else if (missing.length <= 2) {
        tier = "B";
    } else {
        tier = "C";
    }

    return {
        id: q.id,
        lesson_id: lessonId,
        try_this: tryThis,
        has_fallback: hasFallback,
        has_tiny_metric: hasTinyMetric,
        has_comparator: hasComparator,
        has_ten_seconds: hasTenSeconds,
        is_physical_action: isPhysicalAction,
        tier,
        missing
    };
}

async function main() {
    console.log("🎯 Phase 9: 暫定Tier分け（構造ベース）\n");

    const results: InterventionAnalysis[] = [];

    // Scan all lesson files
    const domains = fs.readdirSync(LESSONS_DIR).filter(d =>
        fs.statSync(path.join(LESSONS_DIR, d)).isDirectory()
    );

    for (const domain of domains) {
        const domainPath = path.join(LESSONS_DIR, domain);
        const files = fs.readdirSync(domainPath).filter(f => f.endsWith(".json"));

        for (const file of files) {
            const filePath = path.join(domainPath, file);
            const lessonId = file.replace(".ja.json", "").replace(".json", "");

            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const questions = JSON.parse(content);

                for (const q of questions) {
                    const analysis = analyzeIntervention(q, lessonId);
                    if (analysis) {
                        results.push(analysis);
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Error processing ${file}:`, e);
            }
        }
    }

    // Group by Tier
    const tierA = results.filter(r => r.tier === "A");
    const tierB = results.filter(r => r.tier === "B");
    const tierC = results.filter(r => r.tier === "C");

    // Output
    console.log("=".repeat(60));
    console.log(`📊 分析結果: ${results.length}介入\n`);

    console.log(`✨ Tier A（昇格候補）: ${tierA.length}件`);
    console.log("   → テンプレート化推奨。次のレッスン量産で優先使用。\n");
    for (const r of tierA) {
        console.log(`   [${r.id}] ${r.try_this.substring(0, 40)}...`);
    }

    console.log(`\n⏸️ Tier B（保留）: ${tierB.length}件`);
    console.log("   → データ取得後に再判定。軽微な改善で昇格可能。\n");
    for (const r of tierB) {
        const missingStr = r.missing.length > 0 ? ` [欠: ${r.missing.join(", ")}]` : "";
        console.log(`   [${r.id}]${missingStr}`);
    }

    console.log(`\n❌ Tier C（除外検討）: ${tierC.length}件`);
    console.log("   → 改修するか、テンプレから除外。\n");
    for (const r of tierC) {
        const missingStr = r.missing.length > 0 ? ` [欠: ${r.missing.join(", ")}]` : "";
        console.log(`   [${r.id}]${missingStr}`);
    }

    // Summary table
    console.log("\n" + "=".repeat(60));
    console.log("📋 Tier別サマリー\n");
    console.log("| Tier | 件数 | 次のアクション |");
    console.log("|------|------|----------------|");
    console.log(`| A    | ${tierA.length.toString().padStart(4)} | テンプレート化・量産で優先使用 |`);
    console.log(`| B    | ${tierB.length.toString().padStart(4)} | データ取得待ち・軽微改善 |`);
    console.log(`| C    | ${tierC.length.toString().padStart(4)} | 改修 or 除外 |`);

    // Export JSON for further processing
    const outputPath = path.join(__dirname, "tier_analysis.json");
    fs.writeFileSync(outputPath, JSON.stringify({ tierA, tierB, tierC }, null, 2));
    console.log(`\n💾 詳細データ: ${outputPath}`);
}

main().catch(console.error);
