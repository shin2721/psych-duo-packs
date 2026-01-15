import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { evaluateQuestion, formatCriticReport } from "./critic";

// Adjust path to point to root .env
config({ path: join(__dirname, "../../../.env") });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in " + join(__dirname, "../../../.env"));
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function runAudit() {
    const filePath = join(__dirname, "../../../data/lessons/mental_units/mental_l01.ja.json");
    if (process.cwd().endsWith("scripts")) {
        // Handle different cwd if run from scripts folder
    }

    console.log(`Reading file from: ${filePath}`);
    const content = JSON.parse(readFileSync(filePath, "utf-8"));

    console.log(`🔍 Auditing ${content.length} questions from mental_l01...`);

    let passed = 0;

    for (const q of content) {
        console.log(`\nEvaluating Q: ${q.id} (${q.type})...`);
        try {
            const result = await evaluateQuestion(genAI, q);
            console.log(formatCriticReport(result));
            if (result.passed) passed++;
        } catch (e) {
            console.error(`Error evaluating ${q.id}:`, e);
        }
    }

    console.log(`\n📊 Result: ${passed}/${content.length} passed.`);
}

runAudit();
