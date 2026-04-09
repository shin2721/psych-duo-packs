// Dogfooding Log - Minimal self-tracking for intervention effectiveness (Active Phase)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logDev, warnDev } from "./devLog";
import { dateKey } from "./streaks";
import {
    createEmptyDogfoodLog,
    finalizeInterventionStats,
    getOrCreateDogfoodEntry,
    normalizeInteractionCount,
} from "./dogfoodHelpers";
import {
    buildDogfoodSummary,
    buildExportableDogfoodJson,
} from "./dogfoodExport";

const DOGFOOD_LOG_KEY = "dogfooding_log";

// ログのバージョン管理（データ収集時の仕様判別用）
export const DOGFOOD_SCHEMA_VERSION = 1;  // 仕様変更時にインクリメント
export const BUILD_ID = "1.0.0+gamification1";  // version + 手動suffix

// セッション内で既にshownをログしたquestionId（二重カウント防止）
const shownThisSession = new Set<string>();

// セッションリセット（アプリ再起動時に自動リセット）
export function resetSessionTracking(): void {
    shownThisSession.clear();
}

// セッション内で既にshownログ済みかチェック
export function hasLoggedShownThisSession(questionId: string): boolean {
    return shownThisSession.has(questionId);
}

// セッション内shownログ済みとしてマーク
export function markShownLogged(questionId: string): void {
    shownThisSession.add(questionId);
}

export interface DogfoodEntry {
    lesson_id: string;
    date_key: string;        // ローカル日付(YYYY-MM-DD) - 同日判定用
    timestamp: string;       // UTC ISO timestamp - 精密な時刻用
    meta: {                  // entry単位のビルド情報
        buildId: string;
        schemaVersion: number;
    };
    usability_response: "yes" | "no" | "unsure" | null;
    interventions_tried: {
        intervention_id: string;
        variant: {
            id: string;      // Fixed ID for analysis
            label: string;   // Display label
        };
        shown: number;      // カウンタ（表示回数）
        attempted: number;  // カウンタ（試行回数）
        executed: number;   // カウンタ（実行回数）
        felt_better_now?: -2 | -1 | 0 | 1 | 2;  // 効果感（悪化〜改善）
    }[];
}

export interface DogfoodLog {
    schemaVersion: number;  // ログ仕様バージョン
    buildId: string;        // ビルド識別子
    entries: DogfoodEntry[];
    last_updated: string;
}

// Get current log
export async function getDogfoodLog(): Promise<DogfoodLog> {
    try {
        const raw = await AsyncStorage.getItem(DOGFOOD_LOG_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // 既存データにschemaVersion/buildIdがなければ追加
            return {
                schemaVersion: parsed.schemaVersion ?? DOGFOOD_SCHEMA_VERSION,
                buildId: parsed.buildId ?? BUILD_ID,
                entries: parsed.entries ?? [],
                last_updated: parsed.last_updated ?? new Date().toISOString(),
            };
        }
    } catch (e) {
        warnDev("[Dogfood] Failed to read log:", e);
    }
    return createEmptyDogfoodLog(DOGFOOD_SCHEMA_VERSION, BUILD_ID);
}

// Log lesson completion with usability response
export async function logLessonCompletion(
    lesson_id: string,
    usability_response: "yes" | "no" | "unsure"
): Promise<void> {
    const log = await getDogfoodLog();
    const entry = getOrCreateDogfoodEntry(
        log,
        lesson_id,
        BUILD_ID,
        DOGFOOD_SCHEMA_VERSION
    );

    entry.usability_response = usability_response;
    log.last_updated = new Date().toISOString();

    try {
        await AsyncStorage.setItem(DOGFOOD_LOG_KEY, JSON.stringify(log));
        logDev("[Dogfood] Logged lesson completion", {
            lessonId: lesson_id,
            usabilityResponse: usability_response,
        });
    } catch (e) {
        warnDev("[Dogfood] Failed to save log:", e);
    }
}

// Log intervention interaction (shown / attempted / executed)
export async function logInterventionInteraction(
    lesson_id: string,
    intervention_id: string,
    variant: { id: string; label: string },
    type: "shown" | "attempted" | "executed"
): Promise<void> {
    const log = await getDogfoodLog();
    const entry = getOrCreateDogfoodEntry(
        log,
        lesson_id,
        BUILD_ID,
        DOGFOOD_SCHEMA_VERSION
    );

    // Add or update intervention
    let existing = entry.interventions_tried.find(i => i.intervention_id === intervention_id);
    if (!existing) {
        existing = {
            intervention_id,
            variant, // Store variant info
            shown: 0,
            attempted: 0,
            executed: 0
        };
        entry.interventions_tried.push(existing);
    }

    // インクリメント（カウンタ）
    if (type === "shown") existing.shown++;
    if (type === "attempted") existing.attempted++;
    if (type === "executed") existing.executed++;

    log.last_updated = new Date().toISOString();

    try {
        await AsyncStorage.setItem(DOGFOOD_LOG_KEY, JSON.stringify(log));
        logDev("[Dogfood] Logged intervention", {
            interventionId: intervention_id,
            type,
        });
    } catch (e) {
        warnDev("[Dogfood] Failed to save log:", e);
    }
}

// Log felt_better after executing an intervention
export async function logFeltBetter(
    lesson_id: string,
    intervention_id: string,
    felt_better: -2 | -1 | 0 | 1 | 2
): Promise<void> {
    const log = await getDogfoodLog();

    const today = dateKey();
    const entry = log.entries.find(
        e => e.lesson_id === lesson_id && e.date_key === today
    );

    if (!entry) {
        warnDev("[Dogfood] No entry found for felt_better");
        return;
    }

    const existing = entry.interventions_tried.find(i => i.intervention_id === intervention_id);
    if (!existing) {
        warnDev("[Dogfood] No intervention found for felt_better");
        return;
    }

    existing.felt_better_now = felt_better;
    log.last_updated = new Date().toISOString();

    try {
        await AsyncStorage.setItem(DOGFOOD_LOG_KEY, JSON.stringify(log));
        logDev("[Dogfood] Logged felt_better", {
            interventionId: intervention_id,
            feltBetter: felt_better,
        });
    } catch (e) {
        warnDev("[Dogfood] Failed to save felt_better:", e);
    }
}

// Get summary stats for dogfooding analysis
export async function getDogfoodSummary(): Promise<{
    total_lessons: number;
    usability: { yes: number; no: number; unsure: number };
    interventions: { total_shown: number; total_attempted: number; total_executed: number; attempt_rate: string; execute_rate: string };
}> {
    const log = await getDogfoodLog();
    return buildDogfoodSummary(log);
}

// Export intervention-level stats for Phase 9 analysis
// Output format: { "intervention_id": { shown, attempted, executed, felt_better_avg, variant_breakdown } }
export interface InterventionStats {
    shown: number;
    attempted: number;
    executed: number;
    felt_better_count: number;  // Number of felt_better responses
    felt_better_sum: number;    // Sum of felt_better values
    felt_better_avg: number;    // Average (-2 to +2)
    attempt_rate: number;
    execute_rate: number;
    variant_breakdown: Record<string, { shown: number; attempted: number; executed: number }>;
}

interface LessonAggregateStats {
    shown: number;
    attempted: number;
    executed: number;
}

type ExportableDogfoodJson = {
    _meta: {
        schema_version: string;
        exported_at: string;
        entry_count: number;
    };
    byIntervention: Record<string, InterventionStats>;
    byLesson: Record<string, LessonAggregateStats>;
} & Record<string, unknown>;

export async function exportInterventionStats(): Promise<Record<string, InterventionStats>> {
    const log = await getDogfoodLog();
    const stats: Record<string, InterventionStats> = {};

    for (const entry of log.entries) {
        for (const i of entry.interventions_tried) {
            const id = i.intervention_id;

            if (!stats[id]) {
                stats[id] = {
                    shown: 0,
                    attempted: 0,
                    executed: 0,
                    felt_better_count: 0,
                    felt_better_sum: 0,
                    felt_better_avg: 0,
                    attempt_rate: 0,
                    execute_rate: 0,
                    variant_breakdown: {}
                };
            }

            // 後方互換: boolean(true)は1として扱う
            const shownVal = normalizeInteractionCount(i.shown);
            const attemptedVal = normalizeInteractionCount(i.attempted);
            const executedVal = normalizeInteractionCount(i.executed);

            stats[id].shown += shownVal;
            stats[id].attempted += attemptedVal;
            stats[id].executed += executedVal;

            // Track felt_better
            if (i.felt_better_now !== undefined) {
                stats[id].felt_better_count++;
                stats[id].felt_better_sum += i.felt_better_now;
            }

            // Track by variant
            const variantId = i.variant?.id || "default";
            if (!stats[id].variant_breakdown[variantId]) {
                stats[id].variant_breakdown[variantId] = { shown: 0, attempted: 0, executed: 0 };
            }
            stats[id].variant_breakdown[variantId].shown += shownVal;
            stats[id].variant_breakdown[variantId].attempted += attemptedVal;
            stats[id].variant_breakdown[variantId].executed += executedVal;
        }
    }

    return finalizeInterventionStats(stats);
}

// Get JSON string for clipboard export (feedback.json format)
// batch_critic.ts expects:
// - "domain/file.json" keys for lesson-level score adjustment
// - intervention_id keys for winners extraction
//
// 出力形式:
// {
//   "byIntervention": { "mental_l01_004": {...} },
//   "byLesson": { "mental_units/mental_l01.ja.json": {...} },
//   // 後方互換: トップレベルにも同じキーを配置
//   "mental_l01_004": {...},
//   "mental_units/mental_l01.ja.json": {...}
// }
export async function getExportableJSON(): Promise<string> {
    const log = await getDogfoodLog();
    const interventionStats = await exportInterventionStats();
    return buildExportableDogfoodJson({
        entryCount: log.entries.length,
        interventionStats,
        log,
    });
}
