/**
 * Domain Router: Routes generated questions to domain-specific lesson directories.
 * 
 * This is the "warehouse manager" that ensures content goes to the right place,
 * preserving the progression structure and learning context.
 */
import { readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";

const OUTPUT_DIR = join(__dirname, "..", "output");
const LESSONS_ROOT = join(__dirname, "..", "..", "..", "data", "lessons");

// Domain to directory mapping (staging only for Mode B)
const DOMAIN_PATHS: Record<string, string> = {
    social: "_staging/social_units",
    mental: "_staging/mental_units",
    money: "_staging/money_units",
    health: "_staging/health_units",
    productivity: "_staging/study_units",
    study: "_staging/study_units",
    work: "_staging/work_units",
    relationships: "_staging/social_units", // alias
};

interface ImportResult {
    imported: number;
    skipped: number;
    failed: number;
    byDomain: Record<string, number>;
}

/**
 * Sleep helper for rate limiting
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Route a question to the correct domain directory
 * Returns null if domain is missing or invalid (Fail Fast)
 */
function routeByDomain(question: any): string | null {
    // Try to get domain from question or nested seed
    const domain = question.domain || question.seed?.domain;

    if (!domain) {
        console.error(`   ❌ Fail Fast: Missing 'domain' field`);
        return null;
    }

    const domainPath = DOMAIN_PATHS[domain.toLowerCase()];
    if (!domainPath) {
        console.error(`   ❌ Fail Fast: Unknown domain '${domain}'`);
        return null;
    }

    return join(LESSONS_ROOT, domainPath);
}

/**
 * Import generated questions to domain-specific lesson directories
 */
export function importContent(): ImportResult {
    const result: ImportResult = {
        imported: 0,
        skipped: 0,
        failed: 0,
        byDomain: {},
    };

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
        console.log("⚠️  No output directory found. Nothing to import.");
        return result;
    }

    // Get all JSON files in output
    const jsonFiles = readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
        console.log("⚠️  No JSON files found in output. Nothing to import.");
        return result;
    }

    console.log(`\n📦 Domain Router: Processing ${jsonFiles.length} files...`);

    // Process each file
    for (const file of jsonFiles) {
        const srcPath = join(OUTPUT_DIR, file);

        try {
            // Read and parse the question
            const content = readFileSync(srcPath, "utf-8");
            const question = JSON.parse(content);

            // Route to correct domain
            const destDir = routeByDomain(question);

            if (!destDir) {
                result.failed++;
                continue;
            }

            // Ensure destination directory exists
            if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
            }

            const destPath = join(destDir, file);

            // Skip if already exists
            if (existsSync(destPath)) {
                console.log(`   ⏭️  Skipped (exists): ${file}`);
                result.skipped++;
                continue;
            }

            // Copy file to domain directory
            copyFileSync(srcPath, destPath);

            // Track by domain
            const domain = question.domain || question.seed?.domain || "unknown";
            result.byDomain[domain] = (result.byDomain[domain] || 0) + 1;

            console.log(`   ✅ ${domain.toUpperCase()} ← ${file}`);
            result.imported++;

        } catch (error) {
            console.error(`   ❌ Error processing ${file}:`, error);
            result.failed++;
        }
    }

    // Summary
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Imported: ${result.imported}`);
    console.log(`   ⏭️  Skipped: ${result.skipped}`);
    console.log(`   ❌ Failed: ${result.failed}`);

    if (Object.keys(result.byDomain).length > 0) {
        console.log(`   📁 By Domain:`);
        for (const [domain, count] of Object.entries(result.byDomain)) {
            console.log(`      - ${domain}: ${count}`);
        }
    }

    return result;
}

// CLI: Run standalone
if (require.main === module) {
    const result = importContent();
    console.log(`\n✨ Domain Router complete!`);
}
