export type EnergyFullRefillFailureReason =
    | "disabled"
    | "limit_reached"
    | "insufficient_gems"
    | "already_full"
    | "subscription_unnecessary";

export type EnergyFullRefillResult =
    | { success: true }
    | { success: false; reason: EnergyFullRefillFailureReason };

export function evaluateEnergyFullRefillPurchase(input: {
    enabled: boolean;
    isSubscriptionActive: boolean;
    energy: number;
    maxEnergy: number;
    dailyCount: number;
    dailyLimit: number;
    gems: number;
    costGems: number;
}): EnergyFullRefillResult {
    if (!input.enabled) return { success: false, reason: "disabled" };
    if (input.isSubscriptionActive) return { success: false, reason: "subscription_unnecessary" };
    if (input.energy >= input.maxEnergy) return { success: false, reason: "already_full" };
    if (input.dailyCount >= input.dailyLimit) return { success: false, reason: "limit_reached" };
    if (input.gems < input.costGems) return { success: false, reason: "insufficient_gems" };
    return { success: true };
}
