// lib/billing.ts - Stripe Checkout呼び出し

import { Linking } from "react-native";

const BILLING_API = "https://psycle-billing.vercel.app"; // デプロイ後のURL

export async function buyPlan(plan: "pro" | "max", uid: string, email: string) {
  try {
    const res = await fetch(`${BILLING_API}/api/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, uid, email }),
    });

    if (!res.ok) throw new Error("Failed to create checkout session");

    const { url } = await res.json();

    // ブラウザでCheckoutを開く
    await Linking.openURL(url);
  } catch (error) {
    console.error("buyPlan error:", error);
    alert("決済画面の起動に失敗しました");
  }
}

export async function openBillingPortal(email: string) {
  try {
    const res = await fetch(`${BILLING_API}/api/portal`, {
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
