/**
 * Gamification Config - 調整可能なパラメータの一元管理
 * 
 * config/gamification.json を読み込み、型安全に提供
 * リリースなしでバランス調整が可能
 */

// Static import (Metro bundler can handle JSON)
import configData from '../config/gamification.json';

// Type definitions
export interface XPRewards {
    correct_answer: number;
    lesson_complete: number;
    felt_better_positive: number;
}

export interface FreezeConfig {
    weekly_refill: number;
    purchase_cost_gems: number;
    max_cap: number;
}

export interface StreakConfig {
    study_per_day_limit: number;
}

export interface StreakMilestoneReward {
    day: number;
    gems: number;
}

export interface StreakMilestonesConfig {
    lifetime_once: boolean;
    rewards: StreakMilestoneReward[];
}

export interface ComboXpMilestone {
    streak: number;
    multiplier: number;
}

export interface ComboXpConfig {
    enabled: boolean;
    milestones: ComboXpMilestone[];
    bonus_cap_per_lesson: number;
}

export interface EnergyFullRefillSinkConfig {
    enabled: boolean;
    cost_gems: number;
    daily_limit: number;
}

export interface ShopSinksConfig {
    energy_full_refill: EnergyFullRefillSinkConfig;
}

export interface NotificationsConfig {
    streak_risk_hour: number;
    daily_quest_deadline_hour: number;
    league_demotion_risk_hour_sunday: number;
    default_enabled: boolean;
}

export interface GamificationConfig {
    version: number;
    xp_rewards: XPRewards;
    freeze: FreezeConfig;
    streak: StreakConfig;
    streak_milestones: StreakMilestonesConfig;
    combo_xp: ComboXpConfig;
    shop_sinks: ShopSinksConfig;
    notifications: NotificationsConfig;
}

// Default values (fallback if config is corrupted)
const DEFAULT_CONFIG: GamificationConfig = {
    version: 1,
    xp_rewards: {
        correct_answer: 5,
        lesson_complete: 20,
        felt_better_positive: 10,
    },
    freeze: {
        weekly_refill: 2,
        purchase_cost_gems: 10,
        max_cap: 10,
    },
    streak: {
        study_per_day_limit: 1,
    },
    streak_milestones: {
        lifetime_once: true,
        rewards: [
            { day: 3, gems: 5 },
            { day: 7, gems: 10 },
            { day: 30, gems: 20 },
        ],
    },
    combo_xp: {
        enabled: true,
        milestones: [
            { streak: 3, multiplier: 1.2 },
            { streak: 5, multiplier: 1.5 },
            { streak: 10, multiplier: 2.0 },
        ],
        bonus_cap_per_lesson: 20,
    },
    shop_sinks: {
        energy_full_refill: {
            enabled: true,
            cost_gems: 30,
            daily_limit: 1,
        },
    },
    notifications: {
        streak_risk_hour: 22,
        daily_quest_deadline_hour: 21,
        league_demotion_risk_hour_sunday: 18,
        default_enabled: true,
    },
};

// Merge config with defaults (in case some fields are missing)
function loadConfig(): GamificationConfig {
    try {
        return {
            version: configData.version ?? DEFAULT_CONFIG.version,
            xp_rewards: { ...DEFAULT_CONFIG.xp_rewards, ...configData.xp_rewards },
            freeze: { ...DEFAULT_CONFIG.freeze, ...configData.freeze },
            streak: { ...DEFAULT_CONFIG.streak, ...configData.streak },
            streak_milestones: {
                ...DEFAULT_CONFIG.streak_milestones,
                ...configData.streak_milestones,
                rewards: Array.isArray(configData.streak_milestones?.rewards)
                    ? configData.streak_milestones.rewards
                    : DEFAULT_CONFIG.streak_milestones.rewards,
            },
            combo_xp: {
                ...DEFAULT_CONFIG.combo_xp,
                ...configData.combo_xp,
                milestones: Array.isArray(configData.combo_xp?.milestones)
                    ? configData.combo_xp.milestones
                    : DEFAULT_CONFIG.combo_xp.milestones,
            },
            shop_sinks: {
                ...DEFAULT_CONFIG.shop_sinks,
                ...configData.shop_sinks,
                energy_full_refill: {
                    ...DEFAULT_CONFIG.shop_sinks.energy_full_refill,
                    ...configData.shop_sinks?.energy_full_refill,
                },
            },
            notifications: { ...DEFAULT_CONFIG.notifications, ...configData.notifications },
        };
    } catch (e) {
        console.warn('[GamificationConfig] Failed to load config, using defaults:', e);
        return DEFAULT_CONFIG;
    }
}

// Singleton config instance
export const gamificationConfig: GamificationConfig = loadConfig();

// Convenience accessors
export function getXpRewards(): XPRewards {
    return gamificationConfig.xp_rewards;
}

export function getFreezeConfig(): FreezeConfig {
    return gamificationConfig.freeze;
}

export function getStreakConfig(): StreakConfig {
    return gamificationConfig.streak;
}

export function getStreakMilestonesConfig(): StreakMilestonesConfig {
    return gamificationConfig.streak_milestones;
}

export function getComboXpConfig(): ComboXpConfig {
    return gamificationConfig.combo_xp;
}

export function getShopSinksConfig(): ShopSinksConfig {
    return gamificationConfig.shop_sinks;
}

export function getNotificationsConfig(): NotificationsConfig {
    return gamificationConfig.notifications;
}
