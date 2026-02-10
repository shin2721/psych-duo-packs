const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data/lessons");
const MAX_QUESTION_LENGTH = 160;
const MAX_EXPLANATION_LENGTH = 420;

const COMMON_REQUIRED_FIELDS = [
    "id",
    "type",
    "question",
    "explanation",
    "difficulty",
    "xp",
    "source_id",
    "evidence_grade",
    "expanded_details",
];

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const globalIds = new Set();
const errors = [];
const warnings = [];

function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
}

function validateIntervention4Set(item, location) {
    const d = item.expanded_details || {};
    const missing = [];

    if (!isNonEmptyString(d.try_this)) missing.push("expanded_details.try_this");
    if (!isNonEmptyString(d?.tiny_metric?.before_prompt)) missing.push("expanded_details.tiny_metric.before_prompt");
    if (!isNonEmptyString(d?.tiny_metric?.after_prompt)) missing.push("expanded_details.tiny_metric.after_prompt");
    if (!isNonEmptyString(d?.tiny_metric?.success_rule)) missing.push("expanded_details.tiny_metric.success_rule");
    if (!isNonEmptyString(d?.tiny_metric?.stop_rule)) missing.push("expanded_details.tiny_metric.stop_rule");
    if (!isNonEmptyString(d?.comparator?.baseline)) missing.push("expanded_details.comparator.baseline");
    if (!isNonEmptyString(d?.comparator?.cost)) missing.push("expanded_details.comparator.cost");
    if (!isNonEmptyString(d?.fallback?.when)) missing.push("expanded_details.fallback.when");
    if (!isNonEmptyString(d?.fallback?.next)) missing.push("expanded_details.fallback.next");

    if (missing.length > 0) {
        errors.push(`❌ Missing intervention fields [${missing.join(", ")}] at ${location} (ID: ${item.id})`);
    }
}

function validateByType(item, location) {
    if (item.type === "multiple_choice") {
        if (!Array.isArray(item.choices) || item.choices.length < 2) {
            errors.push(`❌ multiple_choice requires choices(>=2) at ${location} (ID: ${item.id})`);
            return;
        }
        if (!Number.isInteger(item.correct_index) || item.correct_index < 0 || item.correct_index >= item.choices.length) {
            errors.push(`❌ Invalid correct_index at ${location} (ID: ${item.id})`);
        }
        return;
    }

    if (item.type === "conversation") {
        if (!Array.isArray(item.choices) || item.choices.length < 2) {
            errors.push(`❌ conversation requires choices(>=2) at ${location} (ID: ${item.id})`);
        }
        const rec = item.recommended_index;
        if (rec !== null && rec !== undefined) {
            if (!Number.isInteger(rec) || rec < 0 || rec >= item.choices.length) {
                errors.push(`❌ Invalid recommended_index at ${location} (ID: ${item.id})`);
            }
        }
        return;
    }

    if (item.type === "swipe_judgment") {
        if (typeof item.is_true !== "boolean") {
            errors.push(`❌ swipe_judgment requires boolean is_true at ${location} (ID: ${item.id})`);
        }
        if (!item.swipe_labels || !isNonEmptyString(item.swipe_labels.left) || !isNonEmptyString(item.swipe_labels.right)) {
            errors.push(`❌ swipe_judgment requires swipe_labels.left/right at ${location} (ID: ${item.id})`);
        }
        return;
    }

    warnings.push(`⚠️ Unknown type '${item.type}' at ${location} (ID: ${item.id})`);
}

function findCanonicalLessonFiles() {
    const unitDirs = fs.readdirSync(DATA_DIR).filter((d) => d.endsWith("_units"));
    const files = [];

    for (const unitDir of unitDirs) {
        const unit = unitDir.replace("_units", "");
        const dir = path.join(DATA_DIR, unitDir);
        const lessonFiles = fs
            .readdirSync(dir)
            .filter((f) => new RegExp(`^${unit}_l\\d{2}\\.ja\\.json$`).test(f))
            .map((f) => path.join(unitDir, f));
        files.push(...lessonFiles);
    }

    return files.sort();
}

console.log("🔍 Starting Content Integrity Verification (unit-based) ...\n");

const lessonFiles = findCanonicalLessonFiles();

for (const relativeFile of lessonFiles) {
    const filePath = path.join(DATA_DIR, relativeFile);
    try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

        if (!Array.isArray(content)) {
            errors.push(`❌ Lesson is not an array: ${relativeFile}`);
            continue;
        }

        console.log(`Checking ${relativeFile} (${content.length} questions)...`);

        if (content.length !== 10) {
            errors.push(`❌ Lesson must contain exactly 10 questions: ${relativeFile} (got ${content.length})`);
        }

        content.forEach((item, index) => {
            const location = `${relativeFile} [Index: ${index}]`;

            if (!item.id) {
                errors.push(`❌ Missing ID at ${location}`);
            } else if (globalIds.has(item.id)) {
                errors.push(`❌ Duplicate ID found: ${item.id} (${location})`);
            } else {
                globalIds.add(item.id);
            }

            for (const field of COMMON_REQUIRED_FIELDS) {
                if (item[field] === undefined || item[field] === null || item[field] === "") {
                    errors.push(`❌ Missing required field '${field}' at ${location} (ID: ${item.id})`);
                }
            }

            if (!DIFFICULTIES.has(item.difficulty)) {
                errors.push(`❌ Invalid difficulty '${item.difficulty}' at ${location} (ID: ${item.id})`);
            }

            if (!item.expanded_details || !item.expanded_details.claim_type || !item.expanded_details.evidence_type) {
                errors.push(`❌ Missing expanded_details.claim_type/evidence_type at ${location} (ID: ${item.id})`);
            } else if (item.expanded_details.claim_type === "intervention") {
                validateIntervention4Set(item, location);
            }

            validateByType(item, location);

            if (isNonEmptyString(item.question) && item.question.length > MAX_QUESTION_LENGTH) {
                warnings.push(`⚠️ Question too long (${item.question.length}) at ${location} (ID: ${item.id})`);
            }
            if (isNonEmptyString(item.explanation) && item.explanation.length > MAX_EXPLANATION_LENGTH) {
                warnings.push(`⚠️ Explanation too long (${item.explanation.length}) at ${location} (ID: ${item.id})`);
            }
        });
    } catch (e) {
        errors.push(`❌ JSON Parse Error in ${relativeFile}: ${e.message}`);
    }
}

console.log("\n📊 Verification Report");
console.log("========================");
console.log(`Lessons checked: ${lessonFiles.length}`);
console.log(`Question IDs checked: ${globalIds.size}`);

if (errors.length === 0) {
    console.log("✅ No Errors Found");
} else {
    console.log(`❌ ${errors.length} Errors Found:`);
    errors.forEach((e) => console.log(e));
}

if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} Warnings Found:`);
    warnings.forEach((w) => console.log(w));
}

console.log("\nDone.");

if (errors.length > 0) {
    process.exitCode = 1;
}
