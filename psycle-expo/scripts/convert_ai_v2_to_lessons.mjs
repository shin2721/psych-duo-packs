// scripts/convert_ai_v2_to_lessons.mjs
// data/questions_ai_v2/*.jsonl を data/lessons/*.json に変換

import { readFile, writeFile } from "node:fs/promises";

const UNITS = ["mental", "money", "work", "health", "social", "study"];

async function main() {
  for (const unit of UNITS) {
    const jsonlPath = `data/questions_ai_v2/${unit}.jsonl`;
    const jsonPath = `data/lessons/${unit}.json`;

    console.log(`変換中: ${unit}...`);

    const jsonlContent = await readFile(jsonlPath, "utf8");
    const lines = jsonlContent.split("\n").filter(l => l.trim());

    // JSONLの各行をそのまま配列化（既に正しい形式なので変換不要）
    const questions = lines.map(line => JSON.parse(line));

    await writeFile(jsonPath, JSON.stringify(questions, null, 2), "utf8");
    console.log(`✓ ${unit}: ${questions.length}問 → ${jsonPath}`);
  }

  console.log("\n✅ 変換完了: data/lessons/*.json");
  console.log("アプリを再起動してください");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
