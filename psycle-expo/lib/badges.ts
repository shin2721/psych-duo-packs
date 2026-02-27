// Badge definitions
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Ionicons name
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

export const BADGES: Badge[] = [
    // Progress Badges
    {
        id: 'first_lesson',
        name: '初めの一歩',
        description: '最初のレッスンを完了',
        icon: 'rocket',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 1,
    },
    {
        id: 'level_5',
        name: '5レッスン完了',
        description: '5レッスンを完了',
        icon: 'star',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 5,
    },
    {
        id: 'level_10',
        name: '10レッスン完了',
        description: '10レッスンを完了',
        icon: 'star-half',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 10,
    },
    {
        id: 'lessons_50',
        name: '継続は力なり',
        description: '50レッスンを完了',
        icon: 'trophy',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 50,
    },
    {
        id: 'lessons_100',
        name: '百戦錬磨',
        description: '100レッスンを完了',
        icon: 'medal',
        category: 'progress',
        unlockCondition: (stats) => stats.completedLessons >= 100,
    },

    // Streak Badges
    {
        id: 'streak_3',
        name: '3日連続',
        description: '3日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 3,
    },
    {
        id: 'streak_7',
        name: '1週間連続',
        description: '7日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 7,
    },
    {
        id: 'streak_30',
        name: '1ヶ月連続',
        description: '30日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 30,
    },
    {
        id: 'streak_60',
        name: '60日連続',
        description: '60日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 60,
    },
    {
        id: 'streak_100',
        name: '100日連続',
        description: '100日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 100,
    },
    {
        id: 'streak_365',
        name: '365日連続',
        description: '365日連続で学習',
        icon: 'flame',
        category: 'streak',
        unlockCondition: (stats) => stats.streak >= 365,
    },

    // Performance Badges
    {
        id: 'xp_1000',
        name: 'XP 1000達成',
        description: '総XP 1000に到達',
        icon: 'flash',
        category: 'performance',
        unlockCondition: (stats) => stats.xp >= 1000,
    },
    {
        id: 'xp_5000',
        name: 'XP 5000達成',
        description: '総XP 5000に到達',
        icon: 'flash',
        category: 'performance',
        unlockCondition: (stats) => stats.xp >= 5000,
    },
    {
        id: 'mistake_master',
        name: 'ミステイク克服',
        description: '10個のミスを克服',
        icon: 'checkmark-circle',
        category: 'performance',
        unlockCondition: (stats) => stats.mistakesCleared >= 10,
    },

    // Social Badges
    {
        id: 'first_friend',
        name: '初めての友達',
        description: '最初のフレンドを追加',
        icon: 'people',
        category: 'social',
        unlockCondition: (stats) => stats.friendCount >= 1,
    },
    {
        id: 'top_10',
        name: 'トップ10入り',
        description: 'リーダーボードでトップ10に入る',
        icon: 'podium',
        category: 'social',
        unlockCondition: (stats) => stats.leaderboardRank <= 10 && stats.leaderboardRank > 0,
    },

    // League Badges
    {
        id: 'league_silver',
        name: 'シルバー昇格',
        description: 'シルバーリーグに昇格',
        icon: 'medal',
        category: 'social',
        unlockCondition: () => false, // Manually awarded
    },
    {
        id: 'league_gold',
        name: 'ゴールド昇格',
        description: 'ゴールドリーグに昇格',
        icon: 'medal',
        category: 'social',
        unlockCondition: () => false,
    },
    {
        id: 'league_platinum',
        name: 'プラチナ昇格',
        description: 'プラチナリーグに昇格',
        icon: 'diamond',
        category: 'social',
        unlockCondition: () => false,
    },
    {
        id: 'league_diamond',
        name: 'ダイヤモンド昇格',
        description: 'ダイヤモンドリーグに昇格',
        icon: 'diamond',
        category: 'social',
        unlockCondition: () => false,
    },
    {
        id: 'league_master',
        name: 'マスター昇格',
        description: 'マスターリーグに昇格',
        icon: 'ribbon',
        category: 'social',
        unlockCondition: () => false,
    },
    {
        id: 'league_first_place',
        name: 'リーグ1位',
        description: 'リーグで1位を獲得',
        icon: 'trophy',
        category: 'social',
        unlockCondition: () => false,
    },
    {
        id: 'event_spring_2026',
        name: '春イベント完走',
        description: 'Spring Challenge 2026 を完走',
        icon: 'sparkles',
        category: 'performance',
        unlockCondition: () => false,
    },
];
