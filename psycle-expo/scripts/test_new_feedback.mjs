#!/usr/bin/env node

/**
 * 新しいincorrect_feedbackフィールドのテスト
 *
 * generateResearchCritique()関数を直接呼び出してテスト
 */

import fs from 'fs';

// ソースデータを読み込み
const sources = JSON.parse(fs.readFileSync('./data/sources.json', 'utf-8'));

// ProblemGeneratorクラスの最小実装（generateResearchCritique()のみ）
class TestGenerator {
  constructor(sources) {
    this.sources = sources;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateResearchCritique() {
    // 研究の限界を指摘する問題
    const flaws = [
      {
        text: 'サンプルサイズが小さすぎる（統計的検出力の問題）',
        explanation: '少数のサンプルでは本当の効果を見逃す可能性が高い',
        incorrect_empathy: 'サンプルサイズを気にするのは素晴らしい視点だね！統計的検出力は確かに重要だよ。',
      },
      {
        text: '因果関係が証明できていない（相関≠因果）',
        explanation: '観察研究では「AとBに関連がある」ことは分かっても「AがBの原因」とは言えない',
        incorrect_empathy: '因果関係と相関を区別しようとしているのは良いね！これは研究を読む時の重要なポイントだよ。',
      },
      {
        text: '再現性が確認されていない（単一研究の限界）',
        explanation: '一つの研究だけでは偶然の結果かもしれないから、複数の研究で確認が必要',
        incorrect_empathy: '再現性に注目するのは科学的思考の証拠だね！確かに単一研究には限界があるよ。',
      },
      {
        text: 'バイアスの可能性がある（選択バイアス・測定バイアス）',
        explanation: '研究デザインによっては結果が歪んでいる可能性がある',
        incorrect_empathy: 'バイアスを警戒するのは批判的思考の基本だね！研究の質を見極める良い視点だよ。',
      },
    ];

    // ランダムに研究論文を選択
    const papers = this.sources.filter(s => s.abstract && s.abstract.length > 100);
    if (papers.length === 0) {
      console.error('❌ Error: No papers with abstracts found');
      return null;
    }
    const paper = this.randomChoice(papers);

    // 4つの限界をシャッフルして、最初の3つを選択
    const shuffledFlaws = this.shuffle(flaws);
    const selectedFlaws = shuffledFlaws.slice(0, 3);

    // 正解は常に最初の選択肢
    const correctFlaw = selectedFlaws[0];

    // 詳細な説明を生成
    const detailedExplanation = `この研究の最も重要な限界は「${correctFlaw.text}」だよ。\n\n${correctFlaw.explanation}。だから、この結果をそのまま実践に応用するのは慎重になった方がいいんだ。`;

    // 不正解フィードバックを生成
    const incorrectFeedback = {};
    selectedFlaws.forEach((flaw, index) => {
      if (index !== 0) { // 正解（index 0）以外
        incorrectFeedback[index] = `${flaw.incorrect_empathy}\n\nでも、この研究では「${correctFlaw.text}」の方がより深刻な問題なんだ。${correctFlaw.explanation}からね。\n\n💡見分け方: 研究の最も重要な限界は、「結果の信頼性に最も大きく影響するもの」だよ。`;
      }
    });

    return {
      id: `critique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'mcq3',
      stem: `🔬 この研究の主な限界は？\n\n📄「${paper.title.substring(0, 60)}...」`,
      choices: selectedFlaws.map(f => f.text),
      answer_index: 0,
      explanation: detailedExplanation,
      fun_fact: `💡「完璧な研究」は存在しないんだ。だからこそメタ分析（複数の研究を統合）が重要になるんだよ。`,
      tip: `🔍実践: 論文を読む時は、「どんな限界がある？」って考える習慣をつけよう。批判的思考力が鍛えられるよ。`,
      incorrect_feedback: incorrectFeedback,
      emoji_hint: '🔬',
      difficulty: 'hard',
      source_id: paper.id,
    };
  }
}

// テスト実行
console.log('🧪 Testing generateResearchCritique() with incorrect_feedback...\n');

const generator = new TestGenerator(sources);
const question = generator.generateResearchCritique();

if (!question) {
  console.error('❌ Failed to generate question');
  process.exit(1);
}

console.log('✅ Generated Question:');
console.log(JSON.stringify(question, null, 2));

console.log('\n📊 Field Check:');
console.log('- Has explanation:', !!question.explanation);
console.log('- Has fun_fact:', !!question.fun_fact);
console.log('- Has tip:', !!question.tip);
console.log('- Has incorrect_feedback:', !!question.incorrect_feedback);

if (question.incorrect_feedback) {
  console.log('\n🎯 incorrect_feedback structure:');
  Object.entries(question.incorrect_feedback).forEach(([key, value]) => {
    console.log(`\n  Choice ${key}:`);
    console.log(`    ${value.substring(0, 100)}...`);
  });
}

console.log('\n✨ Test complete!');
