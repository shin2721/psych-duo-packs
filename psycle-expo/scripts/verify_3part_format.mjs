#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const lessonsDir = 'data/lessons_variety';
const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json')).sort();

let totalQuestions = 0;
let completeQuestions = 0;
let incompleteFiles = [];

for (const file of files) {
  const filepath = path.join(lessonsDir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  const total = data.length;
  const complete = data.filter(q => q.explanation && q.fun_fact && q.tip).length;

  totalQuestions += total;
  completeQuestions += complete;

  if (complete === total) {
    console.log(`✅ ${file}: ${complete}/${total} complete`);
  } else {
    console.log(`❌ ${file}: ${complete}/${total} complete`);
    incompleteFiles.push(file);

    // Show which questions are incomplete
    data.forEach((q, i) => {
      if (!q.explanation || !q.fun_fact || !q.tip) {
        console.log(`   Q${i+1}: exp=${!!q.explanation} fun=${!!q.fun_fact} tip=${!!q.tip}`);
      }
    });
  }
}

console.log(`\n📊 Summary:`);
console.log(`  Total files: ${files.length}`);
console.log(`  Total questions: ${totalQuestions}`);
console.log(`  Complete questions: ${completeQuestions}/${totalQuestions}`);
console.log(`  Incomplete files: ${incompleteFiles.length}`);

if (incompleteFiles.length === 0) {
  console.log(`\n🎉 All 36 lessons have complete 3-part format!`);
} else {
  console.log(`\n⚠️  Incomplete files: ${incompleteFiles.join(', ')}`);
}
