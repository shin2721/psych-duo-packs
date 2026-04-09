import { warnDev } from "./devLog";

export const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/shin2721/psych-duo-packs/main";

export const REMOTE_CONTENT_CONFIG = {
  TIMEOUT_MS: 10000,
  RETRY_COUNT: 2,
  RETRY_DELAY_MS: 1000,
  MAX_CONCURRENT_DL: 2,
} as const;

export const REMOTE_CONTENT_STORAGE_KEYS = {
  MANIFEST: "@psycle/manifest",
  PENDING_MANIFEST: "@psycle/pending_manifest",
  LESSON_PREFIX: "@psycle/lesson/",
} as const;

export function warnRemoteContent(message: string, error?: unknown): void {
  warnDev(`[RemoteContent] ${message}`, error);
}
