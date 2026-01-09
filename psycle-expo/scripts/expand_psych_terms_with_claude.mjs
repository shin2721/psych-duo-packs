#!/usr/bin/env node

/**
 * PSYCH_TERMSを拡充するスクリプト
 *
 * 論文から抽出したキーワード + Claudeの知識で
 * therapies, disorders, conceptsを大幅拡充
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

console.log('🚀 PSYCH_TERMS拡充スクリプト開始\n');

// 既存データを確認
const existingTherapies = 15;
const existingDisorders = 14;
const existingConcepts = 18;

console.log('📊 現状:');
console.log(`  therapies:  ${existingTherapies}個`);
console.log(`  disorders:  ${existingDisorders}個`);
console.log(`  concepts:   ${existingConcepts}個`);
console.log(`  合計:       ${existingTherapies + existingDisorders + existingConcepts}個\n`);

console.log('🎯 目標:');
console.log(`  therapies:  20個 (+5)`);
console.log(`  disorders:  30個 (+16)`);
console.log(`  concepts:   40個 (+22)`);
console.log(`  合計:       90個 (+43)\n`);

// 生成
async function generateExpansions() {
  console.log('⏳ Claudeで候補を生成中...\n');

  const prompt = `あなたは心理学の専門家です。以下の3カテゴリについて、日本の一般ユーザー向けの学習アプリで使える用語を提案してください。

【therapies（治療法・技法）】
既存15個に加えて、以下の条件で5個追加してください：
- 一般的で、エビデンスがあるもの
- 日本でも使われているもの
- 初心者にも理解できるもの

【disorders（心理的問題・障害）】
既存14個に加えて、16個追加してください：
- DSM-5に載っているような正式な障害だけでなく
- 「スマホ依存」「SNS疲れ」「完璧主義」のような一般的な心理的問題も含める

【concepts（心理学的概念）】
既存18個に加えて、22個追加してください：
- 感情、認知、行動に関する概念
- ポジティブ心理学の概念
- 神経科学・脳科学の概念

JSON形式で出力してください：
{
  "therapies": [
    { "ja": "日本語名", "en": "English Name", "desc": "一言説明（15文字以内）" }
  ],
  "disorders": [
    { "ja": "日本語名", "en": "English Name", "symptom": "主な症状（15文字以内）" }
  ],
  "concepts": [
    { "ja": "日本語名", "en": "English Name", "effect": "効果・説明（15文字以内）" }
  ]
}

重要：
- 既存のものと重複しないこと
- 日本語は自然で分かりやすいこと
- 説明は15文字以内で簡潔に`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = response.content[0].text;

  // JSONを抽出（```json ... ``` で囲まれている場合）
  let jsonText = content;
  const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  return JSON.parse(jsonText);
}

// メイン処理
async function main() {
  try {
    const expansions = await generateExpansions();

    console.log('✅ 生成完了！\n');
    console.log('📊 生成された候補:');
    console.log(`  therapies:  ${expansions.therapies.length}個`);
    console.log(`  disorders:  ${expansions.disorders.length}個`);
    console.log(`  concepts:   ${expansions.concepts.length}個\n`);

    // ファイルに保存
    const outputPath = 'data/psych_terms_candidates.json';
    fs.writeFileSync(outputPath, JSON.stringify(expansions, null, 2), 'utf-8');

    console.log(`💾 保存しました: ${outputPath}\n`);
    console.log('📝 次のステップ:');
    console.log('  1. cat data/psych_terms_candidates.json で内容を確認');
    console.log('  2. 間違い・重複をチェック');
    console.log('  3. OK なら scripts/auto_generate_problems.mjs に手動でマージ\n');

    // プレビュー表示
    console.log('👀 プレビュー（therapies 最初の3個）:');
    expansions.therapies.slice(0, 3).forEach(t => {
      console.log(`  - ${t.ja} (${t.en}): ${t.desc}`);
    });

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
