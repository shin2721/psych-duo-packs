/**
 * Streaks System for Psycle Gamification v1.0
 * 
 * Two streaks:
 * - Study Streak: レッスン完了で継続
 * - Action Streak: executed で継続（主役）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncWidgetStudyData } from './widgetSync';

const STORAGE_KEY = '@psycle_streaks';

export interface StreakData {
    // Study Streak
    studyStreak: number;
    lastStudyDate: string | null;  // YYYY-MM-DD
    // Daily history (for calendar / widgets)
    studyHistory: Record<string, { lessonsCompleted: number; xp: number }>;

    // Action Streak (主役)
    actionStreak: number;
    lastActionDate: string | null;  // YYYY-MM-DD

    // Recovery Mission
    recoveryLastShownDate: string | null;
    recoveryLastClaimedDate: string | null;

    // Freeze
    freezesRemaining: number;
    freezeWeekStart: string | null;  // 週初めの日付

    // XP
    totalXP: number;
    todayXP: number;
    xpDate: string | null;  // XPが加算された日付
}

const DEFAULT_STATE: StreakData = {
    studyStreak: 0,
    lastStudyDate: null,
    studyHistory: {},
    actionStreak: 0,
    lastActionDate: null,
    recoveryLastShownDate: null,
    recoveryLastClaimedDate: null,
    freezesRemaining: 2,
    freezeWeekStart: null,
    totalXP: 0,
    todayXP: 0,
    xpDate: null,
};

export interface RecoveryMissionStatus {
    eligible: boolean;
    missedDays: number;
    lastActionDate: string | null;
    actionStreak: number;
    shownToday: boolean;
    claimedToday: boolean;
}

export interface RecoveryMissionClaimResult {
    claimed: boolean;
    missedDays: number;
    actionStreakAfter: number;
    lastActionDate: string | null;
}

/**
 * ローカル時間で日付キーを取得（YYYY-MM-DD）
 * UTCだと日本時間で朝9時が境界になる問題を回避
 * プロジェクト全体でこの関数を使うこと
 */
export function dateKey(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getToday(): string {
    return dateKey();
}

function pruneStudyHistory(
    history: Record<string, { lessonsCompleted: number; xp: number }>,
    keepDays = 45
): Record<string, { lessonsCompleted: number; xp: number }> {
    const todayDay = dateKeyToUtcDay(getToday());
    const pruned: Record<string, { lessonsCompleted: number; xp: number }> = {};

    for (const [date, value] of Object.entries(history)) {
        const diff = todayDay - dateKeyToUtcDay(date);
        if (diff >= 0 && diff <= keepDays) {
            pruned[date] = value;
        }
    }

    return pruned;
}

function buildRecentWidgetDays(
    history: Record<string, { lessonsCompleted: number; xp: number }>,
    days = 14
): Array<{ date: string; lessonsCompleted: number; xp: number }> {
    const list: Array<{ date: string; lessonsCompleted: number; xp: number }> = [];
    const todayUtcDay = dateKeyToUtcDay(getToday());
    for (let i = days - 1; i >= 0; i--) {
        const dayKey = utcNumberToDateKey(todayUtcDay - i);
        const value = history[dayKey] || { lessonsCompleted: 0, xp: 0 };
        list.push({
            date: dayKey,
            lessonsCompleted: value.lessonsCompleted || 0,
            xp: value.xp || 0,
        });
    }
    return list;
}

function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    // ローカル時間で週開始日を取得
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
}

/**
 * 日付キー(YYYY-MM-DD)をUTC通し日に変換（堅牢な日付差分計算用）
 * new Date("YYYY-MM-DD")の環境依存問題を回避
 */
function dateKeyToUtcDay(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    // UTCの通し日（1970-01-01からの日数）
    return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
}

function utcNumberToDateKey(utcDay: number): string {
    const d = new Date(utcDay * 24 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function calculateMissedDays(lastActionDate: string | null, today: string): number {
    if (!lastActionDate) return 0;
    const diffDays = dateKeyToUtcDay(today) - dateKeyToUtcDay(lastActionDate);
    if (diffDays <= 1) return 0;
    return diffDays - 1;
}

function toRecoveryMissionStatus(data: StreakData, today = getToday()): RecoveryMissionStatus {
    const missedDays = calculateMissedDays(data.lastActionDate, today);
    const claimedToday = data.recoveryLastClaimedDate === today;
    const shownToday = data.recoveryLastShownDate === today;
    return {
        eligible: Boolean(data.lastActionDate) && missedDays >= 1 && !claimedToday,
        missedDays,
        lastActionDate: data.lastActionDate,
        actionStreak: data.actionStreak || 0,
        shownToday,
        claimedToday,
    };
}

export async function getStreakData(): Promise<StreakData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_STATE };

        const data = JSON.parse(raw) as StreakData;
        data.studyHistory = pruneStudyHistory(data.studyHistory || {});
        data.recoveryLastShownDate = data.recoveryLastShownDate || null;
        data.recoveryLastClaimedDate = data.recoveryLastClaimedDate || null;

        // 週が変わったらfreezeを最低weekly_refillに補充（購入分は消さない）
        const currentWeekStart = getWeekStart(new Date());
        if (data.freezeWeekStart !== currentWeekStart) {
            const weeklyRefill = getFreezeConfig().weekly_refill;
            data.freezesRemaining = Math.max(data.freezesRemaining || 0, weeklyRefill);
            data.freezeWeekStart = currentWeekStart;
        }

        // 日が変わったらtodayXPをリセット
        const today = getToday();
        if (data.xpDate !== today) {
            data.todayXP = 0;
            data.xpDate = today;
        }

        return data;
    } catch {
        return { ...DEFAULT_STATE };
    }
}

export async function getRecoveryMissionStatus(): Promise<RecoveryMissionStatus> {
    const data = await getStreakData();
    return toRecoveryMissionStatus(data);
}

export async function markRecoveryMissionShown(): Promise<RecoveryMissionStatus> {
    const data = await getStreakData();
    const today = getToday();
    const status = toRecoveryMissionStatus(data, today);
    if (!status.eligible || status.shownToday) {
        return status;
    }

    data.recoveryLastShownDate = today;
    await saveStreakData(data);
    return toRecoveryMissionStatus(data, today);
}

export async function claimRecoveryMissionIfEligible(
    lastActionDateBeforeExecution: string | null
): Promise<RecoveryMissionClaimResult> {
    const data = await getStreakData();
    const today = getToday();

    if (data.recoveryLastClaimedDate === today) {
        return {
            claimed: false,
            missedDays: 0,
            actionStreakAfter: data.actionStreak || 0,
            lastActionDate: data.lastActionDate,
        };
    }

    if (!lastActionDateBeforeExecution) {
        return {
            claimed: false,
            missedDays: 0,
            actionStreakAfter: data.actionStreak || 0,
            lastActionDate: data.lastActionDate,
        };
    }

    if (data.lastActionDate !== today) {
        return {
            claimed: false,
            missedDays: 0,
            actionStreakAfter: data.actionStreak || 0,
            lastActionDate: data.lastActionDate,
        };
    }

    const missedDays = calculateMissedDays(lastActionDateBeforeExecution, today);
    if (missedDays < 1) {
        return {
            claimed: false,
            missedDays,
            actionStreakAfter: data.actionStreak || 0,
            lastActionDate: data.lastActionDate,
        };
    }

    data.recoveryLastClaimedDate = today;
    await saveStreakData(data);
    return {
        claimed: true,
        missedDays,
        actionStreakAfter: data.actionStreak || 0,
        lastActionDate: data.lastActionDate,
    };
}

async function saveStreakData(data: StreakData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const today = getToday();
    const todayHistory = data.studyHistory[today] || { lessonsCompleted: 0, xp: 0 };
    syncWidgetStudyData({
        studyStreak: data.studyStreak || 0,
        todayLessons: todayHistory.lessonsCompleted || 0,
        todayXP: todayHistory.xp || 0,
        totalXP: data.totalXP || 0,
        recentDays: buildRecentWidgetDays(data.studyHistory || {}),
        updatedAtMs: Date.now(),
    });
}

/**
 * Study Streakを更新（レッスン完了時に呼ぶ）
 */
export async function recordStudyCompletion(): Promise<StreakData> {
    const data = await getStreakData();
    const today = getToday();
    const firstStudyOfToday = data.lastStudyDate !== today;

    // ローカル時間で昨日の日付を取得
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${year}-${month}-${day}`;

    if (firstStudyOfToday && data.lastStudyDate === yesterdayStr) {
        // 昨日やっていた → 継続
        data.studyStreak++;
    } else if (firstStudyOfToday) {
        // 途切れた → 1からスタート（Study StreakはFreeze対象外 - 行動が主役）
        data.studyStreak = 1;
    }

    if (firstStudyOfToday) {
        data.lastStudyDate = today;
    }

    const todayHistory = data.studyHistory[today] || { lessonsCompleted: 0, xp: 0 };
    data.studyHistory[today] = {
        ...todayHistory,
        lessonsCompleted: todayHistory.lessonsCompleted + 1,
    };
    data.studyHistory = pruneStudyHistory(data.studyHistory);
    await saveStreakData(data);
    return data;
}

/**
 * Action Streakを更新（executed時に呼ぶ）
 */
/**
 * Action Streakを更新（executed時に呼ぶ）
 */
export async function recordActionExecution(): Promise<StreakData> {
    const data = await getStreakData();
    const today = getToday();

    if (data.lastActionDate === today) {
        // 今日すでに記録済み
        return data;
    }

    if (!data.lastActionDate) {
        // 初回
        data.actionStreak = 1;
    } else {
        // 日付差分を計算（dateKeyToUtcDayで堅牢に）
        const diffDays = dateKeyToUtcDay(today) - dateKeyToUtcDay(data.lastActionDate);

        if (diffDays <= 1) {
            // 昨日やっていた（diff=1）または同日（diff=0は上で弾いているはずだが念のため）
            data.actionStreak++;
        } else {
            // 2日以上空いた（diffDays >= 2）
            // 欠勤日数 = diffDays - 1
            const missedDays = diffDays - 1;

            if (data.actionStreak > 0 && data.freezesRemaining >= missedDays) {
                // Freezeで救済
                data.freezesRemaining -= missedDays;
                data.actionStreak++; // 継続扱い
                if (__DEV__) console.log(`[Streak] Used ${missedDays} Freezes to save Action Streak`);
            } else {
                // 足りない → リセット
                data.actionStreak = 1;
            }
        }
    }

    data.lastActionDate = today;
    await saveStreakData(data);
    return data;
}

/**
 * XPを加算
 */
export async function addXP(amount: number): Promise<StreakData> {
    const data = await getStreakData();
    data.totalXP += amount;
    data.todayXP += amount;
    data.xpDate = getToday();
    const today = getToday();
    const todayHistory = data.studyHistory[today] || { lessonsCompleted: 0, xp: 0 };
    data.studyHistory[today] = {
        ...todayHistory,
        xp: todayHistory.xp + amount,
    };
    data.studyHistory = pruneStudyHistory(data.studyHistory);
    await saveStreakData(data);
    return data;
}

/**
 * Freezeを使用（手動使用など）
 */
export async function useFreeze(): Promise<{ success: boolean; data: StreakData }> {
    const data = await getStreakData();
    if (data.freezesRemaining <= 0) {
        return { success: false, data };
    }
    data.freezesRemaining--;
    await saveStreakData(data);
    return { success: true, data };
}

/**
 * Freezeを追加（Shop購入時など）
 */
export async function addFreezes(amount: number): Promise<StreakData> {
    const data = await getStreakData();
    data.freezesRemaining = (data.freezesRemaining || 0) + amount;
    await saveStreakData(data);
    return data;
}

// XP配点定数（config/gamification.jsonから取得）
import { getXpRewards, getFreezeConfig } from './gamificationConfig';

export const XP_REWARDS = {
    get CORRECT_ANSWER() { return getXpRewards().correct_answer; },
    get LESSON_COMPLETE() { return getXpRewards().lesson_complete; },
    get ATTEMPTED() { return getXpRewards().attempted; },
    get EXECUTED() { return getXpRewards().executed; },
    get FELT_BETTER_POSITIVE() { return getXpRewards().felt_better_positive; },
};
