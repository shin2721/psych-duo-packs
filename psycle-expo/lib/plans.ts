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
  {
    id: "max",
    name: "Psycle Max",
    priceId: "price_1SJ82FJDXOz4c0ISrrFASipQ",
    priceMonthly: 1980,
    features: [
      "Proの全機能",
      "Max限定コンテンツ",
      "MistakesHub 無制限",
      "最優先で新機能を先行開放",
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
