import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { EnergyIcon } from "../../components/CustomIcons";
import i18n from "../i18n";
import { getPlanPrice, type BillingPeriod } from "../pricing";
import type { PlanConfig } from "../plans";
import { getShopSinksConfig } from "../gamificationConfig";
import type { EnergyFullRefillFailureReason } from "../energyFullRefill";
import type { DoubleXpPurchaseFailureReason } from "../doubleXpPurchase";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  action: () =>
    | boolean
    | { success: boolean; reason?: EnergyFullRefillFailureReason | DoubleXpPurchaseFailureReason };
}

const DATE_LOCALE_BY_LANGUAGE: Record<string, string> = {
  ja: "ja-JP",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
  fr: "fr-FR",
  de: "de-DE",
  ko: "ko-KR",
  pt: "pt-BR",
};

export function getDateLocaleForLanguage(languageCode: string): string | undefined {
  return DATE_LOCALE_BY_LANGUAGE[languageCode];
}

export function getEnergyRecoveryMinutesRemaining(params: {
  isSubscriptionActive: boolean;
  energy: number;
  maxEnergy: number;
  lastEnergyUpdateTime: number | null;
  energyRefillMinutes: number;
  nowTs: number;
}): number | null {
  const { isSubscriptionActive, energy, maxEnergy, lastEnergyUpdateTime, energyRefillMinutes, nowTs } = params;
  if (isSubscriptionActive) return null;
  if (energy >= maxEnergy || lastEnergyUpdateTime === null) return null;

  const refillMs = energyRefillMinutes * 60 * 1000;
  const elapsed = Math.max(0, nowTs - lastEnergyUpdateTime);
  const remainingMs = refillMs - (elapsed % refillMs);
  return Math.max(1, Math.ceil(remainingMs / 60000));
}

export function formatPlanPrice(plan: PlanConfig, billingPeriod: BillingPeriod): string {
  const planType = plan.id === "max" ? "max" : "pro";
  try {
    return getPlanPrice(planType, billingPeriod);
  } catch {
    return `¥${plan.priceMonthly.toLocaleString()}`;
  }
}

export function buildShopItems(params: {
  buyFreeze: () => boolean;
  buyEnergyFullRefill: () => boolean | { success: boolean; reason?: EnergyFullRefillFailureReason };
  buyDoubleXP: (
    source?: "shop_item" | "lesson_complete_nudge"
  ) => boolean | { success: boolean; reason?: DoubleXpPurchaseFailureReason };
  isDoubleXpActive: boolean;
  doubleXpEndTime: number | null;
}): ShopItem[] {
  const { buyFreeze, buyEnergyFullRefill, buyDoubleXP, isDoubleXpActive, doubleXpEndTime } = params;
  const energyFullRefillConfig = getShopSinksConfig().energy_full_refill;
  const items: ShopItem[] = [
    {
      id: "freeze",
      name: i18n.t("shop.items.freeze.name"),
      description: i18n.t("shop.items.freeze.desc"),
      price: 10,
      icon: "snow-outline",
      action: buyFreeze,
    },
    {
      id: "double_xp",
      name: i18n.t("shop.items.doubleXP.name"),
      description: isDoubleXpActive
        ? i18n.t("shop.items.doubleXP.activeWithMinutes", {
            minutes: Math.ceil(((doubleXpEndTime ?? Date.now()) - Date.now()) / 60000),
          })
        : i18n.t("shop.items.doubleXP.desc"),
      price: 20,
      icon: "flash-outline",
      customIcon: React.createElement(EnergyIcon, { size: 36 }),
      action: () => buyDoubleXP("shop_item"),
    },
  ];

  if (energyFullRefillConfig.enabled) {
    items.push({
      id: "energy_full_refill",
      name: i18n.t("shop.items.energyFullRefill.name"),
      description: i18n.t("shop.items.energyFullRefill.desc"),
      price: energyFullRefillConfig.cost_gems,
      icon: "battery-charging-outline",
      customIcon: React.createElement(EnergyIcon, { size: 36 }),
      action: buyEnergyFullRefill,
    });
  }

  return items;
}
