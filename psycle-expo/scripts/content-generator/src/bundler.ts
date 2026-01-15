/**
 * Lesson Bundler: Packages accumulated questions into complete lessons.
 * 
 * When a domain's auto/ directory has 10+ questions, bundles them into
 * a proper lesson file that can be used directly by the app.
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";

const LESSONS_ROOT = join(__dirname, "..", "..", "..", "data", "lessons");
const THRESHOLD = 10; // Questions needed to form a lesson

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
    const files = readdirSync(autoDir).filter(f => f.endsWith(".json"));

    if (files.length < THRESHOLD) {
        console.log(`   ⏳ ${domain.key}: ${files.length}/${THRESHOLD} questions (not ready)`);
        return null;
    }

    console.log(`   ✅ ${domain.key}: ${files.length} questions → Bundling...`);

    // Read and parse questions (take first THRESHOLD)
    const questionsToBundle = files.slice(0, THRESHOLD);
    const questions: any[] = [];

    // Determine lesson ID
    const lessonNum = getNextLessonNumber(domain.dir, domain.prefix);
    const lessonId = `${domain.prefix}_l${String(lessonNum).padStart(2, "0")}`;

    for (let i = 0; i < questionsToBundle.length; i++) {
        const file = questionsToBundle[i];
        const filePath = join(autoDir, file);
        const content = readFileSync(filePath, "utf-8");
        const question = JSON.parse(content);

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

    for (const file of questionsToBundle) {
        const srcPath = join(autoDir, file);
        const destPath = join(bundledDir, file);
        // Move by copying then deleting
        writeFileSync(destPath, readFileSync(srcPath));
        unlinkSync(srcPath);
    }
    console.log(`   🗂️  Moved ${questionsToBundle.length} files to bundled/`);

    return {
        domain: domain.key,
        lessonId,
        questionCount: questions.length,
        outputPath,
    };
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
