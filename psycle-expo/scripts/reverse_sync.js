
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const TRACKS = ["mental", "work"];
const INPUT_DIR = "data/lessons";
const ROOT_DIR = "../"; // Relative to psycle-expo/

async function reverseSync(track) {
    console.log(`\n🔄 Reverse Syncing track: ${track}...`);

    const inputPath = path.join(INPUT_DIR, `${track}.json`);

    try {
        const raw = await readFile(inputPath, "utf8");
        let data;

        // Handle both array format (work.json) and object format (mental.json)
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error(`❌ Invalid JSON in ${inputPath}`);
            return;
        }

        let packs = [];

        if (Array.isArray(data)) {
            // Group by lesson ID pattern: track_l{level}_{index}
            // e.g. mental_l01_001 -> mental_w01
            // e.g. mental_l02_001 -> mental_w02

            const grouped = {};
            let unknownCount = 0;

            data.forEach(card => {
                // Try to extract lesson number from ID
                const match = card.id.match(/_l(\d+)_/);
                if (match) {
                    const lessonNum = match[1]; // "01", "02"
                    const packId = `${track}_w${lessonNum}`;
                    if (!grouped[packId]) grouped[packId] = [];
                    grouped[packId].push(card);
                } else {
                    // Fallback for IDs without lesson number (e.g. minicase_001)
                    // We'll assign them to w01 for now or try to infer from context
                    // Actually, minicase_001 in mental.json seems to belong to l01 based on context
                    // Let's dump unknowns into w01
                    const packId = `${track}_w01`;
                    if (!grouped[packId]) grouped[packId] = [];
                    grouped[packId].push(card);
                    unknownCount++;
                }
            });

            console.log(`   ℹ️  Grouped ${data.length} items. (Unknown IDs assigned to w01: ${unknownCount})`);

            for (const [pid, cards] of Object.entries(grouped)) {
                packs.push({ id: pid, cards });
            }

        } else if (data.packs) {
            // If it's the object format { packs: [...] } (like mental.json from previous build)
            packs = data.packs;
        } else if (data.id && data.cards) {
            // Single pack format?
            packs.push(data);
        } else {
            // Fallback: if it's an array but didn't match the above,
            // it might be a simple flat array that should all go into w01.
            // This handles cases like the original work.json where all items were in one array.
            console.log(`   ℹ️  Detected flat array format (${data.length} items) without lesson IDs. Assigning to ${track}_w01.`);
            packs.push({
                id: `${track}_w01`,
                cards: data
            });
        }

        for (const pack of packs) {
            const packId = pack.id;
            const outputDir = path.resolve(ROOT_DIR, track);
            const outputPath = path.join(outputDir, `${packId}.json`);

            // Ensure directory exists
            await mkdir(outputDir, { recursive: true });

            // Construct pack object preserving metadata if possible, or creating basic structure
            const packContent = {
                id: packId,
                cards: pack.cards
            };

            await writeFile(outputPath, JSON.stringify(packContent, null, 2));
            console.log(`   💾 Saved ${pack.cards.length} cards to ${outputPath}`);
        }

    } catch (err) {
        console.error(`❌ Failed to sync track ${track}: ${err.message}`);
    }
}

async function main() {
    for (const track of TRACKS) {
        await reverseSync(track);
    }
}

main().catch(console.error);
