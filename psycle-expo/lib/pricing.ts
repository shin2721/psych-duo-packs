// lib/pricing.ts
import pricing from "../config/pricing.json";
import * as Localization from "expo-localization";

export type Region = "US" | "CA" | "EU" | "GB" | "JP" | "KR" | "IN" | "BR" | "MX";
export type PlanType = "pro" | "max";
export type BillingPeriod = "monthly" | "yearly";

interface RegionalPricing {
  currency: string;
  symbol: string;
  pro_monthly: number;
  max_monthly: number;
  pro_yearly: number;
  max_yearly: number;
  note: string;
  countries?: string[];
}

/**
 * ユーザーの地域を検出
 * @returns {Region} 検出された地域コード
 */
export function detectUserRegion(): Region {
  const locale = Localization.locale; // e.g., "en-US", "ja-JP"
  const countryCode = locale.split("-")[1]?.toUpperCase();

  // 地域マッピング
  const regionMap: Record<string, Region> = {
    US: "US",
    CA: "CA",
    GB: "GB",
    JP: "JP",
    KR: "KR",
    IN: "IN",
    BR: "BR",
    MX: "MX",
    // EUの国々
    DE: "EU",
    FR: "EU",
    ES: "EU",
    IT: "EU",
    NL: "EU",
    BE: "EU",
    AT: "EU",
    PT: "EU",
  };

  return regionMap[countryCode] || (pricing.default_region as Region);
}

/**
 * 指定された地域の価格情報を取得
 * @param {Region} region - 地域コード
 * @returns {RegionalPricing} 価格情報
 */
export function getRegionalPricing(region: Region): RegionalPricing {
  return pricing.pricing[region] as RegionalPricing;
}

/**
 * 価格をフォーマットして表示
 * @param {number} amount - 金額
 * @param {string} currency - 通貨コード
 * @param {string} symbol - 通貨記号
 * @returns {string} フォーマットされた価格文字列
 */
export function formatPrice(amount: number, currency: string, symbol: string): string {
  // 整数通貨（JPY, KRWなど）は小数点なし
  const isWholeNumber = ["JPY", "KRW"].includes(currency);

  if (isWholeNumber) {
    return `${symbol}${amount.toLocaleString()}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * プランの価格を取得
 * @param {PlanType} plan - プランタイプ
 * @param {BillingPeriod} period - 請求期間
 * @param {Region} region - 地域（省略時は自動検出）
 * @returns {string} フォーマットされた価格
 */
export function getPlanPrice(
  plan: PlanType,
  period: BillingPeriod,
  region?: Region
): string {
  const userRegion = region || detectUserRegion();
  const regionalPricing = getRegionalPricing(userRegion);

  const priceKey = `${plan}_${period}` as keyof RegionalPricing;
  const amount = regionalPricing[priceKey] as number;

  return formatPrice(amount, regionalPricing.currency, regionalPricing.symbol);
}

/**
 * プランの月額換算価格を取得（年額プランの場合）
 * @param {PlanType} plan - プランタイプ
 * @param {Region} region - 地域（省略時は自動検出）
 * @returns {string} フォーマットされた月額換算価格
 */
export function getYearlyMonthlyEquivalent(plan: PlanType, region?: Region): string {
  const userRegion = region || detectUserRegion();
  const regionalPricing = getRegionalPricing(userRegion);

  const yearlyAmount = regionalPricing[`${plan}_yearly`];
  const monthlyEquivalent = yearlyAmount / 12;

  return formatPrice(monthlyEquivalent, regionalPricing.currency, regionalPricing.symbol);
}

/**
 * 年額プランの割引率を計算
 * @param {PlanType} plan - プランタイプ
 * @param {Region} region - 地域（省略時は自動検出）
 * @returns {number} 割引率（パーセント）
 */
export function getYearlyDiscount(plan: PlanType, region?: Region): number {
  const userRegion = region || detectUserRegion();
  const regionalPricing = getRegionalPricing(userRegion);

  const monthly = regionalPricing[`${plan}_monthly`];
  const yearly = regionalPricing[`${plan}_yearly`];

  const monthlyTotal = monthly * 12;
  const discount = ((monthlyTotal - yearly) / monthlyTotal) * 100;

  return Math.round(discount);
}
