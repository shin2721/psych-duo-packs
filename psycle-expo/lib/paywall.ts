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
 * Determines if a lesson is locked based on genre, level, and purchased packs
 * @param genre - Genre ID (e.g., 'mental', 'health')
 * @param level - Lesson level (1-10)
 * @param purchasedPacks - Set of purchased genre IDs
 * @returns true if lesson is locked, false if accessible
 */
export function isLessonLocked(
    genre: string,
    level: number,
    purchasedPacks: Set<string>
): boolean {
    // Mental genre is always free (all levels)
    if (genre === 'mental') {
        return false;
    }

    // First 3 levels are free for all genres
    if (level <= FREE_TIER_LEVELS) {
        return false;
    }

    // Level 4+ requires pack purchase or Pro subscription
    if (purchasedPacks.has(genre)) {
        return false;
    }

    // Check if user has Pro/Max plan (in entitlement context, we pass purchasedPacks but usually logic is external)
    // However, this function signature only takes purchasedPacks string set.
    // We need to check if 'pro' access unlocks everything.
    // Since we can't access planId here directly without changing signature,
    // we assume the caller handles this OR we check if "all_access" is in purchasedPacks (special flag).

    return !purchasedPacks.has(genre) && !purchasedPacks.has("all_access");
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

/**
 * Paywall表示までの進捗を取得
 * @returns { canShow: boolean, progress: string }
 */
export function getPaywallProgress(
    executedCount: number,
    lessonCompleteCount: number
): { canShow: boolean; progress: string } {
    const canShow = shouldShowPaywall(executedCount, lessonCompleteCount);

    if (canShow) {
        return { canShow: true, progress: 'ready' };
    }

    const execProgress = `${executedCount}/${PAYWALL_THRESHOLDS.executedCount} executed`;
    const lessonProgress = `${lessonCompleteCount}/${PAYWALL_THRESHOLDS.lessonCompleteCount} lessons`;

    return { canShow: false, progress: `${execProgress} or ${lessonProgress}` };
}
