#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const lessonsDir = join(projectRoot, 'data/lessons_variety');
const files = readdirSync(lessonsDir).filter(f => f.endsWith('.jsonl'));

console.log(`Converting ${files.length} JSONL files to JSON...`);

for (const file of files) {
  const jsonlPath = join(lessonsDir, file);
  const jsonPath = jsonlPath.replace('.jsonl', '.json');

  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const questions = lines.map(l => JSON.parse(l));

  writeFileSync(jsonPath, JSON.stringify(questions, null, 2));
  console.log(`✓ ${file} → ${file.replace('.jsonl', '.json')} (${questions.length} questions)`);
}

console.log('\nDone! All JSONL files converted to JSON.');
