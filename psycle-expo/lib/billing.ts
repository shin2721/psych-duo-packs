// lib/billing.ts - Stripe Checkout呼び出し

import { Linking } from "react-native";
import { Analytics } from "./analytics";
import { getPlanById, SUPABASE_FUNCTION_URL } from "./plans";

export async function buyPlan(plan: "pro" | "max", uid: string, email: string) {
  let stage: "create_checkout_session" | "open_checkout_url" = "create_checkout_session";
  try {
    const selectedPlan = getPlanById(plan);
    if (!selectedPlan) {
      throw new Error(`Unknown plan: ${plan}`);
    }

    const res = await fetch(`${SUPABASE_FUNCTION_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: selectedPlan.priceId,
        userId: uid,
        email,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to create checkout session");
    }

    const { url } = await res.json();

    // ブラウザでCheckoutを開く
    stage = "open_checkout_url";
    await Linking.openURL(url);
    Analytics.track("checkout_opened", {
      plan,
      source: "supabase_functions",
    });
  } catch (error) {
    Analytics.track("checkout_failed", {
      plan,
      source: "supabase_functions",
      stage,
    });
    console.error("buyPlan error:", error);
    alert("決済画面の起動に失敗しました");
  }
}

export async function openBillingPortal(email: string) {
  try {
    const res = await fetch(`${SUPABASE_FUNCTION_URL}/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) throw new Error("Failed to create portal session");

    const { url } = await res.json();

    // ブラウザでCustomer Portalを開く
    await Linking.openURL(url);
  } catch (error) {
    console.error("openBillingPortal error:", error);
    alert("請求ポータルの起動に失敗しました");
  }
}

/**
 * 購入を復元する（App Store審査で必須）
 * サーバーサイドでユーザーの購入履歴を確認し、entitlementを復元する
 */
export async function restorePurchases(uid: string, email: string): Promise<{ restored: boolean; planId?: "free" | "pro" | "max"; activeUntil?: string | null } | false> {
  try {
    Analytics.track("restore_start", { source: "settings" });
    const res = await fetch(`${SUPABASE_FUNCTION_URL}/restore-purchases`, {
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
      Analytics.track("restore_result", {
        source: "settings",
        status: "restored",
        plan: data.planId,
      });
      alert(`購入を復元しました！プラン: ${data.planId.toUpperCase()}`);
      return data;
    } else {
      Analytics.track("restore_result", {
        source: "settings",
        status: "not_found",
      });
      alert("復元可能な購入が見つかりませんでした。");
      return false;
    }
  } catch (error) {
    Analytics.track("restore_result", {
      source: "settings",
      status: "failed",
    });
    console.error("restorePurchases error:", error);
    alert("購入の復元に失敗しました。しばらくしてから再度お試しください。");
    return false;
  }
}
