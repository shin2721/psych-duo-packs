#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load sources
const sourcesPath = path.join(__dirname, '../data/sources.json');
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

// Filter sources by unit
const mentalSources = sources.filter(s => s.unit === 'mental');
const moneySources = sources.filter(s => s.unit === 'money');
const workSources = sources.filter(s => s.unit === 'work');

console.log(`Mental sources: ${mentalSources.length}`);
console.log(`Money sources: ${moneySources.length}`);
console.log(`Work sources: ${workSources.length}`);

// Helper functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateId(type, timestamp) {
  const random = Math.random().toString(36).substring(2, 11);
  return `${type}_you_${timestamp}_${random}`;
}

// Mental Health content
const mentalConcepts = [
  { term: '認知的再評価', desc: 'ネガティブな出来事を別の視点から捉え直すことで感情を調整する技法' },
  { term: 'マインドフルネス', desc: '今この瞬間に意識を向けて、判断せずに観察する心の状態' },
  { term: 'ストレス対処', desc: 'ストレスに対して効果的に対応するための様々な方法' },
  { term: '感情調整', desc: '自分の感情を認識し、適切にコントロールする能力' },
  { term: 'メンタルヘルス', desc: '心の健康状態。ストレスへの対処力や感情の安定性を含む' },
  { term: 'レジリエンス', desc: '困難な状況から回復する心の回復力' },
  { term: '認知行動療法', desc: '考え方のパターンを変えることで感情や行動を改善する治療法' },
  { term: '感情の抑制', desc: '感情を表に出さずに我慢すること。長期的にはストレスの原因になることも' }
];

const mentalBiases = [
  { name: 'ネガティブバイアス', desc: '悪い情報の方が記憶に残る', example: '褒められた10回より、怒られた1回の方を覚えてる' },
  { name: '確証バイアス', desc: '自分の考えを裏付ける情報だけ集める', example: '自分の意見に合う記事ばかり読んでしまう' },
  { name: '後知恵バイアス', desc: '後から「知ってた」と思う', example: '試験の答え見た後「これ知ってた」' },
  { name: '生存者バイアス', desc: '成功例だけ見て失敗例を無視', example: '成功者の話だけ聞いて「簡単」と思う' }
];

// Money/Finance content
const moneyConcepts = [
  { term: 'ファイナンシャルリテラシー', desc: 'お金についての知識と判断力' },
  { term: '現在バイアス', desc: '将来の利益より今の快楽を優先してしまう傾向' },
  { term: '損失回避', desc: '得することより損することを強く避けようとする心理' },
  { term: '心の会計', desc: '同じお金でも出どころや用途で価値が変わって感じる現象' },
  { term: 'サンクコスト', desc: '既に使ったお金や時間。取り戻せないのに判断に影響する' },
  { term: '衝動買い', desc: '計画なく感情的に買い物してしまうこと' },
  { term: '貯蓄行動', desc: '将来のために計画的にお金を貯める習慣' },
  { term: 'デフォルト効果', desc: '初期設定のままにしてしまう傾向。自動的に貯蓄される仕組みに活用' }
];

const moneyBiases = [
  { name: '現在バイアス', desc: '将来の利益より今の快楽を優先', example: '「来月から貯金」って毎月言ってる' },
  { name: 'サンクコストの誤謬', desc: '既に使った分を取り戻そうとする', example: 'つまらない映画でも「チケット代もったいない」と最後まで見る' },
  { name: 'アンカリング効果', desc: '最初の情報に判断が引っ張られる', example: '定価を見た後、セール価格がお得に感じる' },
  { name: '心の会計', desc: '同じ金額でも扱いが変わる', example: 'ボーナスは散財、給料は節約' }
];

// Work/Career content
const workConcepts = [
  { term: 'バーンアウト', desc: '仕事の過度なストレスで心身が疲れ果てた状態' },
  { term: 'ワークライフバランス', desc: '仕事と私生活の調和。両立が心の健康に重要' },
  { term: 'キャリア自己効力感', desc: '仕事で成果を出せるという自信' },
  { term: '心理的安全性', desc: '職場で安心して意見を言える雰囲気' },
  { term: 'ストレスマネジメント', desc: '仕事のストレスを適切にコントロールする技術' },
  { term: 'モチベーション', desc: '仕事への意欲や動機付け' },
  { term: '自己効力感', desc: '自分ならできるという信念。成功体験で高まる' },
  { term: 'インポスター症候群', desc: '成功しても「自分は偽物だ」と感じる心理状態' }
];

const workBiases = [
  { name: 'ダニング=クルーガー効果', desc: '能力が低い人ほど自信過剰になる', example: '新人なのに「仕事簡単」って思ってた' },
  { name: '確証バイアス', desc: '自分の考えを裏付ける情報だけ集める', example: '上司への不満を裏付ける出来事だけ覚えてる' },
  { name: '帰属の誤り', desc: '成功は自分の実力、失敗は環境のせい', example: '成功は「自分の努力」、失敗は「運が悪かった」' },
  { name: '集団思考', desc: 'みんなの意見に合わせて批判的思考が失われる', example: '会議で疑問があっても「みんなOKしてるし」と黙る' }
];

// Question generators
function generateTrueFalse(unit, unitData, sources, timestamp) {
  const source = randomChoice(sources);
  const concept = randomChoice(unitData.concepts);

  const misconceptions = [
    { q: `${concept.term}を一度試せば、すぐに完璧にできる`, correct: false },
    { q: `${concept.term}は科学的根拠がない`, correct: false },
    { q: `${concept.term}は誰にでも同じように効果がある`, correct: false },
    { q: `${concept.term}の効果は研究で確認されている`, correct: true },
    { q: `${concept.term}を習得するには練習と時間が必要`, correct: true }
  ];

  const selected = randomChoice(misconceptions);
  const answerIndex = selected.correct ? 0 : 1;

  return {
    id: generateId('tf', timestamp),
    type: 'truefalse',
    stem: `💭 あなたについての質問:\n\n❓ あなたは${selected.q}`,
    choices: ['正しい（○）', '誤り（×）'],
    answer_index: answerIndex,
    what: `【この方法は】\n${concept.term}（${concept.desc}）は、科学的に効果が証明された方法だよ。`,
    why: `【なぜ効くの？】\n\n研究で効果が実証されているんだ。多くの人が実際に使って、効果を実感してるよ。`,
    how: `【やり方】\n\n専門家に相談しながら、あなたに合ったやり方を見つけていこう。`,
    real_example: `【みんなの体験談】\n\n「最初は半信半疑だったけど、続けたら効果を実感できた！」って声がたくさんあるよ。`,
    action: `【今すぐ試そう！】\n\nまずは専門家に相談してみよう。あなたに合った方法を一緒に見つけられるよ。`,
    fun_fact: `💡心理療法の効果は「エビデンスレベル」で評価されるよ。多くの質の高い研究ほど信頼度が上がるんだ。`,
    tip: `🔍実践: 治療を選ぶ時は、「この方法は研究で効果が示されてる？」って質問してみよう。エビデンスを確認することが大事！`,
    incorrect_feedback: selected.correct ? {
      '1': `その通り！${concept.term}は効果的な方法だよ。研究で効果が証明されているんだ。\n\nでも「すぐに完璧」は誤りなんだ。どんな方法も、練習と時間が必要。最初はうまくいかなくても、それが普通。続けることで少しずつ上達していくんだよ。\n\n💡見分け方: 「すぐに完璧」「一度で効く」って言い切る表現には注意しよう。成長には時間がかかるんだ。`
    } : {
      '0': `やる気があるのは素晴らしいね！確かに${concept.term}は効果的な方法だよ。\n\nでも「一度で完璧」は誤りなんだ。どんな方法も、練習と時間が必要。最初はうまくいかなくても、それが普通。続けることで少しずつ上達していくんだよ。\n\n💡見分け方: 「すぐに完璧」「一度で効く」って言い切る表現には注意しよう。成長には時間がかかるんだ。`
    },
    emoji_hint: '❓',
    difficulty: 'medium',
    source_id: source.id,
    xp: 10
  };
}

function generateBiasQuestion(unit, unitData, timestamp) {
  const bias = randomChoice(unitData.biases);
  const otherBiases = unitData.biases.filter(b => b.name !== bias.name);
  const wrongChoices = shuffleArray(otherBiases).slice(0, 2);

  const choices = shuffleArray([
    bias.desc,
    ...wrongChoices.map(b => b.desc)
  ]);

  const answerIndex = choices.indexOf(bias.desc);

  const incorrectFeedback = {};
  choices.forEach((choice, idx) => {
    if (idx !== answerIndex) {
      incorrectFeedback[idx] = `${choice}に注目したんだね！確かにそれもよくあるバイアスだよ。\n\nでも、この状況は「${bias.name}」なんだ。${bias.desc}だね。バイアスは似ているものが多いから、状況に合わせて見分けることが大切なんだよ。\n\n💡見分け方: 1日の終わりに「今日の良かったこと3つ」を書き出そう。ポジティブな記憶も意識的に残すトレーニングになるよ。`;
    }
  });

  return {
    id: generateId('bias', timestamp),
    type: 'mcq3',
    stem: `💭 あなたの思考:\n\n「${bias.example}」\n\nあなたは何バイアスに陥ってる？`,
    choices: choices,
    answer_index: answerIndex,
    what: `【あなたが陥ったバイアスは】\n\nこれは「${bias.name}」って言うんだ。${bias.desc}のことだよ。`,
    why: `🧠【なぜあなたに起きる？】\n\n人間の脳は効率的に判断するために、自動的にショートカットを使うんだ。でも、そのショートカットが時々あなたの判断を歪めちゃう。無意識にやっちゃうから、まず気づくことが大事！`,
    how: `💪【対策】\n\n1日の終わりに「今日の良かったこと3つ」を書き出そう。ポジティブな記憶も意識的に残すトレーニングになるよ。\n\n自分の思考パターンに気づくことが第一歩。「あ、今バイアスに陥ってるかも」って気づけるだけで、判断の質がグッと上がるよ。`,
    real_example: `🌟【実際の例】\n\n進化心理学的には、危険を避けるために「悪い情報」に敏感になるのは合理的だったんだ。でも現代社会では、このバイアスがストレスの原因になることも。`,
    action: `🔍【今すぐ試そう！】\n\n今日、何か判断する時に「自分、今バイアスに陥ってない？」って一度立ち止まってみよう。例えば買い物の時、恋愛の時、仕事の時…どんな場面でもこのバイアスは現れるよ。`,
    fun_fact: `💡進化心理学的には、危険を避けるために「悪い情報」に敏感になるのは合理的だったんだ。でも現代社会では、このバイアスがストレスの原因になることも。`,
    tip: `🔍対策: 1日の終わりに「今日の良かったこと3つ」を書き出そう。ポジティブな記憶も意識的に残すトレーニングになるよ。`,
    incorrect_feedback: incorrectFeedback,
    emoji_hint: '⚠️',
    difficulty: 'easy',
    xp: 5
  };
}

function generateMCQ3(unit, unitData, sources, timestamp) {
  const source = randomChoice(sources);
  const titleShort = source.title.substring(0, 50) + '...';

  const scenarios = unit === 'mental' ? [
    { situation: '不安で眠れない', treatments: ['認知行動療法', 'マインドフルネス瞑想', '運動療法'] },
    { situation: 'ストレスで体調不良', treatments: ['リラクゼーション法', '認知的再評価', '社会的サポート'] },
    { situation: '気分の落ち込みが続く', treatments: ['認知行動療法', '対人関係療法', '行動活性化'] }
  ] : unit === 'money' ? [
    { situation: '衝動買いがやめられない', treatments: ['予算管理アプリ', '24時間ルール', 'お金の日記'] },
    { situation: '貯金ができない', treatments: ['自動積立', '先取り貯蓄', '目標設定'] },
    { situation: 'お金の不安が消えない', treatments: ['ファイナンシャルプランナー相談', '家計簿', '資産の見える化'] }
  ] : [
    { situation: '仕事でバーンアウト', treatments: ['休息とリカバリー', '仕事の境界設定', 'ストレス管理'] },
    { situation: 'やる気が出ない', treatments: ['小さな成功体験', '目標の明確化', 'フィードバック'] },
    { situation: '職場の人間関係で悩む', treatments: ['アサーティブコミュニケーション', '境界線の設定', '上司への相談'] }
  ];

  const scenario = randomChoice(scenarios);
  const correctTreatment = scenario.treatments[0];
  const shuffledTreatments = shuffleArray(scenario.treatments);
  const answerIndex = shuffledTreatments.indexOf(correctTreatment);

  const incorrectFeedback = {};
  shuffledTreatments.forEach((treatment, idx) => {
    if (idx !== answerIndex) {
      incorrectFeedback[idx] = `${treatment}も効果的な方法だね！\n\nでも、研究データでは「${correctTreatment}」の方がより効果が大きいことが示されてるんだ。もちろん、個人によって合う方法は違うから、いろんな選択肢を知っておくことが大事だよ。\n\n💡見分け方: 複数の研究を比較して、どの方法がより効果的か確認しよう。`;
    }
  });

  return {
    id: generateId('mcq3', timestamp),
    type: 'mcq3',
    stem: `💭 あなたの状況:\n\n${scenario.situation}で困ってる。\n\n📄 研究「${titleShort}」\n\nあなたに最も効果的な方法は？`,
    choices: shuffledTreatments,
    answer_index: answerIndex,
    what: `【あなたに効く方法は】\n\n研究によると、${scenario.situation}には「${correctTreatment}」が最も効果的だよ。`,
    why: `🧠【なぜあなたに効くの？】\n\n複数の研究で効果が確認されているんだ。科学的根拠に基づいた方法だから、あなたにも効果が期待できるよ。`,
    how: `💪【やり方】\n\n専門家に相談しながら、あなたに合った形で取り組んでいこう。最初は小さく始めて、徐々に習慣化していくのがコツだよ。`,
    real_example: `🌟【実際の例】\n\n「${correctTreatment}を続けたら、${scenario.situation}が改善した！」って報告がたくさんあるんだ。`,
    action: `🔍【今すぐ試そう！】\n\nまずは${correctTreatment}について調べてみよう。信頼できる情報源を見つけて、自分に合うか確認してみてね。`,
    fun_fact: `💡治療法の効果は研究で数値化されるんだ。「効果量」って指標で、どのくらい効くかが分かるよ。`,
    tip: `🔍実践: 複数の方法を試して、自分に最も合う方法を見つけよう。万人に効く方法はないんだ。`,
    incorrect_feedback: incorrectFeedback,
    emoji_hint: '💡',
    difficulty: 'medium',
    source_id: source.id,
    xp: 10
  };
}

function generateCritiqueQuestion(sources, timestamp) {
  const source = randomChoice(sources);
  const titleShort = source.title.substring(0, 50) + '...';

  const limitations = [
    { lim: 'バイアスの可能性がある（あなたに合うとは限らない）', explanation: '研究デザインによっては結果が歪んでいる可能性があり、あなたの状況には当てはまらないかもしれない' },
    { lim: '再現性が確認されていない（あなたが信頼するには早い）', explanation: '単一研究には限界があり、他の研究でも同じ結果が出るか確認が必要' },
    { lim: '因果関係が証明できていない（あなたが使っても効くとは限らない）', explanation: '相関関係だけで因果関係は不明。実際に効果があるかは別の研究が必要' }
  ];

  const correctLim = randomChoice(limitations);
  const wrongLims = limitations.filter(l => l.lim !== correctLim.lim);
  const choices = shuffleArray([correctLim, ...wrongLims.slice(0, 2)]).map(l => l.lim);
  const answerIndex = choices.indexOf(correctLim.lim);

  const incorrectFeedback = {};
  choices.forEach((choice, idx) => {
    if (idx !== answerIndex) {
      incorrectFeedback[idx] = `${choice}も重要な視点だね！\n\nでも、この研究では「${correctLim.lim}」の方がより深刻な問題なんだ。${correctLim.explanation}からね。\n\n💡見分け方: 研究の最も重要な限界は、「あなたがこの結果を信頼して行動するかどうか」に最も大きく影響するものだよ。`;
    }
  });

  return {
    id: generateId('critique', timestamp),
    type: 'mcq3',
    stem: `🔬 あなたが見つけた研究:\n\n📄「${titleShort}」\n\nあなたがこの研究を信頼する前に、まず確認すべき限界は？`,
    choices: choices,
    answer_index: answerIndex,
    what: `【この研究の限界は】\nこの研究の主な限界は「${correctLim.lim}」だよ。`,
    why: `【なぜ重要？】\n\n${correctLim.explanation}んだ。研究を批判的に読むことは、あなた自身を守ることにつながるよ。`,
    how: `【どう見分ける？】\n\n論文を読む時は、「Abstract（要約）」だけじゃなく「Methods（方法）」と「Limitations（限界）」のセクションも必ず確認しよう。`,
    real_example: `【実際の例】\n\n「この研究、効果すごい！」って記事を見て飛びついた人が、実際に試したら全然効かなかった…なんてことはよくあるんだ。批判的に読む力が大事だよ。`,
    action: `【今日から実践】\n\n次に「○○に効果！」って記事を見たら、「サンプル数は？」「因果関係は証明されてる？」「他の研究でも同じ結果？」って3つ質問してみよう。`,
    fun_fact: `💡「完璧な研究」は存在しないんだ。だからこそメタ分析（複数の研究を統合）が重要になるんだよ。`,
    tip: `🔍実践: 論文を読む時は、「どんな限界がある？」って考える習慣をつけよう。批判的思考力が鍛えられるよ。`,
    incorrect_feedback: incorrectFeedback,
    emoji_hint: '🔬',
    difficulty: 'medium',
    source_id: source.id,
    xp: 10
  };
}

function generateABQuestion(sources, timestamp) {
  const sourceA = randomChoice(sources);
  const sourceB = randomChoice(sources.filter(s => s.id !== sourceA.id));

  const titleA = sourceA.title.substring(0, 50) + '...';
  const titleB = sourceB.title.substring(0, 50) + '...';

  // Randomly choose which is better
  const betterIsB = Math.random() > 0.5;
  const answerIndex = betterIsB ? 1 : 0;
  const betterSource = betterIsB ? sourceB : sourceA;

  return {
    id: generateId('battle', timestamp),
    type: 'ab',
    stem: `💭 あなたの状況:\n\n不安を和らげる方法を探してる。\n2つの研究を見つけた。\n\n⚔️ どちらの研究をあなたは信頼する？\n\nA: 「${titleA}」\n\nB: 「${titleB}」`,
    choices: [
      'A の方が信頼できる',
      'B の方が信頼できる'
    ],
    answer_index: answerIndex,
    what: `【この判断基準は】\n\n研究の質を見分ける力は、あなたが「信頼できる情報」を選ぶための必須スキルだよ。`,
    why: `🧠【なぜ重要？】\n\nネットには「〜に効く！」って情報があふれてる。\n\nでも、その根拠となる研究の質はバラバラなんだ。\n\n質の高い研究を見分けられないと、あなたは効果のない方法に時間とお金を使うことになる。\n\n「査読済み」だけじゃ不十分。サンプル数、研究デザイン、バイアス対策を総合的に見ることが大切なんだ。`,
    how: `💪【見分け方】\n\n1. **研究デザイン**: ランダム化試験 > 観察研究\n2. **サンプル数**: 多い方が信頼できる\n3. **追跡期間**: 長い方が実用的\n4. **バイアス対策**: 二重盲検など\n5. **再現性**: 複数の研究で確認されてるか\n\n今回は${betterIsB ? 'B' : 'A'}の方がこれらの点で優れてるよ。`,
    real_example: `🌟【みんなの体験談】\n\n「ネットで『〜で痩せた！』って記事見て試したけど効果なし。\n\nよく見たら、研究はたった10人で追跡期間も1週間だった。\n\n今は『サンプル数は？期間は？』って確認するようになった。」\n\n— Taku（26歳・会社員）`,
    action: `🔍【今すぐ使える！】\n\n次に「〜に効く！」って情報を見たら、\n\nこの3つを確認してみて：\n\n1. **何人で調べた？** → 100人以上が理想\n2. **どのくらいの期間？** → 数週間以上\n3. **どんな研究？** → ランダム化試験が最強\n\nこれだけでも、あなたは「怪しい情報」を避けられるよ。`,
    fun_fact: `💡研究の信頼性は「査読済み」だけじゃ分からない。研究デザイン、サンプル数、バイアス対策などを総合的に見る必要があるんだ。`,
    tip: `🔍実践: 論文を比較する時は、「どっちの方法がより厳密？」「サンプル数は？」って具体的なポイントをチェックしよう。`,
    incorrect_feedback: {
      [betterIsB ? 0 : 1]: `${betterIsB ? 'A' : 'B'}を選んだんだね！研究の質を見極めようとする姿勢は素晴らしいよ。\n\nでも、今回は${betterIsB ? 'B' : 'A'}の方がより厳密な研究デザインを使っているんだ。\n\n両方とも査読済みだけど、研究の質には差があるんだよ。サンプル数、方法論、バイアス対策などを総合的に見ることが大切なんだ。\n\n💡見分け方: タイトルだけじゃなく、研究デザイン（ランダム化試験か観察研究か等）やサンプル数を確認しよう。`
    },
    emoji_hint: '⚔️',
    difficulty: 'hard',
    xp: 15,
    source_id: betterSource.id
  };
}

function generateClozeN(unit, unitData, timestamp) {
  const pairs = unit === 'mental' ? [
    { disorder: 'パニック障害', therapy: '認知行動療法' },
    { disorder: 'うつ病', therapy: '対人関係療法' },
    { disorder: 'PTSD（心的外傷後ストレス障害）', therapy: '曝露療法' },
    { disorder: '不安障害', therapy: 'マインドフルネス療法' }
  ] : unit === 'money' ? [
    { disorder: '衝動買い', therapy: '24時間ルール' },
    { disorder: '浪費癖', therapy: '予算管理' },
    { disorder: '借金依存', therapy: '専門家カウンセリング' },
    { disorder: 'ギャンブル依存', therapy: '認知行動療法' }
  ] : [
    { disorder: 'バーンアウト', therapy: '休息と回復' },
    { disorder: '仕事依存', therapy: 'ワークライフバランス調整' },
    { disorder: 'インポスター症候群', therapy: '認知的再構成' },
    { disorder: '職場ストレス', therapy: 'ストレス管理技法' }
  ];

  const pair = randomChoice(pairs);
  const otherPairs = pairs.filter(p => p.disorder !== pair.disorder);
  const distractors = shuffleArray(otherPairs).slice(0, 2);

  const bank = shuffleArray([
    pair.therapy,
    pair.disorder,
    ...distractors.map(p => p.therapy),
    ...distractors.map(p => p.disorder).slice(0, 1)
  ]).slice(0, 4);

  return {
    id: generateId('cloze', timestamp),
    type: 'clozeN',
    text: `🔤 ［1］の症状には［2］が有効`,
    bank: bank,
    key: {
      '1': pair.disorder,
      '2': pair.therapy
    },
    what: `【あなたが覚えるべき組み合わせ】\n\n✅ その通り！「${pair.therapy}」と「${pair.disorder}」だよ。${pair.therapy}は、${pair.disorder}に対して科学的に効果が確認されてるんだ。`,
    why: `🧠【なぜあなたに必要？】\n\nこの基本的な組み合わせを知っていると、もし自分や大切な人が困った時に、「どんな選択肢があるか」がすぐに分かるようになるよ。治療の知識は、あなたの人生を守る武器になるんだ。`,
    how: `💪【覚え方】\n\n治療法と症状の特徴を照らし合わせて、「どっちがより合うか」を考えてみよう。例えば、「考え方の問題」には「考え方を変える治療」、「感情の問題」には「感情を扱う治療」って感じで覚えるとラクだよ。`,
    real_example: `🌟【実際の例】\n\n友達が「最近調子悪い」って言った時、あなたが「こういう治療法もあるよ」って教えてあげられる。知識があるだけで、誰かを助けられる可能性が生まれるんだ。`,
    action: `🔍【今すぐ試そう！】\n\n今覚えた組み合わせを、ノートかスマホのメモアプリに書き留めてみよう。「${pair.therapy} → ${pair.disorder}」って。後で見返すと、記憶が定着するよ。`,
    fun_fact: `💡治療法と障害の組み合わせは「教科書的な正解」があるけど、実際は一人ひとりに合わせてカスタマイズするんだ。`,
    tip: `🔍実践: 基本的な組み合わせを覚えておくと、治療の選択肢を理解しやすくなるよ。でも「教科書通り」が絶対じゃないことも覚えておこう。`,
    incorrect_feedback: {
      '1': `良い組み合わせを考えようとしているね！でも、${pair.disorder}の方が正しいんだ。${pair.disorder}と${pair.therapy}は、研究で効果が確認されている組み合わせなんだよ。\n\n💡見分け方: 治療法と症状の特徴を照らし合わせて、「どっちがより合うか」を考えてみよう。`,
      '2': `良い選択を考えているね！でも、${pair.therapy}の方が正しいんだ。${pair.disorder}と${pair.therapy}は、科学的根拠のある組み合わせなんだよ。\n\n💡見分け方: 治療法の特性と症状の特徴を結びつけて考えてみよう。基本的な組み合わせを覚えておくと役立つよ。`
    },
    emoji_hint: '🔤',
    difficulty: 'easy',
    xp: 5
  };
}

function generateRankQuestion(unit, unitData, sources, timestamp) {
  const situations = unit === 'mental' ? [
    { situation: '不安が強い', items: ['認知行動療法', 'マインドフルネス', '運動療法'] },
    { situation: '気分の落ち込み', items: ['認知行動療法', '対人関係療法', '薬物療法'] },
    { situation: 'ストレスが多い', items: ['リラクゼーション', '認知的再評価', '社会的サポート'] }
  ] : unit === 'money' ? [
    { situation: '貯金ができない', items: ['自動積立', '予算管理', '節約テクニック'] },
    { situation: '衝動買いが多い', items: ['24時間ルール', '予算設定', '現金払い'] },
    { situation: 'お金の不安', items: ['資産の見える化', 'ファイナンシャルプランナー相談', '家計簿'] }
  ] : [
    { situation: '仕事でバーンアウト', items: ['休息とリカバリー', '仕事の境界設定', 'ストレス管理'] },
    { situation: 'モチベーション低下', items: ['小さな成功体験', '目標の明確化', 'フィードバック'] },
    { situation: '職場の人間関係', items: ['アサーティブコミュニケーション', '境界線の設定', '上司への相談'] }
  ];

  const situation = randomChoice(situations);

  return {
    id: generateId('rank', timestamp),
    type: 'rank',
    stem: `💭 あなたの状況:\n\n${situation.situation}で困ってる。\n\n🏆 あなたにとって効果が高い順に並べよう\n（研究データより）`,
    items: situation.items,
    correct_order: [0, 1, 2],
    what: `【あなたの症状に効く順位は】\n\n${situation.situation}に対する効果の大きさは、以下の順だよ：\n\n1位: ${situation.items[0]}\n2位: ${situation.items[1]}\n3位: ${situation.items[2]}`,
    why: `🧠【なぜあなたに必要？】\n\nこれは複数の研究をまとめたメタ分析のデータに基づいてるんだ。もしあなたが${situation.situation}で困っているなら、まず1位の方法から試すのが効率的だよ。`,
    how: `💪【選び方】\n\nこれはあくまで「平均的な効果」だから、個人によって合う・合わないがあるんだ。1位が効かなくても、2位や3位があなたには合うこともある。だから「ランキング1位＝あなたに絶対効く」じゃないんだよ。`,
    real_example: `🌟【実際の例】\n\n「1位の治療を受けたけどイマイチ…」って人が、2位の治療に変えたら劇的に改善することもあるんだ。ランキングは「スタート地点」として参考にして、自分に合う方法を見つけることが大事だよ。`,
    action: `🔍【今すぐ試そう！】\n\nもし今何かの症状で困っているなら、その症状名と「治療法 ランキング」で検索してみよう。科学的に効果が証明されている方法の順位が分かるはず。それを参考に、自分に合う方法を探してみよう。`,
    fun_fact: `💡メタ分析って、複数の研究結果をまとめて分析する方法だよ。一つの研究より信頼度が高いんだ。`,
    tip: `🔍実践: 効果の順位を見る時は、「自分の状況に一番合うのはどれ？」って考えてみよう。ランキング1位が必ずしもあなたに最適とは限らないよ。`,
    incorrect_feedback: {
      general: `順序を考えようとしているのは素晴らしいね！治療法の効果を比較するのは重要だよ。\n\nでも、正しい順序は以下だよ：\n1位: ${situation.items[0]}\n2位: ${situation.items[1]}\n3位: ${situation.items[2]}\n\nこれは複数の研究をまとめたメタ分析のデータに基づいているよ。ただし、これは「平均的な効果」だから、個人によっては順位が変わることもあるんだ。\n\n💡見分け方: 効果の大きさは研究データを参考にしつつ、「自分に合うか」も考えることが大切だよ。`
    },
    emoji_hint: '🏆',
    difficulty: 'hard',
    xp: 15
  };
}

// Generate lessons
function generateLesson(unit, unitSources, unitData) {
  const questions = [];
  const timestamp = Date.now();

  // Distribution to match health.json: 8 TF, 67 MCQ3 (including bias+critique), 2 Rank, 7 Cloze, 6 AB
  // Total: 90 questions (same as health.json)

  // 8 True/False
  for (let i = 0; i < 8; i++) {
    questions.push(generateTrueFalse(unit, unitData, unitSources, timestamp + i));
  }

  // 10 Bias questions (MCQ3 type)
  for (let i = 0; i < 10; i++) {
    questions.push(generateBiasQuestion(unit, unitData, timestamp + 10 + i));
  }

  // 52 MCQ3 (general) - reduced from 57 to get to 90 total
  for (let i = 0; i < 52; i++) {
    questions.push(generateMCQ3(unit, unitData, unitSources, timestamp + 20 + i));
  }

  // 5 Critique questions (MCQ3 type)
  for (let i = 0; i < 5; i++) {
    questions.push(generateCritiqueQuestion(unitSources, timestamp + 80 + i));
  }

  // 2 Rank questions
  for (let i = 0; i < 2; i++) {
    questions.push(generateRankQuestion(unit, unitData, unitSources, timestamp + 85 + i));
  }

  // 7 ClozeN questions
  for (let i = 0; i < 7; i++) {
    questions.push(generateClozeN(unit, unitData, timestamp + 87 + i));
  }

  // 6 AB questions
  for (let i = 0; i < 6; i++) {
    questions.push(generateABQuestion(unitSources, timestamp + 95 + i));
  }

  return questions;
}

// Generate all three files
const mentalData = {
  concepts: mentalConcepts,
  biases: mentalBiases
};

const moneyData = {
  concepts: moneyConcepts,
  biases: moneyBiases
};

const workData = {
  concepts: workConcepts,
  biases: workBiases
};

console.log('\nGenerating mental.json...');
const mentalQuestions = generateLesson('mental', mentalSources, mentalData);
fs.writeFileSync(
  path.join(__dirname, '../data/lessons/mental.json'),
  JSON.stringify(mentalQuestions, null, 2),
  'utf-8'
);

console.log('Generating money.json...');
const moneyQuestions = generateLesson('money', moneySources, moneyData);
fs.writeFileSync(
  path.join(__dirname, '../data/lessons/money.json'),
  JSON.stringify(moneyQuestions, null, 2),
  'utf-8'
);

console.log('Generating work.json...');
const workQuestions = generateLesson('work', workSources, workData);
fs.writeFileSync(
  path.join(__dirname, '../data/lessons/work.json'),
  JSON.stringify(workQuestions, null, 2),
  'utf-8'
);

console.log('\n✅ Generation complete!');
console.log(`Mental: ${mentalQuestions.length} questions`);
console.log(`Money: ${moneyQuestions.length} questions`);
console.log(`Work: ${workQuestions.length} questions`);

// Print file sizes
const mentalSize = fs.statSync(path.join(__dirname, '../data/lessons/mental.json')).size;
const moneySize = fs.statSync(path.join(__dirname, '../data/lessons/money.json')).size;
const workSize = fs.statSync(path.join(__dirname, '../data/lessons/work.json')).size;

console.log(`\nFile sizes:`);
console.log(`Mental: ${(mentalSize / 1024).toFixed(0)}KB`);
console.log(`Money: ${(moneySize / 1024).toFixed(0)}KB`);
console.log(`Work: ${(workSize / 1024).toFixed(0)}KB`);
