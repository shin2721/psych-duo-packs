/**
 * Lesson Bundler: Packages accumulated questions into complete lessons.
 * 
 * When a domain's auto/ directory has 10+ questions, bundles them into
 * a proper lesson file that can be used directly by the app.
 */
import { appendFileSync, readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { isValidPhase, selectBalancedPhaseItems } from "./phasePolicy";
import { GeneratedQuestionSchema } from "./types";

const LESSONS_ROOT = join(__dirname, "..", "..", "..", "data", "lessons");
const THRESHOLD = 10; // Questions needed to form a lesson
const REQUIRED_PER_PHASE = 2;
const REJECTED_DIR = "rejected";
const REJECT_LOG_FILE = "reject_log.jsonl";

// Domain configurations
const DOMAINS = [
    { key: "social", dir: "social_units", prefix: "social_auto" },
    { key: "mental", dir: "mental_units", prefix: "mental_auto" },
    { key: "money", dir: "money_units", prefix: "money_auto" },
    { key: "health", dir: "health_units", prefix: "health_auto" },
    { key: "productivity", dir: "study_units", prefix: "study_auto" },
    { key: "work", dir: "work_units", prefix: "work_auto" },
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

    if (files.length < THRESHOLD) {
        console.log(`   ⏳ ${domain.key}: ${files.length}/${THRESHOLD} questions (not ready)`);
        return null;
    }

    console.log(`   ✅ ${domain.key}: ${files.length} questions → Bundling...`);

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

    const selectedEntries = selectBalancedPhaseItems(phaseEntries, REQUIRED_PER_PHASE);
    if (!selectedEntries || selectedEntries.length < THRESHOLD) {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const entry of phaseEntries) {
            if (isValidPhase(entry.phase)) counts[entry.phase]++;
        }
        console.log(`   ⏳ ${domain.key}: phase distribution not ready (p1=${counts[1]}, p2=${counts[2]}, p3=${counts[3]}, p4=${counts[4]}, p5=${counts[5]})`);
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
        question.source_id = question.id;

        questions.push(question);
    }

    // Write lesson file
    const outputPath = join(LESSONS_ROOT, domain.dir, `${lessonId}.ja.json`);
    writeFileSync(outputPath, JSON.stringify(questions, null, 4), "utf-8");
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
