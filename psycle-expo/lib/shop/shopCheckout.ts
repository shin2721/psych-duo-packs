import { Analytics } from "../analytics";
import { buyPlan, type BuyPlanFailureReason } from "../billing";
import { persistCheckoutContextSnapshot } from "../app-state/billingStorage";
import { warnDev } from "../devLog";
import { assignExperiment } from "../experimentEngine";
import type { BillingPeriod } from "../pricing";
import { detectUserRegion } from "../pricing";
import {
  getSupabaseFunctionsUrl,
  resolvePlanPriceId,
  supportsPlanBillingPeriod,
  type PlanConfig,
  type PriceVersion,
} from "../plans";
import type { PlanId } from "../types/plan";

export function resolveCheckoutTrialDays(userId: string | null | undefined): number {
  if (!userId) return 0;
  const assignment = assignExperiment(userId, "pro_trial_checkout");
  if (!assignment) return 0;
  const value = Number(assignment.payload?.trialDays);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(30, Math.floor(value)));
}

export function resolveCheckoutPriceContext(params: {
  plan: PlanConfig;
  billingPeriod: BillingPeriod;
  userRegion: string;
  planId: PlanId;
  userId: string | null | undefined;
  accountAgeDays: number | null;
}): { priceVersion: PriceVersion; priceCohort: string } {
  const { plan, billingPeriod, userRegion, planId, userId, accountAgeDays } = params;
  if (
    plan.id !== "pro" ||
    billingPeriod !== "monthly" ||
    userRegion !== "JP" ||
    planId !== "free" ||
    !userId ||
    accountAgeDays === null ||
    accountAgeDays > 14
  ) {
    return { priceVersion: "control", priceCohort: "default" };
  }

  const assignment = assignExperiment(userId, "pro_monthly_price_jp");
  const priceVersion: PriceVersion = assignment?.variantId === "variant_a" ? "variant_a" : "control";
  return {
    priceVersion,
    priceCohort: "jp_new_14d_free",
  };
}

type ShopCheckoutUser = {
  id?: string | null;
  email?: string | null;
};

export type ShopCheckoutFailureReason =
  | "billing_period_unavailable"
  | "price_id_unavailable"
  | BuyPlanFailureReason;

export type ShopCheckoutResult =
  | { ok: true }
  | {
      ok: false;
      reason: ShopCheckoutFailureReason;
      messageKey: string;
    };

function mapFailureToMessageKey(reason: ShopCheckoutFailureReason): string {
  switch (reason) {
    case "billing_period_unavailable":
    case "price_id_unavailable":
    case "billing_period_unsupported":
      return "shop.errors.billingPeriodUnavailable";
    case "open_url_failed":
      return "shop.errors.openCheckoutFailed";
    case "missing_checkout_url":
      return "shop.errors.checkoutSessionFailed";
    default:
      return "shop.errors.checkoutProcessFailed";
  }
}

export async function startShopCheckout(params: {
  plan: PlanConfig;
  billingPeriod: BillingPeriod;
  user: ShopCheckoutUser | null;
  currentPlanId: PlanId;
  accountAgeDays: number | null;
  sessionAccessToken?: string | null;
}): Promise<ShopCheckoutResult> {
  const { plan, billingPeriod, user, currentPlanId, accountAgeDays, sessionAccessToken } = params;
  const source = "shop_tab";

  Analytics.track("plan_select", {
    source,
    planId: plan.id,
  });

  if (!supportsPlanBillingPeriod(plan.id, billingPeriod)) {
    return {
      ok: false,
      reason: "billing_period_unavailable",
      messageKey: mapFailureToMessageKey("billing_period_unavailable"),
    };
  }

  const trialDays = plan.id === "pro" ? resolveCheckoutTrialDays(user?.id) : 0;
  const { priceVersion, priceCohort } = resolveCheckoutPriceContext({
    plan,
    billingPeriod,
    userRegion: detectUserRegion(),
    planId: currentPlanId,
    userId: user?.id,
    accountAgeDays,
  });
  const resolvedPriceId = resolvePlanPriceId(plan.id, billingPeriod, priceVersion);

  if (!resolvedPriceId) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan.id,
      reason: "price_id_unavailable",
    });
    return {
      ok: false,
      reason: "price_id_unavailable",
      messageKey: mapFailureToMessageKey("price_id_unavailable"),
    };
  }

  if (!user?.id || !user.email) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan.id,
      reason: "missing_user_context",
    });
    return {
      ok: false,
      reason: "missing_user_context",
      messageKey: mapFailureToMessageKey("missing_user_context"),
    };
  }

  if (!getSupabaseFunctionsUrl()) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan.id,
      reason: "functions_url_missing",
    });
    return {
      ok: false,
      reason: "functions_url_missing",
      messageKey: mapFailureToMessageKey("functions_url_missing"),
    };
  }

  if (!sessionAccessToken) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan.id,
      reason: "missing_auth_token",
    });
    return {
      ok: false,
      reason: "missing_auth_token",
      messageKey: mapFailureToMessageKey("missing_auth_token"),
    };
  }

  Analytics.track("checkout_start", {
    source,
    planId: plan.id,
    billingPeriod,
    trialDays,
    priceVersion,
    priceCohort,
  });

  try {
    await persistCheckoutContextSnapshot(user.id, {
      planId: plan.id,
      billingPeriod,
      trialDays,
      priceVersion,
      priceCohort,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    warnDev("Failed to persist checkout context", error);
  }

  const result = await buyPlan(plan.id, user.id, user.email, {
    billingPeriod,
    trialDays,
    priceVersion,
    priceCohort,
    source,
    accessToken: sessionAccessToken,
  });

  if (result.ok) {
    return result;
  }

  return {
    ok: false,
    reason: result.reason,
    messageKey: mapFailureToMessageKey(result.reason),
  };
}
