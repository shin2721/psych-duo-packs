// scripts/pack_builder.mjs
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { fetchPMCFullText, parseJATSXML, getPMCIDFromPMID } from "./pmc_fetcher.mjs";

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
    lessons_per_unit: 2,  // 2 lessons per unit
    questions_per_lesson: 15,  // 15 questions per lesson (90 total for 3 units)
    units_to_generate: 3,  // Only generate 3 units (background, methods, results)
    allow_figure_questions: false,
    evidence_granularity: "paragraph", // ABS:¶2
    question_types: ["mcq", "tf", "cloze", "word_bank"],
  },
  multi_abstract_lite: {
    profiles: ["lite"],
    sources_to_combine: 3,  // Combine 3-5 papers (minimum 3)
    lessons_per_unit: 2,    // 2 lessons per unit
    questions_per_lesson: 15, // 15 questions per lesson
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
  eric_pdf_pro: {
    profiles: ["pro", "lite"],
    lessons_per_unit: 3,  // 2-3 lessons per unit
    questions_per_lesson: 15,
    allow_figure_questions: true,
    min_figure_questions: 2,
    evidence_granularity: "paragraph", // Background:¶3
    question_types: ["mcq", "tf", "cloze", "word_bank", "reorder", "figure_reading"],
  },
};

// ============ PDF Text Parser ============
function parsePDFText(pdfText) {
  const result = {
    title: "",
    abstract: "",
    sections: [],
    figures: [],
    tables: [],
  };

  const lines = pdfText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Extract title (first substantial line, usually)
  result.title = lines[0] || "Untitled";

  // Find section headers and split text into sections
  const sectionKeywords = {
    background: /^(introduction|background|literature review|theoretical framework)/i,
    methods: /^(method|methodology|procedure|participants|design|measures|materials)/i,
    results: /^(results|findings|outcomes)/i,
    discussion: /^(discussion|conclusion|implications|limitations|future research)/i,
  };

  let currentSection = null;
  let currentParagraph = [];
  let paraIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a section header
    let matchedType = null;
    for (const [type, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(line)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      // Save previous paragraph if exists
      if (currentSection && currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        if (text.length > 50) {
          currentSection.paragraphs.push({
            id: `p${currentSection.paragraphs.length + 1}`,
            text,
          });
        }
        currentParagraph = [];
      }

      // Start new section
      currentSection = {
        id: `${matchedType}:sec${result.sections.filter(s => s.type === matchedType).length + 1}`,
        type: matchedType,
        title: line,
        paragraphs: [],
      };
      result.sections.push(currentSection);
    } else if (currentSection) {
      // Check if this line starts a new paragraph (empty line before, or capital letter start)
      if (line.length > 100 || /^[A-Z]/.test(line)) {
        // Save previous paragraph
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ");
          if (text.length > 50) {
            currentSection.paragraphs.push({
              id: `p${currentSection.paragraphs.length + 1}`,
              text,
            });
          }
          currentParagraph = [];
        }
      }

      currentParagraph.push(line);
    }

    // Extract figure mentions
    const figMatch = line.match(/Figure (\d+)[:\.]?\s*(.{0,200})/i);
    if (figMatch) {
      const figNum = figMatch[1];
      const caption = figMatch[2] || "";
      if (!result.figures.find(f => f.id === `Fig${figNum}`)) {
        result.figures.push({
          id: `Fig${figNum}`,
          label: `Figure ${figNum}`,
          caption: caption.trim(),
        });
      }
    }

    // Extract table mentions
    const tableMatch = line.match(/Table (\d+)[:\.]?\s*(.{0,200})/i);
    if (tableMatch) {
      const tableNum = tableMatch[1];
      const caption = tableMatch[2] || "";
      if (!result.tables.find(t => t.id === `Tab${tableNum}`)) {
        result.tables.push({
          id: `Tab${tableNum}`,
          label: `Table ${tableNum}`,
          caption: caption.trim(),
        });
      }
    }
  }

  // Save last paragraph
  if (currentSection && currentParagraph.length > 0) {
    const text = currentParagraph.join(" ");
    if (text.length > 50) {
      currentSection.paragraphs.push({
        id: `p${currentSection.paragraphs.length + 1}`,
        text,
      });
    }
  }

  return result;
}

// ============ ERIC PDF Pro Pack Builder ============
async function buildERICPDFProPack(pdfText, meta = {}) {
  const mode = MODES.eric_pdf_pro;

  console.log(`  Parsing PDF text (${pdfText.length} chars)...`);
  const parsed = parsePDFText(pdfText);

  if (!parsed.title || parsed.sections.length < 3) {
    console.log(`⚠️  Insufficient content (${parsed.sections.length} sections)`);
    return null;
  }

  const packId = `pack_eric_${meta.doi?.replace(/[^\w]/g, '_') || Date.now()}`;

  const pack = {
    id: packId,
    title: meta.title || parsed.title,
    units: [
      { id: "u1_background", name: "背景・仮説", lessons: mode.lessons_per_unit },
      { id: "u2_methods", name: "方法", lessons: mode.lessons_per_unit },
      { id: "u3_results", name: "結果・図表", lessons: mode.lessons_per_unit },
      { id: "u4_discussion", name: "解釈・限界", lessons: mode.lessons_per_unit },
    ],
    targets: meta.tags || [],
    tags: ["psychology", "eric", "full-text"],
    lesson_size: mode.questions_per_lesson,
    profiles: mode.profiles,
    source: {
      doi: meta.doi || null,
      eric_id: meta.eric_id || null,
      license: meta.license || "fair_use",
    },
  };

  // Generate spans from parsed content
  const spans = [];

  // Add section paragraphs as spans
  for (const section of parsed.sections) {
    for (const para of section.paragraphs) {
      spans.push({
        id: `${section.id}:${para.id}`,
        section: section.type,
        text: para.text,
        note: section.title,
      });
    }
  }

  // Add figure captions
  for (const fig of parsed.figures) {
    if (fig.caption.length > 20) {
      spans.push({
        id: `${fig.id}:cap`,
        section: "figure",
        text: `${fig.label}: ${fig.caption}`,
        note: "Figure caption",
      });
    }
  }

  // Add table captions
  for (const table of parsed.tables) {
    if (table.caption.length > 20) {
      spans.push({
        id: `${table.id}:cap`,
        section: "table",
        text: `${table.label}: ${table.caption}`,
        note: "Table caption",
      });
    }
  }

  console.log(`  Generated ${spans.length} evidence spans`);

  // Extract facts from all sections (same as PMC Pro)
  const allFacts = [];

  for (const section of parsed.sections) {
    for (const para of section.paragraphs) {
      const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, section.type);
      allFacts.push(...facts);
    }
  }

  // Add figure-based facts
  for (const fig of parsed.figures) {
    if (fig.caption.length > 50) {
      allFacts.push({
        sentence: fig.caption,
        evidenceSpanId: `${fig.id}:cap`,
        unitHint: 2, // results
        questionType: "figure_reading",
        difficulty: 0.4,
        isFigure: true,
        figureLabel: fig.label,
      });
    }
  }

  const totalQuestions = mode.lessons_per_unit * mode.questions_per_lesson * 4; // 4 units

  if (allFacts.length < totalQuestions * 0.5) {
    console.log(`⚠️  Insufficient facts (${allFacts.length}/${totalQuestions})`);
    return null;
  }

  console.log(`  Extracted ${allFacts.length} facts from full text`);

  // Generate questions (same logic as PMC Pro)
  const items = [];
  const unitMapping = ["background", "methods", "results", "discussion"];

  for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
    const unit = pack.units[unitIdx];
    const unitType = unitMapping[unitIdx];
    const unitFacts = allFacts.filter(f =>
      (f.unitHint === unitIdx) ||
      (f.isFigure && unitIdx === 2) // Figures go to results unit
    );

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const startIdx = (lessonNum - 1) * mode.questions_per_lesson;
      const lessonFacts = unitFacts.slice(startIdx, startIdx + mode.questions_per_lesson * 2);

      for (let q = 0; q < mode.questions_per_lesson; q++) {
        if (q >= lessonFacts.length) break;

        const fact = lessonFacts[q];
        const item = generateQuestionFromFact(
          fact,
          unit.id,
          lessonNum,
          items.length,
          mode
        );

        if (item) {
          items.push(item);
        }
      }
    }
  }

  // Pad with extra questions if needed (same as PMC Pro)
  const usedSpanIds = new Set(items.map(item => item.evidence_span_id));

  while (items.length < totalQuestions) {
    const unusedFacts = allFacts.filter(f => !usedSpanIds.has(f.evidenceSpanId));

    if (unusedFacts.length === 0) break;

    const lessonCounts = new Map();
    for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
      const unit = pack.units[unitIdx];
      for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
        const key = `${unit.id}_L${lessonNum}`;
        const count = items.filter(item => item.unit === unit.id && item.lesson === lessonNum).length;
        lessonCounts.set(key, { unitId: unit.id, lessonNum, count });
      }
    }

    const sortedLessons = Array.from(lessonCounts.values()).sort((a, b) => a.count - b.count);
    const targetLesson = sortedLessons[0];

    const unitIdx = pack.units.findIndex(u => u.id === targetLesson.unitId);
    let fact = unusedFacts.find(f => f.unitHint === unitIdx);

    if (!fact) {
      fact = unusedFacts[0];
    }

    const item = generateQuestionFromFact(
      fact,
      targetLesson.unitId,
      targetLesson.lessonNum,
      items.length,
      mode
    );

    if (item) {
      items.push(item);
      usedSpanIds.add(fact.evidenceSpanId);
    } else {
      usedSpanIds.add(fact.evidenceSpanId);
    }
  }

  // Validate (same as PMC Pro)
  if (items.length < totalQuestions * 0.6) {
    console.log(`⚠️  Too few questions generated (${items.length}/${totalQuestions}, minimum ${Math.floor(totalQuestions * 0.6)})`);
    return null;
  }

  const minQuestionsPerLesson = Math.floor(mode.questions_per_lesson * 0.7);
  const lessonDistribution = new Map();

  for (const item of items) {
    const key = `${item.unit}_L${item.lesson}`;
    lessonDistribution.set(key, (lessonDistribution.get(key) || 0) + 1);
  }

  const underfilledLessons = [];
  for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
    const unit = pack.units[unitIdx];
    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const key = `${unit.id}_L${lessonNum}`;
      const count = lessonDistribution.get(key) || 0;
      if (count < minQuestionsPerLesson) {
        underfilledLessons.push(`${key}: ${count}/${mode.questions_per_lesson}`);
      }
    }
  }

  if (underfilledLessons.length > 0) {
    console.log(`⚠️  Uneven lesson distribution (need ${mode.questions_per_lesson} per lesson):`);
    for (const lesson of underfilledLessons) {
      console.log(`     ${lesson}`);
    }
    return null;
  }

  // Generate schedule
  const schedule = items.map((item, idx) => ({
    item_id: item.id,
    due_at_offset_min: 30 + idx * 10, // Pro: longer intervals
    half_life_h: 48, // Pro: longer retention
  }));

  console.log(`  ✓ Generated ${items.length} questions`);

  return { pack, spans, items, schedule };
}

// ============ PMC Pro Pack Builder ============
async function buildPMCProPack(pmcid, pmid) {
  const mode = MODES.pmc_pro;

  console.log(`  Fetching PMC ${pmcid} full text...`);
  const xml = await fetchPMCFullText(pmcid);

  console.log(`  Parsing JATS XML...`);
  const parsed = parseJATSXML(xml);

  if (!parsed.title || parsed.sections.length < 3) {
    console.log(`⚠️  Insufficient content (${parsed.sections.length} sections)`);
    return null;
  }

  const packId = `pack_pmc_${pmcid}`;

  const pack = {
    id: packId,
    title: parsed.title,
    units: [
      { id: "u1_background", name: "背景・仮説", lessons: mode.lessons_per_unit },
      { id: "u2_methods", name: "方法", lessons: mode.lessons_per_unit },
      { id: "u3_results", name: "結果・図表", lessons: mode.lessons_per_unit },
      { id: "u4_discussion", name: "解釈・限界", lessons: mode.lessons_per_unit },
    ],
    targets: [],
    tags: ["psychology", "full-text"],
    lesson_size: mode.questions_per_lesson,
    profiles: mode.profiles,
    source: {
      pmcid,
      pmid,
      doi: null, // Will be extracted from XML if available
      license: "open_access",
    },
  };

  // Generate spans from parsed content
  const spans = [];

  // Add abstract spans
  if (parsed.abstract) {
    spans.push({
      id: "ABS:full",
      section: "abstract",
      text: parsed.abstract,
      note: null,
    });
  }

  // Add section paragraphs as spans
  for (const section of parsed.sections) {
    for (const para of section.paragraphs) {
      spans.push({
        id: `${section.id}:${para.id}`,
        section: section.type,
        text: para.text,
        note: section.title,
      });
    }
  }

  // Add figure captions
  for (const fig of parsed.figures) {
    spans.push({
      id: `${fig.id}:cap`,
      section: "figure",
      text: `${fig.label}: ${fig.caption}`,
      note: "Figure caption",
    });
  }

  // Add table captions
  for (const table of parsed.tables) {
    spans.push({
      id: `${table.id}:cap`,
      section: "table",
      text: `${table.label}: ${table.caption}`,
      note: "Table caption",
    });
  }

  console.log(`  Generated ${spans.length} evidence spans`);

  // Extract facts from all sections
  const allFacts = [];

  // Background section
  const backgroundSections = parsed.sections.filter(s => s.type === "background");
  for (const section of backgroundSections) {
    for (const para of section.paragraphs) {
      const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, "background");
      allFacts.push(...facts);
    }
  }

  // Methods section
  const methodsSections = parsed.sections.filter(s => s.type === "methods");
  for (const section of methodsSections) {
    for (const para of section.paragraphs) {
      const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, "methods");
      allFacts.push(...facts);
    }
  }

  // Results section
  const resultsSections = parsed.sections.filter(s => s.type === "results");
  for (const section of resultsSections) {
    for (const para of section.paragraphs) {
      const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, "results");
      allFacts.push(...facts);
    }
  }

  // Discussion section
  const discussionSections = parsed.sections.filter(s => s.type === "discussion");
  for (const section of discussionSections) {
    for (const para of section.paragraphs) {
      const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, "discussion");
      allFacts.push(...facts);
    }
  }

  // Add figure-based facts
  for (const fig of parsed.figures) {
    if (fig.caption.length > 50) {
      allFacts.push({
        sentence: fig.caption,
        evidenceSpanId: `${fig.id}:cap`,
        unitHint: 2, // results
        questionType: "figure_reading",
        difficulty: 0.4,
        isFigure: true,
        figureLabel: fig.label,
      });
    }
  }

  const totalQuestions = mode.lessons_per_unit * mode.questions_per_lesson * 4; // 4 units

  if (allFacts.length < totalQuestions * 0.5) {
    console.log(`⚠️  Insufficient facts (${allFacts.length}/${totalQuestions})`);
    return null;
  }

  console.log(`  Extracted ${allFacts.length} facts from full text`);

  // Generate 180 questions (15 per lesson × 12 lessons)
  const items = [];
  const unitMapping = ["background", "methods", "results", "discussion"];

  for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
    const unit = pack.units[unitIdx];
    const unitType = unitMapping[unitIdx];
    const unitFacts = allFacts.filter(f =>
      (f.unitHint === unitIdx) ||
      (f.isFigure && unitIdx === 2) // Figures go to results unit
    );

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const startIdx = (lessonNum - 1) * mode.questions_per_lesson;
      const lessonFacts = unitFacts.slice(startIdx, startIdx + mode.questions_per_lesson * 2); // Take 2x for filtering

      for (let q = 0; q < mode.questions_per_lesson; q++) {
        if (q >= lessonFacts.length) break;

        const fact = lessonFacts[q];
        const item = generateQuestionFromFact(
          fact,
          unit.id,
          lessonNum,
          items.length,
          mode
        );

        if (item) {
          items.push(item);
        }
      }
    }
  }

  // Pad with extra questions if needed
  // Distribute across units and lessons more evenly
  const usedSpanIds = new Set(items.map(item => item.evidence_span_id));

  while (items.length < totalQuestions) {
    const unusedFacts = allFacts.filter(f => !usedSpanIds.has(f.evidenceSpanId));

    if (unusedFacts.length === 0) break;

    // Find the lesson with the fewest questions across ALL units
    const lessonCounts = new Map();
    for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
      const unit = pack.units[unitIdx];
      for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
        const key = `${unit.id}_L${lessonNum}`;
        const count = items.filter(item => item.unit === unit.id && item.lesson === lessonNum).length;
        lessonCounts.set(key, { unitId: unit.id, lessonNum, count });
      }
    }

    // Sort by count to find most underfilled lesson
    const sortedLessons = Array.from(lessonCounts.values()).sort((a, b) => a.count - b.count);
    const targetLesson = sortedLessons[0];

    // Find best fact for this lesson
    // Prefer facts with matching unitHint, but accept any if needed
    const unitIdx = pack.units.findIndex(u => u.id === targetLesson.unitId);
    let fact = unusedFacts.find(f => f.unitHint === unitIdx);

    if (!fact) {
      // No matching facts, use any available fact
      fact = unusedFacts[0];
    }

    const item = generateQuestionFromFact(
      fact,
      targetLesson.unitId,
      targetLesson.lessonNum,
      items.length,
      mode
    );

    if (item) {
      items.push(item);
      usedSpanIds.add(fact.evidenceSpanId);
    } else {
      // If generation still fails, mark as used and try next
      usedSpanIds.add(fact.evidenceSpanId);
    }
  }

  // Check if we have enough questions after padding
  if (items.length < totalQuestions * 0.6) {
    console.log(`⚠️  Too few questions generated (${items.length}/${totalQuestions}, minimum ${Math.floor(totalQuestions * 0.6)})`);
    return null;
  }

  // Validate lesson distribution (each lesson should have at least 70% of target)
  const minQuestionsPerLesson = Math.floor(mode.questions_per_lesson * 0.7);
  const lessonDistribution = new Map();

  for (const item of items) {
    const key = `${item.unit}_L${item.lesson}`;
    lessonDistribution.set(key, (lessonDistribution.get(key) || 0) + 1);
  }

  const underfilledLessons = [];
  for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
    const unit = pack.units[unitIdx];
    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const key = `${unit.id}_L${lessonNum}`;
      const count = lessonDistribution.get(key) || 0;
      if (count < minQuestionsPerLesson) {
        underfilledLessons.push(`${key}: ${count}/${mode.questions_per_lesson}`);
      }
    }
  }

  if (underfilledLessons.length > 0) {
    console.log(`⚠️  Uneven lesson distribution (need ${mode.questions_per_lesson} per lesson):`);
    for (const lesson of underfilledLessons) {
      console.log(`     ${lesson}`);
    }
    return null;
  }

  // Generate schedule
  const schedule = items.map((item, idx) => ({
    item_id: item.id,
    due_at_offset_min: 30 + idx * 10, // Pro: longer intervals
    half_life_h: 48, // Pro: longer retention
  }));

  console.log(`  ✓ Generated ${items.length} questions`);

  return { pack, spans, items, schedule };
}

function extractFactsFromParagraph(text, spanId, sectionType) {
  const facts = [];

  // Split into sentences (more aggressive - include shorter sentences)
  const sentences = text
    .split(/[。．.!?]\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // Lowered from 20 to 15

  // Map section type to unit hint
  const unitHintMap = {
    background: 0,
    methods: 1,
    results: 2,
    discussion: 3,
  };

  const unitHint = unitHintMap[sectionType] || 0;

  for (const sentence of sentences) {
    const hasNumber = /\d+/.test(sentence);
    const hasStatistics = /p\s*[<>=]|F\(|t\(|chi|correlation|significant/i.test(sentence);
    const hasComparison = /more|less|higher|lower|better|worse|increased|decreased/i.test(sentence);

    // Split complex sentences by conjunctions to extract multiple facts
    const subSentences = sentence.includes(" and ") || sentence.includes(", ")
      ? sentence.split(/,\s+(?:and\s+)?|;\s+/).filter(s => s.trim().length > 15)
      : [sentence];

    for (const subSent of subSentences) {
      let questionType = "mcq";
      let difficulty = 0.0;

      if (subSent.length < 60) {
        questionType = "tf";
      } else if (hasStatistics) {
        questionType = "mcq";
        difficulty += 0.3;
      } else if (subSent.length > 120) {
        questionType = "cloze";
        difficulty += 0.2;
      }

      facts.push({
        sentence: subSent.trim(),
        evidenceSpanId: spanId,
        unitHint,
        questionType,
        hasNumber,
        hasComparison,
        difficulty: Math.min(1.0, Math.max(-0.5, difficulty)),
      });
    }
  }

  return facts;
}

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

  // Extract facts from all sources using enhanced extraction
  const allFacts = [];
  const allSpans = [];

  console.log(`  Extracting facts from ${selectedSources.length} abstracts...`);

  for (let i = 0; i < selectedSources.length; i++) {
    const source = selectedSources[i];
    const sourcePrefix = `P${i + 1}`;

    // Parse abstract into sections (same as before for spans)
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

    // Extract facts using enhanced extraction (same as abstract_lite)
    const facts = extractFactsFromAbstract(source.abstract, sections);

    // Prefix evidence_span_id with source identifier and add metadata
    facts.forEach(fact => {
      // Update span ID to include source prefix
      if (!fact.evidenceSpanId.includes(sourcePrefix)) {
        fact.evidenceSpanId = `${sourcePrefix}:${fact.evidenceSpanId}`;
      }
      fact.sourceIndex = i;
      fact.sourceTitle = source.title.slice(0, 60);
    });

    allFacts.push(...facts);
    console.log(`    Paper ${i + 1}: ${facts.length} facts extracted`);
  }

  const unitsToGenerate = mode.units_to_generate || 3;
  const totalQuestions = mode.lessons_per_unit * mode.questions_per_lesson * unitsToGenerate;

  // For multi_abstract_lite, accept 40% of target facts since we can reuse with different question types
  const minFactThreshold = 0.4;

  if (allFacts.length < totalQuestions * minFactThreshold) {
    console.log(`⚠️  Insufficient facts (${allFacts.length}/${Math.floor(totalQuestions * minFactThreshold)} minimum, ${totalQuestions} target)`);
    return null;
  }

  console.log(`  Total facts extracted: ${allFacts.length}`);

  // Generate questions from pooled facts with reuse strategy (same as abstract_lite)
  const items = [];
  let factIndex = 0;
  const usedFactQuestionTypes = new Map(); // Track which question types used for each fact

  for (let unitIdx = 0; unitIdx < unitsToGenerate; unitIdx++) {
    const unit = pack.units[unitIdx];

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const questionsNeeded = mode.questions_per_lesson;

      for (let q = 0; q < questionsNeeded; q++) {
        // Allow cycling through facts multiple times if needed
        if (factIndex >= allFacts.length) {
          factIndex = 0; // Reset to beginning
        }

        const fact = allFacts[factIndex];

        // Try to vary question type if reusing a fact
        const factKey = `${fact.evidenceSpanId}_${fact.sentence.slice(0, 30)}`;
        const usedTypes = usedFactQuestionTypes.get(factKey) || [];

        // If this fact was used before, try a different question type
        if (usedTypes.length > 0) {
          const availableTypes = ["mcq", "tf", "cloze"].filter(t => !usedTypes.includes(t));
          if (availableTypes.length > 0) {
            fact.questionType = availableTypes[0];
          }
        }

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

          // Track which question type was used for this fact
          usedTypes.push(item.type);
          usedFactQuestionTypes.set(factKey, usedTypes);
        } else {
          q--; // Retry with next fact
        }
      }
    }
  }

  if (items.length < totalQuestions * 0.8) {
    console.log(`⚠️  Too few questions generated (${items.length}/${totalQuestions}, minimum ${Math.floor(totalQuestions * 0.8)})`);
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

  // For abstract_lite, accept 40% of target facts since we can reuse with different question types
  const minFactThreshold = mode.profiles.includes("lite") && mode.lessons_per_unit >= 2 ? 0.4 : 1.0;

  if (facts.length < minFacts * minFactThreshold) {
    console.log(`⚠️  Insufficient facts extracted (${facts.length}/${Math.floor(minFacts * minFactThreshold)} minimum, ${minFacts} target)`);
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
  const usedFactQuestionTypes = new Map(); // Track which question types used for each fact

  for (let unitIdx = 0; unitIdx < unitsToGenerate; unitIdx++) {
    const unit = pack.units[unitIdx];

    for (let lessonNum = 1; lessonNum <= mode.lessons_per_unit; lessonNum++) {
      const questionsNeeded = mode.questions_per_lesson;

      for (let q = 0; q < questionsNeeded; q++) {
        // Allow cycling through facts multiple times if needed
        if (factIndex >= facts.length) {
          factIndex = 0; // Reset to beginning
        }

        const fact = facts[factIndex];

        // Try to vary question type if reusing a fact
        const factKey = `${fact.evidenceSpanId}_${fact.sentence.slice(0, 30)}`;
        const usedTypes = usedFactQuestionTypes.get(factKey) || [];

        // If this fact was used before, try a different question type
        if (usedTypes.length > 0) {
          const availableTypes = ["mcq", "tf", "cloze"].filter(t => !usedTypes.includes(t));
          if (availableTypes.length > 0) {
            fact.questionType = availableTypes[0];
          }
        }

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

          // Track which question type was used for this fact
          usedTypes.push(item.type);
          usedFactQuestionTypes.set(factKey, usedTypes);
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

  // Split into sentences - more aggressive splitting
  const sentences = abstract
    .split(/[。．.!?]\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // Lower threshold to get more sentences

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Split complex sentences by conjunctions and punctuation to extract more facts
    const subSentences = [];

    // More aggressive splitting for abstract_lite with high question targets
    // Split by: semicolons, commas, "and/but/however/while", parentheses, dashes
    const parts = sentence.split(/[;,]\s*(?:and|but|however|while|with|including|resulting|leading)?\s*|[;]\s*|\s+-\s+|\([^)]+\)/gi);

    for (const part of parts) {
      let trimmed = part.trim();

      // Clean up split artifacts
      trimmed = trimmed.replace(/^(and|but|however|while|with|the|a|an)\s+/i, '');

      // Accept very short clauses for abstract_lite mode with high targets
      if (trimmed.length > 8 && /[a-zA-Z]{3,}/.test(trimmed)) {
        subSentences.push(trimmed);

        // For statistical findings, also extract the numeric value as a separate fact
        const numberMatch = trimmed.match(/(\w+[^.]*?)([\d.]+%?|p\s*[<>=]\s*[\d.]+)/i);
        if (numberMatch && numberMatch[1].length > 15) {
          subSentences.push(numberMatch[1].trim());
        }
      }
    }

    // If no splits, use the original sentence
    if (subSentences.length === 0) {
      subSentences.push(sentence);
    }

    // Process each sub-sentence as a separate fact
    for (let j = 0; j < subSentences.length; j++) {
      const subSent = subSentences[j];

      // Find which paragraph this sub-sentence belongs to (fuzzy match)
      const paragraph = paragraphs.find(p => {
        // Check if sub-sentence or substantial part of it exists in paragraph
        const cleanSubSent = subSent.replace(/[^\w\s]/g, '').toLowerCase();
        const cleanParagraph = p.text.replace(/[^\w\s]/g, '').toLowerCase();
        return cleanParagraph.includes(cleanSubSent.slice(0, Math.min(30, cleanSubSent.length)));
      });

      // If no paragraph match, create a sentence-level span
      const evidenceSpanId = paragraph ? paragraph.id : `ABS:S${i + 1}_${j + 1}`;

      // Determine unit hint based on keywords
      let unitHint = 0; // default: background
      if (/method|procedure|participant|sample|design|measure/i.test(subSent)) {
        unitHint = 1; // methods
      } else if (/result|finding|showed|demonstrated|observed|p\s*[<>=]|significant/i.test(subSent)) {
        unitHint = 2; // results
      } else if (/implication|limitation|suggest|conclude|future|recommend/i.test(subSent)) {
        unitHint = 3; // discussion
      } else if (/background|previous|theory|hypothesis|aim|purpose/i.test(subSent)) {
        unitHint = 0; // background
      }

      // Extract key components
      const hasNumber = /\d+/.test(subSent);
      const hasComparison = /more|less|higher|lower|better|worse|increased|decreased/i.test(subSent);
      const hasEffect = /effect|impact|relationship|association|correlation/i.test(subSent);
      const isConclusion = /result|finding|showed|demonstrated/i.test(subSent);

      // Determine question type
      let questionType = "mcq";
      if (subSent.length < 60) {
        questionType = "tf"; // Short statements → True/False
      } else if (subSent.split(/\s+/).length > 20 && subSent.includes(",")) {
        questionType = "cloze"; // Long complex sentences → Fill in blank
      } else if (hasComparison || hasEffect) {
        questionType = "mcq"; // Comparative/causal → Multiple choice
      }

      facts.push({
        sentence: subSent,
        evidenceSpanId,
        unitHint,
        questionType,
        hasNumber,
        hasComparison,
        hasEffect,
        isConclusion,
        difficulty: estimateDifficulty(subSent, questionType),
      });
    }
  }

  return facts;
}

function generateQuestionFromFact(fact, unitId, lessonNum, qIndex, mode) {
  const itemId = `${unitId}_l${lessonNum}_q${String(qIndex + 1).padStart(2, '0')}`;

  const sentence = fact.sentence;
  const profile = mode.profiles[0]; // lite

  let item = null;
  let actualType = fact.questionType;

  // Try primary question type
  switch (fact.questionType) {
    case "tf":
      item = generateTrueFalse(sentence, fact);
      break;
    case "mcq":
      item = generateMCQ(sentence, fact);
      break;
    case "cloze":
      item = generateCloze(sentence, fact);
      // Fallback to MCQ if cloze fails
      if (!item) {
        item = generateMCQ(sentence, fact);
        actualType = "mcq";
      }
      break;
    case "word_bank":
      item = generateWordBank(sentence, fact);
      break;
    default:
      item = generateMCQ(sentence, fact);
      actualType = "mcq";
  }

  // Final fallback: always use TF if everything else fails
  if (!item) {
    item = generateTrueFalse(sentence, fact);
    actualType = "tf";
  }

  if (!item) return null; // Should never happen now

  return {
    id: itemId,
    unit: unitId,
    lesson: lessonNum,
    profile,
    type: actualType,
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
  const sourceId = process.argv[3]; // Optional: specific source ID or PDF file path

  if (!MODES[mode]) {
    console.error(`❌ Unknown mode: ${mode}`);
    console.error(`Available modes: ${Object.keys(MODES).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🎯 Pack Builder - Mode: ${mode}`);

  // ERIC PDF Pro mode: Read PDF text from file
  if (mode === "eric_pdf_pro") {
    let pdfText = "";
    let meta = {};

    if (sourceId && existsSync(sourceId)) {
      // Read from file
      console.log(`📄 Reading PDF text from: ${sourceId}`);
      pdfText = await readFile(sourceId, "utf8");

      // Try to extract DOI from filename or first lines
      const filename = sourceId.split("/").pop();
      const doiMatch = filename.match(/(\d+\.\d+[^\s]+)/);
      if (doiMatch) {
        meta.doi = doiMatch[1];
      }
    } else {
      console.error("❌ For eric_pdf_pro mode, provide a PDF text file path as argument");
      console.error("   Usage: node scripts/pack_builder.mjs eric_pdf_pro path/to/pdf_text.txt");
      process.exit(1);
    }

    if (!pdfText || pdfText.length < 1000) {
      console.error("❌ Insufficient PDF text content");
      process.exit(1);
    }

    const result = await buildERICPDFProPack(pdfText, meta);

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
      await mkdir(packDir, { recursive: true});
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
    return;
  }

  // PMC Pro mode with XML file: Read XML from file
  if (mode === "pmc_pro" && sourceId && sourceId.endsWith(".xml")) {
    console.log(`📄 Reading PMC XML from: ${sourceId}`);

    if (!existsSync(sourceId)) {
      console.error(`❌ XML file not found: ${sourceId}`);
      process.exit(1);
    }

    const xml = await readFile(sourceId, "utf8");

    if (!xml || xml.length < 1000) {
      console.error("❌ Insufficient XML content");
      process.exit(1);
    }

    // Extract PMCID from filename or XML
    let pmcid = null;
    const filenameMatch = sourceId.match(/PMC(\d+)/i);
    if (filenameMatch) {
      pmcid = `PMC${filenameMatch[1]}`;
    }

    // Parse XML directly
    console.log(`  Parsing JATS XML...`);
    const parsed = parseJATSXML(xml);

    if (!parsed.title || parsed.sections.length < 3) {
      console.log(`⚠️  Insufficient content (${parsed.sections.length} sections)`);
      process.exit(1);
    }

    const packId = `pack_pmc_${pmcid || 'custom'}`;
    const mode_config = MODES.pmc_pro;

    const pack = {
      id: packId,
      title: parsed.title,
      units: [
        { id: "u1_background", name: "背景・仮説", lessons: mode_config.lessons_per_unit },
        { id: "u2_methods", name: "方法", lessons: mode_config.lessons_per_unit },
        { id: "u3_results", name: "結果・図表", lessons: mode_config.lessons_per_unit },
        { id: "u4_discussion", name: "解釈・限界", lessons: mode_config.lessons_per_unit },
      ],
      targets: [],
      tags: ["psychology", "full-text"],
      lesson_size: mode_config.questions_per_lesson,
      profiles: mode_config.profiles,
      source: {
        pmcid,
        pmid: null,
        doi: null,
        license: "open_access",
      },
    };

    // Generate spans
    const spans = [];
    if (parsed.abstract) {
      spans.push({
        id: "ABS:full",
        section: "abstract",
        text: parsed.abstract,
        note: null,
      });
    }

    for (const section of parsed.sections) {
      for (const para of section.paragraphs) {
        spans.push({
          id: `${section.id}:${para.id}`,
          section: section.type,
          text: para.text,
          note: section.title,
        });
      }
    }

    for (const fig of parsed.figures) {
      spans.push({
        id: `${fig.id}:cap`,
        section: "figure",
        text: `${fig.label}: ${fig.caption}`,
        note: "Figure caption",
      });
    }

    for (const table of parsed.tables) {
      spans.push({
        id: `${table.id}:cap`,
        section: "table",
        text: `${table.label}: ${table.caption}`,
        note: "Table caption",
      });
    }

    console.log(`  Generated ${spans.length} evidence spans`);

    // Extract facts (same as buildPMCProPack)
    const allFacts = [];
    for (const section of parsed.sections) {
      for (const para of section.paragraphs) {
        const facts = extractFactsFromParagraph(para.text, `${section.id}:${para.id}`, section.type);
        allFacts.push(...facts);
      }
    }

    for (const fig of parsed.figures) {
      if (fig.caption.length > 50) {
        allFacts.push({
          sentence: fig.caption,
          evidenceSpanId: `${fig.id}:cap`,
          unitHint: 2,
          questionType: "figure_reading",
          difficulty: 0.4,
          isFigure: true,
          figureLabel: fig.label,
        });
      }
    }

    const totalQuestions = mode_config.lessons_per_unit * mode_config.questions_per_lesson * 4;

    if (allFacts.length < totalQuestions * 0.5) {
      console.log(`⚠️  Insufficient facts (${allFacts.length}/${totalQuestions})`);
      process.exit(1);
    }

    console.log(`  Extracted ${allFacts.length} facts from full text`);

    // Generate questions (same logic as buildPMCProPack)
    const items = [];
    const unitMapping = ["background", "methods", "results", "discussion"];

    for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
      const unit = pack.units[unitIdx];
      const unitFacts = allFacts.filter(f =>
        (f.unitHint === unitIdx) || (f.isFigure && unitIdx === 2)
      );

      for (let lessonNum = 1; lessonNum <= mode_config.lessons_per_unit; lessonNum++) {
        const startIdx = (lessonNum - 1) * mode_config.questions_per_lesson;
        const lessonFacts = unitFacts.slice(startIdx, startIdx + mode_config.questions_per_lesson * 2);

        for (let q = 0; q < mode_config.questions_per_lesson; q++) {
          if (q >= lessonFacts.length) break;

          const fact = lessonFacts[q];
          const item = generateQuestionFromFact(fact, unit.id, lessonNum, items.length, mode_config);

          if (item) {
            items.push(item);
          }
        }
      }
    }

    // Padding logic
    const usedSpanIds = new Set(items.map(item => item.evidence_span_id));

    while (items.length < totalQuestions) {
      const unusedFacts = allFacts.filter(f => !usedSpanIds.has(f.evidenceSpanId));
      if (unusedFacts.length === 0) break;

      const lessonCounts = new Map();
      for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
        const unit = pack.units[unitIdx];
        for (let lessonNum = 1; lessonNum <= mode_config.lessons_per_unit; lessonNum++) {
          const key = `${unit.id}_L${lessonNum}`;
          const count = items.filter(item => item.unit === unit.id && item.lesson === lessonNum).length;
          lessonCounts.set(key, { unitId: unit.id, lessonNum, count });
        }
      }

      const sortedLessons = Array.from(lessonCounts.values()).sort((a, b) => a.count - b.count);
      const targetLesson = sortedLessons[0];

      const unitIdx = pack.units.findIndex(u => u.id === targetLesson.unitId);
      let fact = unusedFacts.find(f => f.unitHint === unitIdx);
      if (!fact) fact = unusedFacts[0];

      const item = generateQuestionFromFact(fact, targetLesson.unitId, targetLesson.lessonNum, items.length, mode_config);

      if (item) {
        items.push(item);
        usedSpanIds.add(fact.evidenceSpanId);
      } else {
        usedSpanIds.add(fact.evidenceSpanId);
      }
    }

    if (items.length < totalQuestions * 0.6) {
      console.log(`⚠️  Too few questions generated (${items.length}/${totalQuestions}, minimum ${Math.floor(totalQuestions * 0.6)})`);
      process.exit(1);
    }

    // Validate distribution
    const minQuestionsPerLesson = Math.floor(mode_config.questions_per_lesson * 0.7);
    const lessonDistribution = new Map();

    for (const item of items) {
      const key = `${item.unit}_L${item.lesson}`;
      lessonDistribution.set(key, (lessonDistribution.get(key) || 0) + 1);
    }

    const underfilledLessons = [];
    for (let unitIdx = 0; unitIdx < 4; unitIdx++) {
      const unit = pack.units[unitIdx];
      for (let lessonNum = 1; lessonNum <= mode_config.lessons_per_unit; lessonNum++) {
        const key = `${unit.id}_L${lessonNum}`;
        const count = lessonDistribution.get(key) || 0;
        if (count < minQuestionsPerLesson) {
          underfilledLessons.push(`${key}: ${count}/${mode_config.questions_per_lesson}`);
        }
      }
    }

    if (underfilledLessons.length > 0) {
      console.log(`⚠️  Uneven lesson distribution (need ${mode_config.questions_per_lesson} per lesson):`);
      for (const lesson of underfilledLessons) {
        console.log(`     ${lesson}`);
      }
      process.exit(1);
    }

    const schedule = items.map((item, idx) => ({
      item_id: item.id,
      due_at_offset_min: 30 + idx * 10,
      half_life_h: 48,
    }));

    console.log(`  ✓ Generated ${items.length} questions`);

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
    return;
  }

  // Abstract Lite mode with text file: Read abstract from file
  if (mode === "abstract_lite" && sourceId && sourceId.endsWith(".txt")) {
    console.log(`📄 Reading abstract text from: ${sourceId}`);

    if (!existsSync(sourceId)) {
      console.error(`❌ Text file not found: ${sourceId}`);
      process.exit(1);
    }

    const abstractText = await readFile(sourceId, "utf8");

    if (!abstractText || abstractText.length < 100) {
      console.error("❌ Insufficient abstract text (minimum 100 chars)");
      process.exit(1);
    }

    // Extract metadata from filename or use defaults
    const filename = sourceId.split("/").pop().replace(".txt", "");
    const pmidMatch = filename.match(/PMID[_-]?(\d+)/i);
    const doiMatch = filename.match(/(\d+\.\d+[^\s]+)/);

    const source = {
      id: `abstract_${filename}`,
      title: `Abstract: ${filename}`,
      abstract: abstractText,
      pmid: pmidMatch ? pmidMatch[1] : null,
      doi: doiMatch ? doiMatch[1] : null,
      tags: [],
      unit: "psychology",
    };

    console.log(`  Abstract length: ${abstractText.length} chars`);
    if (source.pmid) console.log(`  PMID: ${source.pmid}`);
    if (source.doi) console.log(`  DOI: ${source.doi}`);

    const result = await buildAbstractLitePack(source);

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
    return;
  }

  // Multi Abstract Lite mode with directory: Read multiple abstracts from directory
  if (mode === "multi_abstract_lite" && sourceId) {
    // Check if sourceId is a directory
    let isDirectory = false;
    try {
      const stats = statSync(sourceId);
      isDirectory = stats.isDirectory();
    } catch (err) {
      // Not a directory, might be pattern or doesn't exist
    }

    if (isDirectory) {
      console.log(`📁 Reading abstracts from directory: ${sourceId}`);

      // Read all .txt files from directory
      const files = await readdir(sourceId);
      const txtFiles = files.filter(f => f.endsWith(".txt")).sort();

      if (txtFiles.length < MODES.multi_abstract_lite.sources_to_combine) {
        console.error(`❌ Insufficient abstract files (${txtFiles.length}/${MODES.multi_abstract_lite.sources_to_combine} minimum)`);
        process.exit(1);
      }

      console.log(`  Found ${txtFiles.length} abstract files`);

      // Read and parse abstracts
      const sources = [];

      for (let i = 0; i < Math.min(txtFiles.length, 5); i++) {
        const filename = txtFiles[i];
        const filepath = `${sourceId}/${filename}`;
        const abstractText = await readFile(filepath, "utf8");

        if (abstractText.length < 100) {
          console.log(`  ⚠️  Skipping ${filename} (too short: ${abstractText.length} chars)`);
          continue;
        }

        // Extract metadata from filename
        const baseFilename = filename.replace(".txt", "");
        const pmidMatch = baseFilename.match(/PMID[_-]?(\d+)/i);
        const doiMatch = baseFilename.match(/(\d+\.\d+[^\s]+)/);

        const source = {
          id: `abs_${i + 1}_${baseFilename}`,
          title: `Abstract ${i + 1}: ${baseFilename.slice(0, 50)}`,
          abstract: abstractText,
          pmid: pmidMatch ? pmidMatch[1] : null,
          doi: doiMatch ? doiMatch[1] : null,
          unit: "psychology",
        };

        sources.push(source);
        console.log(`  ✓ Loaded: ${filename} (${abstractText.length} chars)`);
      }

      if (sources.length < MODES.multi_abstract_lite.sources_to_combine) {
        console.error(`❌ Insufficient valid abstracts (${sources.length}/${MODES.multi_abstract_lite.sources_to_combine} minimum)`);
        process.exit(1);
      }

      console.log(`\n📚 Building multi-abstract pack from ${sources.length} papers`);

      const result = await buildMultiAbstractLitePack(sources);

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
      return;
    }
  }

  // Load sources for other modes
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

  if (mode === "pmc_pro") {
    // PMC Pro mode - fetch full text from Europe PMC
    const source = rankedSources.find(s => s.pmid); // Find first source with PMID

    if (!source || !source.pmid) {
      console.error("❌ No source with PMID found for PMC mode");
      process.exit(1);
    }

    console.log(`\n📄 Selected source: ${source.title.slice(0, 80)}...`);
    console.log(`   PMID: ${source.pmid}`);

    // Get PMC ID from PMID
    const pmcid = await getPMCIDFromPMID(source.pmid);

    if (!pmcid) {
      console.error(`❌ No PMC ID found for PMID ${source.pmid}`);
      console.error("   This paper may not be in PMC or not open access");
      process.exit(1);
    }

    console.log(`   PMC ID: ${pmcid}`);

    result = await buildPMCProPack(pmcid, source.pmid);
  } else if (mode === "multi_abstract_lite") {
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
