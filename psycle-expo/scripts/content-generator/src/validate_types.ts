/**
 * Type Validator
 * 
 * Tests if the Generator can correctly produce ALL 9 Question Types
 * from a single fixed Seed.
 * 
 * Usage: npx ts-node src/validate_types.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { generateQuestion } from "./generator";
import { QuestionType } from "./types";

config({ path: join(__dirname, "..", ".env") });

const OUTPUT_DIR = join(__dirname, "..", "output", "type_validation");

// 1. Fixed Mock Seed (Sunk Cost Fallacy)
const MOCK_SEED = {
    id: "validation_seed_001",
    domain: "money",
    core_principle: "サンクコスト効果（埋没費用）",
    core_principle_en: "Sunk Cost Fallacy",
    counter_intuitive_insight: "「もったいない」という感情こそが、最大の損失を生む。",
    common_misconception: "元を取ろうとするのが賢い節約だ。",
    actionable_tactic: "「今初めてこの状況に出会ったらどうするか？」と問う。",
    academic_reference: "Arkes, H. R., & Blumer, C. (1985)",
    evidence_grade: "gold",
    cultural_notes: "日本では「もったいない精神」が美徳とされるため、特に罠に陥りやすい。",
    suggested_question_types: [], // We will override this
};

const ALL_TYPES: QuestionType[] = [
    "multiple_choice",
    "swipe_judgment",
    "select_all",
    "fill_blank_tap",
    "sort_order",
    "conversation",
    "matching",
    "quick_reflex",
    "consequence_scenario",
];

async function runValidation() {
    console.log("🚀 Starting Type Validation Test...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const type of ALL_TYPES) {
        console.log(`\n🧪 Testing Type: [ ${type} ]...`);

        try {
            // Generate question
            const question = await generateQuestion(genAI, MOCK_SEED as any, type, "medium");

            console.log("   ✅ Generated Successfully!");
            console.log(`   📝 Question: ${question.question.slice(0, 50)}...`);

            // Save to file
            const filepath = join(OUTPUT_DIR, `${type}.json`);
            writeFileSync(filepath, JSON.stringify(question, null, 2), "utf-8");
            console.log(`   💾 Saved to: ${filepath}`);

            successCount++;
        } catch (error) {
            console.error("   ❌ Failed to generate:");
            console.error(error);
            failureCount++;
        }

        // Small delay to be gentle on API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Validation Complete");
    console.log(`   ✅ Success: ${successCount} / ${ALL_TYPES.length}`);
    console.log(`   ❌ Failure: ${failureCount} / ${ALL_TYPES.length}`);
    console.log(`\n📂 Check results in: ${OUTPUT_DIR}`);
}

runValidation().catch(console.error);
