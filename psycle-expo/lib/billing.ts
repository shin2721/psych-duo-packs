// lib/billing.ts - Stripe Checkout呼び出し

import { Linking } from "react-native";
import { Analytics } from "./analytics";
import { supabase } from "./supabase";
import type { BillingPeriod } from "./pricing";
import {
  getPlanById,
  getSupabaseFunctionsUrl,
  isPlanPurchasable,
  type PriceVersion,
  resolvePlanPriceId,
  supportsPlanBillingPeriod,
} from "./plans";
import type { PlanId } from "./types/plan";

type BuyPlanOptions = {
  billingPeriod?: BillingPeriod;
  trialDays?: number;
  priceVersion?: PriceVersion;
  priceCohort?: string;
  source?: string;
  accessToken?: string;
};

export type BuyPlanFailureReason =
  | "plan_disabled"
  | "billing_period_unsupported"
  | "functions_url_missing"
  | "missing_user_context"
  | "missing_auth_token"
  | "invalid_plan"
  | "http_error"
  | "missing_checkout_url"
  | "checkout_session_failed"
  | "open_url_failed"
  | "unknown";

export type BuyPlanResult =
  | { ok: true }
  | { ok: false; reason: BuyPlanFailureReason };

export type OpenBillingPortalFailureReason =
  | "functions_url_missing"
  | "missing_auth_token"
  | "portal_session_failed"
  | "open_url_failed"
  | "unknown";

export type OpenBillingPortalResult =
  | { ok: true }
  | { ok: false; reason: OpenBillingPortalFailureReason };

export type RestorePurchasesResult =
  | { status: "restored"; planId: PlanId; activeUntil: string | null }
  | { status: "not_found" }
  | { status: "error"; reason: "functions_url_missing" | "missing_auth_token" | "restore_failed" | "unknown" };

export async function buyPlan(
  plan: "pro" | "max",
  uid: string,
  email: string,
  options?: BuyPlanOptions
): Promise<BuyPlanResult> {
  const billingPeriod = options?.billingPeriod ?? "monthly";
  const trialDays = Math.max(0, Math.floor(options?.trialDays ?? 0));
  const priceVersion = options?.priceVersion ?? "control";
  const priceCohort = options?.priceCohort ?? "default";
  const source = options?.source ?? "billing_lib";

  if (!isPlanPurchasable(plan)) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "plan_disabled",
    });
    return { ok: false, reason: "plan_disabled" };
  }

  if (!supportsPlanBillingPeriod(plan, billingPeriod)) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "billing_period_unsupported",
    });
    return { ok: false, reason: "billing_period_unsupported" };
  }

  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "functions_url_missing",
    });
    return { ok: false, reason: "functions_url_missing" };
  }

  if (!uid || !email) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "missing_user_context",
    });
    return { ok: false, reason: "missing_user_context" };
  }

  const accessToken =
    options?.accessToken ??
    (
      await supabase.auth.getSession()
    ).data.session?.access_token;
  if (!accessToken) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "missing_auth_token",
    });
    return { ok: false, reason: "missing_auth_token" };
  }

  const selectedPlan = getPlanById(plan);
  const resolvedPriceId = resolvePlanPriceId(plan, billingPeriod, priceVersion);
  if (!selectedPlan) {
    Analytics.track("checkout_failed", {
      source,
      planId: plan,
      reason: "invalid_plan",
    });
    return { ok: false, reason: "invalid_plan" };
  }

  try {
    const res = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: plan,
        billingPeriod,
        trialDays: plan === "pro" ? trialDays : 0,
        priceVersion,
        priceCohort,
        priceId: resolvedPriceId ?? undefined,
      }),
    });

    if (!res.ok) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan,
        reason: "http_error",
        status: res.status,
      });
      return { ok: false, reason: "http_error" };
    }

    const { url } = await res.json();
    if (typeof url !== "string" || !url) {
      Analytics.track("checkout_failed", {
        source,
        planId: plan,
        reason: "missing_checkout_url",
      });
      return { ok: false, reason: "missing_checkout_url" };
    }

    // ブラウザでCheckoutを開く
    try {
      await Linking.openURL(url);
      return { ok: true };
    } catch (error) {
      console.error("buyPlan openURL error:", error);
      return { ok: false, reason: "open_url_failed" };
    }
  } catch (error) {
    console.error("buyPlan error:", error);
    return { ok: false, reason: "checkout_session_failed" };
  }
}

export async function openBillingPortal(): Promise<OpenBillingPortalResult> {
  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl) {
    return { ok: false, reason: "functions_url_missing" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      reason: "missing_auth_token",
    });
    return { ok: false, reason: "missing_auth_token" };
  }

  try {
    const res = await fetch(`${functionsUrl}/portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error("Failed to create portal session");

    const { url } = await res.json();
    if (typeof url !== "string" || !url) {
      return { ok: false, reason: "portal_session_failed" };
    }

    // ブラウザでCustomer Portalを開く
    try {
      await Linking.openURL(url);
      return { ok: true };
    } catch (error) {
      console.error("openBillingPortal openURL error:", error);
      return { ok: false, reason: "open_url_failed" };
    }
  } catch (error) {
    console.error("openBillingPortal error:", error);
    return { ok: false, reason: "portal_session_failed" };
  }
}

/**
 * 購入を復元する（App Store審査で必須）
 * サーバーサイドでユーザーの購入履歴を確認し、entitlementを復元する
 */
export async function restorePurchases(): Promise<RestorePurchasesResult> {
  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      reason: "functions_url_missing",
    });
    return { status: "error", reason: "functions_url_missing" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      reason: "missing_auth_token",
    });
    return { status: "error", reason: "missing_auth_token" };
  }

  try {
    const res = await fetch(`${functionsUrl}/restore-purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "復元に失敗しました");
    }

    const data = await res.json();

    if (data.restored && data.planId) {
      return {
        status: "restored",
        planId: data.planId as PlanId,
        activeUntil: data.activeUntil ?? null,
      };
    }

    return { status: "not_found" };
  } catch (error) {
    console.error("restorePurchases error:", error);
    return { status: "error", reason: "restore_failed" };
  }
}
