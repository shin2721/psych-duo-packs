#!/usr/bin/env node

/**
 * Translates English choice text in question files to Japanese
 * Uses Google Translate API
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import translate from "@iamtraction/google-translate";

const UNITS = ["mental", "money", "work", "health", "social", "study"];

/**
 * Translate text to Japanese using Google Translate
 * Falls back to original text if translation fails
 */
async function translateToJapanese(text) {
  try {
    const result = await translate(text, { from: "en", to: "ja" });
    return result.text || text;
  } catch (error) {
    console.warn(`Translation failed for: ${text.substring(0, 50)}...`);
    return text;
  }
}

/**
 * Translate all choices and stem in a question object
 */
async function translateQuestion(question) {
  const translatedChoices = [];

  for (const choice of question.choices) {
    const translatedText = await translateToJapanese(choice.text);
    translatedChoices.push({
      ...choice,
      text: translatedText
    });
  }

  // Translate the question stem as well
  const translatedStem = await translateToJapanese(question.stem);

  return {
    ...question,
    stem: translatedStem,
    choices: translatedChoices
  };
}

async function main() {
  console.log("Starting translation of question choices to Japanese...\n");

  for (const unit of UNITS) {
    const inputPath = `data/questions/${unit}.jsonl`;

    if (!existsSync(inputPath)) {
      console.log(`❌ Skipping ${unit}: File not found`);
      continue;
    }

    console.log(`📖 Processing ${unit}...`);

    const content = await readFile(inputPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    const translatedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const question = JSON.parse(lines[i]);
      console.log(`  Translating question ${i + 1}/${lines.length}...`);

      const translatedQuestion = await translateQuestion(question);
      translatedLines.push(JSON.stringify(translatedQuestion));

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Write back to file
    await writeFile(inputPath, translatedLines.join("\n") + "\n", "utf-8");
    console.log(`✅ ${unit}: Translated ${lines.length} questions\n`);
  }

  console.log("\n✅ Translation complete! Run conversion script to update JSON files:");
  console.log("node scripts/convert_jsonl_to_json.mjs");
}

main().catch(console.error);
