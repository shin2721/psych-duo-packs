/**
 * Analytics Debug Module
 * 
 * Self-Test機能のためのデバッグ状態管理
 * __DEV__ で有効。E2E用Releaseでは EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1 でも有効。
 */

import type { TrackedEvent } from "./analytics.types";

// ============================================================
// Types
// ============================================================

export type DebugEventType = 'event' | 'system';
export type DebugEventStatus = 'queued' | 'sent' | 'failed' | 'system';

export type DebugEvent = {
    type: DebugEventType;
    name: string;
    status: DebugEventStatus;
    anonId: string;
    timestamp: string;
    meta?: Record<string, string | number | boolean>;
};

export type DebugState = {
    anonId: string;
    events: DebugEvent[];
    counters: Record<string, number>;
    failures: string[];
    passed: boolean;
    secondLaunchMode: boolean;
};

export type EngagementDebugHealth = {
    passed: boolean;
    primaryActionShown: number;
    primaryActionStarted: number;
    primaryActionStartRate: number | null;
    returnReasonsShown: number;
    rewardGrants: number;
    warnings: string[];
};

export type PerformanceDebugHealth = {
    passed: boolean;
    latestStartupMs: number | null;
    latestLessonLoadMs: number | null;
    lessonLoadSamples: number;
    warnings: string[];
};

// ============================================================
// Constants
// ============================================================

const MAX_EVENTS = 100;
export const PERFORMANCE_BUDGETS = {
    appStartupMs: 3000,
    lessonLoadMs: 1200,
} as const;
const TRACKED_EVENTS = [
    'app_open',
    'session_start',
    'app_ready',
    'app_startup_performance',
    'onboarding_start',
    'onboarding_complete',
    'onboarding_genres_selected',
    'onboarding_first_lesson_targeted',
    'onboarding_first_lesson_completed',
    'lesson_start',
    'lesson_load_performance',
    'lesson_complete',
    'question_incorrect',
    'streak_lost',
    'energy_blocked',
    'energy_bonus_hit',
    'shop_open_from_energy',
    'daily_goal_reached',
    'quest_claimed',
    'comeback_reward_offered',
    'comeback_reward_claimed',
    'comeback_reward_expired',
    'engagement_primary_action_shown',
    'engagement_primary_action_started',
    'engagement_paywall_guardrail',
    'engagement_reward_granted',
    'engagement_return_reason_shown',
    'league_entry_shown',
] as const satisfies readonly TrackedEvent["name"][];
const TRACKED_EVENT_SET = new Set<string>(TRACKED_EVENTS);
export const ENGAGEMENT_DEBUG_EVENTS = [
    'onboarding_genres_selected',
    'onboarding_first_lesson_targeted',
    'onboarding_first_lesson_completed',
    'daily_goal_reached',
    'quest_claimed',
    'comeback_reward_offered',
    'comeback_reward_claimed',
    'comeback_reward_expired',
    'engagement_primary_action_shown',
    'engagement_primary_action_started',
    'engagement_paywall_guardrail',
    'engagement_reward_granted',
    'engagement_return_reason_shown',
    'league_entry_shown',
] as const satisfies readonly TrackedEvent["name"][];
const ENGAGEMENT_DEBUG_EVENT_SET = new Set<string>(ENGAGEMENT_DEBUG_EVENTS);
const ANALYTICS_DEBUG_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

// ============================================================
// State (DEV only)
// ============================================================

let ringBuffer: DebugEvent[] = [];
let counters: Record<string, number> = {};
let currentAnonId = 'unknown';
let secondLaunchMode = false;

function isTrackedEventName(name: string): boolean {
    return TRACKED_EVENT_SET.has(name);
}

export function isEngagementDebugEventName(name: string): boolean {
    return ENGAGEMENT_DEBUG_EVENT_SET.has(name);
}

// Initialize counters
TRACKED_EVENTS.forEach((name) => {
    counters[name] = 0;
});

// ============================================================
// Public API
// ============================================================

/**
 * デバッグイベントを記録
 * Analytics.track() から呼ばれる
 */
export function recordDebugEvent(
    name: string,
    status: DebugEventStatus,
    anonId: string,
    meta?: Record<string, string | number | boolean>
): void {
    if (!ANALYTICS_DEBUG_ENABLED) return;

    const event: DebugEvent = {
        type: status === 'system' ? 'system' : 'event',
        name,
        status,
        anonId,
        timestamp: new Date().toISOString(),
        meta,
    };

    // Ring buffer: FIFO
    ringBuffer.push(event);
    if (ringBuffer.length > MAX_EVENTS) {
        ringBuffer.shift();
    }

    // Count completed analytics emissions only. Queued entries remain in the
    // ring buffer for diagnostics but should not look like duplicate fires.
    if (isTrackedEventName(name) && status === 'sent') {
        counters[name] = (counters[name] || 0) + 1;
    }

    // Update current anonId
    currentAnonId = anonId;
}

/**
 * システムイベントを記録（initialized など）
 */
export function recordSystemEvent(
    name: string,
    anonId: string,
    meta?: Record<string, string | number | boolean>
): void {
    if (!ANALYTICS_DEBUG_ENABLED) return;
    recordDebugEvent(name, 'system', anonId, meta);
}

/**
 * Second Launch Mode を設定
 */
export function setSecondLaunchMode(enabled: boolean): void {
    if (!ANALYTICS_DEBUG_ENABLED) return;
    if (enabled && !secondLaunchMode) {
        ringBuffer = [];
        counters = {};
        TRACKED_EVENTS.forEach((name) => {
            counters[name] = 0;
        });
    }
    secondLaunchMode = enabled;
}

/**
 * Second Launch Mode の状態を取得
 */
export function isSecondLaunchMode(): boolean {
    if (!ANALYTICS_DEBUG_ENABLED) return false;
    return secondLaunchMode;
}

/**
 * デバッグ状態をリセット（E2Eやり直し用）
 * Analytics側のリセットは呼び出し元で別途行う
 */
export function resetDebugState(): void {
    if (!ANALYTICS_DEBUG_ENABLED) return;

    ringBuffer = [];
    counters = {};
    TRACKED_EVENTS.forEach((name) => {
        counters[name] = 0;
    });
    secondLaunchMode = false;
    // anonIdは維持（Analytics側でリセットするかは別判断）
}

/**
 * PASS/FAIL判定
 */
export function evaluatePassFail(): { passed: boolean; failures: string[] } {
    if (!ANALYTICS_DEBUG_ENABLED) return { passed: true, failures: [] };

    const failures: string[] = [];

    // 1. anonId が 'unknown' を含む
    if (currentAnonId === 'unknown' || currentAnonId.includes('unknown')) {
        failures.push('anonId is unknown');
    }

    // 2. session_start が2回以上
    if (counters['session_start'] > 1) {
        failures.push(`session_start fired ${counters['session_start']} times (expected ≤1)`);
    }

    // 3. app_ready が2回以上
    if (counters['app_ready'] > 1) {
        failures.push(`app_ready fired ${counters['app_ready']} times (expected ≤1)`);
    }

    // 4. app_ready が queued として記録された
    const queuedAppReady = ringBuffer.find(
        (e) => e.name === 'app_ready' && e.status === 'queued'
    );
    if (queuedAppReady) {
        failures.push('app_ready was queued (should fire after initialize)');
    }

    // 5. Second Launch Mode時に app_open が発火した
    if (secondLaunchMode && counters['app_open'] > 0) {
        failures.push('app_open fired in Second Launch Mode (should not fire on 2nd+ launch)');
    }

    return {
        passed: failures.length === 0,
        failures,
    };
}

function getMetaString(event: DebugEvent, key: string): string | undefined {
    const value = event.meta?.[key];
    return typeof value === 'string' ? value : undefined;
}

function getMetaBoolean(event: DebugEvent, key: string): boolean | undefined {
    const value = event.meta?.[key];
    return typeof value === 'boolean' ? value : undefined;
}

function getMetaNumber(event: DebugEvent, key: string): number | undefined {
    const value = event.meta?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function hasDebugMetaValue(event: DebugEvent, key: string): boolean {
    return event.meta?.[key] !== undefined;
}

const ALLOWED_APP_ENV = new Set(['dev', 'prod']);
const ALLOWED_PRIMARY_ACTION_TYPES = new Set([
    'lesson',
    'review',
    'paywall',
    'return',
    'adaptive',
    'refresh',
    'replay',
    'mastery',
    'streak_repair',
    'comeback_reward',
]);
const ALLOWED_RETURN_REASONS = new Set([
    'daily_goal_remaining',
    'daily_goal_complete',
    'streak_repair_available',
    'comeback_reward_available',
    'return_support_available',
]);
const ALLOWED_REWARD_TYPES = new Set(['xp', 'gems', 'energy', 'badge']);

export const ENGAGEMENT_REQUIRED_PAYLOAD_FIELDS: Record<string, readonly string[]> = {
    onboarding_genres_selected: [
        'selectedGenres',
        'primaryGenreId',
        'selectionCount',
        'source',
    ],
    onboarding_first_lesson_targeted: [
        'genreId',
        'lessonFile',
        'source',
    ],
    onboarding_first_lesson_completed: [
        'lessonId',
        'genreId',
        'source',
    ],
    daily_goal_reached: [
        'dailyGoal',
        'dailyXp',
        'gemsAwarded',
        'source',
    ],
    quest_claimed: [
        'templateId',
        'type',
        'rewardXp',
        'rewardGems',
        'source',
    ],
    comeback_reward_offered: [
        'daysSinceStudy',
        'rewardEnergy',
        'rewardGems',
        'thresholdDays',
        'source',
    ],
    comeback_reward_claimed: [
        'rewardEnergy',
        'rewardGems',
        'daysSinceStudy',
        'source',
    ],
    comeback_reward_expired: [
        'daysSinceStudy',
        'expiredAt',
        'source',
    ],
    engagement_primary_action_shown: [
        'userState',
        'surface',
        'source',
        'primaryActionType',
        'priorityRank',
        'priorityReason',
        'genreId',
        'appEnv',
    ],
    engagement_primary_action_started: [
        'userState',
        'surface',
        'source',
        'primaryActionType',
        'priorityRank',
        'entrypoint',
        'genreId',
        'appEnv',
    ],
    engagement_return_reason_shown: [
        'userState',
        'surface',
        'source',
        'reason',
        'dailyGoal',
        'dailyXp',
        'remainingXp',
        'streak',
        'genreId',
        'primaryActionType',
        'appEnv',
    ],
    engagement_reward_granted: [
        'rewardType',
        'rewardAmount',
        'sourceEventName',
        'sourceEventId',
        'surface',
        'appEnv',
    ],
    engagement_paywall_guardrail: [
        'userState',
        'surface',
        'source',
        'genreId',
        'lessonCompleteCount',
        'allowed',
        'blockedReason',
        'appEnv',
    ],
    league_entry_shown: [
        'source',
        'surface',
        'weekId',
        'leagueId',
        'tier',
        'weeklyXp',
        'weeklyXpZeroState',
        'memberCount',
        'rank',
        'appEnv',
    ],
};

function pushRequiredPayloadWarnings(events: DebugEvent[], warnings: string[]): void {
    for (const [eventName, fields] of Object.entries(ENGAGEMENT_REQUIRED_PAYLOAD_FIELDS)) {
        const missingRequiredPayload = events.filter(
            (event) =>
                event.name === eventName &&
                fields.some((field) => !hasDebugMetaValue(event, field))
        );
        if (missingRequiredPayload.length > 0) {
            warnings.push(
                `${eventName} missing required audit payload: ${missingRequiredPayload.length}`
            );
        }
    }
}

function pushDomainValueWarnings(events: DebugEvent[], warnings: string[]): void {
    const invalidAppEnv = events.filter((event) => {
        const appEnv = getMetaString(event, 'appEnv');
        return appEnv !== undefined && !ALLOWED_APP_ENV.has(appEnv);
    });
    if (invalidAppEnv.length > 0) {
        warnings.push(`engagement event invalid appEnv: ${invalidAppEnv.length}`);
    }

    const actionEvents = events.filter((event) =>
        event.name === 'engagement_primary_action_shown' ||
        event.name === 'engagement_primary_action_started' ||
        event.name === 'engagement_return_reason_shown'
    );
    const invalidPrimaryActionType = actionEvents.filter((event) => {
        const primaryActionType = getMetaString(event, 'primaryActionType');
        return primaryActionType !== undefined && !ALLOWED_PRIMARY_ACTION_TYPES.has(primaryActionType);
    });
    if (invalidPrimaryActionType.length > 0) {
        warnings.push(`engagement event invalid primaryActionType: ${invalidPrimaryActionType.length}`);
    }

    const invalidReturnReason = events.filter((event) => {
        if (event.name !== 'engagement_return_reason_shown') return false;
        const reason = getMetaString(event, 'reason');
        return reason !== undefined && !ALLOWED_RETURN_REASONS.has(reason);
    });
    if (invalidReturnReason.length > 0) {
        warnings.push(`engagement_return_reason_shown invalid reason: ${invalidReturnReason.length}`);
    }

    const invalidRewardType = events.filter((event) => {
        if (event.name !== 'engagement_reward_granted') return false;
        const rewardType = getMetaString(event, 'rewardType');
        return rewardType !== undefined && !ALLOWED_REWARD_TYPES.has(rewardType);
    });
    if (invalidRewardType.length > 0) {
        warnings.push(`engagement_reward_granted invalid rewardType: ${invalidRewardType.length}`);
    }

    const invalidRewardAmount = events.filter((event) => {
        if (event.name !== 'engagement_reward_granted') return false;
        const rewardAmount = getMetaNumber(event, 'rewardAmount');
        return rewardAmount !== undefined && rewardAmount <= 0;
    });
    if (invalidRewardAmount.length > 0) {
        warnings.push(`engagement_reward_granted non-positive rewardAmount: ${invalidRewardAmount.length}`);
    }
}

function getExpectedReturnReasonForPrimaryAction(event: DebugEvent): string | null {
    const supportKind = getMetaString(event, 'supportKind');
    if (supportKind === 'streakRepair') return 'streak_repair_available';
    if (supportKind === 'comebackReward') return 'comeback_reward_available';
    if (supportKind === 'return') return 'return_support_available';
    return null;
}

function getReturnReasonDedupeKey(event: DebugEvent): string {
    const meta = event.meta ?? {};
    return [
        meta.userState ?? 'unknown_state',
        meta.genreId ?? 'unknown_genre',
        meta.reason ?? 'unknown_reason',
        meta.dailyGoal ?? 'unknown_goal',
        meta.dailyXp ?? 'unknown_xp',
        meta.streak ?? 'unknown_streak',
        meta.primaryActionType ?? 'unknown_action',
        meta.supportKind ?? 'none',
    ].map(String).join(':');
}

function getPrimaryActionShownDedupeKey(event: DebugEvent): string {
    const meta = event.meta ?? {};
    return [
        meta.userState ?? 'unknown_state',
        meta.genreId ?? 'unknown_genre',
        meta.primaryActionType ?? 'unknown_action',
        meta.priorityRank ?? 'unknown_rank',
        meta.lessonId ?? 'none',
        meta.supportKind ?? 'none',
    ].map(String).join(':');
}

function getPrimaryActionStartedDedupeKey(event: DebugEvent): string {
    const meta = event.meta ?? {};
    return [
        meta.userState ?? 'unknown_state',
        meta.genreId ?? 'unknown_genre',
        meta.primaryActionType ?? 'unknown_action',
        meta.priorityRank ?? 'unknown_rank',
        meta.entrypoint ?? 'unknown_entrypoint',
        meta.lessonId ?? 'none',
        meta.supportKind ?? 'none',
    ].map(String).join(':');
}

/**
 * Engagement系イベントのローカル健全性を評価する。
 * 実験結果の良し悪しではなく、発火/報酬/ガードレールの配線ミスを検出する。
 */
export function evaluateEngagementDebugHealth(events: DebugEvent[] = ringBuffer): EngagementDebugHealth {
    const chronologicalEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const primaryActionEvents = chronologicalEvents.filter((event) => event.name === 'engagement_primary_action_shown');
    const primaryActionStartedEvents = chronologicalEvents.filter((event) => event.name === 'engagement_primary_action_started');
    const returnReasonEvents = chronologicalEvents.filter((event) => event.name === 'engagement_return_reason_shown');
    const primaryActionShown = chronologicalEvents.filter((event) => event.name === 'engagement_primary_action_shown').length;
    const primaryActionStarted = primaryActionStartedEvents.length;
    const returnReasonShown = returnReasonEvents.length;
    const rewardGrantEvents = chronologicalEvents.filter((event) => event.name === 'engagement_reward_granted');
    const paywallGuardrailEvents = chronologicalEvents.filter((event) => event.name === 'engagement_paywall_guardrail');
    const warnings: string[] = [];

    if (primaryActionShown > 0 && primaryActionStarted === 0) {
        warnings.push('primary action shown but never started in the current debug buffer');
    }

    if (primaryActionShown === 0 && primaryActionStarted > 0) {
        warnings.push('primary action started without engagement_primary_action_shown');
    }

    if (primaryActionShown > 0 && primaryActionStarted > primaryActionShown) {
        warnings.push(
            `primary action started more often than shown: ${primaryActionStarted}/${primaryActionShown}`
        );
    }

    pushRequiredPayloadWarnings(chronologicalEvents, warnings);
    pushDomainValueWarnings(chronologicalEvents, warnings);

    if (primaryActionShown > 0 && returnReasonShown === 0) {
        warnings.push('primary action shown without engagement_return_reason_shown');
    }

    if (primaryActionShown === 0 && returnReasonShown > 0) {
        warnings.push('engagement_return_reason_shown without engagement_primary_action_shown');
    }

    const primaryActionShownCounts = new Map<string, number>();
    for (const event of primaryActionEvents) {
        const key = getPrimaryActionShownDedupeKey(event);
        primaryActionShownCounts.set(key, (primaryActionShownCounts.get(key) ?? 0) + 1);
    }
    const duplicatePrimaryActions = Array.from(primaryActionShownCounts.values()).filter((count) => count > 1).length;
    if (duplicatePrimaryActions > 0) {
        warnings.push(`duplicate engagement_primary_action_shown observed: ${duplicatePrimaryActions}`);
    }

    const primaryActionStartedCounts = new Map<string, number>();
    for (const event of primaryActionStartedEvents) {
        const key = getPrimaryActionStartedDedupeKey(event);
        primaryActionStartedCounts.set(key, (primaryActionStartedCounts.get(key) ?? 0) + 1);
    }
    const duplicatePrimaryActionStarts = Array.from(primaryActionStartedCounts.values()).filter((count) => count > 1).length;
    if (duplicatePrimaryActionStarts > 0) {
        warnings.push(`duplicate engagement_primary_action_started observed: ${duplicatePrimaryActionStarts}`);
    }

    const latestPrimaryAction = primaryActionEvents.at(-1);
    const latestReturnReason = returnReasonEvents.at(-1);
    const expectedReturnReason = latestPrimaryAction
        ? getExpectedReturnReasonForPrimaryAction(latestPrimaryAction)
        : null;
    if (
        expectedReturnReason &&
        latestReturnReason &&
        getMetaString(latestReturnReason, 'reason') !== expectedReturnReason
    ) {
        warnings.push(
            `return reason mismatch: expected ${expectedReturnReason}, got ${getMetaString(latestReturnReason, 'reason') ?? 'unknown'}`
        );
    }

    const returnReasonCounts = new Map<string, number>();
    for (const event of returnReasonEvents) {
        const key = getReturnReasonDedupeKey(event);
        returnReasonCounts.set(key, (returnReasonCounts.get(key) ?? 0) + 1);
    }
    const duplicateReturnReasons = Array.from(returnReasonCounts.values()).filter((count) => count > 1).length;
    if (duplicateReturnReasons > 0) {
        warnings.push(`duplicate engagement_return_reason_shown observed: ${duplicateReturnReasons}`);
    }

    const missingIdempotency = rewardGrantEvents.filter((event) => !getMetaString(event, 'idempotencyKey'));
    if (missingIdempotency.length > 0) {
        warnings.push(`engagement_reward_granted missing idempotencyKey: ${missingIdempotency.length}`);
    }

    const rewardIdempotencyMismatches = rewardGrantEvents.filter((event) => {
        const idempotencyKey = getMetaString(event, 'idempotencyKey');
        const sourceEventId = getMetaString(event, 'sourceEventId');
        const rewardType = getMetaString(event, 'rewardType');
        if (!idempotencyKey || !sourceEventId || !rewardType) return false;
        return !idempotencyKey.includes(sourceEventId) || !idempotencyKey.includes(rewardType);
    });
    if (rewardIdempotencyMismatches.length > 0) {
        warnings.push(`engagement_reward_granted idempotency/source mismatch: ${rewardIdempotencyMismatches.length}`);
    }

    const rewardSourceNameMismatches = rewardGrantEvents.filter((event) => {
        const sourceEventName = getMetaString(event, 'sourceEventName');
        const sourceEventId = getMetaString(event, 'sourceEventId');
        if (!sourceEventName || !sourceEventId) return false;
        return !sourceEventId.startsWith(`${sourceEventName}:`);
    });
    if (rewardSourceNameMismatches.length > 0) {
        warnings.push(`engagement_reward_granted sourceEventName/sourceEventId mismatch: ${rewardSourceNameMismatches.length}`);
    }

    const idempotencyCounts = new Map<string, number>();
    for (const event of rewardGrantEvents) {
        const idempotencyKey = getMetaString(event, 'idempotencyKey');
        if (!idempotencyKey) continue;
        idempotencyCounts.set(idempotencyKey, (idempotencyCounts.get(idempotencyKey) ?? 0) + 1);
    }
    const duplicateRewardGrants = Array.from(idempotencyCounts.values()).filter((count) => count > 1).length;
    if (duplicateRewardGrants > 0) {
        warnings.push(`duplicate reward idempotencyKey observed: ${duplicateRewardGrants}`);
    }

    const paywallGuardrailMismatches = paywallGuardrailEvents.filter((event) => {
        const allowed = getMetaBoolean(event, 'allowed');
        const blockedReason = getMetaString(event, 'blockedReason');
        return (
            (allowed === true && blockedReason !== 'eligible') ||
            (allowed === false && blockedReason === 'eligible')
        );
    });
    if (paywallGuardrailMismatches.length > 0) {
        warnings.push(`engagement_paywall_guardrail allowed/block reason mismatch: ${paywallGuardrailMismatches.length}`);
    }

    let firstLessonCompletedSeen = false;
    for (const event of chronologicalEvents) {
        if (event.name === 'onboarding_first_lesson_completed') {
            firstLessonCompletedSeen = true;
        }
        if (
            event.name === 'engagement_paywall_guardrail' &&
            getMetaBoolean(event, 'allowed') === true &&
            !firstLessonCompletedSeen
        ) {
            warnings.push('paywall allowed before onboarding_first_lesson_completed');
            break;
        }
    }

    return {
        passed: warnings.length === 0,
        primaryActionShown,
        primaryActionStarted,
        primaryActionStartRate:
            primaryActionShown > 0 ? Math.round((primaryActionStarted / primaryActionShown) * 100) : null,
        returnReasonsShown: returnReasonShown,
        rewardGrants: rewardGrantEvents.length,
        warnings,
    };
}

/**
 * 起動とlesson遷移の体感速度をDebug buffer上で評価する。
 * 実機計測の代替ではなく、遅さを見逃さないためのローカル警報。
 */
export function evaluatePerformanceDebugHealth(events: DebugEvent[] = ringBuffer): PerformanceDebugHealth {
    const chronologicalEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const startupEvents = chronologicalEvents.filter(
        (event) => event.name === 'app_startup_performance' && event.status === 'sent'
    );
    const loadedLessonEvents = chronologicalEvents.filter(
        (event) =>
            event.name === 'lesson_load_performance' &&
            event.status === 'sent' &&
            getMetaString(event, 'status') === 'loaded'
    );
    const latestStartupMs = startupEvents.length > 0
        ? getMetaNumber(startupEvents[startupEvents.length - 1], 'durationMs') ?? null
        : null;
    const latestLessonLoadMs = loadedLessonEvents.length > 0
        ? getMetaNumber(loadedLessonEvents[loadedLessonEvents.length - 1], 'durationMs') ?? null
        : null;
    const warnings: string[] = [];

    if (latestStartupMs !== null && latestStartupMs > PERFORMANCE_BUDGETS.appStartupMs) {
        warnings.push(
            `app startup exceeded budget: ${latestStartupMs}ms/${PERFORMANCE_BUDGETS.appStartupMs}ms`
        );
    }

    if (latestLessonLoadMs !== null && latestLessonLoadMs > PERFORMANCE_BUDGETS.lessonLoadMs) {
        warnings.push(
            `lesson load exceeded budget: ${latestLessonLoadMs}ms/${PERFORMANCE_BUDGETS.lessonLoadMs}ms`
        );
    }

    const malformedPerformanceEvents = chronologicalEvents.filter((event) => {
        if (event.name !== 'app_startup_performance' && event.name !== 'lesson_load_performance') {
            return false;
        }
        const durationMs = getMetaNumber(event, 'durationMs');
        return durationMs === undefined || durationMs < 0;
    });
    if (malformedPerformanceEvents.length > 0) {
        warnings.push(`performance event missing valid durationMs: ${malformedPerformanceEvents.length}`);
    }

    return {
        passed: warnings.length === 0,
        latestStartupMs,
        latestLessonLoadMs,
        lessonLoadSamples: loadedLessonEvents.length,
        warnings,
    };
}

/**
 * 現在のデバッグ状態を取得（UI表示用）
 */
export function getDebugState(): DebugState {
    if (!ANALYTICS_DEBUG_ENABLED) {
        return {
            anonId: 'N/A',
            events: [],
            counters: {},
            failures: [],
            passed: true,
            secondLaunchMode: false,
        };
    }

    const { passed, failures } = evaluatePassFail();

    return {
        anonId: currentAnonId,
        events: [...ringBuffer].reverse(), // 最新が先頭
        counters: { ...counters },
        failures,
        passed,
        secondLaunchMode,
    };
}

/**
 * デバッグレポートを生成（Copy Report用）
 */
export function getDebugReport(): string {
    if (!ANALYTICS_DEBUG_ENABLED) return 'Debug not available in Release build';

    const state = getDebugState();
    const { passed, failures } = evaluatePassFail();

    const lines: string[] = [
        '=== Analytics Self-Test Report ===',
        '',
        `Status: ${passed ? '✅ PASS' : '❌ FAIL'}`,
        `anonId: ${state.anonId}`,
        `Second Launch Mode: ${state.secondLaunchMode ? 'ON' : 'OFF'}`,
        `Timestamp: ${new Date().toISOString()}`,
        '',
        '--- Event Counters ---',
    ];

    TRACKED_EVENTS.forEach((name) => {
        lines.push(`${name}: ${state.counters[name] || 0}`);
    });

    if (failures.length > 0) {
        lines.push('', '--- Failures ---');
        failures.forEach((f, i) => {
            lines.push(`${i + 1}. ${f}`);
        });
    }

    const engagementHealth = evaluateEngagementDebugHealth(state.events);
    lines.push('', '--- Engagement Health ---');
    lines.push(`Status: ${engagementHealth.passed ? 'PASS' : 'WARN'}`);
    lines.push(`Primary action start: ${engagementHealth.primaryActionStarted}/${engagementHealth.primaryActionShown}`);
    lines.push(`Return reasons shown: ${engagementHealth.returnReasonsShown}`);
    lines.push(`Reward grants: ${engagementHealth.rewardGrants}`);
    if (engagementHealth.warnings.length > 0) {
        engagementHealth.warnings.forEach((warning, index) => {
            lines.push(`${index + 1}. ${warning}`);
        });
    }

    const performanceHealth = evaluatePerformanceDebugHealth(state.events);
    lines.push('', '--- Performance Health ---');
    lines.push(`Status: ${performanceHealth.passed ? 'PASS' : 'WARN'}`);
    lines.push(`Startup: ${performanceHealth.latestStartupMs ?? 'n/a'}ms / ${PERFORMANCE_BUDGETS.appStartupMs}ms`);
    lines.push(`Latest lesson load: ${performanceHealth.latestLessonLoadMs ?? 'n/a'}ms / ${PERFORMANCE_BUDGETS.lessonLoadMs}ms`);
    lines.push(`Lesson load samples: ${performanceHealth.lessonLoadSamples}`);
    if (performanceHealth.warnings.length > 0) {
        performanceHealth.warnings.forEach((warning, index) => {
            lines.push(`${index + 1}. ${warning}`);
        });
    }

    lines.push('', '--- Recent Events (last 10) ---');
    state.events.slice(0, 10).forEach((e) => {
        const time = e.timestamp.split('T')[1]?.split('.')[0] || e.timestamp;
        lines.push(`[${time}] ${e.name} (${e.status}) - ${e.anonId.slice(0, 8)}...`);
    });

    lines.push('', '--- Engagement Audit (last 10) ---');
    state.events.filter((e) => isEngagementDebugEventName(e.name)).slice(0, 10).forEach((e) => {
        const time = e.timestamp.split('T')[1]?.split('.')[0] || e.timestamp;
        const meta = e.meta
            ? Object.entries(e.meta).map(([key, value]) => `${key}=${String(value)}`).join(', ')
            : 'no_meta';
        lines.push(`[${time}] ${e.name} (${e.status}) - ${meta}`);
    });

    lines.push('', '=== End of Report ===');

    return lines.join('\n');
}

/**
 * 現在のanonIdを更新（Analytics.initializeから呼ばれる）
 */
export function setCurrentAnonId(anonId: string): void {
    if (!ANALYTICS_DEBUG_ENABLED) return;
    currentAnonId = anonId;
}

/**
 * 現在のanonIdを取得
 */
export function getCurrentAnonId(): string {
    if (!ANALYTICS_DEBUG_ENABLED) return 'N/A';
    return currentAnonId;
}
