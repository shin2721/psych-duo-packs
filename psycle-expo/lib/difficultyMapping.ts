/**
 * Maps difficulty labels to Elo-compatible numeric ratings.
 * 
 * Difficulty Scale:
 * - "easy": 1300 (below average)
 * - "medium": 1500 (average, default user skill)
 * - "hard": 1700 (above average)
 */

export type DifficultyLabel = "easy" | "medium" | "hard";

const DIFFICULTY_RATINGS: Record<DifficultyLabel, number> = {
    easy: 1300,
    medium: 1500,
    hard: 1700,
};

/**
 * Converts a difficulty label to an Elo rating.
 * @param label - The difficulty label from question metadata
 * @returns Elo rating (1300-1700)
 */
export function getDifficultyRating(label: string | undefined): number {
    if (!label) return 1500; // Default to medium

    const normalized = label.toLowerCase() as DifficultyLabel;
    return DIFFICULTY_RATINGS[normalized] ?? 1500;
}

/**
 * Converts an Elo rating back to a difficulty label.
 * Useful for UI display.
 * @param rating - Elo rating
 * @returns Difficulty label
 */
export function getRatingLabel(rating: number): DifficultyLabel {
    if (rating < 1400) return "easy";
    if (rating < 1600) return "medium";
    return "hard";
}
