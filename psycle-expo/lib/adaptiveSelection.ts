import { getDifficultyRating } from './difficultyMapping';

export interface SelectionContext {
    userSkill: number;
    skillConfidence: number;
    recentlyAnswered: string[];
    recentQuestionTypes: string[]; // Track last 5 question types for diversity
    recentAccuracy: number; // Rolling accuracy (0-1) from last 10 questions
    currentStreak: number; // Current correct answer streak
}

/**
 * Calculates the learning value of a question for a given user.
 * Higher values indicate better learning opportunities.
 * 
 * @param questionDifficulty - Elo rating of the question
 * @param userSkill - Current user skill rating
 * @param recentAccuracy - Recent accuracy (0-1) for adaptive difficulty
 * @returns Learning value (0-1)
 */
function calculateLearningValue(
    questionDifficulty: number,
    userSkill: number,
    recentAccuracy: number = 0.7
): number {
    // Adaptive optimal difficulty based on recent performance:
    // - High accuracy (>0.8): Increase challenge (+75)
    // - Medium accuracy (0.5-0.8): Standard challenge (+50)
    // - Low accuracy (<0.5): Reduce challenge (+25)
    let optimalOffset = 50;
    if (recentAccuracy > 0.8) {
        optimalOffset = 75;
    } else if (recentAccuracy < 0.5) {
        optimalOffset = 25;
    }

    const optimalDifficulty = userSkill + optimalOffset;
    const distance = Math.abs(questionDifficulty - optimalDifficulty);

    // Learning value decreases as distance from optimal increases
    // Max distance of 200 points (beyond which value approaches 0)
    return Math.max(0, 1 - (distance / 200));
}

/**
 * Selects the next best question for the user based on adaptive difficulty.
 * 
 * Algorithm:
 * 1. Filter questions by difficulty range (based on user skill and confidence)
 * 2. Calculate learning value for each question
 * 3. Penalize recently answered questions
 * 4. Return question with highest adjusted learning value
 * 
 * @param questions - Available questions
 * @param context - User skill context
 * @returns Selected question, or null if no questions available
 */
export function selectNextQuestion<T extends { id?: string; difficulty?: string; type?: string }>(
    questions: T[],
    context: SelectionContext
): T | null {
    if (questions.length === 0) return null;

    const { userSkill, skillConfidence, recentlyAnswered, recentQuestionTypes, recentAccuracy, currentStreak } = context;

    // Streak-aware difficulty adjustment
    // If user is on a streak, reduce difficulty to maintain momentum
    let streakAdjustment = 0;
    if (currentStreak >= 5) {
        streakAdjustment = -50; // Easier questions for long streaks
    } else if (currentStreak >= 3) {
        streakAdjustment = -25; // Slightly easier for medium streaks
    }

    // Determine difficulty range based on confidence
    // Low confidence (0-50): Wide range for exploration
    // High confidence (50-100): Narrow range for optimization
    const rangeWidth = 150 + (100 - skillConfidence);
    const minDifficulty = userSkill - rangeWidth + streakAdjustment;
    const maxDifficulty = userSkill + rangeWidth + streakAdjustment;

    // Score each question
    const scoredQuestions = questions.map((q) => {
        const difficulty = getDifficultyRating(q.difficulty);

        // Base learning value (now uses recentAccuracy for adaptive difficulty)
        let score = calculateLearningValue(difficulty, userSkill, recentAccuracy);

        // Penalize recently answered questions (50% reduction)
        if (q.id && recentlyAnswered.includes(q.id)) {
            score *= 0.5;
        }

        // Question type diversity penalty
        // Penalize if this type was recently seen (30% reduction per recent occurrence)
        if (q.type && recentQuestionTypes.includes(q.type)) {
            const occurrences = recentQuestionTypes.filter(t => t === q.type).length;
            score *= Math.pow(0.7, occurrences);
        }

        // Penalize questions outside optimal range
        if (difficulty < minDifficulty || difficulty > maxDifficulty) {
            score *= 0.3;
        }

        return { question: q, score, difficulty };
    });

    // Sort by score (descending)
    scoredQuestions.sort((a, b) => b.score - a.score);

    // Return highest-scoring question
    return scoredQuestions[0]?.question ?? null;
}

/**
 * Sorts all questions by adaptive difficulty.
 * Used to pre-order questions at the start of a lesson.
 * 
 * @param questions - All questions in the lesson
 * @param context - User skill context
 * @returns Sorted questions (best first)
 */
export function sortQuestionsByAdaptiveDifficulty<T extends { id?: string; difficulty?: string; type?: string }>(
    questions: T[],
    context: SelectionContext
): T[] {
    const sorted: T[] = [];
    const remaining = [...questions];
    const recentIds = [...context.recentlyAnswered];

    while (remaining.length > 0) {
        const next = selectNextQuestion(remaining, {
            ...context,
            recentlyAnswered: recentIds,
        });

        if (!next) break;

        sorted.push(next);
        if (next.id) {
            recentIds.push(next.id);
        }

        const index = remaining.findIndex((q) => q.id === next.id);
        if (index !== -1) {
            remaining.splice(index, 1);
        }
    }

    // Add any remaining questions (shouldn't happen, but safety net)
    return [...sorted, ...remaining];
}
