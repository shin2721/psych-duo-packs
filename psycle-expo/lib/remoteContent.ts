/**
 * Remote Content Manager
 * 
 * manifest.jsonを取得して、新しいコンテンツをダウンロード・キャッシュ・検証する
 * 
 * 設計原則:
 * - 失敗時は常にロールバック（旧キャッシュで継続）
 * - 部分成功は許容しない（1つでも失敗したら全体を破棄）
 * - キャッシュバストでraw.githubusercontent.comのキャッシュ問題を回避
 * 
 * 使い方:
 * import { syncContent, getCacheStatus } from './remoteContent';
 * 
 * // 起動時に同期（安全にロールバック対応）
 * const result = await syncContent();
 * if (result.success) {
 *   console.log(`Updated to v${result.newVersion}`);
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// ============ 設定 ============

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/shin2721/psych-duo-packs/main';

const CONFIG = {
    TIMEOUT_MS: 10000,         // 10秒タイムアウト
    RETRY_COUNT: 2,            // リトライ回数
    RETRY_DELAY_MS: 1000,      // リトライ間隔（指数バックオフ）
    MAX_CONCURRENT_DL: 2,      // 同時ダウンロード数
};

const STORAGE_KEYS = {
    MANIFEST: '@psycle/manifest',
    PENDING_MANIFEST: '@psycle/pending_manifest',
    LESSON_PREFIX: '@psycle/lesson/',
};

// ============ 型定義 ============

interface LessonMeta {
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

interface Manifest {
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

interface SyncResult {
    success: boolean;
    oldVersion: string | null;
    newVersion: string | null;
    downloaded: string[];
    failed: string[];
    error?: string;
}

// ============ ヘルパー ============

/**
 * SHA256ハッシュを計算
 */
async function sha256(content: string): Promise<string> {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content
    );
}

/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
            },
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * リトライ付きfetch（指数バックオフ）
 */
async function fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= CONFIG.RETRY_COUNT; attempt++) {
        try {
            const response = await fetchWithTimeout(url, CONFIG.TIMEOUT_MS);
            if (response.ok) {
                return response;
            }
            lastError = new Error(`HTTP ${response.status}`);
        } catch (e) {
            lastError = e as Error;
        }

        if (attempt < CONFIG.RETRY_COUNT) {
            const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Fetch failed');
}

/**
 * キャッシュバスト付きURL生成
 */
function addCacheBust(url: string, buster?: string): string {
    const separator = url.includes('?') ? '&' : '?';
    const param = buster || `_t=${Date.now()}`;
    return `${url}${separator}${param}`;
}

// ============ Manifest ============

/**
 * キャッシュされたmanifestを取得
 */
export async function getCachedManifest(): Promise<Manifest | null> {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.MANIFEST);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn('[RemoteContent] Failed to get cached manifest:', e);
    }
    return null;
}

/**
 * リモートからmanifestを取得（保存しない、検証用）
 */
async function fetchManifestRemote(): Promise<Manifest | null> {
    try {
        const url = addCacheBust(`${GITHUB_RAW_BASE}/psycle-expo/data/manifest.json`);
        const response = await fetchWithRetry(url);
        return await response.json();
    } catch (e) {
        console.warn('[RemoteContent] Error fetching manifest:', e);
        return null;
    }
}

// ============ Lesson ============

/**
 * レッスンをキャッシュから取得
 */
export async function getCachedLesson(lessonId: string): Promise<any | null> {
    try {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PREFIX + lessonId);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn(`[RemoteContent] Failed to get cached lesson ${lessonId}:`, e);
    }
    return null;
}

/**
 * レッスンをダウンロードして検証（キャッシュに保存しない、一時的）
 */
async function downloadLessonTemp(meta: LessonMeta): Promise<{ id: string; content: string } | null> {
    try {
        // SHA256の先頭8文字でキャッシュバスト
        const url = addCacheBust(`${GITHUB_RAW_BASE}/${meta.file}`, `v=${meta.sha256.slice(0, 8)}`);
        const response = await fetchWithRetry(url);
        const content = await response.text();

        // SHA256検証
        const actualHash = await sha256(content);
        if (actualHash !== meta.sha256) {
            console.warn(`[RemoteContent] SHA256 mismatch for ${meta.id}:`);
            console.warn(`  Expected: ${meta.sha256}`);
            console.warn(`  Actual:   ${actualHash}`);
            return null;
        }

        // JSONパース検証
        JSON.parse(content);

        return { id: meta.id, content };
    } catch (e) {
        console.warn(`[RemoteContent] Error downloading lesson ${meta.id}:`, e);
        return null;
    }
}

/**
 * 並列ダウンロード（同時接続数制限付き）
 */
async function downloadLessonsParallel(
    metas: LessonMeta[]
): Promise<{ success: Array<{ id: string; content: string }>; failed: string[] }> {
    const success: Array<{ id: string; content: string }> = [];
    const failed: string[] = [];

    // 同時接続数制限のためのセマフォ
    const queue = [...metas];
    const inFlight: Promise<void>[] = [];

    while (queue.length > 0 || inFlight.length > 0) {
        // 空きがあればキューから取り出して開始
        while (inFlight.length < CONFIG.MAX_CONCURRENT_DL && queue.length > 0) {
            const meta = queue.shift()!;
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

        // 1つ完了するまで待機
        if (inFlight.length > 0) {
            await Promise.race(inFlight);
            // 完了したものを除去（簡易実装のため全て待機）
            await Promise.all(inFlight.splice(0));
        }
    }

    return { success, failed };
}

// ============ メイン同期ロジック ============

/**
 * コンテンツを同期する（メインAPI）
 * 
 * 動作:
 * 1. リモートからmanifest取得
 * 2. バージョン比較
 * 3. 差分レッスンをダウンロード
 * 4. 全て成功 → 新manifest + 新レッスンを採用
 * 5. 1つでも失敗 → ロールバック（何も変更しない）
 */
export async function syncContent(): Promise<SyncResult> {
    const oldManifest = await getCachedManifest();
    const oldVersion = oldManifest?.content_version || null;

    // 1. リモートmanifest取得
    const newManifest = await fetchManifestRemote();
    if (!newManifest) {
        return {
            success: false,
            oldVersion,
            newVersion: null,
            downloaded: [],
            failed: [],
            error: 'Failed to fetch manifest',
        };
    }

    const newVersion = newManifest.content_version;

    // 2. バージョン比較（変更なければスキップ）
    if (oldVersion === newVersion) {
        console.log('[RemoteContent] Already up to date');
        return {
            success: true,
            oldVersion,
            newVersion,
            downloaded: [],
            failed: [],
        };
    }

    console.log(`[RemoteContent] Update available: ${oldVersion} -> ${newVersion}`);

    // 3. 変更があったレッスンを特定
    const lessonsToDownload: LessonMeta[] = [];
    for (const meta of newManifest.lessons) {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PREFIX + meta.id);
        if (cached) {
            const cachedHash = await sha256(cached);
            if (cachedHash === meta.sha256) {
                continue; // 変更なし
            }
        }
        lessonsToDownload.push(meta);
    }

    console.log(`[RemoteContent] Lessons to download: ${lessonsToDownload.length}`);

    // 4. ダウンロード（並列、同時接続数制限付き）
    const { success, failed } = await downloadLessonsParallel(lessonsToDownload);

    // 5. 1つでも失敗 → ロールバック
    if (failed.length > 0) {
        console.warn(`[RemoteContent] ROLLBACK: ${failed.length} lessons failed`);
        return {
            success: false,
            oldVersion,
            newVersion,
            downloaded: success.map(s => s.id),
            failed,
            error: `Failed to download: ${failed.join(', ')}`,
        };
    }

    // 6. 全て成功 → コミット（キャッシュに保存）
    try {
        // レッスンを保存
        for (const item of success) {
            await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PREFIX + item.id, item.content);
        }

        // manifestを保存
        await AsyncStorage.setItem(STORAGE_KEYS.MANIFEST, JSON.stringify(newManifest));

        console.log(`[RemoteContent] Successfully updated to v${newVersion}`);
        return {
            success: true,
            oldVersion,
            newVersion,
            downloaded: success.map(s => s.id),
            failed: [],
        };
    } catch (e) {
        console.error('[RemoteContent] Failed to save to cache:', e);
        return {
            success: false,
            oldVersion,
            newVersion,
            downloaded: [],
            failed: success.map(s => s.id),
            error: 'Failed to save to cache',
        };
    }
}

/**
 * 全レッスンのキャッシュをクリア
 */
export async function clearAllCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const psycleKeys = keys.filter(k => k.startsWith('@psycle/'));
    await AsyncStorage.multiRemove(psycleKeys);
    console.log(`[RemoteContent] Cleared ${psycleKeys.length} cached items`);
}

// ============ 状態 ============

/**
 * キャッシュ状態のサマリーを取得
 */
export async function getCacheStatus(): Promise<{
    manifestVersion: string | null;
    cachedLessons: string[];
    totalCacheSize: number;
}> {
    const manifest = await getCachedManifest();
    const keys = await AsyncStorage.getAllKeys();
    const lessonKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.LESSON_PREFIX));

    let totalSize = 0;
    for (const key of lessonKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
            totalSize += value.length;
        }
    }

    return {
        manifestVersion: manifest?.content_version || null,
        cachedLessons: lessonKeys.map(k => k.replace(STORAGE_KEYS.LESSON_PREFIX, '')),
        totalCacheSize: totalSize,
    };
}

// ============ 後方互換 ============

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
