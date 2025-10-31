export type PlanId = "free" | "pro" | "max";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceId: string; // Stripe Price ID
  priceMonthly: number; // Display price in yen
  features: string[];
  popular?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: "pro",
    name: "Pro",
    priceId: "price_1SJ82EJDXOz4c0ISSpJmO8sx",
    priceMonthly: 980,
    features: [
      "全ユニット・全レッスン無制限",
      "ミスハブ機能（復習）",
      "広告なし",
      "ライフ無制限",
    ],
    popular: true,
  },
  {
    id: "max",
    name: "Max",
    priceId: "price_1SJ82FJDXOz4c0ISrrFASipQ",
    priceMonthly: 1480,
    features: [
      "Proの全機能",
      "パーソナライズAIコーチ",
      "詳細な進捗分析",
      "優先サポート",
    ],
  },
];

export const SUPABASE_FUNCTION_URL = "https://nudmnbmasmtacoluyvqo.functions.supabase.co";

export function getPlanById(planId: PlanId): PlanConfig | undefined {
  return PLANS.find((p) => p.id === planId);
}
