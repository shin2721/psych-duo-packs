#!/usr/bin/env node

/**
 * DeepL APIを使ってPSYCH_TERMSを拡充するスクリプト
 *
 * フロー:
 * 1. 論文から英語キーワードを抽出 (extract_keywords_from_papers.mjs)
 * 2. DeepL APIで英語→日本語に翻訳
 * 3. Claudeで説明文を生成（15文字以内）
 * 4. ユーザーレビュー用のファイルを出力
 *
 * 使い方:
 *   export DEEPL_API_KEY="your-api-key-here"
 *   node scripts/expand_with_deepl.mjs
 */

import * as deepl from 'deepl-node';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// ========================================
// 設定
// ========================================

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!DEEPL_API_KEY) {
  console.error('❌ DEEPL_API_KEY が設定されていません');
  console.error('   export DEEPL_API_KEY="your-key-here"');
  process.exit(1);
}

// ========================================
// 論文からキーワードを抽出
// ========================================

function extractKeywordsFromPapers() {
  console.log('📚 論文からキーワードを抽出中...\n');

  const sources = JSON.parse(fs.readFileSync('data/sources.json', 'utf-8'));

  // 抽出パターン（より厳密に）
  const patterns = {
    therapies: /\b(cognitive behavioral therapy|acceptance and commitment therapy|dialectical behavior therapy|interpersonal therapy|psychodynamic therapy|mindfulness-based|solution-focused|narrative therapy|gestalt therapy|art therapy|music therapy|schema therapy|compassion-focused therapy|emotion-focused therapy)\b/gi,

    disorders: /\b(major depressive disorder|generalized anxiety disorder|social anxiety|panic disorder|obsessive-compulsive disorder|post-traumatic stress|bipolar disorder|eating disorder|substance use disorder|attention deficit|autism spectrum|borderline personality|adjustment disorder|dissociative disorder|somatoform disorder|body dysmorphic|hoarding disorder|trichotillomania|intermittent explosive)\b/gi,

    concepts: /\b(cognitive reappraisal|emotion regulation|behavioral activation|exposure therapy|systematic desensitization|cognitive restructuring|problem-solving|coping strategies|resilience|self-efficacy|mindfulness|metacognition|cognitive load|working memory|executive function|attentional control|emotional intelligence|empathy|self-compassion|gratitude|optimism|growth mindset|grit|intrinsic motivation|self-determination|locus of control|learned helplessness|cognitive bias|confirmation bias|anchoring|halo effect|dunning-kruger)\b/gi,
  };

  const extracted = {
    therapies: new Set(),
    disorders: new Set(),
    concepts: new Set(),
  };

  sources.forEach(source => {
    const text = (source.abstract || '') + ' ' + (source.title || '');

    Object.keys(patterns).forEach(key => {
      const matches = text.match(patterns[key]);
      if (matches) {
        matches.forEach(m => {
          // 正規化（小文字化、トリム）
          const normalized = m.toLowerCase().trim();
          extracted[key].add(normalized);
        });
      }
    });
  });

  console.log('✅ 抽出完了\n');
  console.log(`  therapies:  ${extracted.therapies.size}個`);
  console.log(`  disorders:  ${extracted.disorders.size}個`);
  console.log(`  concepts:   ${extracted.concepts.size}個\n`);

  return {
    therapies: Array.from(extracted.therapies),
    disorders: Array.from(extracted.disorders),
    concepts: Array.from(extracted.concepts),
  };
}

// ========================================
// DeepL翻訳
// ========================================

async function translateWithDeepL(keywords) {
  console.log('🌍 DeepL APIで翻訳中...\n');

  const translator = new deepl.Translator(DEEPL_API_KEY);
  const results = {
    therapies: [],
    disorders: [],
    concepts: [],
  };

  for (const [category, items] of Object.entries(keywords)) {
    console.log(`  ${category} (${items.length}個)...`);

    for (const en of items) {
      try {
        // DeepL翻訳
        const result = await translator.translateText(en, 'en', 'ja');
        const ja = result.text;

        results[category].push({ en, ja });

        // レート制限対策（100ms待機）
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`    ⚠️ 翻訳失敗: ${en} - ${error.message}`);
      }
    }
  }

  console.log('\n✅ 翻訳完了\n');
  return results;
}

// ========================================
// Claude で説明文生成
// ========================================

async function generateDescriptions(translatedTerms) {
  console.log('🤖 Claudeで説明文を生成中...\n');

  // ANTHROPIC_API_KEYが設定されていない場合はスキップ
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ ANTHROPIC_API_KEY未設定 - 説明文生成をスキップします\n');

    // 説明文なしで返す
    return {
      therapies: translatedTerms.therapies.map(t => ({ ...t, desc: '（説明文なし）' })),
      disorders: translatedTerms.disorders.map(t => ({ ...t, symptom: '（症状なし）' })),
      concepts: translatedTerms.concepts.map(t => ({ ...t, effect: '（効果なし）' })),
    };
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const results = {
    therapies: [],
    disorders: [],
    concepts: [],
  };

  // therapies（治療法）
  console.log('  therapies の説明文を生成中...');
  for (const { en, ja } of translatedTerms.therapies) {
    const prompt = `心理療法「${ja}」（英: ${en}）を15文字以内で説明してください。初心者向けの分かりやすい表現で。`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      });

      const desc = response.content[0].text.trim().substring(0, 15);
      results.therapies.push({ ja, en, desc });

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`    ⚠️ 生成失敗: ${ja} - ${error.message}`);
      results.therapies.push({ ja, en, desc: '（生成失敗）' });
    }
  }

  // disorders（障害）
  console.log('  disorders の症状を生成中...');
  for (const { en, ja } of translatedTerms.disorders) {
    const prompt = `精神障害「${ja}」（英: ${en}）の主な症状を15文字以内で説明してください。`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      });

      const symptom = response.content[0].text.trim().substring(0, 15);
      results.disorders.push({ ja, en, symptom });

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`    ⚠️ 生成失敗: ${ja} - ${error.message}`);
      results.disorders.push({ ja, en, symptom: '（生成失敗）' });
    }
  }

  // concepts（概念）
  console.log('  concepts の効果を生成中...');
  for (const { en, ja } of translatedTerms.concepts) {
    const prompt = `心理学的概念「${ja}」（英: ${en}）の効果や意味を15文字以内で説明してください。`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      });

      const effect = response.content[0].text.trim().substring(0, 15);
      results.concepts.push({ ja, en, effect });

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`    ⚠️ 生成失敗: ${ja} - ${error.message}`);
      results.concepts.push({ ja, en, effect: '（生成失敗）' });
    }
  }

  console.log('\n✅ 説明文生成完了\n');
  return results;
}

// ========================================
// メイン処理
// ========================================

async function main() {
  console.log('🚀 DeepL統合によるPSYCH_TERMS拡充スクリプト\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // ステップ1: 論文からキーワード抽出
    const keywords = extractKeywordsFromPapers();

    // ステップ2: DeepL翻訳
    const translated = await translateWithDeepL(keywords);

    // ステップ3: Claude説明文生成
    const withDescriptions = await generateDescriptions(translated);

    // ステップ4: ファイル保存
    const outputPath = 'data/psych_terms_from_papers.json';
    fs.writeFileSync(outputPath, JSON.stringify(withDescriptions, null, 2), 'utf-8');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ 完了！\n');
    console.log(`📊 生成結果:`);
    console.log(`  therapies:  ${withDescriptions.therapies.length}個`);
    console.log(`  disorders:  ${withDescriptions.disorders.length}個`);
    console.log(`  concepts:   ${withDescriptions.concepts.length}個`);
    console.log(`  合計:       ${withDescriptions.therapies.length + withDescriptions.disorders.length + withDescriptions.concepts.length}個\n`);

    console.log(`💾 保存先: ${outputPath}\n`);
    console.log('📝 次のステップ:');
    console.log('  1. cat data/psych_terms_from_papers.json で内容を確認');
    console.log('  2. 間違い・重複をチェック');
    console.log('  3. data/psych_terms_candidates.json とマージ');
    console.log('  4. scripts/auto_generate_problems.mjs に統合\n');

    // プレビュー
    console.log('👀 プレビュー（各カテゴリ3個）:\n');

    console.log('【therapies】');
    withDescriptions.therapies.slice(0, 3).forEach(t => {
      console.log(`  - ${t.ja} (${t.en}): ${t.desc}`);
    });

    console.log('\n【disorders】');
    withDescriptions.disorders.slice(0, 3).forEach(d => {
      console.log(`  - ${d.ja} (${d.en}): ${d.symptom}`);
    });

    console.log('\n【concepts】');
    withDescriptions.concepts.slice(0, 3).forEach(c => {
      console.log(`  - ${c.ja} (${c.en}): ${c.effect}`);
    });

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
