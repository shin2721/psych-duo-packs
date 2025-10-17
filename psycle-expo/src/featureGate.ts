// src/featureGate.ts
import entitlements from "../config/entitlements.json";

type PlanId = "free" | "pro" | "max";

interface PlanConfig {
  features: {
    mistakes_hub: { enabled: boolean; daily_limit: number | null };
    ai_explain: { mode: string };
  };
  item_access: { lite: boolean; pro: boolean };
}

// 日次利用カウンタ（メモリ内、午前0時リセット）
const mistakesHubUsage = new Map<string, { date: string; count: number }>();

/**
 * 今日の日付キー（YYYY-MM-DD）を取得
 * @returns {string} 今日の日付文字列
 */
function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * ユーザーがMistakesHub機能を利用できるか判定
 * @param {string} userId - ユーザーID
 * @param {PlanId} plan - プランID（free/pro/max）
 * @returns {boolean} 利用可能ならtrue
 */
export function canUseMistakesHub(userId: string, plan: PlanId): boolean {
  const config = entitlements.plans[plan] as PlanConfig;

  if (!config?.features.mistakes_hub.enabled) {
    return false;
  }

  const dailyLimit = config.features.mistakes_hub.daily_limit;

  // Pro/Maxは無制限
  if (dailyLimit === null) {
    return true;
  }

  // Freeプランは利用不可（daily_limit=0）
  if (dailyLimit === 0) {
    return false;
  }

  const today = getTodayKey();
  const usage = mistakesHubUsage.get(userId);

  if (!usage || usage.date !== today) {
    return true;
  }

  return usage.count < dailyLimit;
}

/**
 * MistakesHubセッションを1回消費
 * @param {string} userId - ユーザーID
 */
export function consumeMistakesHub(userId: string): void {
  const today = getTodayKey();
  const usage = mistakesHubUsage.get(userId);

  if (!usage || usage.date !== today) {
    mistakesHubUsage.set(userId, { date: today, count: 1 });
  } else {
    usage.count += 1;
    mistakesHubUsage.set(userId, usage);
  }
}

/**
 * 本日の残りMistakesHubセッション数を取得（Freeプランのみ）
 * @param {string} userId - ユーザーID
 * @param {PlanId} plan - プランID
 * @returns {number | null} 残り回数、または無制限ならnull
 */
export function getMistakesHubRemaining(userId: string, plan: PlanId): number | null {
  const config = entitlements.plans[plan] as PlanConfig;
  const dailyLimit = config?.features.mistakes_hub.daily_limit;

  if (dailyLimit === null) {
    return null; // 無制限
  }

  if (dailyLimit === 0) {
    return 0; // Freeプランは利用不可
  }

  const today = getTodayKey();
  const usage = mistakesHubUsage.get(userId);

  if (!usage || usage.date !== today) {
    return dailyLimit;
  }

  return Math.max(0, dailyLimit - usage.count);
}

/**
 * ユーザーがPro出題（上級問題）にアクセスできるか判定
 * @param {PlanId} plan - プランID
 * @returns {boolean} Maxプランのみtrue
 */
export function hasProItemAccess(plan: PlanId): boolean {
  const config = entitlements.plans[plan] as PlanConfig;
  return config?.item_access.pro === true;
}

/**
 * ユーザーがLite出題にアクセスできるか判定
 * @param {PlanId} plan - プランID
 * @returns {boolean} 全プランでtrue
 */
export function hasLiteItemAccess(plan: PlanId): boolean {
  const config = entitlements.plans[plan] as PlanConfig;
  return config?.item_access.lite === true;
}

/**
 * AI解説機能が有効か判定（常にfalse）
 * @param {PlanId} plan - プランID
 * @returns {boolean} 常にfalse
 */
export function isExplainEnabled(plan: PlanId): boolean {
  const config = entitlements.plans[plan] as PlanConfig;
  return config?.features.ai_explain.mode !== "off";
}
