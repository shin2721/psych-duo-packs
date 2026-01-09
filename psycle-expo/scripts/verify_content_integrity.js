const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/lessons');
const FILES = ['health.json', 'study.json', 'money.json', 'social.json'];

const REQUIRED_FIELDS = [
    'id', 'type', 'question', 'choices', 'correct_index',
    'explanation', 'source_id', 'difficulty', 'xp'
];

const MAX_QUESTION_LENGTH = 120; // Slightly relaxed from 100
const MAX_EXPLANATION_LENGTH = 350; // Slightly relaxed from 300

let globalIds = new Set();
let errors = [];
let warnings = [];

console.log('🔍 Starting Content Integrity Verification...\n');

FILES.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
        errors.push(`❌ File not found: ${file}`);
        return;
    }

    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Checking ${file} (${content.length} questions)...`);

        content.forEach((item, index) => {
            const location = `${file} [Index: ${index}]`;

            // 1. Check ID Uniqueness
            if (!item.id) {
                errors.push(`❌ Missing ID at ${location}`);
            } else if (globalIds.has(item.id)) {
                errors.push(`❌ Duplicate ID found: ${item.id} in ${file}`);
            } else {
                globalIds.add(item.id);
            }

            // 2. Check Required Fields
            REQUIRED_FIELDS.forEach(field => {
                if (item[field] === undefined || item[field] === null || item[field] === '') {
                    errors.push(`❌ Missing required field: '${field}' at ${location} (ID: ${item.id})`);
                }
            });

            // 3. Check Logic
            if (item.choices && Array.isArray(item.choices)) {
                if (item.correct_index < 0 || item.correct_index >= item.choices.length) {
                    errors.push(`❌ Invalid correct_index at ${location} (ID: ${item.id})`);
                }
            }

            // 4. Check Lengths (Warnings)
            if (item.question && item.question.length > MAX_QUESTION_LENGTH) {
                warnings.push(`⚠️ Question too long (${item.question.length} chars) at ${location} (ID: ${item.id})`);
            }
            if (item.explanation && item.explanation.length > MAX_EXPLANATION_LENGTH) {
                warnings.push(`⚠️ Explanation too long (${item.explanation.length} chars) at ${location} (ID: ${item.id})`);
            }
        });

    } catch (e) {
        errors.push(`❌ JSON Parse Error in ${file}: ${e.message}`);
    }
});

console.log('\n📊 Verification Report');
console.log('========================');
if (errors.length === 0) {
    console.log('✅ No Errors Found');
} else {
    console.log(`❌ ${errors.length} Errors Found:`);
    errors.forEach(e => console.log(e));
}

if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} Warnings Found:`);
    warnings.forEach(w => console.log(w));
}

console.log('\nDone.');
