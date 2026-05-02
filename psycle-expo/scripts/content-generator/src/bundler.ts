/**
 * Lesson Bundler: Packages accumulated questions into complete lessons.
 * 
 * When a domain's auto/ directory has 10+ questions, bundles them into
 * a proper lesson file that can be used directly by the app.
 */
import { appendFileSync, readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getPhaseRequirements, isValidPhase, selectBalancedPhaseItems, selectItemsForPhaseRequirements } from "./phasePolicy";
import { GeneratedQuestionSchema } from "./types";
import { getClaimRegistryEntries } from "./claimRegistry";
import { evaluatePromotionGate } from "./evidencePolicy";
const { createNetNewContinuityMetadata } = require("../../lib/continuity-metadata.js");

const LESSONS_ROOT = join(__dirname, "..", "..", "..", "data", "lessons");
const THRESHOLD = 10; // Questions needed to form a lesson
const REQUIRED_PER_PHASE = 2;
const REJECTED_DIR = "rejected";
const REJECT_LOG_FILE = "reject_log.jsonl";

// Domain configurations
const DOMAINS = [
    { key: "social", dir: "_staging/social_units", prefix: "social_auto" },
    { key: "mental", dir: "_staging/mental_units", prefix: "mental_auto" },
    { key: "money", dir: "_staging/money_units", prefix: "money_auto" },
    { key: "health", dir: "_staging/health_units", prefix: "health_auto" },
    { key: "study", dir: "_staging/study_units", prefix: "study_auto" },
    { key: "work", dir: "_staging/work_units", prefix: "work_auto" },
];

interface BundleResult {
    domain: string;
    lessonId: string;
    questionCount: number;
    outputPath: string;
}

interface PhaseQuestionEntry {
    file: string;
    sourcePath: string;
    phase: number;
    question: any;
}

function buildEvidenceCard(domain: string, lessonId: string, questions: any[]) {
    const claimIds = Array.from(
        new Set(
            questions
                .map((question) => question.claim_id)
                .filter((claimId): claimId is string => typeof claimId === "string" && claimId.length > 0)
        )
    );
    const claims = getClaimRegistryEntries(claimIds);
    const promotion = evaluatePromotionGate({ questions, claims });
    const citations = claims.map((claim, index) => ({
        role: index === 0 ? "primary" : "supporting",
        source_type: claim.source_type,
        doi: "",
        pmid: "",
        url: claim.discovery_url || "",
        label: claim.academic_reference || claim.claim_text,
    }));

    const grades = claims.map((claim) => claim.source_grade);
    const evidenceGrade =
        grades.includes("bronze") ? "bronze" : grades.includes("silver") ? "silver" : "gold";
    const today = new Date().toISOString().slice(0, 10);

    return {
        source_type: "claim_registry_bundle",
        citations,
        source_label: claims.map((claim) => claim.academic_reference).filter(Boolean).join(" + "),
        claim:
            claims.map((claim) => claim.claim_text).filter(Boolean).join(" / ") ||
            `${domain} lesson bundle ${lessonId}`,
        limitations:
            promotion.reasons.length > 0
                ? `auto gate pending: ${promotion.reasons.join(", ")}`
                : "auto gate passed for recurring lesson promotion",
        effect_size_note: `claim_tiers=${promotion.tierSummary.join(",") || "unknown"}`,
        evidence_grade: evidenceGrade,
        severity_tier: "B",
        confidence: promotion.eligible ? "medium" : "low",
        status: "staged",
        last_verified: today,
        last_verified_at: today,
        review_sla_days: 90,
        expiry_action: "refresh_queue",
        next_review_due_at: today,
        stale_route_owner: "content_ops",
        refresh_value_reason_candidate: "evidence_strength_update",
        generated_by: "content_generator_auto",
        review: {
            human_approved: false,
            reviewer: "codex-auto",
            auto_approved: promotion.eligible,
            approval_mode: "auto_gate",
            approval_reasons: promotion.reasons,
            evaluated_at: new Date().toISOString(),
        },
        citation: {
            doi: "",
            pmid: "",
            url: citations[0]?.url || "",
        },
        claim_trace: claims,
        promotion,
        content_package: {
            lesson_path: `data/lessons/_staging/${domain}_units/${lessonId}.ja.json`,
            evidence_path: `data/lessons/_staging/${domain}_units/${lessonId}.evidence.json`,
            theme_manifest_path: `data/themes/${domain}.meta.json`,
            continuity_metadata_path: `data/lessons/_staging/${domain}_units/${lessonId}.continuity.json`,
            analytics_contract_id: `content.lesson.${domain}.v1`,
            analytics_contract_version: 1,
            analytics_schema_lineage: `content.lesson.${domain}.base`,
            analytics_backward_compat_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            package_dependencies: {
                requires_package_ids: [],
                dependency_rule: "no_additional_package_dependency",
                invalidation_rule: "dependency_change_requires_revalidation",
            },
            owner_id: "content_ops",
            state: "staging",
            rollback_route: `course:${domain}:entry`,
            rollback_class: "soft",
            localized_locales: ["ja"],
            localization_owner: "content_ops",
            approval_locale_set: ["ja"],
            semantic_parity_rule: "claim_strength_and_safety_must_match_across_locales",
            tone_guard: "no_shame_no_threat_better_choice_tone",
            readiness: {
                quality_gate_pass: promotion.eligible,
                dependency_valid: true,
                continuity_complete: true,
                analytics_wired: true,
                rollback_defined: true,
            },
            readiness_authority: {
                quality_gate_pass: {
                    owner: "content_ops",
                    auto_source: "deterministic_validator",
                    final_authority: "human_review_or_approved_source",
                },
                dependency_valid: {
                    owner: "runtime",
                    auto_source: "theme_manifest_validator",
                    final_authority: "approved_bypass_only",
                },
                continuity_complete: {
                    owner: "content_ops",
                    auto_source: "continuity_aftercare_validator",
                    final_authority: "redirect_and_analytics_continuity_complete",
                },
                analytics_wired: {
                    owner: "analytics",
                    auto_source: "analytics_contract_checker",
                    final_authority: "continuity_events_verified",
                },
                rollback_defined: {
                    owner: "content_ops",
                    auto_source: "rollback_metadata_checker",
                    final_authority: "rollback_route_and_owner_present",
                },
            },
            completeness: {
                localized_copy_ready: true,
                analytics_contract_named: true,
                rollback_route_present: true,
                owner_assigned: true,
                readiness_authority_complete: true,
            },
            review_decision: {
                change_type: "content_patch",
                human_review_required: false,
                approved_source: "deterministic_validator",
                review_reason: "autonomous_default_content_package_gate",
                reviewed_at: new Date().toISOString(),
                rollback_trigger_if_reverted: "guardrail_or_contract_regression",
            },
        },
    };
}

function resolveBundleTarget(entries: PhaseQuestionEntry[]): number {
    const targets = new Set<number>();

    for (const entry of entries) {
        const target = entry.question.lesson_blueprint?.question_count_range?.target;
        if (typeof target !== "number") {
            return THRESHOLD;
        }
        targets.add(target);
    }

    if (targets.size !== 1) {
        return THRESHOLD;
    }

    const [target] = [...targets];
    if (target < 5 || target > 10) {
        return THRESHOLD;
    }

    return target;
}

/**
 * Get the next available lesson number for a domain
 */
function getNextLessonNumber(domainDir: string, prefix: string): number {
    const dir = join(LESSONS_ROOT, domainDir);
    if (!existsSync(dir)) return 1;

    const files = readdirSync(dir);
    const autoLessons = files.filter(f => f.startsWith(prefix) && f.endsWith(".ja.json"));

    if (autoLessons.length === 0) return 1;

    // Extract numbers and find max
    const numbers = autoLessons.map(f => {
        const match = f.match(/_l(\d+)\./);
        return match ? parseInt(match[1], 10) : 0;
    });

    return Math.max(...numbers) + 1;
}

/**
 * Bundle questions from auto/ into a lesson file
 */
function bundleDomain(domain: typeof DOMAINS[0]): BundleResult | null {
    const autoDir = join(LESSONS_ROOT, domain.dir, "auto");

    if (!existsSync(autoDir)) {
        return null;
    }

    // Get all JSON files in auto/
    const files = readdirSync(autoDir).filter(f => f.endsWith(".json")).sort();

    if (files.length < 5) {
        console.log(`   ⏳ ${domain.key}: ${files.length}/5 questions (not ready)`);
        return null;
    }

    console.log(`   ✅ ${domain.key}: ${files.length} questions → Evaluating bundle target...`);

    const phaseEntries: PhaseQuestionEntry[] = [];
    for (const file of files) {
        const sourcePath = join(autoDir, file);
        try {
            const content = readFileSync(sourcePath, "utf-8");
            const parsed = JSON.parse(content);
            const validated = GeneratedQuestionSchema.safeParse(parsed);
            if (!validated.success) {
                rejectFile(autoDir, sourcePath, file, "schema_invalid");
                continue;
            }
            const question = validated.data;
            if (!isValidPhase(question.phase)) {
                rejectFile(autoDir, sourcePath, file, "invalid_or_missing_phase");
                continue;
            }
            phaseEntries.push({
                file,
                sourcePath,
                phase: question.phase,
                question,
            });
        } catch (error) {
            rejectFile(autoDir, sourcePath, file, "parse_error");
        }
    }

    const bundleTarget = resolveBundleTarget(phaseEntries);
    const selectedEntries =
        bundleTarget === THRESHOLD
            ? selectBalancedPhaseItems(phaseEntries, REQUIRED_PER_PHASE)
            : selectItemsForPhaseRequirements(phaseEntries, getPhaseRequirements(bundleTarget));

    if (!selectedEntries || selectedEntries.length < bundleTarget) {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const entry of phaseEntries) {
            if (isValidPhase(entry.phase)) counts[entry.phase]++;
        }
        console.log(
            `   ⏳ ${domain.key}: phase distribution not ready for target ${bundleTarget} (p1=${counts[1]}, p2=${counts[2]}, p3=${counts[3]}, p4=${counts[4]}, p5=${counts[5]})`
        );
        return null;
    }

    const questions: any[] = [];

    // Determine lesson ID
    const lessonNum = getNextLessonNumber(domain.dir, domain.prefix);
    const lessonId = `${domain.prefix}_l${String(lessonNum).padStart(2, "0")}`;

    for (let i = 0; i < selectedEntries.length; i++) {
        const question = { ...selectedEntries[i].question };

        // Assign new ID within the lesson
        question.id = `${lessonId}_q${String(i + 1).padStart(2, "0")}`;
        if (!question.source_id && question.claim_id) {
            question.source_id = question.claim_id;
        }

        questions.push(question);
    }

    // Write lesson file
    const outputPath = join(LESSONS_ROOT, domain.dir, `${lessonId}.ja.json`);
    writeFileSync(outputPath, JSON.stringify(questions, null, 4), "utf-8");
    const evidencePath = join(LESSONS_ROOT, domain.dir, `${lessonId}.evidence.json`);
    writeFileSync(
        evidencePath,
        JSON.stringify(buildEvidenceCard(domain.key, lessonId, questions), null, 2),
        "utf-8"
    );
    const continuityPath = join(LESSONS_ROOT, domain.dir, `${lessonId}.continuity.json`);
    writeFileSync(
        continuityPath,
        JSON.stringify(
            createNetNewContinuityMetadata({
                lessonId,
                themeId: domain.key,
                aftercareDefaults: {
                    aftercare_window_days: 30,
                    legacy_candidate_suppression_rule: "suppress_replaced_candidates_during_aftercare",
                },
            }),
            null,
            2
        ),
        "utf-8"
    );
    console.log(`   📦 Created: ${lessonId}.ja.json (${questions.length} questions)`);

    // Move bundled files to bundled/ (or delete)
    const bundledDir = join(autoDir, "bundled");
    if (!existsSync(bundledDir)) {
        mkdirSync(bundledDir, { recursive: true });
    }

    for (const entry of selectedEntries) {
        const srcPath = entry.sourcePath;
        const destPath = join(bundledDir, entry.file);
        // Move by copying then deleting
        writeFileSync(destPath, readFileSync(srcPath));
        unlinkSync(srcPath);
    }
    console.log(`   🗂️  Moved ${selectedEntries.length} files to bundled/`);

    return {
        domain: domain.key,
        lessonId,
        questionCount: questions.length,
        outputPath,
    };
}

function rejectFile(autoDir: string, sourcePath: string, file: string, reason: string): void {
    const rejectedDir = join(autoDir, REJECTED_DIR);
    if (!existsSync(rejectedDir)) {
        mkdirSync(rejectedDir, { recursive: true });
    }
    const rejectedPath = join(rejectedDir, file);
    writeFileSync(rejectedPath, readFileSync(sourcePath));
    unlinkSync(sourcePath);
    const logLine = JSON.stringify({
        timestamp: new Date().toISOString(),
        file,
        reason,
    });
    appendFileSync(join(rejectedDir, REJECT_LOG_FILE), `${logLine}\n`, "utf-8");
    console.log(`   🚫 Rejected ${file}: ${reason}`);
}

/**
 * Check all domains and bundle where ready
 */
export function checkAndBundle(): BundleResult[] {
    console.log("\n📚 Lesson Bundler: Checking domains...\n");

    const results: BundleResult[] = [];

    for (const domain of DOMAINS) {
        const result = bundleDomain(domain);
        if (result) {
            results.push(result);
        }
    }

    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (results.length === 0) {
        console.log("📊 No lessons ready to bundle yet.");
    } else {
        console.log(`📊 Bundled ${results.length} new lesson(s):`);
        for (const r of results) {
            console.log(`   - ${r.lessonId} (${r.questionCount} questions)`);
        }
    }

    return results;
}

// CLI
if (require.main === module) {
    checkAndBundle();
}
