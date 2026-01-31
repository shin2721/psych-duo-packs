import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { glob } from 'glob';

// Configuration
const TARGET_LANGUAGES = ['en', 'es', 'zh', 'fr', 'de', 'ko', 'pt'];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY environment variable is missing.");
  console.error("Please run: export OPENAI_API_KEY='sk-...' && node scripts/translate_lessons.mjs");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const LESSONS_DIR = path.join(process.cwd(), 'data/lessons');

async function translateText(text, targetLang) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: `You are a professional translator for a psychology learning app. Translate the following text to ${targetLang}. Keep the tone educational but accessible. Preserve any emojis.` },
        { role: "user", content: text }
      ],
      model: "gpt-4o-mini", // Cost-effective model
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error);
    return text; // Fallback to original
  }
}

async function translateLessonFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  
  // We need to generate a localized version for each target language
  // The strategy: Save as {filename}_{lang}.json OR keep structure?
  // Strategy: For Psycle, let's assume we want a localized folder structure: data/lessons/{lang}/...
  // But for now, let's create a sibling file: money_l24.en.json
  
  for (const lang of TARGET_LANGUAGES) {
    const newFileName = filePath.replace('.json', `.${lang}.json`);
    
    // Skip if exists
    try {
      await fs.access(newFileName);
      console.log(`  - Skipping ${lang} (already exists)`);
      continue;
    } catch {}

    console.log(`  - Translating to ${lang}...`);
    
    const translatedContent = await Promise.all(content.map(async (item) => {
      const newItem = { ...item };
      
      // Translate dynamic fields
      if (newItem.question) newItem.question = await translateText(newItem.question, lang);
      if (newItem.explanation) newItem.explanation = await translateText(newItem.explanation, lang);
      if (newItem.choices) {
        newItem.choices = await Promise.all(newItem.choices.map(c => translateText(c, lang)));
      }
      if (newItem.actionable_advice) newItem.actionable_advice = await translateText(newItem.actionable_advice, lang);
      
      return newItem;
    }));

    await fs.writeFile(newFileName, JSON.stringify(translatedContent, null, 2));
  }
}

async function main() {
  console.log("🚀 Starting Bulk AI Translation...");
  
  // Find all base JSON files (exclude already localized ones like *.en.json)
  const files = await glob(`${LESSONS_DIR}/**/*.json`);
  const baseFiles = files.filter(f => !f.match(/\.[a-z]{2}\.json$/));

  console.log(`Found ${baseFiles.length} lesson files to translate.`);

  for (const file of baseFiles) {
    await translateLessonFile(file);
  }

  console.log("✅ All translations completed!");
}

main().catch(console.error);
