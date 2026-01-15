import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENRES = ['mental', 'work', 'social', 'health', 'study', 'money'];
const DATA_DIR = path.join(__dirname, '../data/lessons');

function verifygenre(genre) {
    console.log(`\n🔍 Verifying ${genre}...`);
    const unitDir = path.join(DATA_DIR, `${genre}_units`);

    if (!fs.existsSync(unitDir)) {
        console.error(`❌ Directory not found: ${unitDir}`);
        return 0;
    }

    const files = fs.readdirSync(unitDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.warn(`⚠️ No JSON files found in ${unitDir}`);
        return 0;
    }

    let totalQuestions = 0;
    let errors = 0;

    files.forEach(file => {
        const filePath = path.join(unitDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const questions = JSON.parse(content);

            if (!Array.isArray(questions)) {
                console.error(`❌ ${file}: Root is not an array`);
                errors++;
                return;
            }

            totalQuestions += questions.length;

            questions.forEach((q, idx) => {
                if (!q.id) {
                    console.error(`❌ ${file} [index ${idx}]: Missing 'id'`);
                    errors++;
                }

                // Check for essential content
                const questionText = q.content?.prompt || q.stem || q.question || q.text;
                if (!questionText) {
                    console.error(`❌ ${file} [${q.id || idx}]: Missing question text`);
                    errors++;
                }

                // Check for explanation (CRITICAL: Users must have feedback)
                // term_card sometimes uses 'definition' as main content, but usually still needs explanation context
                if (!q.explanation && !q.snack && q.type !== 'term_card') {
                    console.error(`❌ ${file} [${q.id || idx}]: Missing 'explanation'`);
                    errors++;
                }

                // Basic type validation
                if (!q.type) {
                    // Some legacy formats might omit type, defaulting to MC, but good to warn
                    // console.warn(`⚠️ ${file} [${q.id}]: Missing 'type'`);
                }
            });

        } catch (e) {
            console.error(`❌ ${file}: Invalid JSON - ${e.message}`);
            errors++;
        }
    });

    console.log(`✅ ${genre}: ${files.length} files, ${totalQuestions} questions verified.`);
    if (errors > 0) console.error(`🚨 ${genre}: ${errors} errors found.`);
    return errors;
}

console.log("🚀 Starting Lesson Data Verification...");
let totalErrors = 0;
GENRES.forEach(genre => {
    totalErrors += verifygenre(genre);
});

if (totalErrors === 0) {
    console.log("\n✨ All checks passed! Data integrity looks good.");
} else {
    console.log(`\n💥 Found ${totalErrors} errors total. Please review above.`);
    process.exit(1);
}
