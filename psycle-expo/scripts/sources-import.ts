import * as fs from "node:fs";
import * as path from "node:path";

interface SourceEntry {
  id: string;
  apa: string;
  doi?: string;
  url: string;
  type: "meta-analysis" | "systematic-review" | "rct" | "other";
  year?: number;
  tags: string[];
}

interface UnitCitations {
  [unitId: string]: string[];
}

interface ParsedInput {
  doi?: string;
  pmid?: string;
  title?: string;
  raw: string;
}

const CROSSREF_API = "https://api.crossref.org/works";
const PUBMED_ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error("Usage: node sources-import.ts --input <file> [--map <csv>] [--topic-tags <str>]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const sourcesPath = path.resolve("data/sources.json");
  const unitCitationsPath = path.resolve("data/unit_citations.json");

  const lines = fs.readFileSync(inputPath, "utf-8").split("\n").filter((l) => l.trim());
  const topicTags = parseTopicTags(args["topic-tags"] || "");

  let existingSources: SourceEntry[] = [];
  if (fs.existsSync(sourcesPath)) {
    existingSources = JSON.parse(fs.readFileSync(sourcesPath, "utf-8"));
  }

  const doiSet = new Set(existingSources.filter((s) => s.doi).map((s) => s.doi!.toLowerCase()));
  const titleSet = new Set(existingSources.map((s) => normalizeTitle(s.apa)));

  let added = 0;
  let skipped = 0;
  let errors = 0;

  const newSources: SourceEntry[] = [];

  for (const line of lines) {
    try {
      const parsed = parseLine(line);
      if (!parsed.doi && !parsed.pmid && !parsed.title) {
        skipped++;
        continue;
      }

      const meta = await fetchMetadata(parsed);
      if (!meta) {
        errors++;
        continue;
      }

      if (meta.doi && doiSet.has(meta.doi.toLowerCase())) {
        skipped++;
        continue;
      }

      const normTitle = normalizeTitle(meta.apa);
      if (titleSet.has(normTitle)) {
        skipped++;
        continue;
      }

      if (meta.doi) doiSet.add(meta.doi.toLowerCase());
      titleSet.add(normTitle);

      const tags = inferTags(meta, topicTags);
      const id = generateId(meta, existingSources.concat(newSources));

      const entry: SourceEntry = {
        id,
        apa: meta.apa,
        doi: meta.doi,
        url: meta.url,
        type: meta.type,
        year: meta.year,
        tags,
      };

      newSources.push(entry);
      added++;
    } catch (err) {
      errors++;
    }
  }

  const finalSources = existingSources.concat(newSources);
  fs.mkdirSync(path.dirname(sourcesPath), { recursive: true });
  fs.writeFileSync(sourcesPath, JSON.stringify(finalSources, null, 2), "utf-8");

  console.log(`✓ Added: ${added}, Skipped: ${skipped}, Errors: ${errors}`);

  if (args.map) {
    const mapPath = path.resolve(args.map);
    if (fs.existsSync(mapPath)) {
      const unitMap = parseUnitMap(mapPath, finalSources);
      let existingUnitCitations: UnitCitations = {};
      if (fs.existsSync(unitCitationsPath)) {
        existingUnitCitations = JSON.parse(fs.readFileSync(unitCitationsPath, "utf-8"));
      }

      for (const [unitId, citationIds] of Object.entries(unitMap)) {
        if (!existingUnitCitations[unitId]) {
          existingUnitCitations[unitId] = [];
        }
        for (const cid of citationIds) {
          if (!existingUnitCitations[unitId].includes(cid)) {
            existingUnitCitations[unitId].push(cid);
          }
        }
      }

      fs.writeFileSync(unitCitationsPath, JSON.stringify(existingUnitCitations, null, 2), "utf-8");
      console.log(`✓ Updated unit_citations.json`);
    }
  }
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      result[key] = argv[i + 1] || "";
      i++;
    }
  }
  return result;
}

function parseTopicTags(str: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!str) return result;
  const pairs = str.split(";").map((s) => s.trim()).filter(Boolean);
  for (const pair of pairs) {
    const [topic, tagStr] = pair.split("=");
    if (topic && tagStr) {
      result[topic.trim()] = tagStr.split(",").map((t) => t.trim());
    }
  }
  return result;
}

function parseLine(line: string): ParsedInput {
  const trimmed = line.trim();
  const doiMatch = trimmed.match(/10\.\d{4,}\/[^\s]+/);
  if (doiMatch) {
    return { doi: doiMatch[0], raw: trimmed };
  }

  const pmidMatch = trimmed.match(/(?:pmid:?\s*)?(\d{7,})/i);
  if (pmidMatch && !trimmed.includes("doi.org")) {
    return { pmid: pmidMatch[1], raw: trimmed };
  }

  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const urlDoiMatch = url.match(/doi\.org\/(10\.\d{4,}\/[^\s]+)/);
    if (urlDoiMatch) {
      return { doi: urlDoiMatch[1], raw: trimmed };
    }
    const urlPmidMatch = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
    if (urlPmidMatch) {
      return { pmid: urlPmidMatch[1], raw: trimmed };
    }
  }

  const titleMatch = trimmed.match(/[A-Z][^.]+\./);
  if (titleMatch) {
    return { title: titleMatch[0].replace(/\.$/, ""), raw: trimmed };
  }

  return { raw: trimmed };
}

async function fetchMetadata(parsed: ParsedInput): Promise<{
  apa: string;
  doi?: string;
  url: string;
  type: SourceEntry["type"];
  year?: number;
} | null> {
  if (parsed.doi) {
    return await fetchCrossrefByDoi(parsed.doi);
  }
  if (parsed.pmid) {
    return await fetchPubMed(parsed.pmid);
  }
  if (parsed.title) {
    return await fetchCrossrefByTitle(parsed.title);
  }
  return null;
}

async function fetchCrossrefByDoi(doi: string): Promise<any> {
  const url = `${CROSSREF_API}/${encodeURIComponent(doi)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return normalizeCrossref(json.message);
}

async function fetchCrossrefByTitle(title: string): Promise<any> {
  const url = `${CROSSREF_API}?query.bibliographic=${encodeURIComponent(title)}&rows=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.message.items && json.message.items.length > 0) {
    return normalizeCrossref(json.message.items[0]);
  }
  return null;
}

async function fetchPubMed(pmid: string): Promise<any> {
  const url = `${PUBMED_ESUMMARY}?db=pubmed&id=${pmid}&retmode=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.result?.[pmid];
  if (!doc) return null;

  const authors = doc.authors
    ?.slice(0, 6)
    .map((a: any) => a.name)
    .join(", ") || "Unknown";
  const year = doc.pubdate ? parseInt(doc.pubdate.split(" ")[0], 10) : undefined;
  const title = doc.title || "";
  const journal = doc.source || "";
  const doiObj = doc.articleids?.find((a: any) => a.idtype === "doi");
  const doi = doiObj?.value;

  const apa = `${authors} (${year || "n.d."}). ${title}. ${journal}.${doi ? ` https://doi.org/${doi}` : ""}`;
  const type = inferType(title + " " + (doc.pubtype?.join(" ") || ""));

  return {
    apa,
    doi,
    url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    type,
    year,
  };
}

function normalizeCrossref(item: any): any {
  const authors = item.author
    ?.slice(0, 6)
    .map((a: any) => `${a.family}, ${a.given?.[0] || ""}`)
    .join(", ") || "Unknown";
  const year = item.published?.["date-parts"]?.[0]?.[0];
  const title = item.title?.[0] || "";
  const journal = item["container-title"]?.[0] || "";
  const doi = item.DOI;

  const apa = `${authors} (${year || "n.d."}). ${title}. ${journal}.${doi ? ` https://doi.org/${doi}` : ""}`;
  const type = inferType(title + " " + (item.type || ""));

  return {
    apa,
    doi,
    url: doi ? `https://doi.org/${doi}` : item.URL || "",
    type,
    year,
  };
}

function inferType(text: string): SourceEntry["type"] {
  const lower = text.toLowerCase();
  if (lower.includes("meta-analysis")) return "meta-analysis";
  if (lower.includes("systematic")) return "systematic-review";
  if (lower.includes("randomized") || lower.includes("rct")) return "rct";
  return "other";
}

function inferTags(meta: any, topicTags: Record<string, string[]>): string[] {
  const tags = new Set<string>();
  const text = (meta.apa || "").toLowerCase();

  const keywords = ["hrv", "breathing", "reappraisal", "mindfulness", "mbct", "spacing", "retrieval", "habit"];
  for (const kw of keywords) {
    if (text.includes(kw)) tags.add(kw);
  }

  for (const [topic, tagList] of Object.entries(topicTags)) {
    if (text.includes(topic.toLowerCase())) {
      tagList.forEach((t) => tags.add(t));
    }
  }

  return Array.from(tags);
}

function generateId(meta: any, existing: SourceEntry[]): string {
  const apa = meta.apa || "";
  const match = apa.match(/([A-Za-z]+)/);
  const lastname = match ? match[1].toLowerCase() : "unknown";
  const year = meta.year || "0000";
  const titleMatch = apa.match(/\)\.\s*([A-Za-z]+)/);
  const keyword = titleMatch ? titleMatch[1].toLowerCase().slice(0, 8) : "item";

  let base = `${lastname}${year}_${keyword}`;
  let id = base;
  let suffix = 97;

  while (existing.some((e) => e.id === id)) {
    id = `${base}${String.fromCharCode(suffix)}`;
    suffix++;
  }

  return id;
}

function normalizeTitle(apa: string): string {
  return apa
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseUnitMap(csvPath: string, sources: SourceEntry[]): UnitCitations {
  const result: UnitCitations = {};
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").filter((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i === 0 && (line.toLowerCase().includes("unit") || line.toLowerCase().includes("citation"))) continue;

    const [unitId, ref] = line.split(",").map((s) => s.trim());
    if (!unitId || !ref) continue;

    let citationId = ref;
    if (ref.startsWith("10.")) {
      const found = sources.find((s) => s.doi?.toLowerCase() === ref.toLowerCase());
      citationId = found?.id || ref;
    }

    if (!result[unitId]) result[unitId] = [];
    if (!result[unitId].includes(citationId)) {
      result[unitId].push(citationId);
    }
  }

  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
