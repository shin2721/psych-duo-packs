// Analytics v1 - Core Implementation (最小実装: Console出力のみ)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { AnalyticsConfig, AnalyticsEvent } from './analytics.types';
import { analyticsConfig } from './analytics.config';
import { recordDebugEvent, recordSystemEvent, setCurrentAnonId } from './analytics-debug';
const ANALYTICS_DEBUG_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === '1';

// 定数
const ANALYTICS_SCHEMA_VERSION = 'analytics_v1';
const STORAGE_KEY_ANON_ID = '@psycle/analytics_anon_id';
const STORAGE_KEY_APP_OPEN = '@psycle/analytics_did_track_app_open';
const HTTP_TIMEOUT_MS = 3000; // 3秒タイムアウト

/**
 * キューに保存するイベント型（anonId確定前）
 */
type QueuedEvent = {
  name: string;
  properties: Record<string, any>;
  eventId: string;
  timestamp: string; // ISO 8601
};

/**
 * Analytics Core API v1.3
 * 
 * 実装済みイベント（コアイベント）:
 *   - app_open: 初回起動時のみ（AsyncStorageガード）
 *   - session_start: 起動毎（プロセス内ガード）
 *   - app_ready: Analytics初期化完了時（プロセス内ガード）
 *   - onboarding_start: ウェルカム画面表示時（useRefガード）
 *   - onboarding_complete: ドメイン確定時（確定地点）
 *   - lesson_start: レッスン画面入場時（useRefガード）
 *   - lesson_complete: レッスン完了時（確定地点）
 *
 * 追加イベント（成長KPI/課金導線）:
 *   - question_incorrect
 *   - intervention_shown / intervention_attempted
 *   - intervention_executed
 *   - recovery_mission_shown / recovery_mission_claimed
 *   - streak_guard_shown / streak_guard_clicked / streak_guard_saved
 *   - league_boundary_shown / league_boundary_clicked
 *   - streak_lost / streak_saved_with_freeze
 *   - checkout_start / checkout_opened / checkout_failed
 *   - restore_start / restore_result
 *   - plan_select / plan_changed
 * 
 * 送信先:
 *   - Console出力（常時）
 *   - HTTP送信（endpoint設定時のみ）
 *   - PostHog送信（posthogHost & posthogApiKey設定時のみ）
 * 
 * Lazy Initialization:
 *   - track()は初期化前でも呼び出し可能（イベントをキューに保存）
 *   - 初回track()で自動的にinitialize()を開始
 *   - 初期化完了後、キューに溜まったイベントを順次送信
 *   - session_startなどの起動時イベントが必ずPostHogに届く保証
 */
class AnalyticsCore {
  private static config: AnalyticsConfig = analyticsConfig;

  private static anonId: string | null = null;
  private static initialized = false;
  private static initializing = false; // 初期化中フラグ
  private static initPromise: Promise<void> | null = null; // 共有初期化Promise
  private static eventQueue: QueuedEvent[] = []; // 初期化前のイベントキュー（anonId確定前）
  private static sessionStartTracked = false; // プロセス内ガード
  private static appReadyTracked = false; // プロセス内ガード（app_ready多重発火防止）

  /**
   * 初期化（アプリ起動時に1回呼ぶ）
   * 初期化中に再度呼ばれた場合は同じPromiseを返し、全呼び出し元が完了を待てる
   */
  static async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    // 既に初期化済み
    if (this.initialized) return;

    // 初期化中なら同じPromiseを返す（全呼び出し元が待てる）
    if (this.initPromise) return this.initPromise;

    this.initializing = true;
    this.initPromise = this.doInitialize(config);

    return this.initPromise;
  }

  /**
   * 初期化の実装（内部）
   */
  private static async doInitialize(config?: Partial<AnalyticsConfig>): Promise<void> {

    try {
      // 設定をマージ
      this.config = {
        ...this.config,
        ...config,
      };

      // 匿名IDを取得または生成
      this.anonId = await this.getOrCreateAnonId();

      this.initialized = true;

      if (this.config.debug) {
        console.log('[Analytics] Initialized', {
          anonId: this.anonId,
          enabled: this.config.enabled,
        });
      }

      // キューに溜まったイベントをフラッシュ
      this.flushEventQueue();

      // Debug hook: record initialized system event
      if (ANALYTICS_DEBUG_ENABLED) {
        setCurrentAnonId(this.anonId);
        recordSystemEvent('initialized', this.anonId);
      }
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
      // キューは保持（再試行可能にする）
      throw error;
    } finally {
      this.initializing = false;
      // 失敗時は再試行可能にするためPromiseをクリア
      // 成功時はinitializedがtrueなので次回呼び出しは早期リターン
      if (!this.initialized) {
        this.initPromise = null;
      }
    }
  }

  /**
   * イベントを記録
   * @param name イベント名
   * @param properties イベント固有のプロパティ
   */
  static track(name: string, properties: Record<string, any> = {}): void {
    // 無効化されている場合はスキップ
    if (!this.config.enabled) {
      return;
    }

    // 初期化前の場合はキューに追加してlazy initを開始（anonId確定後にbuildする）
    if (!this.initialized) {
      this.eventQueue.push({
        name,
        properties: { ...properties },
        eventId: this.generateUUID(),
        timestamp: new Date().toISOString(),
      });

      if (this.config.debug) {
        console.log('[Analytics] Event queued (not initialized yet):', name);
      }

      // Debug hook: record queued event
      if (ANALYTICS_DEBUG_ENABLED) {
        recordDebugEvent(name, 'queued', this.anonId || 'unknown', properties);
      }

      // Lazy initialization: 初回track()で初期化を開始
      if (!this.initializing) {
        this.initialize().catch((error) => {
          console.error('[Analytics] Lazy initialization failed:', error);
        });
      }

      return;
    }

    try {
      // イベントを構築
      const event = this.buildEvent(name, properties);

      // Console出力
      if (this.config.debug) {
        console.log('[Analytics]', event.name, event);
      }

      // HTTP送信（非ブロッキング、endpoint設定時のみ）
      this.sendEvent(event);

      // PostHog送信（非ブロッキング、posthogHost & posthogApiKey設定時のみ）
      this.sendToPostHog(event);

      // Debug hook: record sent event
      if (ANALYTICS_DEBUG_ENABLED) {
        recordDebugEvent(name, 'sent', this.anonId || 'unknown', properties);
      }
    } catch (error) {
      // Debug hook: record failed event
      if (ANALYTICS_DEBUG_ENABLED) {
        recordDebugEvent(name, 'failed', this.anonId || 'unknown', properties);
      }
      // エラーが発生してもアプリをクラッシュさせない
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * キューに溜まったイベントをフラッシュ（anonId確定後）
   */
  private static flushEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    if (this.config.debug) {
      console.log(`[Analytics] Flushing ${this.eventQueue.length} queued events`);
    }

    const queue = [...this.eventQueue];
    this.eventQueue = [];

    queue.forEach((q) => {
      // anonId確定後にbuildEvent（eventId/timestampは保持）
      const event = this.buildEvent(q.name, q.properties, {
        eventId: q.eventId,
        timestamp: q.timestamp,
      });

      // Console出力
      if (this.config.debug) {
        console.log('[Analytics]', event.name, event);
      }

      // 送信
      this.sendEvent(event);
      this.sendToPostHog(event);
    });
  }

  /**
   * app_openイベントを記録（初回起動1回のみ）
   */
  static async trackAppOpen(): Promise<void> {
    try {
      // 既に記録済みかチェック
      const didTrack = await AsyncStorage.getItem(STORAGE_KEY_APP_OPEN);
      if (didTrack === 'true') {
        if (this.config.debug) {
          console.log('[Analytics] app_open already tracked, skipping');
        }
        return;
      }

      // app_openイベントを記録
      this.track('app_open');

      // フラグを保存
      await AsyncStorage.setItem(STORAGE_KEY_APP_OPEN, 'true');
    } catch (error) {
      console.error('[Analytics] Failed to track app_open:', error);
    }
  }

  /**
   * session_startイベントを記録（起動時に毎回1回のみ）
   */
  static trackSessionStart(): void {
    // プロセス内ガード（多重発火防止）
    if (this.sessionStartTracked) {
      if (this.config.debug) {
        console.log('[Analytics] session_start already tracked in this session, skipping');
      }
      return;
    }

    // session_startイベントを記録
    this.track('session_start');

    // フラグを立てる
    this.sessionStartTracked = true;
  }

  /**
   * app_readyイベントを記録（初期化完了時に1回のみ）
   */
  static trackAppReady(): void {
    // プロセス内ガード（多重発火防止）
    if (this.appReadyTracked) {
      if (this.config.debug) {
        console.log('[Analytics] app_ready already tracked in this session, skipping');
      }
      return;
    }

    // app_readyイベントを記録
    this.track('app_ready');

    // フラグを立てる
    this.appReadyTracked = true;
  }

  /**
   * 匿名IDを取得（未初期化時は 'unknown'）
   */
  static getAnonId(): string {
    return this.anonId || 'unknown';
  }

  /**
   * デバッグ用: Analyticsの内部状態をリセット
   * E2Eテストやり直し用。DEV onlyで使用。
   * @param regenerateAnonId trueなら新しいanonIdを生成（AsyncStorageも削除）
   */
  static async resetAnalyticsStateForDebug(regenerateAnonId = false): Promise<void> {
    if (!ANALYTICS_DEBUG_ENABLED) return;

    // メモリ状態をクリア
    this.initialized = false;
    this.initializing = false;
    this.initPromise = null;
    this.sessionStartTracked = false;
    this.appReadyTracked = false;
    this.eventQueue = [];

    // app_open フラグを削除
    await AsyncStorage.removeItem(STORAGE_KEY_APP_OPEN);

    // anonId の再生成（オプション）
    if (regenerateAnonId) {
      await AsyncStorage.removeItem(STORAGE_KEY_ANON_ID);
      this.anonId = null;
    }

    if (this.config.debug) {
      console.log('[Analytics] Debug reset completed', { regenerateAnonId });
    }
  }

  /**
   * イベントを構築（共通プロパティを自動付与）
   */
  private static buildEvent(
    name: string,
    properties: Record<string, any>,
    overrides?: { eventId?: string; timestamp?: string }
  ): AnalyticsEvent {
    return {
      // 共通プロパティ
      eventId: overrides?.eventId ?? this.generateUUID(),
      timestamp: overrides?.timestamp ?? new Date().toISOString(),
      anonId: this.anonId || 'unknown',
      buildId: Constants.expoConfig?.version || '1.0.0',
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      env: this.config.appEnv || (__DEV__ ? 'dev' : 'prod'),

      // イベント固有
      name,
      properties,
    };
  }

  /**
   * 匿名IDを取得または生成
   */
  private static async getOrCreateAnonId(): Promise<string> {
    try {
      // AsyncStorageから読み込み
      const stored = await AsyncStorage.getItem(STORAGE_KEY_ANON_ID);
      if (stored) {
        return stored;
      }

      // 新規生成
      const newId = this.generateUUID();
      await AsyncStorage.setItem(STORAGE_KEY_ANON_ID, newId);
      return newId;
    } catch (error) {
      console.error('[Analytics] Failed to get/create anonId:', error);
      // フォールバック: メモリ内のみ
      return this.generateUUID();
    }
  }

  /**
   * UUID v4を生成
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * イベントをHTTP POSTで送信（非ブロッキング、3秒タイムアウト）
   */
  private static sendEvent(event: AnalyticsEvent): void {
    // endpoint未設定なら早期return
    if (!this.config.endpoint) {
      return;
    }

    // 非ブロッキング実行（Promiseをawaitしない）
    this.sendEventAsync(event).catch((error) => {
      // エラーを握りつぶす（アプリをクラッシュさせない）
      if (this.config.debug) {
        console.error('[Analytics] HTTP send failed:', error);
      }
    });
  }

  /**
   * イベントをHTTP POSTで送信（内部実装）
   */
  private static async sendEventAsync(event: AnalyticsEvent): Promise<void> {
    if (!this.config.endpoint) return;

    // タイムアウト付きfetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスステータス確認
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.debug) {
        console.log('[Analytics] Event sent successfully:', event.name);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // タイムアウトエラーの場合
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (3s)');
      }

      // その他のエラーはそのままthrow（上位でcatchされる）
      throw error;
    }
  }

  /**
   * PostHogにイベントを送信（非ブロッキング、3秒タイムアウト）
   */
  private static sendToPostHog(event: AnalyticsEvent): void {
    // PostHog設定未設定なら早期return
    if (!this.config.posthogHost || !this.config.posthogApiKey) {
      return;
    }

    // 非ブロッキング実行（Promiseをawaitしない）
    this.sendToPostHogAsync(event).catch((error) => {
      // エラーを握りつぶす（アプリをクラッシュさせない）
      if (this.config.debug) {
        console.error('[Analytics] PostHog send failed:', error);
      }
    });
  }

  /**
   * PostHogにイベントを送信（内部実装）
   */
  private static async sendToPostHogAsync(event: AnalyticsEvent): Promise<void> {
    if (!this.config.posthogHost || !this.config.posthogApiKey) return;

    // PostHog /capture エンドポイント（スキーム付与）
    const posthogUrl = `https://${this.config.posthogHost}/i/v0/e/`;

    // PostHog形式に変換
    const posthogPayload = {
      api_key: this.config.posthogApiKey,
      event: event.name,
      distinct_id: event.anonId, // 匿名ID（PII禁止）
      properties: {
        // 匿名イベントとして送信（Person profile作らない）
        $process_person_profile: false,
        // イベント固有のプロパティ
        ...event.properties,
        // 共通メタデータ
        buildId: event.buildId,
        schemaVersion: event.schemaVersion,
        platform: event.platform,
        env: event.env,
        eventId: event.eventId,
        // userId（オプション）
        ...(event.userId && { userId: event.userId }),
      },
      timestamp: event.timestamp,
    };

    // タイムアウト付きfetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(posthogUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(posthogPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスステータス確認
      if (!response.ok) {
        throw new Error(`PostHog HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.debug) {
        console.log('[Analytics] PostHog event sent successfully:', event.name);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // タイムアウトエラーの場合
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('PostHog request timeout (3s)');
      }

      // その他のエラーはそのままthrow（上位でcatchされる）
      throw error;
    }
  }
}

// Export as singleton
export const Analytics = AnalyticsCore;
