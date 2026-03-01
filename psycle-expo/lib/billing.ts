// lib/billing.ts - Stripe Checkout呼び出し

import { Linking } from "react-native";
import { Analytics } from "./analytics";
import { getPlanById, getSupabaseFunctionsUrl, isPlanPurchasable } from "./plans";
import type { PlanId } from "./types/plan";

export async function buyPlan(plan: "pro" | "max", uid: string, email: string): Promise<boolean> {
  if (!isPlanPurchasable(plan)) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      planId: plan,
      reason: "plan_disabled",
    });
    alert(`${plan.toUpperCase()}プランは現在停止中です。`);
    return false;
  }

  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      planId: plan,
      reason: "functions_url_missing",
    });
    alert("決済設定が未完了です。しばらくしてから再度お試しください。");
    return false;
  }

  if (!uid || !email) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      planId: plan,
      reason: "missing_user_context",
    });
    alert("ログイン情報を確認できませんでした。");
    return false;
  }

  const selectedPlan = getPlanById(plan);
  if (!selectedPlan) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      planId: plan,
      reason: "invalid_plan",
    });
    alert("選択したプラン情報を読み込めませんでした。");
    return false;
  }

  try {
    const res = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan,
        priceId: selectedPlan.priceId,
        userId: uid,
        email,
      }),
    });

    if (!res.ok) {
      Analytics.track("checkout_failed", {
        source: "billing_lib",
        planId: plan,
        reason: "http_error",
        status: res.status,
      });
      throw new Error("Failed to create checkout session");
    }

    const { url } = await res.json();
    if (!url) {
      Analytics.track("checkout_failed", {
        source: "billing_lib",
        planId: plan,
        reason: "missing_checkout_url",
      });
      throw new Error("Missing checkout url");
    }

    // ブラウザでCheckoutを開く
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error("buyPlan error:", error);
    alert("決済画面の起動に失敗しました");
    return false;
  }
}

export async function openBillingPortal(email: string): Promise<boolean> {
  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl || !email) {
    return false;
  }

  try {
    const res = await fetch(`${functionsUrl}/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) throw new Error("Failed to create portal session");

    const { url } = await res.json();

    // ブラウザでCustomer Portalを開く
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error("openBillingPortal error:", error);
    alert("請求ポータルの起動に失敗しました");
    return false;
  }
}

/**
 * 購入を復元する（App Store審査で必須）
 * サーバーサイドでユーザーの購入履歴を確認し、entitlementを復元する
 */
export async function restorePurchases(uid: string, email: string): Promise<{ restored: boolean; planId?: PlanId; activeUntil?: string | null } | false> {
  const functionsUrl = getSupabaseFunctionsUrl();
  if (!functionsUrl || !uid || !email) {
    Analytics.track("checkout_failed", {
      source: "billing_lib",
      reason: !functionsUrl ? "functions_url_missing" : "missing_user_context",
    });
    return false;
  }

  try {
    const res = await fetch(`${functionsUrl}/restore-purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "復元に失敗しました");
    }

    const data = await res.json();

    if (data.restored && data.planId) {
      alert(`購入を復元しました！プラン: ${data.planId.toUpperCase()}`);
      return data as { restored: boolean; planId?: PlanId; activeUntil?: string | null };
    } else {
      alert("復元可能な購入が見つかりませんでした。");
      return false;
    }
  } catch (error) {
    console.error("restorePurchases error:", error);
    alert("購入の復元に失敗しました。しばらくしてから再度お試しください。");
    return false;
  }
}
