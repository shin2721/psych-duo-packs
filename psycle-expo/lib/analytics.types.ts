// Analytics v1 - Type Definitions (最小実装)

/**
 * イベントの共通プロパティ
 */
export interface CommonProperties {
  eventId: string;            // UUID v4
  timestamp: string;          // ISO 8601形式
  anonId: string;             // 匿名ID（UUID v4）
  buildId: string;            // アプリのビルドID
  schemaVersion: string;      // イベントスキーマバージョン（"analytics_v1"）
  platform: 'ios' | 'android' | 'web';
  env: 'dev' | 'prod';
  userId?: string;            // 認証済みユーザーID（オプション）
}

/**
 * イベントデータ
 */
export interface AnalyticsEvent extends CommonProperties {
  name: string;               // イベント名
  properties: Record<string, any>; // イベント固有のプロパティ
}

/**
 * Analytics システムの設定
 */
export interface AnalyticsConfig {
  enabled: boolean;           // 分析を有効化するか（デフォルト: true）
  debug: boolean;             // デバッグログを出力するか（デフォルト: __DEV__）
  appEnv?: 'dev' | 'prod';    // アプリ環境（未設定時は __DEV__ で判定）
  endpoint?: string;          // 送信先エンドポイント（未設定の場合はConsoleのみ）
  posthogHost?: string;       // PostHogホスト（us.i.posthog.com / eu.i.posthog.com）
  posthogApiKey?: string;     // PostHog APIキー
}

// イベント型定義（7イベント: app_open, session_start, app_ready, onboarding_start, onboarding_complete, lesson_start, lesson_complete）
export type AppOpenEvent = {
  name: 'app_open';
  properties: {};
};

export type SessionStartEvent = {
  name: 'session_start';
  properties: {};
};

export type AppReadyEvent = {
  name: 'app_ready';
  properties: {};
};

export type OnboardingStartEvent = {
  name: 'onboarding_start';
  properties: {};
};

export type OnboardingCompleteEvent = {
  name: 'onboarding_complete';
  properties: {};
};

export type LessonStartEvent = {
  name: 'lesson_start';
  properties: {
    lessonId: string;
    genreId: string;
  };
};

export type LessonCompleteEvent = {
  name: 'lesson_complete';
  properties: {
    lessonId: string;
    genreId: string;
  };
};

export type TrackedEvent =
  | AppOpenEvent
  | SessionStartEvent
  | AppReadyEvent
  | OnboardingStartEvent
  | OnboardingCompleteEvent
  | LessonStartEvent
  | LessonCompleteEvent;
