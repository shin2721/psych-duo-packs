/**
 * Analytics Debug Module
 * 
 * Self-Test機能のためのデバッグ状態管理
 * __DEV__ で有効。E2E用Releaseでは EXPO_PUBLIC_E2E_ANALYTICS_DEBUG=1 でも有効。
 */

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

// ============================================================
// Constants
// ============================================================

const MAX_EVENTS = 100;
const TRACKED_EVENTS = [
    'app_open',
    'session_start',
    'app_ready',
    'onboarding_start',
    'onboarding_complete',
    'lesson_start',
    'lesson_complete',
] as const;
const ANALYTICS_DEBUG_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

// ============================================================
// State (DEV only)
// ============================================================

let ringBuffer: DebugEvent[] = [];
let counters: Record<string, number> = {};
let currentAnonId = 'unknown';
let secondLaunchMode = false;

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

    // Update counters for tracked events
    if (TRACKED_EVENTS.includes(name as any) && status !== 'system') {
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

    lines.push('', '--- Recent Events (last 10) ---');
    state.events.slice(0, 10).forEach((e) => {
        const time = e.timestamp.split('T')[1]?.split('.')[0] || e.timestamp;
        lines.push(`[${time}] ${e.name} (${e.status}) - ${e.anonId.slice(0, 8)}...`);
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
