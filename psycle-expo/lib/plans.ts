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
    name: "Psycle Pro",
    priceId: "price_1SJ82EJDXOz4c0ISSpJmO8sx",
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
];

export const SUPABASE_FUNCTION_URL = "https://nudmnbmasmtacoluyvqo.functions.supabase.co";

export function getPlanById(planId: PlanId): PlanConfig | undefined {
  return PLANS.find((p) => p.id === planId);
}
