// scripts/convert_jsonl_to_json.mjs
// JSONL を JSON配列に変換（React Nativeで読み込みやすくする）
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const UNITS = ["mental", "money", "work", "health", "social", "study"];

async function main() {
  if (!existsSync("data/lessons")) {
    await mkdir("data/lessons", { recursive: true });
  }

  for (const unit of UNITS) {
    const jsonlPath = `data/questions_duolingo/${unit}.jsonl`;
    const jsonPath = `data/lessons/${unit}.json`;

    const jsonlContent = await readFile(jsonlPath, "utf8");
    const lines = jsonlContent.split("\n").filter(l => l.trim());
    const questions = lines.map(line => JSON.parse(line));

    await writeFile(jsonPath, JSON.stringify(questions, null, 2), "utf8");
    console.log(`✓ ${unit}: ${questions.length}問 → ${jsonPath}`);
  }

  console.log("\n✅ 変換完了: data/lessons/*.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
