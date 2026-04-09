export interface LessonMeta {
  id: string;
  domain: string;
  level: number;
  locale: string;
  file: string;
  sha256: string;
  bytes: number;
  updated_at: string;
  question_count: number;
}

export interface Manifest {
  manifest_version: number;
  content_version: string;
  min_app_version: string;
  generated_at: string;
  lessons: LessonMeta[];
  curricula: Record<string, { file: string; sha256: string; updated_at: string }>;
  sources: { file: string; sha256: string; updated_at: string } | null;
  stats: {
    total_lessons: number;
    domains: string[];
    total_questions: number;
    total_bytes: number;
  };
}

export interface SyncResult {
  success: boolean;
  oldVersion: string | null;
  newVersion: string | null;
  downloaded: string[];
  failed: string[];
  error?: string;
}

export interface DownloadedLesson {
  id: string;
  content: string;
}

export interface CacheStatusSummary {
  manifestVersion: string | null;
  cachedLessons: string[];
  totalCacheSize: number;
}
