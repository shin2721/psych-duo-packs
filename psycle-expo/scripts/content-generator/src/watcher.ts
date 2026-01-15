import Parser from "rss-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { join } from "path";
import { checkRelevance, extractSeedFromNews, RawNewsItem, ExtractedSeed } from "./extractor";

dotenv.config({ path: join(__dirname, "..", ".env") });

const parser = new Parser();

const SOURCES = [
    {
        name: "ScienceDaily (Psychology)",
        url: "https://www.sciencedaily.com/rss/mind_brain/psychology.xml",
    },
    {
        name: "ScienceDaily (Behavioral Science)",
        url: "https://www.sciencedaily.com/rss/mind_brain/behavioral_science.xml",
    },
    {
        name: "EurekAlert! (Social/Behavioral Science)",
        url: "https://www.eurekalert.org/rss/social_behavior.xml",
    },
];

// Simple keyword pre-filter (cheap, fast)
const KEYWORDS = [
    "bias", "decision", "behavior", "habit", "motivation", "willpower",
    "stress", "burnout", "empathy", "influence", "persuasion", "negotiation",
    "productivity", "cognitive", "psychology", "mental", "emotional",
    "anxiety", "depression", "relationship", "social", "brain",
];

interface WatcherResult {
    rawItems: RawNewsItem[];
    filteredItems: RawNewsItem[];
    extractedSeeds: ExtractedSeed[];
}

async function watch(useAI: boolean = false): Promise<WatcherResult> {
    console.log("🕵️  Psycle News Watcher: Starting patrol...");
    console.log("==========================================");

    const rawItems: RawNewsItem[] = [];
    const filteredItems: RawNewsItem[] = [];
    const extractedSeeds: ExtractedSeed[] = [];

    // Step 1: Fetch all RSS items
    for (const source of SOURCES) {
        try {
            console.log(`📡 Checking source: ${source.name}...`);
            const feed = await parser.parseURL(source.url);
            const items = feed.items.slice(0, 10);

            for (const item of items) {
                const title = item.title || "";
                const snippet = item.contentSnippet || item.content || "";
                const fullText = (title + " " + snippet).toLowerCase();

                // Simple keyword pre-filter
                const match = KEYWORDS.filter((k) => fullText.includes(k));

                if (match.length > 0) {
                    rawItems.push({
                        title: title,
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

    console.log(`\n📋 Pre-filter found ${rawItems.length} potential items.`);

    // Step 2: AI Relevance Filter (if enabled)
    if (useAI && process.env.GEMINI_API_KEY) {
        console.log("\n🤖 Running AI relevance filter...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        for (const item of rawItems) {
            try {
                const relevance = await checkRelevance(genAI, item);
                console.log(`  [${relevance.psychologyScore}/10] ${item.title.slice(0, 50)}...`);

                if (relevance.isRelevant && relevance.psychologyScore >= 5) {
                    filteredItems.push(item);
                }
            } catch (error) {
                console.error(`  ❌ Error checking relevance: ${error}`);
                // On error, include item (fail-safe)
                filteredItems.push(item);
            }
        }

        console.log(`\n✅ AI filter passed ${filteredItems.length}/${rawItems.length} items.`);

        // Step 3: Extract Seeds
        console.log("\n🧬 Extracting seeds from filtered items...");

        for (const item of filteredItems) {
            try {
                const seed = await extractSeedFromNews(genAI, item);
                if (seed) {
                    extractedSeeds.push(seed);
                    console.log(`  ✅ Extracted: ${seed.core_principle}`);
                } else {
                    console.log(`  ⏭️  Skipped (not extractable): ${item.title.slice(0, 40)}...`);
                }
            } catch (error) {
                console.error(`  ❌ Error extracting seed: ${error}`);
            }
        }

        console.log(`\n🌱 Extracted ${extractedSeeds.length} seeds.`);
    } else {
        // No AI mode: just report raw items
        console.log("\n⚠️  AI mode disabled. Showing raw items only.");
        rawItems.forEach((item, index) => {
            console.log(`\n[${index + 1}] ${item.title}`);
            console.log(`    Source: ${item.source}`);
            console.log(`    Link: ${item.link}`);
        });
    }

    console.log("\n==========================================");
    console.log("✅ Patrol complete.");

    return { rawItems, filteredItems, extractedSeeds };
}

// Run if executed directly
const args = process.argv.slice(2);
const useAI = args.includes("--ai");

watch(useAI).then((result) => {
    if (result.extractedSeeds.length > 0) {
        console.log("\n📦 Extracted Seeds (JSON):");
        console.log(JSON.stringify(result.extractedSeeds, null, 2));
    }
});
