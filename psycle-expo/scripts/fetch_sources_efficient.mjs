#!/usr/bin/env node
// 効率的な学術ソース収集スクリプト
import { writeFile } from "fs/promises";

const UNITS = ["mental", "money", "work", "health", "social", "study"];
const FROM_YEAR = 2015;
const MAX_PER_UNIT = 100; // 適度な量に調整（600件程度）
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// ユニット別クエリ（最適化版）
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

// Ban語（除外）
const BAN_TERMS = [
  "COPD", "asthma", "dermatitis", "tinnitus", "ventilator",
  " animal ", " rodent", " mouse ", " rat ", " mice ", "case report",
  "pediatric", "neonate", " infant", "children under"
];

function detectBanHits(text) {
  const hits = [];
  const lower = text.toLowerCase();
  for (const term of BAN_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      hits.push(term.trim());
    }
  }
  return hits;
}

function inferStudyType(pubTypes) {
  const types = Array.isArray(pubTypes) ? pubTypes.join(" ").toLowerCase() : String(pubTypes).toLowerCase();
  if (types.includes("meta-analysis")) return "meta";
  if (types.includes("systematic review")) return "sr";
  if (types.includes("randomized controlled trial")) return "rct";
  return "other";
}

// PubMed取得（改善版：最新順ソート）
async function fetchPubMed(unit) {
  const query = UNIT_QUERIES[unit].pubmed;
  const baseFilter = `("humans"[MeSH Terms]) AND (randomized controlled trial[pt] OR systematic[sb] OR meta-analysis[pt]) AND ("${FROM_YEAR}"[Date - Publication] : "3000"[Date - Publication])`;
  const exclusions = 'NOT ("Pulmonary Disease, Chronic Obstructive"[MeSH] OR "Asthma"[MeSH] OR "Dermatitis"[MeSH] OR "Tinnitus"[MeSH] OR case reports[pt] OR animals[mh:noexp] OR rats[mh] OR mice[mh])';

  const term = `(${query}) AND ${baseFilter} ${exclusions}`;

  try {
    // ESearch - 最新順でソート
    const esearch = `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${MAX_PER_UNIT}&retmode=json&sort=pub_date`;
    const esRes = await fetch(esearch);
    const esJson = await esRes.json();
    const ids = esJson.esearchresult?.idlist || [];

    if (ids.length === 0) return [];

    console.log(`  PubMed: ${ids.length}件取得`);

    // ESummary
    const esum = `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const sumRes = await fetch(esum);
    const sumJson = await sumRes.json();
    const uidMap = sumJson.result || {};

    // EFetch (抄録)
    const efetch = `${EUTILS}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`;
    const fetchRes = await fetch(efetch);
    const xml = await fetchRes.text();

    // 抄録をパース
    const absMap = {};
    const articleBlocks = xml.split("<PubmedArticle>").slice(1);
    for (const block of articleBlocks) {
      const pmid = (block.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
      const absParts = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)).map(m => m[1]);
      absMap[pmid] = absParts.join("\n").replace(/\s+/g, " ").trim() || null;
    }

    // データ構築
    return ids.map(id => {
      const it = uidMap[id];
      const pubTypes = it?.pubtype || [];
      const studyType = inferStudyType(pubTypes);
      const abstract = absMap[id] || null;

      return {
        unit,
        pmid: id,
        doi: (it?.elocationid || "").startsWith("doi:") ? it.elocationid.replace(/^doi:\s*/i, "") : null,
        title: it?.title || "",
        abstract,
        year: Number((it?.pubdate || "").slice(0, 4)) || null,
        authors: (it?.authors || []).slice(0, 6).map(a => a.name).join(", "),
        journal: it?.fulljournalname || "",
        study_type: studyType,
        source: "pubmed"
      };
    }).filter(x => x.year >= FROM_YEAR);
  } catch (err) {
    console.error(`  ⚠️  PubMed取得エラー:`, err.message);
    return [];
  }
}

// Europe PMC取得（修正版：正しいエンコーディング）
async function fetchEuropePMC(unit) {
  const query = UNIT_QUERIES[unit].europepmc;
  const fullQuery = `(${query}) AND PUB_YEAR:[${FROM_YEAR} TO 3000] AND HAS_ABSTRACT:Y`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(fullQuery)}&format=json&pageSize=${MAX_PER_UNIT}&sort=CITED desc`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ⚠️  Europe PMC HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    const results = json.resultList?.result || [];

    console.log(`  Europe PMC: ${results.length}件取得`);

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
    console.error(`  ⚠️  Europe PMC取得エラー:`, err.message);
    return [];
  }
}

// 重複排除（DOI→PMID→タイトル正規化）
function deduplicate(records) {
  const seen = new Set();
  const unique = [];

  for (const rec of records) {
    let key = null;

    if (rec.doi) {
      key = `doi:${rec.doi.toLowerCase()}`;
    } else if (rec.pmid) {
      key = `pmid:${rec.pmid}`;
    } else if (rec.title) {
      const normalized = rec.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      key = `title:${normalized}`;
    }

    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(rec);
    }
  }

  return unique;
}

// フィルタリング（Ban語チェック）
function filterRecords(records) {
  const filtered = [];
  const banned = [];

  for (const rec of records) {
    const text = `${rec.title} ${rec.abstract || ""}`;
    const banHits = detectBanHits(text);

    if (banHits.length > 0) {
      banned.push({ ...rec, ban_hits: banHits });
    } else {
      filtered.push(rec);
    }
  }

  return { filtered, banned };
}

// メイン処理
async function main() {
  console.log("🚀 効率的な学術ソース収集を開始\n");
  console.log(`設定: ${MAX_PER_UNIT}件/ユニット (PubMed + Europe PMC)\n`);

  const allRecords = [];

  for (const unit of UNITS) {
    console.log(`\n=== ${unit} ===`);

    // 並列取得
    const [pubmedData, pmcData] = await Promise.all([
      fetchPubMed(unit),
      fetchEuropePMC(unit)
    ]);

    // 重複排除（PubMed優先）
    const combined = deduplicate([...pubmedData, ...pmcData]);
    console.log(`  重複排除後: ${combined.length}件`);

    // Ban語フィルタリング
    const { filtered, banned } = filterRecords(combined);
    console.log(`  Ban語除外: ${banned.length}件 → 最終: ${filtered.length}件`);

    allRecords.push(...filtered);
  }

  // 保存
  await writeFile("data/sources.json", JSON.stringify(allRecords, null, 2), "utf8");

  console.log(`\n✅ 完了！`);
  console.log(`総取得数: ${allRecords.length}件`);
  console.log(`保存先: data/sources.json`);

  // 統計表示
  const byUnit = UNITS.map(u => ({
    unit: u,
    count: allRecords.filter(r => r.unit === u).length
  }));
  console.log("\n📊 ユニット別:");
  byUnit.forEach(({ unit, count }) => console.log(`  ${unit}: ${count}件`));

  const bySource = {
    pubmed: allRecords.filter(r => r.source === "pubmed").length,
    europe_pmc: allRecords.filter(r => r.source === "europe_pmc").length
  };
  console.log("\n📚 ソース別:");
  console.log(`  PubMed: ${bySource.pubmed}件`);
  console.log(`  Europe PMC: ${bySource.europe_pmc}件`);
}

main().catch(console.error);
