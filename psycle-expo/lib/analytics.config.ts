// Analytics v1.3 - Configuration
import type { AnalyticsConfig } from './analytics.types';

/**
 * EXPO_PUBLIC_APP_ENV を安全にパース
 * dev/prod 以外は undefined 扱いにしてフォールバック
 */
function parseAppEnv(): 'dev' | 'prod' | undefined {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  
  if (!raw) {
    return undefined;
  }
  
  if (raw === 'dev' || raw === 'prod') {
    return raw;
  }
  
  // 不正値の場合は警告を出してundefinedにフォールバック
  if (__DEV__) {
    console.warn(
      `[Analytics] Invalid EXPO_PUBLIC_APP_ENV: "${raw}". Expected "dev" or "prod". Falling back to __DEV__ detection.`
    );
  }
  
  return undefined;
}

/**
 * Analytics設定
 * 環境変数から読み込み、デフォルト値を提供
 */
export const analyticsConfig: AnalyticsConfig = {
  enabled: true,
  debug: __DEV__,
  appEnv: parseAppEnv(),
  endpoint: process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
};
