/**
 * Psycle Patrol: Full Automation Orchestrator
 * 
 * This script chains the entire content pipeline:
 * 1. Watch RSS feeds for new psychology news
 * 2. Filter for relevance using AI
 * 3. Extract structured Seeds from news
 * 4. Generate questions from Seeds
 * 5. Evaluate quality with Critic
 * 6. Save passing questions to output
 * 
 * Usage: npx ts-node src/patrol.ts [--dry-run] [--limit=N]
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from "rss-parser";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { checkRelevance, extractSeedFromNews, RawNewsItem, ExtractedSeed } from "./extractor";
import { generateQuestion } from "./generator";
import { evaluateQuestion, formatCriticReport } from "./critic";
import { QuestionType, GeneratedQuestion } from "./types";
import { sleep, importContent } from "./importer";
import { checkAndBundle } from "./bundler";

config({ path: join(__dirname, "..", ".env") });

const parser = new Parser();
const OUTPUT_DIR = join(__dirname, "..", "output");
const HISTORY_PATH = join(__dirname, "..", "processed_urls.json");

// History Management (Memory System)
function loadHistory(): Set<string> {
    if (existsSync(HISTORY_PATH)) {
        try {
            const data = readFileSync(HISTORY_PATH, "utf-8");
            return new Set(JSON.parse(data));
        } catch {
            return new Set();
        }
    }
    return new Set();
}

function saveHistory(history: Set<string>): void {
    writeFileSync(HISTORY_PATH, JSON.stringify([...history], null, 2), "utf-8");
}

const SOURCES = [
    {
        name: "ScienceDaily (Psychology)",
        url: "https://www.sciencedaily.com/rss/mind_brain/psychology.xml",
    },
];

const KEYWORDS = [
    "bias", "decision", "behavior", "habit", "motivation", "willpower",
    "stress", "burnout", "empathy", "influence", "persuasion", "cognitive",
    "psychology", "mental", "emotional", "anxiety", "relationship", "social",
];

interface PatrolResult {
    newsFound: number;
    relevantNews: number;
    seedsExtracted: number;
    questionsGenerated: number;
    questionsPassed: number;
    savedQuestions: GeneratedQuestion[];
}

async function patrol(options: { dryRun?: boolean; limit?: number } = {}): Promise<PatrolResult> {
    const { dryRun = false, limit = 5 } = options;

    console.log("🚀 Psycle Patrol: Full Automation Mode");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (dryRun) console.log("⚠️  DRY RUN: No API calls will be made.");

    const result: PatrolResult = {
        newsFound: 0,
        relevantNews: 0,
        seedsExtracted: 0,
        questionsGenerated: 0,
        questionsPassed: 0,
        savedQuestions: [],
    };

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Step 1: Fetch RSS
    console.log("\n📡 Step 1: Fetching news from RSS...");
    const rawItems: RawNewsItem[] = [];
    const history = loadHistory();
    let skippedDuplicates = 0;

    for (const source of SOURCES) {
        try {
            const feed = await parser.parseURL(source.url);
            const items = feed.items.slice(0, 10);

            for (const item of items) {
                const title = item.title || "";
                const snippet = item.contentSnippet || item.content || "";
                const fullText = (title + " " + snippet).toLowerCase();

                const match = KEYWORDS.filter((k) => fullText.includes(k));
                const link = item.link || "";

                // Skip if already processed (Memory System)
                if (history.has(link)) {
                    skippedDuplicates++;
                    continue;
                }

                if (match.length > 0) {
                    rawItems.push({
                        title,
                        link: item.link || "",
                        pubDate: item.pubDate || "",
                        source: source.name,
                        snippet: snippet.slice(0, 200),
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching ${source.name}:`, error);
        }
    }

    result.newsFound = rawItems.length;
    console.log(`   Found ${rawItems.length} new items. (Skipped ${skippedDuplicates} already-processed)`);

    if (dryRun) {
        console.log("\n🛑 DRY RUN: Stopping before API calls.");
        rawItems.slice(0, limit).forEach((item, i) => {
            console.log(`   [${i + 1}] ${item.title}`);
        });
        return result;
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found. Run with --dry-run or set API key.");
        return result;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Step 2: AI Relevance Filter
    console.log("\n🤖 Step 2: AI Relevance Filter...");
    const relevantItems: RawNewsItem[] = [];

    for (const item of rawItems.slice(0, limit)) {
        try {
            const relevance = await checkRelevance(genAI, item);
            console.log(`   [${relevance.psychologyScore}/10] ${item.title.slice(0, 40)}...`);

            if (relevance.isRelevant && relevance.psychologyScore >= 5) {
                relevantItems.push(item);
            }
            await sleep(2000); // Rate limit protection
        } catch (error) {
            console.error(`   ❌ Error:`, error);
        }
    }

    result.relevantNews = relevantItems.length;
    console.log(`   Passed: ${relevantItems.length}/${Math.min(rawItems.length, limit)}`);

    // Step 3: Extract Seeds
    console.log("\n🧬 Step 3: Extracting Seeds...");
    const seeds: ExtractedSeed[] = [];

    for (const item of relevantItems) {
        try {
            const seed = await extractSeedFromNews(genAI, item);
            if (seed) {
                seeds.push(seed);
                console.log(`   ✅ ${seed.core_principle}`);
            } else {
                console.log(`   ⏭️  Skipped: ${item.title.slice(0, 40)}...`);
            }
            await sleep(2000); // Rate limit protection
        } catch (error) {
            console.error(`   ❌ Error:`, error);
        }
    }

    result.seedsExtracted = seeds.length;
    console.log(`   Extracted: ${seeds.length} seeds`);

    // Step 4: Generate Questions
    console.log("\n📝 Step 4: Generating Questions...");
    const questionTypes: QuestionType[] = ["swipe_judgment", "multiple_choice"];

    for (const seed of seeds) {
        const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        try {
            console.log(`   Generating ${qType} for "${seed.core_principle}"...`);

            // Convert ExtractedSeed to Seed format (exclude inherited id and meta)
            const { originalLink, extractionConfidence, id: _existingId, ...seedWithoutMeta } = seed;
            const fullSeed = {
                id: `patrol_${Date.now()}`,
                ...seedWithoutMeta,
                suggested_question_types: [qType],
            };

            const question = await generateQuestion(genAI, fullSeed as any, qType, "medium");
            result.questionsGenerated++;

            // Step 5: Evaluate
            console.log("   🔍 Evaluating...");
            const criticResult = await evaluateQuestion(genAI, question);
            console.log(formatCriticReport(criticResult));

            if (criticResult.passed) {
                result.questionsPassed++;
                result.savedQuestions.push(question);

                // Attach domain from seed for Domain Router
                const questionWithDomain = {
                    ...question,
                    domain: seedWithoutMeta.domain || "social", // Fallback to social
                };

                // Save to file
                const filename = `patrol_${Date.now()}_${qType}.json`;
                const filepath = join(OUTPUT_DIR, filename);
                writeFileSync(filepath, JSON.stringify(questionWithDomain, null, 2), "utf-8");
                console.log(`   💾 Saved: ${filename} (${questionWithDomain.domain})`);

                // Mark URL as processed
                history.add(seed.originalLink);
            }
            await sleep(3000); // Rate limit protection (longer for generation + critic)
        } catch (error) {
            console.error(`   ❌ Error:`, error);
        }
    }

    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Patrol Complete!");
    console.log(`   📰 News found: ${result.newsFound}`);
    console.log(`   🤖 Relevant: ${result.relevantNews}`);
    console.log(`   🧬 Seeds extracted: ${result.seedsExtracted}`);
    console.log(`   📝 Questions generated: ${result.questionsGenerated}`);
    console.log(`   ✅ Passed quality: ${result.questionsPassed}`);

    // Save history
    saveHistory(history);
    console.log(`   💾 Memory updated (${history.size} URLs tracked)`);

    // Step 6: Import to app
    console.log("\n📦 Step 6: Importing to app...");
    const importResult = importContent();
    console.log(`   ✨ Imported ${importResult.imported} new questions`);

    // Step 7: Check if any domain is ready to bundle into a lesson
    console.log("\n📚 Step 7: Checking for lesson bundling...");
    const bundleResults = checkAndBundle();
    if (bundleResults.length > 0) {
        console.log(`   🎉 Created ${bundleResults.length} new lesson(s)!`);
    }

    return result;
}

// CLI
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 5;

patrol({ dryRun, limit }).catch(console.error);
