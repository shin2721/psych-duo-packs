const fs = require("fs");

// Load the generated questions
// Get genre from command line argument, default to Mental
const genre = process.argv[2] || "Mental";
const questionsPath = `data/lessons/${genre.toLowerCase()}_generated_full.json`;

console.log(`Evaluating quality for: ${genre}`);
console.log(`Loading: ${questionsPath}`);

const questions = JSON.parse(fs.readFileSync(questionsPath, "utf8"));

const TOTAL_QUESTIONS = questions.length;
const SAMPLE_SIZE = 50; // 5% sample size

console.log(`Total Questions: ${TOTAL_QUESTIONS}`);
console.log(`Sample Size: ${SAMPLE_SIZE}`);

// Random sampling
const sampleIndices = new Set();
while (sampleIndices.size < SAMPLE_SIZE) {
    sampleIndices.add(Math.floor(Math.random() * TOTAL_QUESTIONS));
}

const sample = Array.from(sampleIndices).map(index => questions[index]);

// Evaluation Metrics
let checks = {
    validStructure: 0,
    hasCitation: 0,
    validChoices: 0,
    validAnswerIndex: 0,
    validIdFormat: 0,
    reasonableLength: 0
};

const failures = [];

sample.forEach((q, idx) => {
    let passed = true;
    let reasons = [];

    // 1. Valid Structure
    if (q.id && q.question && q.choices && q.explanation && q.source_id) {
        checks.validStructure++;
    } else {
        passed = false;
        reasons.push("Missing required fields");
    }

    // 2. Citation Check (looking for (Author, Year) or Author (Year) pattern)
    // Supports: (Smith, 2020), (Smith & Jones, 2020), Smith (2020), Smith and Jones (2020)
    const parenthetical = /\([A-Za-z\s&\-.,]+,?\s*\d{4}\)/;
    const narrative = /[A-Za-z\s&\-.,]+\s*\(\d{4}\)/;

    if (parenthetical.test(q.explanation) || narrative.test(q.explanation)) {
        checks.hasCitation++;
    } else {
        passed = false;
        reasons.push("No citation found in explanation");
    }

    // 3. Valid Choices (must be 4)
    if (Array.isArray(q.choices) && q.choices.length === 4) {
        checks.validChoices++;
    } else {
        passed = false;
        reasons.push(`Invalid choices length: ${q.choices?.length}`);
    }

    // 4. Valid Answer Index (0-3)
    if (Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index <= 3) {
        checks.validAnswerIndex++;
    } else {
        passed = false;
        reasons.push(`Invalid answer index: ${q.answer_index}`);
    }

    // 5. Valid ID Format ({genre}_lXX_qXX)
    const idRegex = new RegExp(`^${genre.toLowerCase()}_l\\d{2,3}_q\\d{2}$`);
    if (idRegex.test(q.id)) {
        checks.validIdFormat++;
    } else {
        passed = false;
        reasons.push(`Invalid ID format: ${q.id}`);
    }

    // 6. Reasonable Length (Question > 10 chars, Explanation > 20 chars)
    if (q.question.length > 10 && q.explanation.length > 20) {
        checks.reasonableLength++;
    } else {
        passed = false;
        reasons.push("Content too short");
    }

    if (!passed) {
        failures.push({ id: q.id, reasons });
    }
});

// Calculate percentages
const results = {
    sampleSize: SAMPLE_SIZE,
    metrics: {
        structurePassRate: (checks.validStructure / SAMPLE_SIZE) * 100,
        citationPassRate: (checks.hasCitation / SAMPLE_SIZE) * 100,
        choicesPassRate: (checks.validChoices / SAMPLE_SIZE) * 100,
        answerIndexPassRate: (checks.validAnswerIndex / SAMPLE_SIZE) * 100,
        idFormatPassRate: (checks.validIdFormat / SAMPLE_SIZE) * 100,
        contentLengthPassRate: (checks.reasonableLength / SAMPLE_SIZE) * 100
    },
    failures: failures,
    sampleQuestions: sample.slice(0, 3) // Show 3 examples
};

console.log("\n=== Quality Evaluation Results ===");
console.log(JSON.stringify(results, null, 2));

// Save detailed report
fs.writeFileSync("data/quality_report.json", JSON.stringify(results, null, 2));
