#!/usr/bin/env node

/**
 * すべての問題生成関数にtipを一括追加するスクリプト
 */

import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'scripts', 'auto_generate_problems.mjs');
let content = fs.readFileSync(filepath, 'utf-8');

// 各関数ごとにtipを追加
const replacements = [
  // generateWhichOne
  {
    search: `      fun_fact: \`💡心理療法は「オーダーメイド」。一人ひとりに合わせるのがプロの腕の見せ所！\`,
      emoji_hint: '⚖️',`,
    replace: `      fun_fact: \`💡心理療法は「オーダーメイド」。一人ひとりに合わせるのがプロの腕の見せ所！\`,
      tip: \`🔍実践: 「自分に合う方法」を見つけるために、まずは専門家に相談してみよう。最初から完璧じゃなくていいんだよ。\`,
      emoji_hint: '⚖️',`
  },
  // generateTrueFalse
  {
    search: `      fun_fact: \`💡心理療法の効果は「エビデンスレベル」で評価されるよ。多くの質の高い研究ほど信頼度が上がるんだ。\`,
      emoji_hint: '❓',`,
    replace: `      fun_fact: \`💡心理療法の効果は「エビデンスレベル」で評価されるよ。多くの質の高い研究ほど信頼度が上がるんだ。\`,
      tip: \`🔍実践: 治療を選ぶ時は、「この方法は研究で効果が示されてる？」って質問してみよう。エビデンスを確認することが大事！\`,
      emoji_hint: '❓',`
  },
  // generateEmotionQuiz
  {
    search: `      fun_fact: \`💡感情には「良い・悪い」はないよ。全ての感情は、何か大切なことを教えてくれるサインなんだ。\`,
      emoji_hint: emotion.emoji,`,
    replace: `      fun_fact: \`💡感情には「良い・悪い」はないよ。全ての感情は、何か大切なことを教えてくれるサインなんだ。\`,
      tip: \`🔍実践: 感情を感じたら、まず「今、自分は何を感じてる？」って名前をつけてみよう。感情に気づくことが、対処の第一歩だよ。\`,
      emoji_hint: emotion.emoji,`
  },
  // generateTherapistRole
  {
    search: `      fun_fact: \`💡良いセラピストは「教科書通り」じゃなく、目の前の人に合わせて柔軟にアプローチを調整するんだ。\`,
      emoji_hint: '🩺',`,
    replace: `      fun_fact: \`💡良いセラピストは「教科書通り」じゃなく、目の前の人に合わせて柔軟にアプローチを調整するんだ。\`,
      tip: \`🔍実践: セラピストを選ぶ時は、「この人と話しやすいか？」を大事にしよう。相性が良い人との方が、効果が出やすいんだ。\`,
      emoji_hint: '🩺',`
  },
  // generateResearchCritique
  {
    search: `      fun_fact: \`💡「完璧な研究」は存在しないんだ。だからこそメタ分析（複数の研究を統合）が重要になるんだよ。\`,
      emoji_hint: '🔬',`,
    replace: `      fun_fact: \`💡「完璧な研究」は存在しないんだ。だからこそメタ分析（複数の研究を統合）が重要になるんだよ。\`,
      tip: \`🔍実践: 論文を読む時は、「どんな限界がある？」って考える習慣をつけよう。批判的思考力が鍛えられるよ。\`,
      emoji_hint: '🔬',`
  },
  // generateConceptApplication
  {
    search: `      fun_fact: \`💡心理学のスキルは「知識」じゃなくて「練習」で身につくんだ。スポーツと同じで、繰り返すことが大事！\`,
      emoji_hint: '💡',`,
    replace: `      fun_fact: \`💡心理学のスキルは「知識」じゃなくて「練習」で身につくんだ。スポーツと同じで、繰り返すことが大事！\`,
      tip: \`🔍実践: 新しいスキルを試す時は、「1日1回だけ」から始めよう。習慣化するには小さく始めることがポイントだよ。\`,
      emoji_hint: '💡',`
  },
  // generateDataInterpretation
  {
    search: `      fun_fact: \`💡研究の「統計的有意差」と「臨床的な意味」は別物。数字だけじゃなくて、実際の生活への影響を見ることが大事なんだ。\`,
      emoji_hint: '📊',`,
    replace: `      fun_fact: \`💡研究の「統計的有意差」と「臨床的な意味」は別物。数字だけじゃなくて、実際の生活への影響を見ることが大事なんだ。\`,
      tip: \`🔍実践: 「69%が改善」って聞いたら、「改善ってどの程度？」「自分も当てはまる？」って質問してみよう。数字の背景を理解することが大切だよ。\`,
      emoji_hint: '📊',`
  },
  // generateEthicalDilemma
  {
    search: `      fun_fact: \`💡心理職の倫理綱領では「迷ったら相談」が基本。一人で抱え込まないことが、クライアントを守ることにつながるんだ。\`,
      emoji_hint: '⚖️',`,
    replace: `      fun_fact: \`💡心理職の倫理綱領では「迷ったら相談」が基本。一人で抱え込まないことが、クライアントを守ることにつながるんだ。\`,
      tip: \`🔍実践: 倫理的な判断に迷ったら、「この決定は誰のためになる？」って自分に問いかけてみよう。クライアントの利益を最優先に考えることが基本だよ。\`,
      emoji_hint: '⚖️',`
  },
  // generateResearchBattle
  {
    search: `      fun_fact: \`💡研究の信頼性は「査読済み」だけじゃ分からない。研究デザイン、サンプル数、バイアス対策などを総合的に見る必要があるんだ。\`,
      emoji_hint: '⚔️',`,
    replace: `      fun_fact: \`💡研究の信頼性は「査読済み」だけじゃ分からない。研究デザイン、サンプル数、バイアス対策などを総合的に見る必要があるんだ。\`,
      tip: \`🔍実践: 論文を比較する時は、「どっちの方法がより厳密？」「サンプル数は？」って具体的なポイントをチェックしよう。\`,
      emoji_hint: '⚔️',`
  },
  // generateLimitationFinder
  {
    search: `      fun_fact: \`💡良い研究者は自分の研究の限界を正直に書くんだ。「Limitations（制限事項）」セクションは論文の重要な部分だよ。\`,
      emoji_hint: '🔍',`,
    replace: `      fun_fact: \`💡良い研究者は自分の研究の限界を正直に書くんだ。「Limitations（制限事項）」セクションは論文の重要な部分だよ。\`,
      tip: \`🔍実践: 論文を読む時は、必ず「Limitations（限界）」のセクションを確認しよう。そこに書かれていることが、結果の解釈に重要なヒントになるよ。\`,
      emoji_hint: '🔍',`
  },
  // generateTreatmentMatching
  {
    search: `      fun_fact: \`💡実際の臨床では、複数の治療法を組み合わせる「統合的アプローチ」が主流になってきてるんだ。\`,
      emoji_hint: '🎯',`,
    replace: `      fun_fact: \`💡実際の臨床では、複数の治療法を組み合わせる「統合的アプローチ」が主流になってきてるんだ。\`,
      tip: \`🔍実践: 治療を受ける時は、「他の方法と組み合わせることもできる？」って聞いてみよう。複数のアプローチを使うことで、効果が高まることもあるよ。\`,
      emoji_hint: '🎯',`
  },
  // generateCloze
  {
    search: `      fun_fact: \`💡治療法と障害の組み合わせは「教科書的な正解」があるけど、実際は一人ひとりに合わせてカスタマイズするんだ。\`,
      emoji_hint: '🔤',`,
    replace: `      fun_fact: \`💡治療法と障害の組み合わせは「教科書的な正解」があるけど、実際は一人ひとりに合わせてカスタマイズするんだ。\`,
      tip: \`🔍実践: 基本的な組み合わせを覚えておくと、治療の選択肢を理解しやすくなるよ。でも「教科書通り」が絶対じゃないことも覚えておこう。\`,
      emoji_hint: '🔤',`
  },
  // generateBeforeAfter
  {
    search: `      explanation: exp.explanation,
      fun_fact: exp.fun_fact,
      emoji_hint: '📊',`,
    replace: `      explanation: exp.explanation,
      fun_fact: exp.fun_fact,
      tip: \`🔍実践: ビフォー・アフターのデータを見る時は、「どのくらいの期間で？」「他にも変化はある？」って視点を持とう。全体像を見ることが大事だよ。\`,
      emoji_hint: '📊',`
  },
  // generateRank
  {
    search: `      fun_fact: \`💡メタ分析って、複数の研究結果をまとめて分析する方法だよ。一つの研究より信頼度が高いんだ。\`,
      emoji_hint: '🏆',`,
    replace: `      fun_fact: \`💡メタ分析って、複数の研究結果をまとめて分析する方法だよ。一つの研究より信頼度が高いんだ。\`,
      tip: \`🔍実践: 効果の順位を見る時は、「自分の状況に一番合うのはどれ？」って考えてみよう。ランキング1位が必ずしもあなたに最適とは限らないよ。\`,
      emoji_hint: '🏆',`
  },
  // createFallbackQuestion
  {
    search: `      fun_fact: \`💡どれも大切だけど、特に\${concepts[0].ja}は多くの研究で効果が証明されているよ！\`,
      emoji_hint: '🧠',`,
    replace: `      fun_fact: \`💡どれも大切だけど、特に\${concepts[0].ja}は多くの研究で効果が証明されているよ！\`,
      tip: \`🔍実践: 心理学のスキルは日常生活で実践してこそ身につくもの。今日から一つでも試してみよう！\`,
      emoji_hint: '🧠',`
  },
];

let modifiedCount = 0;
for (const {search, replace} of replacements) {
  if (content.includes(search)) {
    content = content.replace(search, replace);
    modifiedCount++;
    console.log(`✓ 修正完了: ${modifiedCount}/${replacements.length}`);
  } else {
    console.log(`⚠️  見つかりません: ${search.substring(0, 50)}...`);
  }
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log(`\n✅ 完了！${modifiedCount}個の関数にtipを追加しました。`);
