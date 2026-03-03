import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { Seed, QuestionType, GenerationResult, PipelineConfig } from "./types";
import { generateQuestion } from "./generator";
import { evaluateQuestion, formatCriticReport } from "./critic";
import { evaluateDeterministicGate } from "./deterministicGate";
import { appendGateFailure } from "./metrics";

// Load environment variables
config({ path: join(__dirname, "..", ".env") });

const SEEDS_PATH = join(__dirname, "..", "seeds", "psychology_seeds.json");
const OUTPUT_DIR = join(__dirname, "..", "output");

function loadSeeds(): Seed[] {
    const content = readFileSync(SEEDS_PATH, "utf-8");
    return JSON.parse(content);
}

function getSeedById(seeds: Seed[], id: string): Seed | undefined {
    return seeds.find((s) => s.id === id);
}

function getSeedsByDomain(seeds: Seed[], domain: string): Seed[] {
    return seeds.filter((s) => s.domain === domain);
}

async function runPipeline(config: PipelineConfig): Promise<GenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            attempts: 0,
            error: "GEMINI_API_KEY not found in environment variables. Get your free API key at https://aistudio.google.com/app/apikey",
        };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let attempts = 0;

    while (attempts < config.maxRetries) {
        attempts++;
        console.log(`\n🔄 Attempt ${attempts}/${config.maxRetries}`);

        try {
            // Step 1: Generate
            console.log("📝 Generating question...");
            const question = await generateQuestion(
                genAI,
                config.seed,
                config.questionType,
                config.difficulty
            );
            console.log("✅ Question generated");

            const gate = evaluateDeterministicGate(question, { expectedDomain: config.seed.domain });
            if (!gate.passed) {
                appendGateFailure({
                    timestamp: new Date().toISOString(),
                    phase: question.phase,
                    questionType: question.type,
                    domain: String(config.seed.domain),
                    hardViolations: gate.hardViolations,
                    warnings: gate.warnings,
                });
                console.log(`🚫 Deterministic gate failed: ${gate.hardViolations.join(", ")}`);
                continue;
            }

            // Step 2: Evaluate
            console.log("🔍 Evaluating quality...");
            const criticResult = await evaluateQuestion(genAI, question);
            console.log(formatCriticReport(criticResult));

            if (criticResult.passed) {
                return {
                    success: true,
                    question,
                    criticResult,
                    attempts,
                };
            } else {
                console.log("⚠️ Quality check failed, retrying...");
            }
        } catch (error) {
            console.error(`❌ Error in attempt ${attempts}:`, error);
        }
    }

    return {
        success: false,
        attempts,
        error: `Failed after ${config.maxRetries} attempts`,
    };
}

async function main() {
    const args = process.argv.slice(2);

    // Parse CLI arguments
    const seedId = args.find((a) => a.startsWith("--seed="))?.split("=")[1];
    const domain = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
    const questionType = (args.find((a) => a.startsWith("--type="))?.split("=")[1] || "multiple_choice") as QuestionType;
    const difficulty = (args.find((a) => a.startsWith("--difficulty="))?.split("=")[1] || "medium") as "easy" | "medium" | "hard";
    const count = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "1", 10);

    console.log("🚀 Psycle Content Generator (Gemini 2.0 Flash - Free Tier)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const seeds = loadSeeds();
    let targetSeeds: Seed[] = [];

    if (seedId) {
        const seed = getSeedById(seeds, seedId);
        if (!seed) {
            console.error(`❌ Seed not found: ${seedId}`);
            process.exit(1);
        }
        targetSeeds = [seed];
    } else if (domain) {
        targetSeeds = getSeedsByDomain(seeds, domain).slice(0, count);
        if (targetSeeds.length === 0) {
            console.error(`❌ No seeds found for domain: ${domain}`);
            process.exit(1);
        }
    } else {
        targetSeeds = seeds.slice(0, count);
    }

    console.log(`📦 Processing ${targetSeeds.length} seed(s)`);
    console.log(`📋 Question type: ${questionType}`);
    console.log(`📊 Difficulty: ${difficulty}`);

    const results: GenerationResult[] = [];

    for (const seed of targetSeeds) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🌱 Processing seed: ${seed.core_principle}`);

        const result = await runPipeline({
            seed,
            questionType,
            difficulty,
            maxRetries: 3,
            minCriticScore: 35,
        });

        results.push(result);

        if (result.success && result.question) {
            const outputPath = join(OUTPUT_DIR, `${seed.id}_${questionType}.json`);
            writeFileSync(outputPath, JSON.stringify(result.question, null, 2), "utf-8");
            console.log(`💾 Saved to: ${outputPath}`);
        }
    }

    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Summary");
    console.log(`✅ Success: ${results.filter((r) => r.success).length}/${results.length}`);
    console.log(`❌ Failed: ${results.filter((r) => !r.success).length}/${results.length}`);
}

main().catch(console.error);
