import Stripe from "npm:stripe@16";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PlanId = "pro" | "max";

const allowOrigin = "*";
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const stripePricePro = Deno.env.get("STRIPE_PRICE_PRO");
const stripePriceMax = Deno.env.get("STRIPE_PRICE_MAX");

if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
const supabase = createClient(supabaseUrl, serviceRoleKey);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
    },
  });
}

function resolvePlanId(metadataPlanId?: string | null, priceId?: string | null): PlanId | null {
  if (metadataPlanId === "pro" || metadataPlanId === "max") return metadataPlanId;
  if (priceId && stripePricePro && priceId === stripePricePro) return "pro";
  if (priceId && stripePriceMax && priceId === stripePriceMax) return "max";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const { uid, email } = await req.json();
    if (!uid || !email || typeof uid !== "string" || typeof email !== "string") {
      return jsonResponse({ error: "missing_params" }, 400);
    }

    const customers = await stripe.customers.list({
      email,
      limit: 10,
    });
    if (customers.data.length === 0) {
      return jsonResponse({ restored: false });
    }

    const customer =
      customers.data.find((candidate) => candidate.metadata?.userId === uid || candidate.metadata?.uid === uid) ??
      customers.data[0];

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data
      .filter((subscription) => subscription.status === "active" || subscription.status === "trialing")
      .sort((a, b) => b.current_period_end - a.current_period_end);

    const latest = activeSubscriptions[0];
    if (!latest) {
      return jsonResponse({ restored: false });
    }

    const priceId = latest.items.data[0]?.price?.id ?? null;
    const planId = resolvePlanId(latest.metadata?.planId ?? latest.metadata?.plan, priceId);
    if (!planId) {
      console.error("[restore-purchases] Unknown plan mapping", { uid, priceId });
      return jsonResponse({ restored: false });
    }

    const activeUntil = new Date(latest.current_period_end * 1000).toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        plan_id: planId,
        active_until: activeUntil,
      })
      .eq("id", uid);

    if (error) throw error;

    return jsonResponse({
      restored: true,
      planId,
      activeUntil,
    });
  } catch (error) {
    console.error("[restore-purchases] Error:", error);
    return jsonResponse({ error: "server_error" }, 500);
  }
});
