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

    // Level 4+ requires pack purchase
    return !purchasedPacks.has(genre);
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
