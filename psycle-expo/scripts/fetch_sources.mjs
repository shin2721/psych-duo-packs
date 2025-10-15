// scripts/fetch_sources.mjs
import { writeFile, readFile } from "node:fs/promises";

// ============ 設定 ============
const FROM_YEAR = 2012;
const MAX_PER_UNIT = 80; // ERIC、PubMed、Crossrefから抄録付き文献を取得
const TYPES_OK = new Set(["journal-article"]); // Crossref
const PUBTYPE_ALLOW = /./; // Accept all publication types
const PUBTYPE_DENY  = /case reports?|editorial|letter|comment/i;
const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || null;

const UNIT_QUERIES = {
  mental: {
    include: /(breathing|respiration|HRV|heart rate variability|reappraisal|cognitive reappraisal|emotion regulation|stress management|anxiety reduction|CBT|mindfulness|meditation|relaxation)/i,
    ban: /(pediatr|animal|rodent|mouse|rat|mice|case[- ]report|agglutinin)/i,
    crossref: 'breathing OR "heart rate variability" OR reappraisal OR "cognitive reappraisal" OR "emotion regulation" OR "stress management" OR CBT OR mindfulness OR meditation'
  },
  money: {
    include: /(financial literacy|saving|budget|debt|spending|self-control|impulse buying)/i,
    ban: /(crypto|blockchain|macro|stock market modeling|derivatives)/i,
    crossref: '"financial literacy" OR saving OR budget OR debt OR "impulse buying"'
  },
  work: {
    include: /(productivity|time management|goal setting|procrastination|focus|attention management)/i,
    ban: /(child labor|macro labor market)/i,
    crossref: 'productivity OR "time management" OR "goal setting" OR procrastination'
  },
  health: {
    include: /(exercise|physical activity|sleep|insomnia|nutrition|diet|stress reduction)/i,
    ban: /(injury case|surgery case|animal)/i,
    crossref: 'exercise OR "physical activity" OR sleep OR insomnia OR nutrition OR diet OR "stress reduction"'
  },
  social: {
    include: /(relationship|communication|prosocial|empathy|conflict resolution|gratitude)/i,
    ban: /(dating app|forensic case)/i,
    crossref: 'relationship OR communication OR prosocial OR empathy OR "conflict resolution" OR gratitude'
  },
  study: {
    include: /(metacognition|spaced practice|spaced repetition|retrieval practice|testing effect|self-explanation)/i,
    ban: /(animal learning|computer vision)/i,
    crossref: 'metacognition OR "spaced practice" OR "retrieval practice" OR "testing effect" OR "self-explanation"'
  }
};

// ============ Crossref ============
// 参考: https://api.crossref.org/works
async function fetchCrossref(unitKey) {
  const q = UNIT_QUERIES[unitKey].crossref;
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", q);
  url.searchParams.set("filter", `type:journal-article,from-pub-date:${FROM_YEAR}-01-01`);
  url.searchParams.set("select", "DOI,title,URL,container-title,issued,type,author,subject");
  url.searchParams.set("rows", String(MAX_PER_UNIT));
  const r = await fetch(url, { headers: { "User-Agent": "psycle/1.0" }});
  const j = await r.json();

  return (j.message.items || [])
    .filter(x => TYPES_OK.has((x.type||"").toLowerCase()))
    .map(x => {
      const year = x.issued?.["date-parts"]?.[0]?.[0];
      return {
        id: x.DOI ? `doi:${x.DOI}` : null,
        doi: x.DOI || null,
        pmid: null,
        title: (x.title && x.title[0]) || "",
        authors: (x.author||[]).map(a => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean),
        year,
        venue: (x["container-title"] && x["container-title"][0]) || "",
        url: x.URL || (x.DOI ? `https://doi.org/${x.DOI}` : ""),
        type: x.type || "journal-article",
        tags: x.subject || [],
        abstract: null, // Crossrefは必ずしも抄録が入らない
        source: "crossref",
        unit: unitKey
      };
    });
}

// ============ ERIC (Education Resources Information Center) ============
// 参考: https://eric.ed.gov/?api
async function fetchERIC(unitKey) {
  // ERIC doesn't support phrase queries (quoted strings), so remove quotes
  const q = UNIT_QUERIES[unitKey].crossref.replace(/"/g, '');
  const url = `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(q)}&rows=${MAX_PER_UNIT}&format=json&start=0`;

  try {
    const r = await fetch(url);

    if (!r.ok) {
      console.warn(`  [ERIC] HTTP ${r.status} for ${unitKey}`);
      return [];
    }

    const j = await r.json();
    const allDocs = j.response?.docs || [];

    const withDescription = allDocs.filter(x => x.description && x.description.length > 50);

    const withYear = withDescription.filter(x => x.publicationdateyear && x.publicationdateyear >= FROM_YEAR);

    return withYear.map(x => {
      const year = parseInt(x.publicationdateyear, 10);
      return {
        id: x.id || `eric:${x.accno}`,
        doi: null,
        pmid: null,
        title: x.title || "",
        authors: Array.isArray(x.author) ? x.author : [],
        year,
        venue: x.source || "",
        url: `https://eric.ed.gov/?id=${x.id}`,
        type: x.publicationtype?.join("; ") || "journal-article",
        tags: x.subject || [],
        abstract: x.description || null,
        source: "eric",
        unit: unitKey
      };
    });
  } catch (error) {
    console.warn(`  [ERIC] Error for ${unitKey}:`, error.message);
    return [];
  }
}

// ============ OpenAlex ============
// 参考: https://docs.openalex.org/
async function fetchOpenAlex(unitKey) {
  const q = UNIT_QUERIES[unitKey].crossref;
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=from_publication_date:${FROM_YEAR}-01-01,type:journal-article&per-page=${MAX_PER_UNIT}&select=id,doi,title,publication_year,authorships,primary_location,type,concepts,ids,abstract_inverted_index&mailto=psycle@example.org`;

  try {
    const r = await fetch(url);

    if (!r.ok) {
      console.warn(`  [OpenAlex] HTTP ${r.status} for ${unitKey}`);
      return [];
    }

    const j = await r.json();

    return (j.results || [])
      .filter(x => x.abstract_inverted_index) // Must have abstract
      .map(x => {
        // Reconstruct abstract from inverted index
        const invertedIndex = x.abstract_inverted_index || {};
        const words = [];
        for (const [word, positions] of Object.entries(invertedIndex)) {
          for (const pos of positions) {
            words[pos] = word;
          }
        }
        const abstract = words.filter(Boolean).join(" ").trim();

        const doi = x.doi ? x.doi.replace("https://doi.org/", "") : null;
        const pmid = x.ids?.pmid ? x.ids.pmid.replace("https://pubmed.ncbi.nlm.nih.gov/", "") : null;

        return {
          id: doi ? `doi:${doi}` : (pmid ? `pmid:${pmid}` : `openalex:${x.id}`),
          doi,
          pmid,
          title: x.title || "",
          authors: (x.authorships || []).map(a => a.author?.display_name).filter(Boolean),
          year: x.publication_year || null,
          venue: x.primary_location?.source?.display_name || "",
          url: doi ? `https://doi.org/${doi}` : x.id,
          type: x.type || "journal-article",
          tags: (x.concepts || []).map(c => c.display_name),
          abstract: abstract.length > 50 ? abstract : null,
          source: "openalex",
          unit: unitKey
        };
      })
      .filter(x => x.abstract && x.year && x.year >= FROM_YEAR);
  } catch (error) {
    console.warn(`  [OpenAlex] Error for ${unitKey}:`, error.message);
    return [];
  }
}

// ============ Semantic Scholar ============
// 参考: https://api.semanticscholar.org/api-docs/graph
async function fetchSemanticScholar(unitKey) {
  const q = UNIT_QUERIES[unitKey].crossref;
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=${MAX_PER_UNIT}&fields=paperId,title,abstract,year,authors,venue,externalIds,publicationTypes,fieldsOfStudy&minCitationCount=3`;

  try {
    const headers = {
      "User-Agent": "psycle/1.0 (academic research app)",
    };

    if (SEMANTIC_SCHOLAR_API_KEY) {
      headers["x-api-key"] = SEMANTIC_SCHOLAR_API_KEY;
    }

    const r = await fetch(url, { headers });

    if (!r.ok) {
      console.warn(`  [Semantic Scholar] HTTP ${r.status} for ${unitKey}`);
      return [];
    }

    const j = await r.json();

    return (j.data || [])
      .filter(x => x.abstract && x.abstract.length > 50) // Must have abstract
      .filter(x => x.year && x.year >= FROM_YEAR) // Filter by year
      .map(x => {
        const doi = x.externalIds?.DOI || null;
        const pmid = x.externalIds?.PubMed || null;
        return {
          id: doi ? `doi:${doi}` : (pmid ? `pmid:${pmid}` : `s2:${x.paperId}`),
          doi,
          pmid,
          title: x.title || "",
          authors: (x.authors || []).map(a => a.name).filter(Boolean),
          year: x.year || null,
          venue: x.venue || "",
          url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${x.paperId}`,
          type: (x.publicationTypes || []).join("; ") || "journal-article",
          tags: x.fieldsOfStudy || [],
          abstract: x.abstract || null,
          source: "semantic-scholar",
          unit: unitKey
        };
      });
  } catch (error) {
    console.warn(`  [Semantic Scholar] Error for ${unitKey}:`, error.message);
    return [];
  }
}

// ============ PubMed ============
// 参考: ESearch -> IdList -> ESummary / EFetch
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
async function fetchPubMed(unitKey) {
  const baseQuery = `(${UNIT_QUERIES[unitKey].crossref})`;
  const filt = `("humans"[MeSH Terms]) AND ("${FROM_YEAR}"[Date - Publication] : "3000"[Date - Publication])
                NOT (case reports[pt] OR editorial[pt] OR letter[pt] OR comment[pt])`;
  const term = `${baseQuery} AND ${filt}`;
  const esearch = `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${MAX_PER_UNIT}&retmode=json`;
  const es = await (await fetch(esearch)).json();
  const ids = es.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  // summary で基本書誌
  const esum = `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const sum = await (await fetch(esum)).json();
  const uidMap = sum.result || {};

  // abstract は efetch(xml) から軽量パース
  const efetch = `${EUTILS}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`;
  const xml = await (await fetch(efetch)).text();

  const absMap = {};
  // 複数 AbstractText を結合
  const articleBlocks = xml.split("<PubmedArticle>").slice(1);
  for (const block of articleBlocks) {
    const pmid = (block.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
    const absParts = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)).map(m => m[1]);
    absMap[pmid] = absParts.join("\n").replace(/\s+/g, " ").trim() || null;
  }

  return ids.map(id => {
    const it = uidMap[id];
    const pubtypes = (it?.pubtype || []).join("; ");
    return {
      id: id ? `pmid:${id}` : null,
      doi: (it?.elocationid || "").startsWith("doi:") ? it.elocationid.replace(/^doi:\s*/i,"") : null,
      pmid: id || null,
      title: it?.title || "",
      authors: (it?.authors || []).map(a => [a.name, a.authtype].filter(Boolean).join(" ")),
      year: Number((it?.pubdate || "").slice(0,4)) || null,
      venue: it?.fulljournalname || "",
      url: it?.elocationid?.startsWith("doi:") ? `https://doi.org/${it.elocationid.replace(/^doi:\s*/i,"")}` : "",
      type: pubtypes,
      tags: it?.meshheadinglist || [],
      abstract: absMap[id] || null,
      source: "pubmed",
      unit: unitKey
    };
  }).filter(x => x.year && x.year >= FROM_YEAR)
    .filter(x => PUBTYPE_ALLOW.test(x.type) && !PUBTYPE_DENY.test(x.type));
}

// ============ 正規化・フィルタリング ============
function filterAndScore(records, unitKey) {
  const { include, ban } = UNIT_QUERIES[unitKey];
  return records
    .filter(r => r.year && r.year >= FROM_YEAR)
    .filter(r => {
      const blob = [r.title, r.abstract, (r.tags||[]).join(" "), r.venue].join(" ").toLowerCase();
      return include.test(blob) && !ban.test(blob);
    });
}

function dedupe(records) {
  const seen = new Set();
  const out = [];
  for (const r of records) {
    const key = r.doi ? `doi:${r.doi.toLowerCase()}` : (r.pmid ? `pmid:${r.pmid}` : r.id);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

// ============ 実行 ============
async function run() {
  const units = Object.keys(UNIT_QUERIES);
  let all = [];
  for (const u of units) {
    console.log(`[${u}] Fetching from ERIC, PubMed, and Crossref...`);

    // Fetch all sources in parallel
    const [eric, pm, cr] = await Promise.all([
      fetchERIC(u),
      fetchPubMed(u),
      fetchCrossref(u)
    ]);

    // ERIC優先（全て抄録付き）、次にPubMed（抄録付きが多い）、最後にCrossref
    let recs = dedupe([...eric, ...pm, ...cr]);
    recs = filterAndScore(recs, u);
    console.log(` -> kept ${recs.length} items (${recs.filter(r => r.abstract).length} with abstracts)`);
    console.log(`    Sources: ERIC=${eric.length}, PubMed=${pm.length}, Crossref=${cr.length}`);
    all.push(...recs);
  }
  all = dedupe(all);
  console.log(`\nDONE. wrote ${all.length} records to data/sources.json`);
  console.log(`Total with abstracts: ${all.filter(r => r.abstract).length}`);
  await writeFile("data/sources.json", JSON.stringify(all, null, 2), "utf8");

  // Auto-generate questions after fetching sources
  console.log("\n=== Auto-generating questions ===");
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync("node scripts/generate_questions.mjs");
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("Failed to generate questions:", error.message);
  }
}
run().catch(e => { console.error(e); process.exit(1); });
