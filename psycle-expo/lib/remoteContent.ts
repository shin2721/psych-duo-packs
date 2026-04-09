/**
 * Remote Content Manager
 *
 * manifest.jsonを取得して、新しいコンテンツをダウンロード・キャッシュ・検証する
 *
 * 設計原則:
 * - 失敗時は常にロールバック（旧キャッシュで継続）
 * - 部分成功は許容しない（1つでも失敗したら全体を破棄）
 * - キャッシュバストでraw.githubusercontent.comのキャッシュ問題を回避
 */

import { logDev } from "./devLog";
import {
  clearRemoteContentCache,
  downloadLessonsParallel,
  fetchManifestRemote,
  getCacheStatusSummary,
  getCachedLesson,
  getCachedManifest,
  getLessonsToDownload,
  saveDownloadedContent,
} from "./remoteContentRuntime";
import { warnRemoteContent } from "./remoteContent.shared";
import type { CacheStatusSummary, SyncResult } from "./remoteContent.types";

export { getCachedLesson, getCachedManifest };
export type { LessonMeta, Manifest, SyncResult } from "./remoteContent.types";

export async function syncContent(): Promise<SyncResult> {
  const oldManifest = await getCachedManifest();
  const oldVersion = oldManifest?.content_version ?? null;
  const newManifest = await fetchManifestRemote();

  if (!newManifest) {
    return {
      success: false,
      oldVersion,
      newVersion: null,
      downloaded: [],
      failed: [],
      error: "Failed to fetch manifest",
    };
  }

  const newVersion = newManifest.content_version;
  if (oldVersion === newVersion) {
    return {
      success: true,
      oldVersion,
      newVersion,
      downloaded: [],
      failed: [],
    };
  }

  const lessonsToDownload = await getLessonsToDownload(newManifest.lessons);
  const { success, failed } = await downloadLessonsParallel(lessonsToDownload);

  if (failed.length > 0) {
    warnRemoteContent("Rollback due to lesson download failures", {
      failedCount: failed.length,
      failed,
    });
    return {
      success: false,
      oldVersion,
      newVersion,
      downloaded: success.map((item) => item.id),
      failed,
      error: `Failed to download: ${failed.join(", ")}`,
    };
  }

  try {
    await saveDownloadedContent(newManifest, success);
    logDev(`[RemoteContent] Content updated to v${newVersion}`, {
      oldVersion,
      downloadedCount: success.length,
    });

    return {
      success: true,
      oldVersion,
      newVersion,
      downloaded: success.map((item) => item.id),
      failed: [],
    };
  } catch (error) {
    warnRemoteContent("Failed to save to cache:", error);
    return {
      success: false,
      oldVersion,
      newVersion,
      downloaded: [],
      failed: success.map((item) => item.id),
      error: "Failed to save to cache",
    };
  }
}

export async function clearAllCache(): Promise<void> {
  const removedCount = await clearRemoteContentCache();
  logDev(`[RemoteContent] Cleared ${removedCount} cached items`);
}

export async function getCacheStatus(): Promise<CacheStatusSummary> {
  return getCacheStatusSummary();
}

/** @deprecated Use syncContent() instead */
export async function checkForUpdates(): Promise<boolean> {
  const oldManifest = await getCachedManifest();
  const newManifest = await fetchManifestRemote();
  if (!newManifest) return false;
  return oldManifest?.content_version !== newManifest.content_version;
}

/** @deprecated Use syncContent() instead */
export async function downloadUpdatedLessons(): Promise<{ downloaded: string[]; failed: string[] }> {
  const result = await syncContent();
  return { downloaded: result.downloaded, failed: result.failed };
}
