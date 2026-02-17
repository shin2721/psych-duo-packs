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

export interface PrimaryKpiMetric {
    key: string;
    label: string;
    formula: string;
}

export interface PrimaryKpisConfig {
    version: string;
    fixed_at: string;
    metrics: PrimaryKpiMetric[];
}

export interface TuningTargetsConfig {
    anomaly_worsening_threshold: number;
    lesson_completion_rate_uv_7d_min: number;
    energy_block_rate_7d_max: number;
    energy_shop_intent_7d_min: number;
    lesson_complete_user_rate_7d_min: number;
    recovery_mission_claim_rate_7d_min: number;
    streak_guard_save_rate_7d_min: number;
    streak_guard_evening_save_rate_7d_min: number;
    league_boundary_click_rate_7d_min: number;
    league_sprint_click_rate_7d_min: number;
    streak_visibility_click_rate_7d_min: number;
    journal_top2_pick_share_7d_min: number;
    journal_post_user_rate_7d_min: number;
    journal_not_tried_share_7d_max: number;
    daily_quest_3of3_rate_7d_min: number;
    xp_boost_activation_rate_7d_min: number;
    xp_boost_bonus_xp_per_user_7d_min: number;
    quest_auto_claim_share_7d_min: number;
    xp_boost_ticket_queue_rate_7d_max: number;
    d1_retention_rate_7d_min: number;
    d7_retention_rate_7d_min: number;
    paid_plan_changes_per_checkout_7d_min: number;
    completed_sessions_per_day_7d_min: number;
    [key: string]: number;
}

export interface GamificationConfig {
    version: number;
    xp_rewards: XPRewards;
    freeze: FreezeConfig;
    streak: StreakConfig;
    focus: FocusConfig;
    tuning_targets: TuningTargetsConfig;
    primary_kpis: PrimaryKpisConfig;
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
    tuning_targets: {
        anomaly_worsening_threshold: 0.2,
        lesson_completion_rate_uv_7d_min: 0.55,
        energy_block_rate_7d_max: 0.25,
        energy_shop_intent_7d_min: 0.08,
        lesson_complete_user_rate_7d_min: 0.45,
        recovery_mission_claim_rate_7d_min: 0.2,
        streak_guard_save_rate_7d_min: 0.35,
        streak_guard_evening_save_rate_7d_min: 0.3,
        league_boundary_click_rate_7d_min: 0.12,
        league_sprint_click_rate_7d_min: 0.15,
        streak_visibility_click_rate_7d_min: 0.25,
        journal_top2_pick_share_7d_min: 0.55,
        journal_post_user_rate_7d_min: 0.18,
        journal_not_tried_share_7d_max: 0.5,
        daily_quest_3of3_rate_7d_min: 0.22,
        xp_boost_activation_rate_7d_min: 0.55,
        xp_boost_bonus_xp_per_user_7d_min: 20,
        quest_auto_claim_share_7d_min: 0.95,
        xp_boost_ticket_queue_rate_7d_max: 0.35,
        d1_retention_rate_7d_min: 0.25,
        d7_retention_rate_7d_min: 0.08,
        paid_plan_changes_per_checkout_7d_min: 0.18,
        completed_sessions_per_day_7d_min: 1.2,
    },
    primary_kpis: {
        version: "growth_v1.19",
        fixed_at: "2026-02-15",
        metrics: [
            {
                key: "d7_retention_rate_7d",
                label: "D7 Retention 7d",
                formula: "retained_users_day7 / cohort_users_day0",
            },
            {
                key: "paid_plan_changes_per_checkout_7d",
                label: "Paid Plan Conversion 7d",
                formula: "plan_changed(toPlan in [pro,max]) / checkout_start",
            },
            {
                key: "lesson_complete_user_rate_7d",
                label: "Lesson Complete User Rate 7d",
                formula: "lesson_complete(UV) / session_start(UV)",
            },
            {
                key: "journal_post_user_rate_7d",
                label: "Journal Post User Rate 7d",
                formula: "action_journal_submitted(UV) / session_start(UV)",
            },
        ],
    },
};

// Merge config with defaults (in case some fields are missing)
function loadConfig(): GamificationConfig {
    try {
        const loadedConfig = configData as Partial<GamificationConfig>;
        const loadedPrimaryKpis = loadedConfig.primary_kpis;
        const hasLoadedMetrics = Array.isArray(loadedPrimaryKpis?.metrics) && loadedPrimaryKpis.metrics.length > 0;

        return {
            version: loadedConfig.version ?? DEFAULT_CONFIG.version,
            xp_rewards: { ...DEFAULT_CONFIG.xp_rewards, ...(loadedConfig.xp_rewards || {}) },
            freeze: { ...DEFAULT_CONFIG.freeze, ...(loadedConfig.freeze || {}) },
            streak: { ...DEFAULT_CONFIG.streak, ...(loadedConfig.streak || {}) },
            focus: { ...DEFAULT_CONFIG.focus, ...(loadedConfig.focus || {}) },
            tuning_targets: { ...DEFAULT_CONFIG.tuning_targets, ...(loadedConfig.tuning_targets || {}) },
            primary_kpis: {
                version: loadedPrimaryKpis?.version ?? DEFAULT_CONFIG.primary_kpis.version,
                fixed_at: loadedPrimaryKpis?.fixed_at ?? DEFAULT_CONFIG.primary_kpis.fixed_at,
                metrics: hasLoadedMetrics ? loadedPrimaryKpis!.metrics : DEFAULT_CONFIG.primary_kpis.metrics,
            },
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

export function getTuningTargetsConfig(): TuningTargetsConfig {
    return gamificationConfig.tuning_targets;
}

export function getPrimaryKpisConfig(): PrimaryKpisConfig {
    return gamificationConfig.primary_kpis;
}
