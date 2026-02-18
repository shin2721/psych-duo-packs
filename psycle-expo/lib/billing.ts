// lib/billing.ts - Stripe Checkout呼び出し

import { Linking } from "react-native";
import { Analytics } from "./analytics";
import { getPlanById, getSupabaseFunctionsUrl } from "./plans";

const BILLING_CONFIG_ERROR = "課金設定が未完了のため、現在は利用できません。";

export async function buyPlan(plan: "pro" | "max", uid: string, email: string): Promise<boolean> {
  let stage: "create_checkout_session" | "open_checkout_url" = "create_checkout_session";
  try {
    const selectedPlan = getPlanById(plan);
    if (!selectedPlan) {
      throw new Error(`Unknown plan: ${plan}`);
    }

    const functionsUrl = getSupabaseFunctionsUrl();
    if (!functionsUrl) {
      Analytics.track("checkout_failed", {
        plan,
        source: "supabase_functions",
        stage,
        reason: "functions_url_missing",
      });
      alert(BILLING_CONFIG_ERROR);
      return false;
    }

    const res = await fetch(`${functionsUrl}/create-checkout-session`, {
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
    return true;
  } catch (error) {
    Analytics.track("checkout_failed", {
      plan,
      source: "supabase_functions",
      stage,
    });
    console.error("buyPlan error:", error);
    alert("決済画面の起動に失敗しました");
    return false;
  }
}

export async function openBillingPortal(email: string): Promise<boolean> {
  try {
    const functionsUrl = getSupabaseFunctionsUrl();
    if (!functionsUrl) {
      alert(BILLING_CONFIG_ERROR);
      return false;
    }

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
export async function restorePurchases(uid: string, email: string): Promise<{ restored: boolean; planId?: "free" | "pro" | "max"; activeUntil?: string | null } | false> {
  try {
    Analytics.track("restore_start", { source: "settings" });
    const functionsUrl = getSupabaseFunctionsUrl();
    if (!functionsUrl) {
      Analytics.track("restore_result", {
        source: "settings",
        status: "failed",
        reason: "functions_url_missing",
      });
      alert(BILLING_CONFIG_ERROR);
      return false;
    }

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
