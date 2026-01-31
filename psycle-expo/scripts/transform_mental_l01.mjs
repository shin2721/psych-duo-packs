#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the backup file (original with 15 questions)
const backupPath = path.join(__dirname, '../data/lessons_variety/mental_l01.json.backup');
const outputPath = path.join(__dirname, '../data/lessons_variety/mental_l01.json');

const originalData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

console.log(`Original questions: ${originalData.length}`);

// Read current file (first 5 questions already transformed)
const currentPath = path.join(__dirname, '../data/lessons_variety/mental_l01.json');
const currentData = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));

console.log(`Current questions: ${currentData.length}`);
console.log(`Need to transform: ${originalData.length - currentData.length} questions`);

// Transform remaining questions (6-15)
const remainingQuestions = originalData.slice(5);

console.log('\n🔥 Transforming remaining questions...\n');

// Keep the first 5 (already transformed)
const finalData = [...currentData];

// Add remaining 10 questions (will keep original structure for now, then manually improve)
for (const q of remainingQuestions) {
  console.log(`Processing: ${q.id} (${q.type})`);
  finalData.push(q);
}

// Write complete file
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

console.log(`\n✅ Complete! Total questions: ${finalData.length}`);
console.log(`Output: ${outputPath}`);
