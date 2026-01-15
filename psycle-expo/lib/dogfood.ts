// Dogfooding Log - Minimal self-tracking for intervention effectiveness (Active Phase)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dateKey } from "./streaks";

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
        console.warn("[Dogfood] Failed to read log:", e);
    }
    return {
        schemaVersion: DOGFOOD_SCHEMA_VERSION,
        buildId: BUILD_ID,
        entries: [],
        last_updated: new Date().toISOString()
    };
}

// Log lesson completion with usability response
export async function logLessonCompletion(
    lesson_id: string,
    usability_response: "yes" | "no" | "unsure"
): Promise<void> {
    const log = await getDogfoodLog();

    const today = dateKey();
    let entry = log.entries.find(
        e => e.lesson_id === lesson_id && e.date_key === today
    );

    if (!entry) {
        entry = {
            lesson_id,
            date_key: today,
            timestamp: new Date().toISOString(),
            meta: { buildId: BUILD_ID, schemaVersion: DOGFOOD_SCHEMA_VERSION },
            usability_response: null,
            interventions_tried: []
        };
        log.entries.push(entry);
    }

    entry.usability_response = usability_response;
    log.last_updated = new Date().toISOString();

    try {
        await AsyncStorage.setItem(DOGFOOD_LOG_KEY, JSON.stringify(log));
        if (__DEV__) console.log("[Dogfood] Logged lesson completion:", lesson_id, usability_response);
    } catch (e) {
        console.warn("[Dogfood] Failed to save log:", e);
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

    const today = dateKey();
    let entry = log.entries.find(
        e => e.lesson_id === lesson_id && e.date_key === today
    );

    if (!entry) {
        entry = {
            lesson_id,
            date_key: today,
            timestamp: new Date().toISOString(),
            meta: { buildId: BUILD_ID, schemaVersion: DOGFOOD_SCHEMA_VERSION },
            usability_response: null,
            interventions_tried: []
        };
        log.entries.push(entry);
    }

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
        if (__DEV__) console.log("[Dogfood] Logged intervention:", intervention_id, type);
    } catch (e) {
        console.warn("[Dogfood] Failed to save log:", e);
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
        if (__DEV__) console.warn("[Dogfood] No entry found for felt_better");
        return;
    }

    const existing = entry.interventions_tried.find(i => i.intervention_id === intervention_id);
    if (!existing) {
        if (__DEV__) console.warn("[Dogfood] No intervention found for felt_better");
        return;
    }

    existing.felt_better_now = felt_better;
    log.last_updated = new Date().toISOString();

    try {
        await AsyncStorage.setItem(DOGFOOD_LOG_KEY, JSON.stringify(log));
        if (__DEV__) console.log("[Dogfood] Logged felt_better:", intervention_id, felt_better);
    } catch (e) {
        console.warn("[Dogfood] Failed to save felt_better:", e);
    }
}

// Get summary stats for dogfooding analysis
export async function getDogfoodSummary(): Promise<{
    total_lessons: number;
    usability: { yes: number; no: number; unsure: number };
    interventions: { total_shown: number; total_attempted: number; total_executed: number; attempt_rate: string; execute_rate: string };
}> {
    const log = await getDogfoodLog();

    const usability = { yes: 0, no: 0, unsure: 0 };
    let totalShown = 0;
    let totalAttempted = 0;
    let totalExecuted = 0;

    for (const entry of log.entries) {
        if (entry.usability_response === "yes") usability.yes++;
        else if (entry.usability_response === "no") usability.no++;
        else if (entry.usability_response === "unsure") usability.unsure++;

        for (const i of entry.interventions_tried) {
            // 後方互換: boolean(true)は1として扱う
            const shownVal = typeof i.shown === 'boolean' ? (i.shown ? 1 : 0) : (i.shown || 0);
            const attemptedVal = typeof i.attempted === 'boolean' ? (i.attempted ? 1 : 0) : (i.attempted || 0);
            const executedVal = typeof i.executed === 'boolean' ? (i.executed ? 1 : 0) : (i.executed || 0);

            totalShown += shownVal;
            totalAttempted += attemptedVal;
            totalExecuted += executedVal;
        }
    }

    return {
        total_lessons: log.entries.length,
        usability,
        interventions: {
            total_shown: totalShown,
            total_attempted: totalAttempted,
            total_executed: totalExecuted,
            attempt_rate: totalShown > 0
                ? `${Math.round((totalAttempted / totalShown) * 100)}%`
                : "N/A",
            execute_rate: totalAttempted > 0
                ? `${Math.round((totalExecuted / totalAttempted) * 100)}%`
                : "N/A"
        }
    };
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
            const shownVal = typeof i.shown === 'boolean' ? (i.shown ? 1 : 0) : (i.shown || 0);
            const attemptedVal = typeof i.attempted === 'boolean' ? (i.attempted ? 1 : 0) : (i.attempted || 0);
            const executedVal = typeof i.executed === 'boolean' ? (i.executed ? 1 : 0) : (i.executed || 0);

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

    // Calculate rates and averages
    for (const id of Object.keys(stats)) {
        const s = stats[id];
        s.attempt_rate = s.shown > 0 ? Math.round((s.attempted / s.shown) * 100) : 0;
        s.execute_rate = s.attempted > 0 ? Math.round((s.executed / s.attempted) * 100) : 0;
        s.felt_better_avg = s.felt_better_count > 0
            ? Math.round((s.felt_better_sum / s.felt_better_count) * 100) / 100
            : 0;
    }

    return stats;
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

    // Build structured output
    const byIntervention: Record<string, any> = {};
    const byLesson: Record<string, { shown: number; attempted: number; executed: number }> = {};

    // 1. Intervention-level stats (for winners extraction)
    for (const [id, stats] of Object.entries(interventionStats)) {
        byIntervention[id] = stats;
    }

    // 2. Lesson-level aggregates (for score adjustment)
    // 定義：「介入に触れたセッション数」（1レッスンに複数介入があっても shown=1）
    for (const entry of log.entries) {
        // Extract domain from lesson_id (e.g., mental_l01 -> mental)
        const match = entry.lesson_id.match(/^([a-z]+)_/);
        if (!match) continue;
        const domain = match[1];

        // Build the key that batch_critic expects
        const key = `${domain}_units/${entry.lesson_id}.ja.json`;

        if (!byLesson[key]) {
            byLesson[key] = { shown: 0, attempted: 0, executed: 0 };
        }

        // セッション単位：このセッションで介入に触れたか？（1 or 0）
        let sessionHadShown = false;
        let sessionHadAttempted = false;
        let sessionHadExecuted = false;

        for (const i of entry.interventions_tried) {
            const shownVal = typeof i.shown === 'boolean' ? (i.shown ? 1 : 0) : (i.shown || 0);
            const attemptedVal = typeof i.attempted === 'boolean' ? (i.attempted ? 1 : 0) : (i.attempted || 0);
            const executedVal = typeof i.executed === 'boolean' ? (i.executed ? 1 : 0) : (i.executed || 0);

            if (shownVal > 0) sessionHadShown = true;
            if (attemptedVal > 0) sessionHadAttempted = true;
            if (executedVal > 0) sessionHadExecuted = true;
        }

        // セッション数としてカウント（1レッスン複数介入でも1回）
        if (sessionHadShown) byLesson[key].shown++;
        if (sessionHadAttempted) byLesson[key].attempted++;
        if (sessionHadExecuted) byLesson[key].executed++;
    }

    // Build final output with namespaces + backward compat + metadata
    const output: Record<string, any> = {
        // メタデータ（スキーマ変更時の安全な分岐用）
        _meta: {
            schema_version: "2.0",  // 1.0: flat, 2.0: namespaced
            exported_at: new Date().toISOString(),
            entry_count: log.entries.length,
        },
        byIntervention,
        byLesson,
    };

    // 後方互換: トップレベルにも配置
    for (const [id, stats] of Object.entries(byIntervention)) {
        output[id] = stats;
    }
    for (const [key, stats] of Object.entries(byLesson)) {
        output[key] = stats;
    }

    return JSON.stringify(output, null, 2);
}
