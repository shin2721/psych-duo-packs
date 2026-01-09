#!/usr/bin/env node

/**
 * 論文abstractsからキーワード（技法名・概念名）を抽出
 */

import fs from 'fs';

// 論文を読み込む
const sources = JSON.parse(fs.readFileSync('data/sources.json', 'utf-8'));

console.log(`📚 Total papers: ${sources.length}\n`);

// キーワードパターン（正規表現）
const patterns = {
  therapies: /\b(\w+\s+therapy|\w+\s+intervention|\w+\s+training)\b/gi,
  techniques: /\b(cognitive reappraisal|emotion regulation|mindfulness|relaxation|exposure|behavioral activation|thought record|coping)\b/gi,
  disorders: /\b(depression|anxiety|PTSD|OCD|panic|burnout|bipolar|eating disorder)\b/gi,
};

// 抽出
const extracted = {
  therapies: new Set(),
  techniques: new Set(),
  disorders: new Set(),
};

sources.forEach(source => {
  const abstract = source.abstract || '';

  // 各パターンでマッチ
  Object.keys(patterns).forEach(key => {
    const matches = abstract.match(patterns[key]);
    if (matches) {
      matches.forEach(m => extracted[key].add(m.toLowerCase()));
    }
  });
});

// 結果表示
console.log('🎯 抽出されたキーワード:\n');

Object.keys(extracted).forEach(key => {
  console.log(`【${key}】 (${extracted[key].size}個)`);
  const items = Array.from(extracted[key]).slice(0, 20);
  items.forEach(item => console.log(`  - ${item}`));
  if (extracted[key].size > 20) {
    console.log(`  ... and ${extracted[key].size - 20} more`);
  }
  console.log('');
});

// 問題点を示す
console.log('⚠️ 論文から抽出できないもの:\n');
console.log('1. 日本語名（"cognitive reappraisal" → "認知的再評価"）');
console.log('2. 一言説明（"cognitive reappraisal" → "見方を変えて考え直す"）');
console.log('3. 具体的手順（"cognitive reappraisal" → ["ネガティブな考えを記録", "別の視点を考える", "感情の変化を観察"]）');
console.log('4. 適用場面（"cognitive reappraisal" → "試験不安、対人ストレス"）\n');

console.log('💡 つまり: 論文からは「名前」だけ取れるが、「説明」は別途作る必要がある');
