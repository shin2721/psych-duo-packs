// scripts/pack_builder.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

/**
 * Psycle Pack Builder
 *
 * Modes:
 * - abstract_lite: 抄録のみから Lite パック生成（各レッスン15問、図表少なめ）
 * - pmc_pro: PMC全文から Pro パック生成（図表2問以上、完全根拠）
 * - multi_abstract_lite: 3-5本の抄録を合成して複数レッスン
 */

// ============ Configuration ============
const MODES = {
  abstract_lite: {
    profiles: ["lite"],
    lessons_per_unit: 1,  // 1 lesson per unit for abstract-only packs
    questions_per_lesson: 8,  // 8 questions per lesson (24 total for 3 units)
    units_to_generate: 3,  // Only generate 3 units (background, methods, results)
    allow_figure_questions: false,
    evidence_granularity: "paragraph", // ABS:¶2
    question_types: ["mcq", "tf", "cloze", "word_bank"],
  },
  multi_abstract_lite: {
    profiles: ["lite"],
    sources_to_combine: 5,  // Combine 5 papers
    lessons_per_unit: 3,    // 3 lessons per unit
    questions_per_lesson: 8, // 8 questions per lesson
    units_to_generate: 3,    // 3 units (background, methods, results)
    allow_figure_questions: false,
    evidence_granularity: "paragraph", // ABS:paper_id:¶2
    question_types: ["mcq", "tf", "cloze", "word_bank"],
  },
  pmc_pro: {
    profiles: ["pro", "lite"],
    lessons_per_unit: 3,
    questions_per_lesson: 15,
    allow_figure_questions: true,
    min_figure_questions: 2,
    evidence_granularity: "line", // M:¶4 L5-12
    question_types: ["mcq", "tf", "cloze", "word_bank", "reorder", "figure_reading", "free_typing"],
  },
};

// ============ Multi-Abstract Lite Pack Builder ============
async function buildMultiAbstractLitePack(sources) {
  const mode = MODES.multi_abstract_lite;

  if (sources.length < mode.sources_to_combine) {
    console.log(`⚠️  Insufficient sources (${sources.length}/${mode.sources_to_combine})`);
    return null;
  }

  const selectedSources = sources.slice(0, mode.sources_to_combine);

  // Generate pack ID from first source
  const firstSource = selectedSources[0];
  const packId = `pack_multi_${firstSource.unit}_${Date.now()}`;

  const pack = {
    id: packId,
    title: `${firstSource.unit.toUpperCase()} Research Collection (${selectedSources.length} papers)`,
    units: [
      { id: "u1_background", name: "背景・目的", lessons: mode.lessons_per_unit },
      { id: "u2_methods", name: "方法", lessons: mode.lessons_per_unit },
      { id: "u3_results", name: "結果", lessons: mode.lessons_per_unit },
    ],
    targets: [],
    tags: [firstSource.unit],
    lesson_size: mode.questions_per_lesson,
    profiles: mode.profiles,
    source: {
      type: "multi_abstract",
      papers: selectedSources.map(s => ({
        doi: s.doi || null,
        pmid: s.pmid || null,
        title: s.title,
      })),
      license: "abstract_fair_use",
    },
  };

  // Extract facts from all sources
  const allFacts = [];
  const allSpans = [];

  for (let i = 0; i < selectedSources.length; i++) {
    const source = selectedSources[i];
    const sourcePrefix = `P${i + 1}`;

    // Parse abstract
    const sentences = source.abstract
      .split(/[。．.!?]\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    const groupSize = Math.max(3, Math.floor(sentences.length / 4));
    const sections = [];

    for (let j = 0; j < sentences.length; j += groupSize) {
      const group = sentences.slice(j, j + groupSize).join(". ");
      if (group.length > 50) {
        const spanId = `${sourcePrefix}:¶${Math.floor(j / groupSize) + 1}`;
        sections.push({
          id: spanId,
          text: group,
          section: "abstract",
        });
      }
    }

    // Add spans
    allSpans.push(...sections);

    // Extract facts from this source
    const facts = extractFactsFromAbstract(source.abstract, sections);

    // Prefix evidence_span_id with source identifier
    facts.forEach(fact => {
      fact.sourceIndex = i;
      fact.sourceTitle = source.title.slice(0, 60);
    });

    allFacts.push(...facts);
  }

  const unitsToGenerate = mode.units_to_generate || 3;
  const totalQuestions = mode.lessons_per_unit * mode.questions_per_lesson * unitsToGenerate;

  if (allFacts.length < totalQuestions * 0.7) {
    console.log(`⚠️  Insufficient facts (${allFacts.length}/${Math.floor(totalQuestions * 0.7)} minimum)`);
    return null;
  }

  // Generate questions from pooled facts
  const items = [];
  let factIndex = 0;

  for (let unitIdx = 0; unitIdx < unitsToGenerate; unitIdx++) {
    const unit = pack.units[unitIdx];

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      for (let q = 0; q < mode.questions_per_lesson; q++) {
        if (factIndex >= allFacts.length) break;

        const fact = allFacts[factIndex];
        factIndex++;

        const item = generateQuestionFromFact(
          fact,
          unit.id,
          lessonNum,
          items.length,
          mode
        );

        if (item) {
          items.push(item);
        } else {
          q--; // Retry
        }
      }
    }
  }

  if (items.length < totalQuestions * 0.7) {
    console.log(`⚠️  Too few questions (${items.length}/${totalQuestions})`);
    return null;
  }

  // Generate schedule
  const schedule = items.map((item, idx) => ({
    item_id: item.id,
    due_at_offset_min: 10 + idx * 5,
    half_life_h: 24,
  }));

  return { pack, spans: allSpans, items, schedule };
}

// ============ Abstract Lite Pack Builder ============
async function buildAbstractLitePack(source) {
  const mode = MODES.abstract_lite;

  if (!source.abstract || source.abstract.length < 500) {
    console.log(`⚠️  Insufficient abstract length (${source.abstract?.length || 0} chars)`);
    return null;
  }

  // Parse abstract into logical sections (Background, Methods, Results, Conclusions)
  // Many abstracts use section headers or are single-paragraph
  const sections = [];

  // Try structured abstract first
  const structuredMatch = source.abstract.match(/(background|methods?|results?|conclusions?|objectives?)[:\s]/gi);

  if (structuredMatch && structuredMatch.length >= 2) {
    // Structured abstract - split by section headers
    const parts = source.abstract.split(/(background|methods?|results?|conclusions?|objectives?)[:\s]/gi);
    for (let i = 1; i < parts.length; i += 2) {
      const header = parts[i];
      const content = parts[i + 1]?.trim();
      if (content && content.length > 50) {
        sections.push({
          id: `ABS:${header.toLowerCase()}`,
          text: content,
          section: "abstract",
        });
      }
    }
  } else {
    // Unstructured abstract - split into sentences and group by content
    const sentences = source.abstract
      .split(/[。．.!?]\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 30); // Lower threshold for filtering

    // Group sentences into logical sections (every 3-4 sentences)
    const groupSize = Math.max(3, Math.floor(sentences.length / 4));
    for (let i = 0; i < sentences.length; i += groupSize) {
      const group = sentences.slice(i, i + groupSize).join(". ");
      if (group.length > 50) {
        sections.push({
          id: `ABS:¶${Math.floor(i / groupSize) + 1}`,
          text: group,
          section: "abstract",
        });
      }
    }
  }

  if (sections.length < 3) {
    console.log(`⚠️  Too few sections (${sections.length})`);
    return null;
  }

  const paragraphs = sections;

  // Generate pack structure
  const packId = `pack_${source.id || source.doi?.replace(/[^\w]/g, '_') || 'unknown'}`;

  const pack = {
    id: packId,
    title: source.title,
    units: [
      { id: "u1_background", name: "背景・目的", lessons: mode.lessons_per_unit },
      { id: "u2_methods", name: "方法", lessons: mode.lessons_per_unit },
      { id: "u3_results", name: "結果", lessons: mode.lessons_per_unit },
      { id: "u4_discussion", name: "考察・示唆", lessons: mode.lessons_per_unit },
    ],
    targets: source.tags || [],
    tags: [source.unit || "psychology"],
    lesson_size: mode.questions_per_lesson,
    profiles: mode.profiles,
    source: {
      doi: source.doi || null,
      pmid: source.pmid || null,
      url: source.url || null,
      license: "abstract_fair_use",
    },
  };

  // Extract key facts from abstract first
  const facts = extractFactsFromAbstract(source.abstract, paragraphs);

  const unitsToGenerate = mode.units_to_generate || 4;
  const minFacts = mode.lessons_per_unit * mode.questions_per_lesson * unitsToGenerate;

  if (facts.length < minFacts) {
    console.log(`⚠️  Insufficient facts extracted (${facts.length}/${minFacts})`);
    return null;
  }

  // Generate spans (evidence) - include both paragraphs and sentence-level spans
  const spans = [
    ...paragraphs.map(p => ({
      id: p.id,
      section: p.section,
      text: p.text,
      note: null,
    })),
    // Add sentence-level spans used in facts
    ...facts
      .filter(f => f.evidenceSpanId.startsWith('ABS:S'))
      .map(f => ({
        id: f.evidenceSpanId,
        section: "abstract",
        text: f.sentence,
        note: null,
      }))
  ];

  // Deduplicate spans by id
  const uniqueSpans = [];
  const seenIds = new Set();
  for (const span of spans) {
    if (!seenIds.has(span.id)) {
      seenIds.add(span.id);
      uniqueSpans.push(span);
    }
  }

  // Generate questions
  const items = [];
  const totalQuestions = mode.lessons_per_unit * mode.questions_per_lesson * unitsToGenerate;

  // Distribute questions across units and lessons
  // Use round-robin to ensure even distribution across units
  let questionIndex = 0;
  let factIndex = 0;

  for (let unitIdx = 0; unitIdx < unitsToGenerate; unitIdx++) {
    const unit = pack.units[unitIdx];

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const questionsNeeded = mode.questions_per_lesson;

      for (let q = 0; q < questionsNeeded; q++) {
        if (factIndex >= facts.length) break; // No more facts

        const fact = facts[factIndex];
        factIndex++;

        const item = generateQuestionFromFact(
          fact,
          unit.id,
          lessonNum,
          questionIndex,
          mode
        );

        if (item) {
          items.push(item);
          questionIndex++;
        } else {
          // If generation failed, try next fact
          q--; // Don't count this as a generated question
        }
      }
    }
  }

  if (items.length < totalQuestions * 0.8) {
    console.log(`⚠️  Too few questions generated (${items.length}/${totalQuestions})`);
    return null;
  }

  // Generate schedule
  const schedule = items.map((item, idx) => ({
    item_id: item.id,
    due_at_offset_min: 10 + idx * 5, // Stagger initial reviews
    half_life_h: 24,
  }));

  return { pack, spans: uniqueSpans, items, schedule };
}

function extractFactsFromAbstract(abstract, paragraphs) {
  const facts = [];

  // Split into sentences
  const sentences = abstract
    .split(/[。．.!?]\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Lower threshold to get more sentences

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Find which paragraph this sentence belongs to (fuzzy match)
    const paragraph = paragraphs.find(p => {
      // Check if sentence or substantial part of it exists in paragraph
      const cleanSentence = sentence.replace(/[^\w\s]/g, '').toLowerCase();
      const cleanParagraph = p.text.replace(/[^\w\s]/g, '').toLowerCase();
      return cleanParagraph.includes(cleanSentence.slice(0, 50));
    });

    // If no paragraph match, create a sentence-level span
    const evidenceSpanId = paragraph ? paragraph.id : `ABS:S${i + 1}`;

    // Determine unit hint based on keywords
    let unitHint = 0; // default: background
    if (/method|procedure|participant|sample|design|measure/i.test(sentence)) {
      unitHint = 1; // methods
    } else if (/result|finding|showed|demonstrated|observed|p\s*[<>=]|significant/i.test(sentence)) {
      unitHint = 2; // results
    } else if (/implication|limitation|suggest|conclude|future|recommend/i.test(sentence)) {
      unitHint = 3; // discussion
    } else if (/background|previous|theory|hypothesis|aim|purpose/i.test(sentence)) {
      unitHint = 0; // background
    }

    // Extract key components
    const hasNumber = /\d+/.test(sentence);
    const hasComparison = /more|less|higher|lower|better|worse|increased|decreased/i.test(sentence);
    const hasEffect = /effect|impact|relationship|association|correlation/i.test(sentence);
    const isConclusion = /result|finding|showed|demonstrated/i.test(sentence);

    // Determine question type
    let questionType = "mcq";
    if (sentence.length < 60) {
      questionType = "tf"; // Short statements → True/False
    } else if (sentence.split(/\s+/).length > 20 && sentence.includes(",")) {
      questionType = "cloze"; // Long complex sentences → Fill in blank
    } else if (hasComparison || hasEffect) {
      questionType = "mcq"; // Comparative/causal → Multiple choice
    }

    facts.push({
      sentence,
      evidenceSpanId,
      unitHint,
      questionType,
      hasNumber,
      hasComparison,
      hasEffect,
      isConclusion,
      difficulty: estimateDifficulty(sentence, questionType),
    });
  }

  return facts;
}

function generateQuestionFromFact(fact, unitId, lessonNum, qIndex, mode) {
  const itemId = `${unitId}_l${lessonNum}_q${String(qIndex + 1).padStart(2, '0')}`;

  const sentence = fact.sentence;
  const profile = mode.profiles[0]; // lite

  let item = null;

  switch (fact.questionType) {
    case "tf":
      item = generateTrueFalse(sentence, fact);
      break;
    case "mcq":
      item = generateMCQ(sentence, fact);
      break;
    case "cloze":
      item = generateCloze(sentence, fact);
      break;
    case "word_bank":
      item = generateWordBank(sentence, fact);
      break;
    default:
      item = generateMCQ(sentence, fact);
  }

  if (!item) return null;

  return {
    id: itemId,
    unit: unitId,
    lesson: lessonNum,
    profile,
    type: fact.questionType,
    prompt: item.prompt,
    choices: item.choices || undefined,
    answer: item.answer,
    evidence_span_id: fact.evidenceSpanId,
    beta: fact.difficulty,
    tags: [unitId.split("_")[1], ...(item.tags || [])],
    retry_hint: false,
  };
}

function generateTrueFalse(sentence, fact) {
  // Create True/False question by either:
  // 1. Using the sentence as-is (correct = true)
  // 2. Inverting key terms (correct = false)

  const isInverted = Math.random() > 0.5;
  let prompt = sentence;
  let answer = "正しい";

  if (isInverted) {
    // Invert the sentence
    prompt = invertSentence(sentence);
    answer = "誤り";
  }

  return {
    prompt: `次の記述は正しいか？\n\n${prompt}`,
    choices: ["正しい", "誤り"],
    answer,
    tags: [],
  };
}

function invertSentence(sentence) {
  return sentence
    .replace(/\bincreased\b/gi, "decreased")
    .replace(/\bdecreased\b/gi, "increased")
    .replace(/\bpositive\b/gi, "negative")
    .replace(/\bnegative\b/gi, "positive")
    .replace(/\bhigher\b/gi, "lower")
    .replace(/\blower\b/gi, "higher")
    .replace(/\bimproved\b/gi, "worsened")
    .replace(/\bworsened\b/gi, "improved")
    .replace(/\bmore\b/gi, "less")
    .replace(/\bless\b/gi, "more")
    .replace(/\bsignificant\b/gi, "non-significant")
    .replace(/\beffective\b/gi, "ineffective");
}

function generateMCQ(sentence, fact) {
  // Extract key fact and create distractors
  const correctAnswer = cleanText(sentence);

  // Generate 3 distractors
  const distractor1 = invertSentence(sentence);
  const distractor2 = perturbNumber(sentence);
  const distractor3 = `この研究では${fact.hasComparison ? "有意な差" : "明確な関連"}は見られなかった`;

  const choices = [
    correctAnswer,
    cleanText(distractor1),
    cleanText(distractor2),
    distractor3,
  ];

  // Deduplicate
  const uniqueChoices = [...new Set(choices)];
  while (uniqueChoices.length < 4) {
    uniqueChoices.push(`選択肢${uniqueChoices.length + 1}：データ不十分により結論なし`);
  }

  return {
    prompt: "この研究の結果として正しく述べられているものはどれか？",
    choices: uniqueChoices.slice(0, 4),
    answer: uniqueChoices[0],
    tags: fact.isConclusion ? ["results"] : [],
  };
}

function generateCloze(sentence, fact) {
  // Find key term to blank out
  const words = sentence.split(/\s+/);

  // Target: numbers, comparison words, or key nouns
  let targetIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (/\d+/.test(words[i]) || /increased|decreased|higher|lower|significant/i.test(words[i])) {
      targetIdx = i;
      break;
    }
  }

  if (targetIdx === -1) {
    // Fallback: blank out a noun
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 5) {
        targetIdx = i;
        break;
      }
    }
  }

  if (targetIdx === -1) return null;

  const target = words[targetIdx];
  const blanked = [...words];
  blanked[targetIdx] = "______";

  return {
    prompt: `次の文の空欄に入る語を選べ：\n\n${blanked.join(" ")}`,
    choices: [
      target,
      invertWord(target),
      perturbWord(target),
      "該当なし",
    ].filter(Boolean),
    answer: target,
    tags: ["cloze"],
  };
}

function generateWordBank(sentence, fact) {
  // Extract 3-4 key words and shuffle
  const words = sentence
    .split(/\s+/)
    .filter(w => w.length > 4 && !/^(the|and|or|but|with|from|that|this)$/i.test(w))
    .slice(0, 6);

  if (words.length < 3) return generateMCQ(sentence, fact);

  const shuffled = [...words].sort(() => Math.random() - 0.5);

  return {
    prompt: `次の語群から、研究結果を正しく説明する文を構成せよ：\n\n語群: ${shuffled.join(", ")}`,
    choices: shuffled,
    answer: words.join(" "), // Original order
    tags: ["word_bank"],
  };
}

function cleanText(text) {
  return text.trim().slice(0, 120);
}

function invertWord(word) {
  const inversions = {
    increased: "decreased",
    decreased: "increased",
    positive: "negative",
    negative: "positive",
    higher: "lower",
    lower: "higher",
    significant: "non-significant",
  };
  return inversions[word.toLowerCase()] || word;
}

function perturbWord(word) {
  if (/\d+/.test(word)) {
    return word.replace(/\d+/, m => parseInt(m) * 1.5);
  }
  return word + "ed";
}

function perturbNumber(sentence) {
  return sentence.replace(/(\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match);
    return (num * 1.3).toFixed(1);
  });
}

function estimateDifficulty(sentence, questionType) {
  let beta = 0.0;

  if (sentence.length > 100) beta += 0.2;
  if (/however|although|whereas/i.test(sentence)) beta += 0.3;
  if (questionType === "cloze") beta += 0.2;
  if (questionType === "free_typing") beta += 0.4;

  return Math.min(1.0, Math.max(-0.5, beta));
}

// ============ Main ============
async function main() {
  const mode = process.argv[2] || "abstract_lite";
  const sourceId = process.argv[3]; // Optional: specific source ID

  if (!MODES[mode]) {
    console.error(`❌ Unknown mode: ${mode}`);
    console.error(`Available modes: ${Object.keys(MODES).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🎯 Pack Builder - Mode: ${mode}`);

  // Load sources
  const sourcesPath = "data/sources.json";
  if (!existsSync(sourcesPath)) {
    console.error("❌ data/sources.json not found");
    process.exit(1);
  }

  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  console.log(`📚 Loaded ${sources.length} sources`);

  // Filter sources for this mode
  let candidateSources = sources.filter(
    s => s.abstract && s.abstract.length > 500
  );

  if (sourceId) {
    candidateSources = candidateSources.filter(
      s => s.id === sourceId || s.doi === sourceId || s.pmid === sourceId
    );
  }

  console.log(`✓ ${candidateSources.length} candidate sources for ${mode}`);

  if (candidateSources.length === 0) {
    console.error("❌ No candidate sources found");
    process.exit(1);
  }

  // Sort by abstract quality
  const rankedSources = candidateSources
    .map(s => ({
      source: s,
      score: s.abstract.length +
        (s.abstract.match(/result|finding|conclusion|significant|p\s*[<>=]/gi) || []).length * 100,
    }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.source);

  let result;

  if (mode === "multi_abstract_lite") {
    // Group by unit and select top 5 from each
    const units = ["mental", "money", "work", "health", "social", "study"];
    let selectedUnit = null;
    let unitSources = [];

    for (const unit of units) {
      const sources = rankedSources.filter(s => s.unit === unit);
      if (sources.length >= MODES.multi_abstract_lite.sources_to_combine) {
        selectedUnit = unit;
        unitSources = sources;
        break;
      }
    }

    if (!selectedUnit) {
      console.error("❌ No unit with sufficient sources for multi-abstract pack");
      process.exit(1);
    }

    console.log(`\n📚 Building multi-abstract pack from ${selectedUnit} unit`);
    console.log(`   Papers: ${Math.min(unitSources.length, MODES.multi_abstract_lite.sources_to_combine)}`);

    result = await buildMultiAbstractLitePack(unitSources);
  } else {
    // Single-paper pack
    const source = rankedSources[0];
    console.log(`\n📄 Building pack from: ${source.title.slice(0, 80)}...`);
    console.log(`   DOI: ${source.doi || 'N/A'}`);
    console.log(`   Abstract length: ${source.abstract.length} chars`);

    result = await buildAbstractLitePack(source);
  }

  if (!result) {
    console.error("❌ Failed to build pack");
    process.exit(1);
  }

  const { pack, spans, items, schedule } = result;

  console.log(`\n✅ Pack generated:`);
  console.log(`   ID: ${pack.id}`);
  console.log(`   Units: ${pack.units.length}`);
  console.log(`   Spans: ${spans.length}`);
  console.log(`   Items: ${items.length}`);
  console.log(`   Schedule: ${schedule.length}`);

  // Save to files
  const outputDir = "paper_packs";
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const packDir = `${outputDir}/${pack.id}`;
  if (!existsSync(packDir)) {
    await mkdir(packDir, { recursive: true });
  }

  await writeFile(`${packDir}/pack.json`, JSON.stringify(pack, null, 2), "utf8");
  await writeFile(
    `${packDir}/spans.jsonl`,
    spans.map(s => JSON.stringify(s)).join("\n"),
    "utf8"
  );
  await writeFile(
    `${packDir}/items.jsonl`,
    items.map(i => JSON.stringify(i)).join("\n"),
    "utf8"
  );
  await writeFile(
    `${packDir}/schedule.jsonl`,
    schedule.map(s => JSON.stringify(s)).join("\n"),
    "utf8"
  );

  console.log(`\n📦 Saved to ${packDir}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
