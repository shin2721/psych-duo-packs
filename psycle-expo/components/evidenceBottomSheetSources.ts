import curatedSourcesData from "../data/curated_sources.json";

export interface SourceEntry {
  author: string;
  year: number;
  title: string;
  type: string;
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
