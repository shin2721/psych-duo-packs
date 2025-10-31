// scripts/convert_jsonl_to_json.mjs
// JSONL を JSON配列に変換（React Nativeで読み込みやすくする）
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { decode } from "html-entities";

const UNITS = ["mental", "money", "work", "health", "social", "study"];

async function main() {
  if (!existsSync("data/lessons")) {
    await mkdir("data/lessons", { recursive: true });
  }

  for (const unit of UNITS) {
    const jsonlPath = `data/questions/${unit}.jsonl`;
    const jsonPath = `data/lessons/${unit}.json`;

    const jsonlContent = await readFile(jsonlPath, "utf8");
    const lines = jsonlContent.split("\n").filter(l => l.trim());
    const questions = lines.map(line => {
      const q = JSON.parse(line);
      // Convert from JSONL format to app format and decode HTML entities
      return {
        type: q.question_type === "true_false" ? "true_false" : "multiple_choice",
        question: decode(q.stem),
        choices: q.choices.map(c => decode(c.text)),
        correct_index: q.correct_index || 0,
        explanation: decode(q.choices[q.correct_index || 0].text),
        source_id: q.source_id,
        difficulty: q.difficulty || "medium",
        xp: q.difficulty === "hard" ? 15 : q.difficulty === "easy" ? 5 : 10
      };
    });

    await writeFile(jsonPath, JSON.stringify(questions, null, 2), "utf8");
    console.log(`✓ ${unit}: ${questions.length}問 → ${jsonPath}`);
  }

  console.log("\n✅ 変換完了: data/lessons/*.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
