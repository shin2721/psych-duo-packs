// scripts/unified_pipeline.mjs
// 統合パイプライン: 学術ソース収集 → 品質監査 → 作問生成
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

// ===================== 設定 =====================
const UNITS = ["mental", "money", "work", "health", "social", "study"];
const FROM_YEAR = 2015;
const TARGET_PER_UNIT = { min: 6, target: 20 };

// include語（論旨が当てはまるもの）
const INCLUDE_TERMS = [
  "breathing exercises", "heart rate variability", "biofeedback", "psychophysiology",
  "emotion regulation", "cognitive reappraisal", "CBT", "mindfulness"
];

// ban語（除外）- より厳密に動物実験を除外、ICUは除外しない
const BAN_TERMS = [
  "COPD", "asthma", "dermatitis", "tinnitus", "ventilator",
  " animal ", " rodent", " mouse ", " rat ", " mice ", "case report",
  "pediatric", "neonate", " infant", "children under"
];

const INCLUDE_REGEX = new RegExp(INCLUDE_TERMS.join("|"), "i");
const BAN_REGEX = new RegExp(BAN_TERMS.join("|"), "i");

// ユニット別クエリ定義
const UNIT_QUERIES = {
  mental: {
    pubmed: '("Breathing Exercises"[MeSH] OR "Heart Rate"[MeSH] OR "Biofeedback, Psychology"[MeSH] OR "Cognitive Behavioral Therapy"[MeSH] OR "Mindfulness"[MeSH]) AND (intervention OR training OR therapy)',
    europepmc: 'breathing exercises OR "heart rate variability" OR biofeedback OR "emotion regulation" OR "cognitive reappraisal" OR CBT OR mindfulness'
  },
  money: {
    pubmed: '("Financial Management"[MeSH] OR "Decision Making"[MeSH] OR "Impulsive Behavior"[MeSH]) AND (financial OR budget OR saving OR debt)',
    europepmc: '"financial literacy" OR saving OR budget OR debt OR "impulse buying" OR "financial behavior"'
  },
  work: {
    pubmed: '("Work Performance"[MeSH] OR "Time Management"[MeSH] OR "Goals"[MeSH]) AND (productivity OR procrastination)',
    europepmc: 'productivity OR "time management" OR "goal setting" OR procrastination OR focus'
  },
  health: {
    pubmed: '("Exercise"[MeSH] OR "Sleep"[MeSH] OR "Diet"[MeSH] OR "Stress, Psychological"[MeSH]) AND (intervention OR program)',
    europepmc: 'exercise OR "physical activity" OR sleep OR insomnia OR nutrition OR diet OR "stress reduction"'
  },
  social: {
    pubmed: '("Interpersonal Relations"[MeSH] OR "Communication"[MeSH] OR "Empathy"[MeSH]) AND (intervention OR training)',
    europepmc: 'relationship OR communication OR prosocial OR empathy OR "conflict resolution" OR gratitude'
  },
  study: {
    pubmed: '("Metacognition"[MeSH] OR "Learning"[MeSH] OR "Memory"[MeSH]) AND (practice OR technique OR strategy)',
    europepmc: 'metacognition OR "spaced practice" OR "retrieval practice" OR "testing effect" OR "self-explanation"'
  }
};

// ===================== ステップ1: 収集 =====================
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function fetchPubMed(unit) {
  const query = UNIT_QUERIES[unit].pubmed;
  const baseFilter = `("humans"[MeSH Terms]) AND (randomized controlled trial[pt] OR systematic[sb] OR meta-analysis[pt]) AND ("${FROM_YEAR}"[Date - Publication] : "3000"[Date - Publication])`;
  const exclusions = 'NOT ("Pulmonary Disease, Chronic Obstructive"[MeSH] OR "Asthma"[MeSH] OR "Dermatitis"[MeSH] OR "Tinnitus"[MeSH] OR case reports[pt] OR animals[mh:noexp] OR rats[mh] OR mice[mh])';

  const term = `(${query}) AND ${baseFilter} ${exclusions}`;

  try {
    const esearch = `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=50&retmode=json`;
    const esRes = await fetch(esearch);
    const esJson = await esRes.json();
    const ids = esJson.esearchresult?.idlist || [];

    if (ids.length === 0) return [];

    // ESummary for metadata
    const esum = `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const sumRes = await fetch(esum);
    const sumJson = await sumRes.json();
    const uidMap = sumJson.result || {};

    // EFetch for abstracts
    const efetch = `${EUTILS}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`;
    const xmlRes = await fetch(efetch);
    const xml = await xmlRes.text();

    const absMap = {};
    const articleBlocks = xml.split("<PubmedArticle>").slice(1);
    for (const block of articleBlocks) {
      const pmid = (block.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
      const absParts = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)).map(m => m[1]);
      absMap[pmid] = absParts.join("\n").replace(/\s+/g, " ").trim() || null;
    }

    return ids.map(id => {
      const it = uidMap[id];
      const pubtypes = (it?.pubtype || []).join("; ");
      const studyType = inferStudyType(pubtypes);

      return {
        unit,
        pmid: id,
        doi: (it?.elocationid || "").startsWith("doi:") ? it.elocationid.replace(/^doi:\s*/i, "") : null,
        title: it?.title || "",
        abstract: absMap[id] || null,
        year: Number((it?.pubdate || "").slice(0, 4)) || null,
        authors: (it?.authors || []).slice(0, 6).map(a => a.name).join(", "),
        journal: it?.fulljournalname || "",
        study_type: studyType,
        source: "pubmed"
      };
    }).filter(x => x.year >= FROM_YEAR);
  } catch (err) {
    console.error(`  ⚠️  PubMed fetch error for ${unit}:`, err.message);
    return [];
  }
}

async function fetchEuropePMC(unit) {
  const query = UNIT_QUERIES[unit].europepmc;
  // OPEN_ACCESS制限を外して、より多くの結果を取得
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=(${encodeURIComponent(query)}) AND PUB_YEAR:[${FROM_YEAR} TO 3000] AND HAS_ABSTRACT:Y&format=json&pageSize=50`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ⚠️  Europe PMC HTTP ${res.status} for ${unit}`);
      return [];
    }
    const json = await res.json();
    const results = json.resultList?.result || [];

    if (results.length === 0) {
      console.log(`  ℹ️  Europe PMC: 0件（クエリ: ${query.slice(0, 50)}...）`);
    }

    return results.map(r => {
      const studyType = inferStudyType(r.pubType || "");
      return {
        unit,
        pmid: r.pmid || null,
        doi: r.doi || null,
        title: r.title || "",
        abstract: r.abstractText || null,
        year: parseInt(r.pubYear, 10) || null,
        authors: (r.authorString || "").slice(0, 200),
        journal: r.journalTitle || "",
        study_type: studyType,
        source: "europe_pmc"
      };
    }).filter(x => x.year >= FROM_YEAR && x.abstract && x.abstract.length > 50);
  } catch (err) {
    console.error(`  ⚠️  Europe PMC fetch error for ${unit}:`, err.message);
    return [];
  }
}

function inferStudyType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("meta-analysis")) return "meta";
  if (lower.includes("systematic review")) return "systematic";
  if (lower.includes("randomized") || lower.includes("rct")) return "RCT";
  return "other";
}

async function step1_collect() {
  console.log("\n========== ステップ1: 収集 & 正規化 ==========\n");

  let allSources = [];
  const summary = {};

  for (const unit of UNITS) {
    console.log(`[${unit}] 収集中...`);
    const [pubmed, europepmc] = await Promise.all([
      fetchPubMed(unit),
      fetchEuropePMC(unit)
    ]);

    const combined = [...pubmed, ...europepmc];
    allSources.push(...combined);

    const withAbstract = combined.filter(s => s.abstract && s.abstract.length > 50).length;
    summary[unit] = {
      total: combined.length,
      pubmed: pubmed.length,
      europepmc: europepmc.length,
      with_abstract: withAbstract
    };

    console.log(`  → PubMed: ${pubmed.length}, Europe PMC: ${europepmc.length}, 抄録有: ${withAbstract}`);
  }

  // 保存
  if (!existsSync("data")) {
    await mkdir("data", { recursive: true });
  }
  await writeFile("data/sources.json", JSON.stringify(allSources, null, 2), "utf8");

  console.log(`\n✓ 収集完了: ${allSources.length}件を data/sources.json に保存`);

  return { allSources, summary };
}

// ===================== ステップ2: 品質監査 =====================
function detectHits(text, regex, terms) {
  const hits = [];
  const lower = text.toLowerCase();
  for (const term of terms) {
    if (lower.includes(term.toLowerCase())) {
      hits.push(term);
    }
  }
  return hits;
}

async function step2_audit() {
  console.log("\n========== ステップ2: 品質監査 & 重複排除 ==========\n");

  const raw = JSON.parse(await readFile("data/sources.json", "utf8"));

  // 重複排除（DOI → PMID → title）
  const deduped = [];
  const seenDoi = new Set();
  const seenPmid = new Set();
  const seenTitle = new Set();

  // ソート: year desc, study_type priority
  const typePriority = { meta: 4, systematic: 3, RCT: 2, other: 1 };
  raw.sort((a, b) => {
    if (a.year !== b.year) return (b.year || 0) - (a.year || 0);
    return (typePriority[b.study_type] || 0) - (typePriority[a.study_type] || 0);
  });

  for (const rec of raw) {
    let skip = false;
    const key = rec.doi ? `doi:${rec.doi.toLowerCase()}` : rec.pmid ? `pmid:${rec.pmid}` : null;

    if (rec.doi && seenDoi.has(rec.doi.toLowerCase())) skip = true;
    if (rec.pmid && seenPmid.has(rec.pmid)) skip = true;

    const normTitle = (rec.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normTitle.length > 20 && seenTitle.has(normTitle)) skip = true;

    if (!skip) {
      if (rec.doi) seenDoi.add(rec.doi.toLowerCase());
      if (rec.pmid) seenPmid.add(rec.pmid);
      if (normTitle.length > 20) seenTitle.add(normTitle);
      deduped.push(rec);
    }
  }

  console.log(`重複排除: ${raw.length} → ${deduped.length}`);

  // include/ban 判定
  const auditResults = [];
  const banReasons = {};

  for (const rec of deduped) {
    const blob = [rec.title, rec.abstract, rec.journal].join(" ");
    const includeHits = detectHits(blob, INCLUDE_REGEX, INCLUDE_TERMS);
    const banHits = detectHits(blob, BAN_REGEX, BAN_TERMS);

    rec.include_hits = includeHits;
    rec.ban_hits = banHits;

    if (banHits.length > 0) {
      for (const b of banHits) {
        banReasons[b] = (banReasons[b] || 0) + 1;
      }
    } else {
      auditResults.push(rec);
    }
  }

  console.log(`ban語除外: ${deduped.length} → ${auditResults.length}`);

  // ユニット別集計
  const unitStats = {};
  for (const unit of UNITS) {
    const unitRecs = auditResults.filter(r => r.unit === unit);
    const withAbstract = unitRecs.filter(r => r.abstract && r.abstract.length > 50);
    unitStats[unit] = {
      total: unitRecs.length,
      with_abstract: withAbstract.length,
      shortage: Math.max(0, TARGET_PER_UNIT.min - withAbstract.length)
    };
  }

  // 保存
  await writeFile("data/sources.json", JSON.stringify(auditResults, null, 2), "utf8");

  // 監査レポート生成
  const topBans = Object.entries(banReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let report = "# 品質監査レポート\n\n";
  report += "## ユニット別集計\n\n";
  report += "| ユニット | 総件数 | 抄録有 | 不足数 |\n";
  report += "|---------|--------|--------|--------|\n";
  for (const unit of UNITS) {
    const s = unitStats[unit];
    report += `| ${unit} | ${s.total} | ${s.with_abstract} | ${s.shortage > 0 ? s.shortage : '-'} |\n`;
  }

  report += "\n## 除外理由 Top 10\n\n";
  report += "| ban語 | 件数 |\n";
  report += "|-------|------|\n";
  for (const [term, count] of topBans) {
    report += `| ${term} | ${count} |\n`;
  }

  report += "\n## 不足ユニット\n\n";
  const shortages = UNITS.filter(u => unitStats[u].shortage > 0);
  if (shortages.length > 0) {
    for (const u of shortages) {
      report += `- **${u}**: ${unitStats[u].shortage}件不足（現在${unitStats[u].with_abstract}件）\n`;
    }
  } else {
    report += "なし\n";
  }

  await writeFile("REPORT_QUALITY.md", report, "utf8");

  console.log("\n✓ 監査完了: REPORT_QUALITY.md に出力");

  return { auditResults, unitStats, topBans };
}

// ===================== ステップ3: 作問生成 =====================
function extractFactSentences(abstract) {
  if (!abstract) return [];
  const sentences = abstract.split(/[.。]/g).filter(s => s.trim().length > 30);
  return sentences.filter(s =>
    /result|finding|showed|demonstrated|indicated|found|observed|suggest|significant/i.test(s)
  ).slice(0, 5);
}

function generateMCQ(source, factSentence) {
  const correctAnswer = factSentence.trim().slice(0, 150);

  // Distractor generation
  const d1 = correctAnswer.replace(/\b(increased|improved|higher)\b/gi, m => {
    if (m.toLowerCase() === "increased") return "decreased";
    if (m.toLowerCase() === "improved") return "worsened";
    if (m.toLowerCase() === "higher") return "lower";
    return m;
  });

  const d2 = correctAnswer.replace(/\d+\.?\d*/g, m => {
    const num = parseFloat(m);
    return (num * 1.4).toFixed(1);
  });

  const d3 = "有意な差は認められなかった";

  const choices = [correctAnswer, d1, d2, d3].filter((c, i, arr) => arr.indexOf(c) === i);
  while (choices.length < 4) {
    choices.push("この効果は確認されなかった");
  }

  return {
    q: `以下の研究結果として正しいものはどれか？（${source.study_type}, ${source.year}）`,
    choices,
    answer_index: 0,
    rationale: factSentence.slice(0, 200),
    pmid: source.pmid,
    doi: source.doi,
    study_type: source.study_type,
    difficulty: source.study_type === "meta" ? "hard" : source.study_type === "RCT" ? "med" : "easy",
    year: source.year
  };
}

function generateTrueFalse(source, factSentence) {
  const statement = factSentence.trim().slice(0, 150);
  const isTrue = Math.random() > 0.5;

  const q = isTrue
    ? `次の記述は正しいか？「${statement}」`
    : `次の記述は正しいか？「${statement.replace(/increased/i, "decreased").replace(/positive/i, "negative")}」`;

  return {
    q,
    choices: ["True", "False"],
    answer_index: isTrue ? 0 : 1,
    rationale: statement,
    pmid: source.pmid,
    doi: source.doi,
    study_type: source.study_type,
    difficulty: "easy",
    year: source.year
  };
}

async function step3_generateQuestions() {
  console.log("\n========== ステップ3: 作問生成 ==========\n");

  const sources = JSON.parse(await readFile("data/sources.json", "utf8"));

  if (!existsSync("data/questions")) {
    await mkdir("data/questions", { recursive: true });
  }

  const questionStats = {};

  for (const unit of UNITS) {
    const unitSources = sources.filter(s => s.unit === unit && s.abstract && s.abstract.length > 100);

    if (unitSources.length < TARGET_PER_UNIT.min) {
      console.log(`[${unit}] ⚠️  抄録不足（${unitSources.length}件）、スキップ`);
      questionStats[unit] = { count: 0, reason: "insufficient_abstracts" };
      continue;
    }

    const questions = [];
    const targetCount = Math.min(12, unitSources.length);

    for (let i = 0; i < targetCount && i < unitSources.length; i++) {
      const source = unitSources[i];
      const facts = extractFactSentences(source.abstract);

      if (facts.length === 0) continue;

      const questionType = i % 3 === 0 ? "mcq" : i % 3 === 1 ? "tf" : "mcq";

      if (questionType === "mcq") {
        questions.push(generateMCQ(source, facts[0]));
      } else {
        questions.push(generateTrueFalse(source, facts[0]));
      }
    }

    const jsonl = questions.map(q => JSON.stringify(q)).join("\n");
    await writeFile(`data/questions/${unit}.jsonl`, jsonl, "utf8");

    console.log(`[${unit}] ✓ ${questions.length}問生成`);
    questionStats[unit] = { count: questions.length, mcq: questions.filter(q => q.choices.length === 4).length, tf: questions.filter(q => q.choices.length === 2).length };
  }

  console.log("\n✓ 作問完了");

  return questionStats;
}

// ===================== メイン実行 =====================
async function main() {
  console.log("🚀 統合パイプライン開始\n");

  const { summary: step1Summary } = await step1_collect();
  const { unitStats, topBans } = await step2_audit();
  const questionStats = await step3_generateQuestions();

  console.log("\n========== 最終サマリ ==========\n");

  console.log("## 1) 収集件数表\n");
  console.log("| ユニット | PubMed | Europe PMC | 抄録有 |");
  console.log("|---------|--------|------------|--------|");
  for (const unit of UNITS) {
    const s = step1Summary[unit];
    console.log(`| ${unit} | ${s.pubmed} | ${s.europepmc} | ${s.with_abstract} |`);
  }

  console.log("\n## 2) 監査ハイライト（除外理由 Top 5）\n");
  for (let i = 0; i < Math.min(5, topBans.length); i++) {
    console.log(`${i + 1}. ${topBans[i][0]}: ${topBans[i][1]}件`);
  }

  console.log("\n## 3) 作問件数表\n");
  console.log("| ユニット | 総問題数 | MCQ | T/F |");
  console.log("|---------|----------|-----|-----|");
  for (const unit of UNITS) {
    const q = questionStats[unit];
    if (q.count > 0) {
      console.log(`| ${unit} | ${q.count} | ${q.mcq} | ${q.tf} |`);
    } else {
      console.log(`| ${unit} | 0 | - | - |`);
    }
  }

  console.log("\n## 4) 次アクション\n");
  const shortages = UNITS.filter(u => unitStats[u].shortage > 0);
  if (shortages.length > 0) {
    console.log("### 不足ユニット対策:");
    for (const u of shortages) {
      console.log(`- **${u}**: 手動キュレーション推奨（メタ分析から引用文献抽出）`);
    }
  } else {
    console.log("✓ 全ユニット目標達成");
  }

  console.log("\n🎉 パイプライン完了\n");
}

main().catch(err => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
