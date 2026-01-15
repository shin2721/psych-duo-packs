/**
 * Focus System for Psycle Gamification v1.0
 * 
 * ソフト制限（やりすぎ防止）
 * - 最大25
 * - レッスン開始で-1
 * - 時間回復（1時間で+1）
 * - 0でも復習はできる（止めない）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFocusConfig } from './gamificationConfig';

const STORAGE_KEY = '@psycle_focus';

export interface FocusData {
    current: number;
    max: number;
    lastUpdate: string;  // ISO timestamp
}

// Default state uses config values
function getDefaultState(): FocusData {
    const focusConfig = getFocusConfig();
    return {
        current: focusConfig.max,
        max: focusConfig.max,
        lastUpdate: new Date().toISOString(),
    };
}

const RECOVERY_RATE_MS = 60 * 60 * 1000;  // 1時間で+1

export async function getFocusData(): Promise<FocusData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultState();

        const data = JSON.parse(raw) as FocusData;

        // 時間経過による回復を計算
        const now = new Date().getTime();
        const lastUpdate = new Date(data.lastUpdate).getTime();
        const elapsed = now - lastUpdate;
        const recovery = Math.floor(elapsed / RECOVERY_RATE_MS);

        if (recovery > 0 && data.current < data.max) {
            data.current = Math.min(data.current + recovery, data.max);
            data.lastUpdate = new Date().toISOString();
            await saveFocusData(data);
        }

        return data;
    } catch {
        return getDefaultState();
    }
}

async function saveFocusData(data: FocusData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * レッスン開始時にFocusを消費
 * @returns true if enough focus, false if not (but don't block)
 */
export async function consumeFocus(amount: number = 1): Promise<{ success: boolean; remaining: number }> {
    const data = await getFocusData();

    if (data.current >= amount) {
        data.current -= amount;
        data.lastUpdate = new Date().toISOString();
        await saveFocusData(data);
        return { success: true, remaining: data.current };
    }

    // Focusが足りなくても止めない（ソフト制限）
    return { success: false, remaining: data.current };
}

/**
 * 復習完了でFocusを回復
 */
export async function recoverFocus(amount: number = 1): Promise<FocusData> {
    const data = await getFocusData();
    data.current = Math.min(data.current + amount, data.max);
    data.lastUpdate = new Date().toISOString();
    await saveFocusData(data);
    return data;
}

/**
 * 次の回復までの時間（ms）を取得
 */
export async function getTimeToNextRecovery(): Promise<number | null> {
    const data = await getFocusData();
    if (data.current >= data.max) return null;

    const now = new Date().getTime();
    const lastUpdate = new Date(data.lastUpdate).getTime();
    const elapsed = now - lastUpdate;
    const remaining = RECOVERY_RATE_MS - (elapsed % RECOVERY_RATE_MS);

    return remaining;
}
