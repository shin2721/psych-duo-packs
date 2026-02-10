/**
 * Evidence Utilities
 * citations[]配列とlegacy citation互換性のためのユーティリティ
 */

export interface Citation {
  role?: 'primary' | 'supporting';
  source_type?: string;
  doi?: string;
  pmid?: string;
  isbn?: string;
  url?: string;
  label?: string;
}

export interface LegacyReference {
  citation: string;
  note?: string;
  level?: "gold" | "silver" | "bronze";
  label?: string;
  doi?: string;
  pmid?: string;
  isbn?: string;
  url?: string;
}

export interface EvidenceCard {
  source_type?: string;
  citations?: Citation[];
  citation?: {
    doi?: string;
    pmid?: string;
    isbn?: string;
    url?: string;
  };
  source_label?: string;
  claim?: string;
  limitations?: string;
  effect_size_note?: string;
  evidence_grade?: 'gold' | 'silver' | 'bronze';
  confidence?: string;
  status?: string;
  last_verified?: string;
  generated_by?: string;
  review?: {
    human_approved?: boolean;
    reviewer?: string;
  };
}

/**
 * 引用情報を表示用文字列に変換
 */
export function formatCitation(citation: Citation | LegacyReference): string {
  if ("citation" in citation && typeof citation.citation === "string") {
    return citation.citation;
  }

  if (citation.label) return citation.label;
  if (citation.doi) return `DOI: ${citation.doi}`;
  if (citation.pmid) return `PMID: ${citation.pmid}`;
  if (citation.isbn) return `ISBN: ${citation.isbn}`;
  
  if (citation.url) {
    try {
      if (typeof URL === "function") {
        return `Source: ${new URL(citation.url).hostname}`;
      }
      return 'Web Source';
    } catch {
      return 'Web Source';
    }
  }
  
  return 'Unknown Source';
}

/**
 * Effect size noteを安全に取得
 */
export function getEffectSizeNote(evidence: EvidenceCard): string {
  return evidence.effect_size_note || '';
}
