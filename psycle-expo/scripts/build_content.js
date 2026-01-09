
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const TRACKS = ["mental", "work"];
const ROOT_DIR = "../"; // Relative to psycle-expo/
const OUTPUT_DIR = "data/lessons";

async function buildTrack(track) {
    console.log(`\n🔨 Building track: ${track}...`);

    const sourceDir = path.resolve(ROOT_DIR, track);
    const outputPath = path.join(OUTPUT_DIR, `${track}.json`);

    try {
        // Read all json files in the track directory
        const files = await readdir(sourceDir);
        const packFiles = files.filter(f => f.startsWith(`${track}_w`) && f.endsWith(".json"));

        let allCards = [];

        // Sort files to ensure order (w01, w02...)
        packFiles.sort();

        for (const file of packFiles) {
            const filePath = path.join(sourceDir, file);
            const raw = await readFile(filePath, "utf8");
            const data = JSON.parse(raw);

            // Support both { id, cards: [] } format and raw array format
            const cards = Array.isArray(data) ? data : (data.cards || []);

            console.log(`   📦 Loaded ${file} (${cards.length} cards)`);
            allCards = allCards.concat(cards);
        }

        // Ensure output directory exists
        await mkdir(OUTPUT_DIR, { recursive: true });

        // Write the consolidated file
        // Note: The app seems to support a flat array of cards.
        // If we need { packs: [...] } structure, we can adjust here.
        // Based on previous reverse sync, mental.json was flat array of cards.

        await writeFile(outputPath, JSON.stringify(allCards, null, 2));
        console.log(`   ✅ Compiled ${allCards.length} cards to ${outputPath}`);

    } catch (err) {
        console.error(`❌ Failed to build track ${track}: ${err.message}`);
    }
}

async function main() {
    for (const track of TRACKS) {
        await buildTrack(track);
    }
}

main().catch(console.error);
