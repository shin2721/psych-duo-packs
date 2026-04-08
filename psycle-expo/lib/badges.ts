import i18n from "./i18n";
import type { IoniconName } from "./ioniconName";

// Badge definitions
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: IoniconName;
    category: 'progress' | 'streak' | 'performance' | 'social';
    unlockCondition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
    completedLessons: number;
    streak: number;
    xp: number;
    mistakesCleared: number;
    friendCount: number;
    leaderboardRank: number;
}

interface BadgeConfig {
    id: string;
    icon: IoniconName;
    category: Badge["category"];
    unlockCondition: Badge["unlockCondition"];
}

function createBadge(config: BadgeConfig): Badge {
    const translationBase = `badges.catalog.${config.id}`;

    return {
        id: config.id,
        get name() {
            return String(i18n.t(`${translationBase}.name`));
        },
        get description() {
            return String(i18n.t(`${translationBase}.description`));
        },
        icon: config.icon,
        category: config.category,
        unlockCondition: config.unlockCondition,
    };
}

export const BADGES: Badge[] = [
    // Progress Badges
    createBadge({
        id: 'first_lesson',
        icon: 'rocket',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 1,
    }),
    createBadge({
        id: 'level_5',
        icon: 'star',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 5,
    }),
    createBadge({
        id: 'level_10',
        icon: 'star-half',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 10,
    }),
    createBadge({
        id: 'lessons_50',
        icon: 'trophy',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 50,
    }),
    createBadge({
        id: 'lessons_100',
        icon: 'medal',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 100,
    }),

    // Streak Badges
    createBadge({
        id: 'streak_3',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 3,
    }),
    createBadge({
        id: 'streak_7',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 7,
    }),
    createBadge({
        id: 'streak_14',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 14,
    }),
    createBadge({
        id: 'streak_30',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 30,
    }),
    createBadge({
        id: 'streak_60',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 60,
    }),
    createBadge({
        id: 'streak_100',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 100,
    }),
    createBadge({
        id: 'streak_365',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 365,
    }),

    // Performance Badges
    createBadge({
        id: 'xp_1000',
        icon: 'flash',
        category: 'performance',
        unlockCondition: (stats) => stats.xp >= 1000,
    }),
    createBadge({
        id: 'xp_5000',
        icon: 'flash',
        category: 'performance',
        unlockCondition: (stats) => stats.xp >= 5000,
    }),
    createBadge({
        id: 'mistake_master',
        icon: 'checkmark-circle',
        category: 'performance',
        unlockCondition: (stats) => stats.mistakesCleared >= 10,
    }),

    // Social Badges
    createBadge({
        id: 'first_friend',
        icon: 'people',
        category: 'social',
        unlockCondition: (stats) => stats.friendCount >= 1,
    }),
    createBadge({
        id: 'top_10',
        icon: 'podium',
        category: 'social',
        unlockCondition: (stats) => stats.leaderboardRank <= 10 && stats.leaderboardRank > 0,
    }),

    // League Badges
    createBadge({
        id: 'league_silver',
        icon: 'medal',
        category: 'social',
        unlockCondition: () => false, // Manually awarded
    }),
    createBadge({
        id: 'league_gold',
        icon: 'medal',
        category: 'social',
        unlockCondition: () => false,
    }),
    createBadge({
        id: 'league_platinum',
        icon: 'diamond',
        category: 'social',
        unlockCondition: () => false,
    }),
    createBadge({
        id: 'league_diamond',
        icon: 'diamond',
        category: 'social',
        unlockCondition: () => false,
    }),
    createBadge({
        id: 'league_master',
        icon: 'ribbon',
        category: 'social',
        unlockCondition: () => false,
    }),
    createBadge({
        id: 'league_first_place',
        icon: 'trophy',
        category: 'social',
        unlockCondition: () => false,
    }),
    createBadge({
        id: 'event_spring_2026',
        icon: 'sparkles',
        category: 'performance',
        unlockCondition: () => false,
    }),
];
