/**
 * オンボーディング進捗管理
 * 
 * 初回〜3日目の勝ち体験を追跡
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    FIRST_LESSON_COMPLETE: '@onboarding_first_lesson_complete',
    ONBOARDING_DAY: '@onboarding_day',
} as const;

/**
 * 初回レッスン完了済みかどうか
 */
export async function hasCompletedFirstLesson(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.FIRST_LESSON_COMPLETE);
    return value === 'true';
}

/**
 * 初回レッスン完了をマーク
 */
export async function markFirstLessonComplete(): Promise<void> {
    await AsyncStorage.setItem(KEYS.FIRST_LESSON_COMPLETE, 'true');
}

/**
 * オンボーディング何日目か取得（1-indexed）
 */
export async function getOnboardingDay(): Promise<number> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DAY);
    return value ? parseInt(value, 10) : 1;
}

/**
 * オンボーディング日数を更新
 */
export async function incrementOnboardingDay(): Promise<void> {
    const current = await getOnboardingDay();
    await AsyncStorage.setItem(KEYS.ONBOARDING_DAY, String(current + 1));
}

/**
 * オンボーディング進捗をリセット（デバッグ用）
 */
export async function resetOnboardingProgress(): Promise<void> {
    await AsyncStorage.multiRemove([
        KEYS.FIRST_LESSON_COMPLETE,
        KEYS.ONBOARDING_DAY,
    ]);
}
