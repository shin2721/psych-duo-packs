/**
 * Streaks System for Psycle Gamification v1.0
 * 
 * Study streak only:
 * - Study Streak: レッスン完了で継続
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analytics } from './analytics';

const STORAGE_KEY = '@psycle_streaks';

export interface StreakData {
    // Study Streak
    studyStreak: number;
    lastStudyDate: string | null;  // YYYY-MM-DD

    // Freeze
    freezesRemaining: number;
    freezeWeekStart: string | null;  // 週初めの日付

    // XP
    totalXP: number;
    todayXP: number;
    xpDate: string | null;  // XPが加算された日付
}

export type StudyRiskType = 'safe_today' | 'at_risk' | 'inactive';

export interface StudyRiskStatus {
    riskType: StudyRiskType;
    todayStudied: boolean;
    studyStreak: number;
    lastStudyDate: string | null;
    daysSinceStudy: number | null;
}

const DEFAULT_STATE: StreakData = {
    studyStreak: 0,
    lastStudyDate: null,
    freezesRemaining: 2,
    freezeWeekStart: null,
    totalXP: 0,
    todayXP: 0,
    xpDate: null,
};

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

function trackStreakLost(
    previousStreak: number,
    gapDays: number,
    freezesRemaining: number,
    freezesNeeded: number
): void {
    if (previousStreak <= 0 || gapDays <= 0) return;

    Analytics.track('streak_lost', {
        streakType: 'study',
        previousStreak,
        gapDays,
        freezesRemaining,
        freezesNeeded,
    });

    if (__DEV__) {
        console.log('[Analytics] streak_lost', {
            streakType: 'study',
            previousStreak,
            gapDays,
            freezesRemaining,
            freezesNeeded,
        });
    }
}

export async function getStreakData(): Promise<StreakData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_STATE };

        const parsed = JSON.parse(raw) as Partial<StreakData>;
        const data: StreakData = {
            ...DEFAULT_STATE,
            ...parsed,
        };

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

export function getStudyRiskStatusFromData(
    data: Pick<StreakData, 'studyStreak' | 'lastStudyDate'>,
    now: Date = new Date()
): StudyRiskStatus {
    const today = dateKey(now);
    const lastStudyDate = data.lastStudyDate;
    const todayStudied = lastStudyDate === today;

    if (!lastStudyDate) {
        return {
            riskType: 'inactive',
            todayStudied: false,
            studyStreak: data.studyStreak,
            lastStudyDate: null,
            daysSinceStudy: null,
        };
    }

    const daysSinceStudy = Math.max(0, dateKeyToUtcDay(today) - dateKeyToUtcDay(lastStudyDate));
    const riskType: StudyRiskType = todayStudied ? 'safe_today' : 'at_risk';

    return {
        riskType,
        todayStudied,
        studyStreak: data.studyStreak,
        lastStudyDate,
        daysSinceStudy,
    };
}

export async function getStudyRiskStatus(now: Date = new Date()): Promise<StudyRiskStatus> {
    const data = await getStreakData();
    return getStudyRiskStatusFromData(data, now);
}

async function saveStreakData(data: StreakData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Study Streakを更新（レッスン完了時に呼ぶ）
 */
export async function recordStudyCompletion(): Promise<StreakData> {
    const data = await getStreakData();
    const today = getToday();
    const previousStreak = data.studyStreak;
    const previousLastStudyDate = data.lastStudyDate;

    if (data.lastStudyDate === today) {
        // 今日すでに記録済み
        return data;
    }

    // ローカル時間で昨日の日付を取得
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${year}-${month}-${day}`;

    if (data.lastStudyDate === yesterdayStr) {
        // 昨日やっていた → 継続
        data.studyStreak++;
    } else if (data.lastStudyDate !== today) {
        // 途切れた → 1からスタート（Study Streakのみ運用）
        if (previousLastStudyDate) {
            const diffDays = dateKeyToUtcDay(today) - dateKeyToUtcDay(previousLastStudyDate);
            const gapDays = Math.max(0, diffDays - 1);
            trackStreakLost(previousStreak, gapDays, data.freezesRemaining, gapDays);
        }
        data.studyStreak = 1;
    }

    data.lastStudyDate = today;
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
    get FELT_BETTER_POSITIVE() { return getXpRewards().felt_better_positive; },
};
