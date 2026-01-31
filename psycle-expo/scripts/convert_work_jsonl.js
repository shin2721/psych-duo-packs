
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INPUT_FILE = "data/questions/work.jsonl";
const OUTPUT_FILE = "data/lessons/work.json";

async function main() {
    try {
        const raw = await readFile(INPUT_FILE, "utf8");
        const lines = raw.split("\n").filter(line => line.trim() !== "");

        const cards = lines.map((line, index) => {
            const data = JSON.parse(line);
            const id = `work_l01_${String(index + 1).padStart(3, "0")}`;

            return {
                id: id,
                type: "multiple_choice", // Defaulting to multiple_choice for now
                stem: data.stem,
                choices: data.choices.map(c => c.text),
                answer_index: data.correct_index,
                snack: "科学的根拠に基づく出題です。", // Placeholder as jsonl lacks snack
                info: data.citation,
                difficulty: data.difficulty || "medium",
                xp: 10
            };
        });

        await writeFile(OUTPUT_FILE, JSON.stringify(cards, null, 2));
        console.log(`✅ Converted ${cards.length} items to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error("❌ Failed:", err);
    }
}

main();
