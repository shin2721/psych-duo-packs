import curatedSourcesData from "../data/curated_sources.json";

export interface SourceEntry {
  author: string;
  year: number;
  title: string;
  type: string;
  // 検索期限（YYYY-MM）。シートの出どころに「〜までの研究」として出す。無い台帳は出さない。
  evidence_through?: string;
  notes?: string;
}

interface CuratedSourcesJson {
  sources?: Record<string, SourceEntry>;
}

export function getSourceInfo(sourceId: string | undefined): SourceEntry | null {
  if (!sourceId) return null;
  const sources = (curatedSourcesData as CuratedSourcesJson).sources || {};
  return sources[sourceId] || null;
}
