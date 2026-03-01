import type { PlanId } from "./types/plan";
import entitlements from "../config/entitlements.json";
import { getCheckoutConfig } from "./gamificationConfig";

export type { PlanId } from "./types/plan";
type PaidPlanId = Exclude<PlanId, "free">;

export interface PlanConfig {
  id: PaidPlanId;
  name: string;
  priceId: string; // Stripe Price ID
  priceMonthly: number; // Display price in yen
  features: string[];
  popular?: boolean;
}

const PRO_PRICE_ID_FALLBACK = "price_1SJ82EJDXOz4c0ISSpJmO8sx";
const MAX_PRICE_ID_FALLBACK = "price_1SJ82FJDXOz4c0ISrrFASipQ";
const PRO_PRICE_ID = entitlements.plans?.pro?.stripe_price_id || PRO_PRICE_ID_FALLBACK;
const MAX_PRICE_ID = entitlements.plans?.max?.stripe_price_id || MAX_PRICE_ID_FALLBACK;

export const PLANS: PlanConfig[] = [
  {
    id: "pro",
    name: "Psycle Pro",
    priceId: PRO_PRICE_ID,
    priceMonthly: 980,
    features: [
      "全300+レッスン無制限アクセス",
      "スマート復習（苦手克服モード）",
      "広告なし",
      "ライフ無制限",
      "毎週末ダブルXPブースト",
    ],
    popular: true,
  },
  {
    id: "max",
    name: "Psycle Max",
    priceId: MAX_PRICE_ID,
    priceMonthly: 1980,
    features: [
      "Proの全機能",
      "Mistakes Hub 無制限アクセス",
      "将来のAI解説機能",
      "優先的な新機能提供",
    ],
  },
];

export function getSupabaseFunctionsUrl(): string | null {
  const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  return configuredUrl.replace(/\/+$/, "");
}

export function getPlanById(planId: PlanId): PlanConfig | undefined {
  return PLANS.find((p) => p.id === planId);
}

export function isMaxPlanEnabled(): boolean {
  return Boolean(getCheckoutConfig().max_plan_enabled);
}

export function isPlanPurchasable(planId: PaidPlanId): boolean {
  if (planId === "max") return isMaxPlanEnabled();
  return true;
}

export function getPurchasablePlans(): PlanConfig[] {
  return PLANS.filter((plan) => isPlanPurchasable(plan.id));
}
