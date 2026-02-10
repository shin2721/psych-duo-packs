// Paywall configuration and gating logic (subscription-only).

export const FREE_TIER_LEVELS = 3; // Levels 1-3 are free for all genres

/**
 * Determines if a lesson is locked based on genre, level, and subscription status.
 * @param genre - Genre ID (e.g., 'mental', 'health')
 * @param level - Lesson level (1-10)
 * @param hasActiveSubscription - Whether an active paid subscription is present
 * @returns true if lesson is locked, false if accessible
 */
export function isLessonLocked(
    genre: string,
    level: number,
    hasActiveSubscription: boolean
): boolean {
    // Mental genre is always free (all levels)
    if (genre === 'mental') {
        return false;
    }

    // First 3 levels are free for all genres
    if (level <= FREE_TIER_LEVELS) {
        return false;
    }

    // Level 4+ requires an active subscription.
    return !hasActiveSubscription;
}

// Paywall表示条件（刺さった後に出す）
export const PAYWALL_THRESHOLDS = {
    executedCount: 1,        // executed 1回達成
    lessonCompleteCount: 3,  // レッスン完了3回
} as const;

/**
 * Paywallを表示してよいかどうかを判定
 * 条件: executed 1回達成 OR レッスン完了3回以上
 * 
 * @param executedCount - これまでのexecuted回数
 * @param lessonCompleteCount - これまでのレッスン完了回数
 * @returns true if paywall should be shown
 */
export function shouldShowPaywall(
    executedCount: number,
    lessonCompleteCount: number
): boolean {
    return (
        executedCount >= PAYWALL_THRESHOLDS.executedCount ||
        lessonCompleteCount >= PAYWALL_THRESHOLDS.lessonCompleteCount
    );
}
