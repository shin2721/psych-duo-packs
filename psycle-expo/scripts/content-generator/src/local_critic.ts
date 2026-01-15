
import { GeneratedQuestion, CriticResult } from "./types";
import * as fs from "fs";
import * as path from "path";

// Load curated sources registry
let curatedSourceIds: Set<string> = new Set();
try {
    const sourcesPath = path.join(__dirname, "../../../data/curated_sources.json");
    const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, "utf-8"));
    curatedSourceIds = new Set(Object.keys(sourcesData.sources || {}));
} catch (e) {
    console.warn("[LocalCritic] Could not load curated_sources.json");
}

// Vocabulary lists
// Note: "必ず" is context-dependent - handled separately
const FAIL_WORDS = [
    "治る", "治療できる", "確実に", "絶対",
    "100%", "証明された", "科学的に確定", "人生が変わる", "劇的に改善"
];
const WARN_WORDS = [
    "高い効果", "多くの研究", "一般に", "効果的"
];

export function evaluateQuestionLocal(question: GeneratedQuestion): CriticResult {
    const violations = {
        scientific_integrity: false,
        ux_standards: false,
        success_granularity: false,
        evidence_template: false,
        life_scene_first: false,
        no_level_collapse: false,
        user_can_be_right: false,
        psychoeducation_first: false,
        citation_reality: false,
        mechanism_over_outcome: false,
        claim_evidence_binding: false,
        dose_and_timebox: false,
        counterexample_first: false,
        vocabulary_hygiene: false
    };

    const warnings = {
        scene_specificity: false,
        twist_line: false,
        vocabulary_warn: false,
        choice_tension: false,
        source_fit: false,
        tiny_metric: false,
        comparator: false,
        countermove: false,
        evidence_consistency: false
    };

    const feedbackLines: string[] = [];

    // --- Rule 16: Vocabulary Hygiene ---
    // Safe scanning of text fields
    const textToScan = [
        question.question,
        (question.explanation as any)?.correct || (typeof question.explanation === 'string' ? question.explanation : ""),
        question.actionable_advice || "",
        question.expanded_details?.citation_role || ""
    ].join(" ");

    for (const word of FAIL_WORDS) {
        if (textToScan.includes(word)) {
            violations.vocabulary_hygiene = true;
            feedbackLines.push(`[FAIL] Prohibited word found: "${word}"`);
        }
    }

    // Special case: "必ず" - WARN for is_true:false (debunking), FAIL otherwise
    if (textToScan.includes("必ず")) {
        const isDebunking = question.type === "swipe_judgment" && question.is_true === false;
        if (isDebunking) {
            warnings.vocabulary_warn = true;
            feedbackLines.push(`[WARN] "必ず" found - acceptable in debunking context (is_true: false)`);
        } else {
            violations.vocabulary_hygiene = true;
            feedbackLines.push(`[FAIL] Prohibited word found: "必ず" (not a debunking question)`);
        }
    }

    for (const word of WARN_WORDS) {
        if (textToScan.includes(word)) {
            warnings.vocabulary_warn = true;
            feedbackLines.push(`[WARN] Sensitive word found: "${word}"`);
        }
    }

    // --- Structural Checks (Intervention) ---
    const details = (question.expanded_details || {}) as any;
    const hasExpandedDetails = question.expanded_details && Object.keys(question.expanded_details).length > 0;
    const isIntervention = details.claim_type === "intervention";

    if (isIntervention) {
        // Tiny Metric
        if (!details.tiny_metric) {
            warnings.tiny_metric = true;
            feedbackLines.push("[WARN] Missing tiny_metric for intervention");
        } else if (!details.tiny_metric.stop_rule) {
            warnings.tiny_metric = true;
            feedbackLines.push("[WARN] Missing tiny_metric.stop_rule");
        }

        // Comparator
        if (!details.comparator) {
            warnings.comparator = true;
            feedbackLines.push("[WARN] Missing comparator for intervention");
        } else if (!details.comparator.baseline || !details.comparator.cost) {
            warnings.comparator = true;
            feedbackLines.push("[WARN] Incomplete comparator (needs baseline & cost)");
        }

        // Fallback / Countermove
        if (details.try_this && !details.fallback) {
            warnings.countermove = true;
            feedbackLines.push("[WARN] Missing fallback for try_this action");
        }
    }

    // --- Rule 20: Evidence Consistency ---
    // Only require citation_role when expanded_details exists
    if (hasExpandedDetails && !details.citation_role) {
        warnings.evidence_consistency = true;
        feedbackLines.push("[WARN] Missing citation_role (expanded_details exists)");
    }

    // evidence_grade without expanded_details = data inconsistency
    if (question.evidence_grade && !hasExpandedDetails) {
        warnings.evidence_consistency = true;
        feedbackLines.push("[WARN] evidence_grade exists but expanded_details is missing (data inconsistency)");
    }

    // --- Claim Tags ---
    if (hasExpandedDetails && (!details.claim_tags || details.claim_tags.length === 0)) {
        warnings.source_fit = true;
        feedbackLines.push("[WARN] Missing claim_tags");
    }

    // --- Rule 21: Source ID Registry Check ---
    // source_id must exist in curated_sources.json
    if (question.source_id && curatedSourceIds.size > 0) {
        if (!curatedSourceIds.has(question.source_id)) {
            violations.citation_reality = true;
            feedbackLines.push(`[FAIL] source_id "${question.source_id}" not found in curated_sources.json`);
        }
    }

    const passed = !Object.values(violations).some(v => v);

    return {
        passed,
        violations: violations as any,
        warnings: warnings as any,
        citation_reality_level: "ok",
        feedback: feedbackLines.join("\n") || "Local Check: OK"
    };
}
