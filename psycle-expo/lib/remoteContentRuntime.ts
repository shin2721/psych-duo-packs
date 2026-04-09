import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import {
  GITHUB_RAW_BASE,
  REMOTE_CONTENT_CONFIG,
  REMOTE_CONTENT_STORAGE_KEYS,
  warnRemoteContent,
} from "./remoteContent.shared";
import type {
  CacheStatusSummary,
  DownloadedLesson,
  LessonMeta,
  Manifest,
} from "./remoteContent.types";

export async function sha256(content: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= REMOTE_CONTENT_CONFIG.RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, REMOTE_CONTENT_CONFIG.TIMEOUT_MS);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < REMOTE_CONTENT_CONFIG.RETRY_COUNT) {
      const delay = REMOTE_CONTENT_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Fetch failed");
}

function addCacheBust(url: string, buster?: string): string {
  const separator = url.includes("?") ? "&" : "?";
  const param = buster ?? `_t=${Date.now()}`;
  return `${url}${separator}${param}`;
}

export async function getCachedManifest(): Promise<Manifest | null> {
  try {
    const cached = await AsyncStorage.getItem(REMOTE_CONTENT_STORAGE_KEYS.MANIFEST);
    if (cached) {
      return JSON.parse(cached) as Manifest;
    }
  } catch (error) {
    warnRemoteContent("Failed to get cached manifest:", error);
  }
  return null;
}

export async function fetchManifestRemote(): Promise<Manifest | null> {
  try {
    const url = addCacheBust(`${GITHUB_RAW_BASE}/psycle-expo/data/manifest.json`);
    const response = await fetchWithRetry(url);
    return (await response.json()) as Manifest;
  } catch (error) {
    warnRemoteContent("Error fetching manifest:", error);
    return null;
  }
}

export async function getCachedLesson(lessonId: string): Promise<Record<string, unknown> | null> {
  try {
    const cached = await AsyncStorage.getItem(REMOTE_CONTENT_STORAGE_KEYS.LESSON_PREFIX + lessonId);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
  } catch (error) {
    warnRemoteContent(`Failed to get cached lesson ${lessonId}:`, error);
  }
  return null;
}

async function downloadLessonTemp(meta: LessonMeta): Promise<DownloadedLesson | null> {
  try {
    const url = addCacheBust(`${GITHUB_RAW_BASE}/${meta.file}`, `v=${meta.sha256.slice(0, 8)}`);
    const response = await fetchWithRetry(url);
    const content = await response.text();
    const actualHash = await sha256(content);

    if (actualHash !== meta.sha256) {
      warnRemoteContent(`SHA256 mismatch for ${meta.id}`, {
        expected: meta.sha256,
        actual: actualHash,
      });
      return null;
    }

    JSON.parse(content);
    return { id: meta.id, content };
  } catch (error) {
    warnRemoteContent(`Error downloading lesson ${meta.id}:`, error);
    return null;
  }
}

export async function getLessonsToDownload(lessons: LessonMeta[]): Promise<LessonMeta[]> {
  const lessonsToDownload: LessonMeta[] = [];

  for (const meta of lessons) {
    const cached = await AsyncStorage.getItem(REMOTE_CONTENT_STORAGE_KEYS.LESSON_PREFIX + meta.id);
    if (cached) {
      const cachedHash = await sha256(cached);
      if (cachedHash === meta.sha256) {
        continue;
      }
    }
    lessonsToDownload.push(meta);
  }

  return lessonsToDownload;
}

export async function downloadLessonsParallel(
  metas: LessonMeta[]
): Promise<{ success: DownloadedLesson[]; failed: string[] }> {
  const success: DownloadedLesson[] = [];
  const failed: string[] = [];
  const queue = [...metas];
  const inFlight: Promise<void>[] = [];

  while (queue.length > 0 || inFlight.length > 0) {
    while (inFlight.length < REMOTE_CONTENT_CONFIG.MAX_CONCURRENT_DL && queue.length > 0) {
      const meta = queue.shift();
      if (!meta) break;

      const promise = (async () => {
        const result = await downloadLessonTemp(meta);
        if (result) {
          success.push(result);
        } else {
          failed.push(meta.id);
        }
      })();
      inFlight.push(promise);
    }

    if (inFlight.length > 0) {
      await Promise.race(inFlight);
      await Promise.all(inFlight.splice(0));
    }
  }

  return { success, failed };
}

export async function saveDownloadedContent(
  manifest: Manifest,
  downloaded: DownloadedLesson[]
): Promise<void> {
  for (const item of downloaded) {
    await AsyncStorage.setItem(REMOTE_CONTENT_STORAGE_KEYS.LESSON_PREFIX + item.id, item.content);
  }

  await AsyncStorage.setItem(REMOTE_CONTENT_STORAGE_KEYS.MANIFEST, JSON.stringify(manifest));
}

export async function clearRemoteContentCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const psycleKeys = keys.filter((key) => key.startsWith("@psycle/"));
  await AsyncStorage.multiRemove(psycleKeys);
  return psycleKeys.length;
}

export async function getCacheStatusSummary(): Promise<CacheStatusSummary> {
  const manifest = await getCachedManifest();
  const keys = await AsyncStorage.getAllKeys();
  const lessonKeys = keys.filter((key) => key.startsWith(REMOTE_CONTENT_STORAGE_KEYS.LESSON_PREFIX));

  let totalSize = 0;
  for (const key of lessonKeys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      totalSize += value.length;
    }
  }

  return {
    manifestVersion: manifest?.content_version ?? null,
    cachedLessons: lessonKeys.map((key) => key.replace(REMOTE_CONTENT_STORAGE_KEYS.LESSON_PREFIX, "")),
    totalCacheSize: totalSize,
  };
}
