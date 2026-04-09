import i18n from "../lib/i18n";
import { getPlanPrice, type Region } from "../lib/pricing";

export const DEMO_PLAN_SELECTOR_USER = {
  uid: "demo-user-123",
  email: "demo@psycle.app",
};

export function buildPlanSelectorPlans(userRegion: Region | undefined) {
  return [
    {
      id: "free" as const,
      name: i18n.t("planSelector.freeName"),
      price: i18n.t("planSelector.freePrice", {
        suffix: i18n.t("planSelector.monthlySuffix"),
      }),
      features: [
        i18n.t("planSelector.featureDailyEnergy"),
        i18n.t("planSelector.featureLiteAccess"),
        i18n.t("planSelector.featureNoMistakesReview"),
      ],
    },
    {
      id: "pro" as const,
      name: i18n.t("planSelector.proName"),
      price: `${getPlanPrice("pro", "monthly", userRegion)} ${i18n.t("planSelector.monthlySuffix")}`,
      features: [
        i18n.t("planSelector.featureUnlimitedEnergy"),
        i18n.t("planSelector.featureLiteFullAccess"),
        i18n.t("planSelector.featureMistakesUnlimited"),
      ],
    },
  ];
}
