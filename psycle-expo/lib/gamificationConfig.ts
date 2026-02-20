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
    attempted: number;
    executed: number;
    felt_better_positive: number;
}

export interface FreezeConfig {
    weekly_refill: number;
    purchase_cost_gems: number;
    max_cap: number;
}

export interface StreakConfig {
    action_per_day_limit: number;
    study_per_day_limit: number;
}

export interface FocusConfig {
    max: number;
    lesson_cost: number;
    recovery_rate_per_hour: number;
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
    focus: FocusConfig;
    notifications: NotificationsConfig;
}

// Default values (fallback if config is corrupted)
const DEFAULT_CONFIG: GamificationConfig = {
    version: 1,
    xp_rewards: {
        correct_answer: 5,
        lesson_complete: 20,
        attempted: 10,
        executed: 25,
        felt_better_positive: 10,
    },
    freeze: {
        weekly_refill: 2,
        purchase_cost_gems: 10,
        max_cap: 10,
    },
    streak: {
        action_per_day_limit: 1,
        study_per_day_limit: 1,
    },
    focus: {
        max: 25,
        lesson_cost: 1,
        recovery_rate_per_hour: 1,
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
            focus: { ...DEFAULT_CONFIG.focus, ...configData.focus },
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

export function getFocusConfig(): FocusConfig {
    return gamificationConfig.focus;
}

export function getNotificationsConfig(): NotificationsConfig {
    return gamificationConfig.notifications;
}
