// Paywall configuration and logic for genre-based monetization

export const PACK_PRICING = {
    health: { price: 4.99, name: 'Health Pack', emoji: '💪' },
    work: { price: 4.99, name: 'Work Pack', emoji: '💼' },
    money: { price: 4.99, name: 'Money Pack', emoji: '💰' },
    social: { price: 4.99, name: 'Social Pack', emoji: '👥' },
    study: { price: 4.99, name: 'Study Pack', emoji: '📚' }
} as const;

export type GenreId = keyof typeof PACK_PRICING | 'mental';

export const FREE_TIER_LEVELS = 3; // Levels 1-3 are free for all genres

/**
 * Determines if a lesson is locked based on genre, level, and subscription access.
 * @param genre - Genre ID (e.g., 'mental', 'health')
 * @param level - Lesson level (1-10)
 * @param hasAllAccess - Whether user has Pro/Max style all-access entitlement
 * @returns true if lesson is locked, false if accessible
 */
export function isLessonLocked(
    genre: string,
    level: number,
    hasAllAccess: boolean
): boolean {
    // Mental genre is always free (all levels)
    if (genre === 'mental') {
        return false;
    }

    // First 3 levels are free for all genres
    if (level <= FREE_TIER_LEVELS) {
        return false;
    }

    // Level 4+ requires all-access subscription.
    if (hasAllAccess) {
        return false;
    }

    return true;
}

/**
 * Gets the pack info for a genre
 */
export function getPackInfo(genre: GenreId) {
    if (genre === 'mental') {
        return { price: 0, name: 'Mental Pack (Free)', emoji: '🧠' };
    }
    return PACK_PRICING[genre];
}

/**
 * Gets all available packs for purchase
 */
export function getAvailablePacks() {
    return Object.entries(PACK_PRICING).map(([id, info]) => ({
        id,
        ...info
    }));
}

// Paywall表示条件（刺さった後に出す）
export const PAYWALL_THRESHOLDS = {
    lessonCompleteCount: 3,  // レッスン完了3回
} as const;

/**
 * Paywallを表示してよいかどうかを判定
 * 条件: レッスン完了3回以上
 * 
 * @param lessonCompleteCount - これまでのレッスン完了回数
 * @returns true if paywall should be shown
 */
export function shouldShowPaywall(
    lessonCompleteCount: number
): boolean {
    return lessonCompleteCount >= PAYWALL_THRESHOLDS.lessonCompleteCount;
}

/**
 * Paywall表示までの進捗を取得
 * @returns { canShow: boolean, progress: string }
 */
export function getPaywallProgress(
    lessonCompleteCount: number
): { canShow: boolean; progress: string } {
    const canShow = shouldShowPaywall(lessonCompleteCount);

    if (canShow) {
        return { canShow: true, progress: 'ready' };
    }

    const lessonProgress = `${lessonCompleteCount}/${PAYWALL_THRESHOLDS.lessonCompleteCount} lessons`;

    return { canShow: false, progress: lessonProgress };
}
