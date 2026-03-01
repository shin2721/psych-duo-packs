import type { PlanId } from "./types/plan";
import type { BillingPeriod } from "./pricing";
import entitlements from "../config/entitlements.json";
import { getCheckoutConfig } from "./gamificationConfig";

export type { PlanId } from "./types/plan";
type PaidPlanId = Exclude<PlanId, "free">;

export interface PlanConfig {
  id: PaidPlanId;
  name: string;
  priceId: string; // Stripe Price ID (monthly)
  priceIds: {
    monthly: string;
    yearly?: string;
  };
  priceMonthly: number; // Display price in yen
  supportsYearly: boolean;
  features: string[];
  popular?: boolean;
}

const PRO_PRICE_ID_MONTHLY_FALLBACK = "price_1SJ82EJDXOz4c0ISSpJmO8sx";
const MAX_PRICE_ID_MONTHLY_FALLBACK = "price_1SJ82FJDXOz4c0ISrrFASipQ";

function normalizePriceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const PRO_PRICE_ID_MONTHLY =
  normalizePriceId(entitlements.plans?.pro?.stripe_price_id_monthly) ??
  normalizePriceId(entitlements.plans?.pro?.stripe_price_id) ??
  PRO_PRICE_ID_MONTHLY_FALLBACK;
const PRO_PRICE_ID_YEARLY = normalizePriceId(entitlements.plans?.pro?.stripe_price_id_yearly);

const MAX_PRICE_ID_MONTHLY =
  normalizePriceId(entitlements.plans?.max?.stripe_price_id_monthly) ??
  normalizePriceId(entitlements.plans?.max?.stripe_price_id) ??
  MAX_PRICE_ID_MONTHLY_FALLBACK;

export const PLANS: PlanConfig[] = [
  {
    id: "pro",
    name: "Psycle Pro",
    priceId: PRO_PRICE_ID_MONTHLY,
    priceIds: {
      monthly: PRO_PRICE_ID_MONTHLY,
      ...(PRO_PRICE_ID_YEARLY ? { yearly: PRO_PRICE_ID_YEARLY } : {}),
    },
    priceMonthly: 980,
    supportsYearly: true,
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
    priceId: MAX_PRICE_ID_MONTHLY,
    priceIds: {
      monthly: MAX_PRICE_ID_MONTHLY,
    },
    priceMonthly: 1980,
    supportsYearly: false,
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

export function supportsPlanBillingPeriod(planId: PaidPlanId, period: BillingPeriod): boolean {
  if (period === "monthly") return true;
  const plan = getPlanById(planId);
  return Boolean(plan?.supportsYearly);
}

export function resolvePlanPriceId(planId: PlanId, period: BillingPeriod = "monthly"): string | null {
  const plan = getPlanById(planId);
  if (!plan) return null;

  if (period === "monthly") {
    return plan.priceIds.monthly;
  }

  if (!plan.supportsYearly) {
    return null;
  }

  // Yearly fallback is intentionally disabled to avoid accidental monthly billing.
  return plan.priceIds.yearly ?? null;
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
