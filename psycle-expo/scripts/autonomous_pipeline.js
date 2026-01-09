const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Autonomous Content Generation Pipeline
 * 
 * Usage: node autonomous_pipeline.js <genre>
 * Example: node autonomous_pipeline.js Health
 * 
 * This script will:
 * 1. Generate curriculum (100 units)
 * 2. Generate questions (1,000 questions)
 * 3. Evaluate quality (probabilistic)
 * 4. Auto-merge if quality threshold met
 * 5. Generate comprehensive report
 */

const QUALITY_THRESHOLD = 0.90; // 90% pass rate required

function log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: "ℹ️",
        success: "✅",
        error: "❌",
        warning: "⚠️"
    }[type] || "ℹ️";

    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function runCommand(command, description) {
    log(`Starting: ${description}`, "info");
    try {
        const output = execSync(command, {
            encoding: "utf8",
            stdio: "pipe"
        });
        log(`Completed: ${description}`, "success");
        return { success: true, output };
    } catch (error) {
        log(`Failed: ${description}`, "error");
        log(error.message, "error");
        return { success: false, error: error.message };
    }
}

async function evaluateQuality(genre) {
    const genreLower = genre.toLowerCase();
    const questionsPath = `data/lessons/${genreLower}_generated_full.json`;

    if (!fs.existsSync(questionsPath)) {
        log(`Questions file not found: ${questionsPath}`, "error");
        return { passRate: 0, passed: false };
    }

    const questions = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
    const sampleSize = Math.min(50, questions.length);
    const sample = [];

    // Random sampling
    for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        sample.push(questions[randomIndex]);
    }

    let passCount = 0;
    const failures = [];

    for (const q of sample) {
        let passed = true;
        const reasons = [];

        // 1. Structure check
        if (!q.id || !q.type || !q.question || !q.choices || !q.explanation) {
            passed = false;
            reasons.push("Missing required fields");
        }

        // 2. Citation check
        const parenthetical = /\([A-Za-z\s&\-.,]+,?\s*\d{4}\)/;
        const narrative = /[A-Za-z\s&\-.,]+\s*\(\d{4}\)/;

        if (!parenthetical.test(q.explanation) && !narrative.test(q.explanation)) {
            passed = false;
            reasons.push("No citation found");
        }

        // 3. Choices check
        if (!Array.isArray(q.choices) || q.choices.length !== 4) {
            passed = false;
            reasons.push("Invalid choices");
        }

        // 4. Answer index check
        if (typeof q.answer_index !== "number" || q.answer_index < 0 || q.answer_index > 3) {
            passed = false;
            reasons.push("Invalid answer_index");
        }

        if (passed) {
            passCount++;
        } else {
            failures.push({ id: q.id, reasons });
        }
    }

    const passRate = passCount / sampleSize;

    log(`Quality Evaluation Results:`, "info");
    log(`  Sample Size: ${sampleSize}`, "info");
    log(`  Pass Rate: ${(passRate * 100).toFixed(1)}%`, passRate >= QUALITY_THRESHOLD ? "success" : "warning");
    log(`  Failures: ${failures.length}`, failures.length === 0 ? "success" : "warning");

    if (failures.length > 0) {
        log(`Failed Questions:`, "warning");
        failures.forEach(f => {
            log(`  - ${f.id}: ${f.reasons.join(", ")}`, "warning");
        });
    }

    return {
        passRate,
        passed: passRate >= QUALITY_THRESHOLD,
        sampleSize,
        passCount,
        failures
    };
}

async function main() {
    const genre = process.argv[2];

    if (!genre) {
        console.error("Usage: node autonomous_pipeline.js <genre>");
        console.error("Example: node autonomous_pipeline.js Health");
        process.exit(1);
    }

    log(`=== Autonomous Content Pipeline Started ===`, "info");
    log(`Genre: ${genre}`, "info");
    log(`Quality Threshold: ${(QUALITY_THRESHOLD * 100).toFixed(0)}%`, "info");

    const report = {
        genre,
        timestamp: new Date().toISOString(),
        steps: []
    };

    // Step 1: Generate Curriculum
    const curriculumResult = runCommand(
        `node scripts/generate_curriculum.js ${genre}`,
        "Curriculum Generation"
    );
    report.steps.push({ step: "curriculum", ...curriculumResult });

    if (!curriculumResult.success) {
        log("Pipeline aborted due to curriculum generation failure", "error");
        fs.writeFileSync(`data/pipeline_report_${genre.toLowerCase()}.json`, JSON.stringify(report, null, 2));
        process.exit(1);
    }

    // Step 2: Generate Questions
    log("Starting question generation (this will take ~45 minutes)...", "info");
    const questionsResult = runCommand(
        `node scripts/generate_questions.js ${genre}`,
        "Question Generation"
    );
    report.steps.push({ step: "questions", ...questionsResult });

    if (!questionsResult.success) {
        log("Pipeline aborted due to question generation failure", "error");
        fs.writeFileSync(`data/pipeline_report_${genre.toLowerCase()}.json`, JSON.stringify(report, null, 2));
        process.exit(1);
    }

    // Step 3: Evaluate Quality
    log("Evaluating quality...", "info");
    const qualityResult = await evaluateQuality(genre);
    report.steps.push({ step: "quality_evaluation", ...qualityResult });

    if (!qualityResult.passed) {
        log(`Quality check failed (${(qualityResult.passRate * 100).toFixed(1)}% < ${(QUALITY_THRESHOLD * 100).toFixed(0)}%)`, "error");
        log("Content NOT merged. Manual review required.", "warning");
        fs.writeFileSync(`data/pipeline_report_${genre.toLowerCase()}.json`, JSON.stringify(report, null, 2));
        process.exit(1);
    }

    // Step 4: Merge Content
    const mergeResult = runCommand(
        `node scripts/merge_generic.js ${genre}`,
        "Content Merge"
    );
    report.steps.push({ step: "merge", ...mergeResult });

    if (!mergeResult.success) {
        log("Merge failed", "error");
        fs.writeFileSync(`data/pipeline_report_${genre.toLowerCase()}.json`, JSON.stringify(report, null, 2));
        process.exit(1);
    }

    // Final Report
    log("=== Pipeline Complete ===", "success");
    log(`Genre: ${genre}`, "success");
    log(`Quality: ${(qualityResult.passRate * 100).toFixed(1)}%`, "success");
    log(`Status: Content successfully merged`, "success");

    report.status = "success";
    report.finalQuality = qualityResult.passRate;

    const reportPath = `data/pipeline_report_${genre.toLowerCase()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Report saved to: ${reportPath}`, "success");
}

main().catch(error => {
    log(`Pipeline crashed: ${error.message}`, "error");
    process.exit(1);
});
